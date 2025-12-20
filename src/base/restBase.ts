import type {
  KrakenApiResponse,
  KrakenClientOptions,
  KrakenLogger,
} from '../types/types';
import {
  TokenBucketLimiter,
  defaultRestCostFn,
  isTradingEndpoint,
  jitter,
  parseThrottledUntilUnixSeconds,
  sleep,
  tierToRestParams,
  type Limiter,
  type KrakenRateLimitOptions,
} from './rateLimit';
import { KrakenApiError } from './errors';
import { createHash, createHmac } from 'node:crypto';

/**
 * Low-level REST base for Kraken clients.
 * @internal
 */
export abstract class KrakenRestBase {
  protected readonly baseUrl: string;
  protected readonly timeoutMs: number;
  protected readonly userAgent?: string;

  protected readonly apiKey?: string;
  protected readonly apiSecret?: string;

  protected readonly logger?: KrakenLogger;

  // Nonce tracking for private endpoints
  private lastNonce?: bigint;
  private lastMs: number = 0;

  // Rate Limiting
  private readonly restLimiter?: Limiter;
  private readonly tradingLimiter?: Limiter;
  private readonly rateLimitOptions: Required<
    Pick<KrakenRateLimitOptions, 'retryOnRateLimit' | 'maxRetries'>
  >;
  private readonly restCostFn: (path: string) => number;
  private readonly tradingCostFn: (path: string) => number;

  constructor(options: KrakenClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? 'https://api.kraken.com';
    this.timeoutMs = options.timeoutMs ?? 10_000;
    this.userAgent = options.userAgent;

    this.apiKey = options.apiKey;
    this.apiSecret = options.apiSecret;

    this.logger = options.logger;

    const rl = options.rateLimit ?? {};
    const mode = rl.mode ?? 'auto';
    const tier = rl.tier ?? 'starter';

    this.rateLimitOptions = {
      retryOnRateLimit: rl.retryOnRateLimit ?? true,
      maxRetries: rl.maxRetries ?? 5,
    };

    this.restCostFn = rl.restCostFn ?? defaultRestCostFn;
    this.tradingCostFn = rl.tradingCostFn ?? (() => 1);

    // Caller can provide their own limiter(s)
    if (options.limiter?.rest) this.restLimiter = options.limiter.rest;
    if (options.limiter?.trading) this.tradingLimiter = options.limiter.trading;

    // Default in-memory limiters
    if (mode !== 'off') {
      if (!this.restLimiter) {
        const { maxCounter, decayPerSec } = tierToRestParams(tier);
        this.restLimiter = new TokenBucketLimiter(maxCounter, decayPerSec);
      }

      // Trading limiter: Kraken docs say it's separate; we keep it conservative.
      // You can tune these values later once you align with Kraken trading rate limit docs.
      if (!this.tradingLimiter) {
        this.tradingLimiter = new TokenBucketLimiter(10, 1.0);
      }
    }
  }

  /**
   * Generate a strictly increasing nonce for private API calls.
   *
   * Strategy:
   * - Base value on current milliseconds * 1000 to allow many calls per ms.
   * - If current time goes backwards or stays the same, just increment
   *   the last nonce.
   *
   * Safe for high throughput in a single Node process, as long as
   * createNonce() is not awaited and not called from multiple processes.
   *
   * @internal
   */
  protected createNonce(): string {
    const nowMs = Date.now();

    if (this.lastNonce === undefined) {
      this.lastNonce = BigInt(nowMs) * 1000n;
      this.lastMs = nowMs;
      return this.lastNonce.toString();
    }

    if (nowMs > this.lastMs) {
      // New millisecond, jump base up
      this.lastNonce = BigInt(nowMs) * 1000n;
      this.lastMs = nowMs;
    } else {
      // Same or earlier ms, just bump the counter
      this.lastNonce = this.lastNonce + 1n;
      // lastMs stays as-is; we care only that nonce is strictly increasing
    }

    return this.lastNonce.toString();
  }

  /**
   * Low-level helper for public GET endpoints.
   * @internal
   */
  public async publicGet<T>(
    path: string,
    query?: Record<string, string | number>,
  ): Promise<T> {
    const url = new URL(path, this.baseUrl);

    if (query) {
      for (const [key, value] of Object.entries(query)) {
        url.searchParams.set(key, String(value));
      }
    }

    this.logger?.debug?.('Kraken REST public GET request', {
      endpoint: path,
      url: url.toString(),
      query,
    });

    // IMPORTANT: retry wrapper must include JSON parsing + Kraken error decoding,
    // not just fetch(), otherwise EAPI/EService throttling won't be retried.
    return this.scheduleWithRetry(path, async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        const resp = await fetch(url, {
          method: 'GET',
          signal: controller.signal,
          headers: this.userAgent
            ? { 'User-Agent': this.userAgent }
            : undefined,
        });

        if (!resp.ok) {
          this.logger?.error?.('Kraken REST HTTP error', {
            endpoint: path,
            status: resp.status,
            statusText: resp.statusText,
          });

          throw new KrakenApiError(
            `HTTP error from Kraken: ${resp.status} ${resp.statusText}`,
            {
              endpoint: path,
              httpStatus: resp.status,
              httpStatusText: resp.statusText,
            },
          );
        }

        let json: KrakenApiResponse<T>;
        try {
          json = (await resp.json()) as KrakenApiResponse<T>;
        } catch (e) {
          this.logger?.error?.('Kraken REST JSON parse error', {
            endpoint: path,
            error: e,
          });

          throw new KrakenApiError('Failed to parse Kraken response JSON', {
            endpoint: path,
            httpStatus: resp.status,
          });
        }

        if (json.error?.length) {
          this.logger?.warn?.('Kraken REST API error', {
            endpoint: path,
            krakenErrors: json.error,
          });

          throw new KrakenApiError(
            `Kraken API error: ${json.error.join(', ')}`,
            {
              endpoint: path,
              httpStatus: resp.status,
              krakenErrorCodes: json.error,
              rawBody: json,
            },
          );
        }

        this.logger?.debug?.('Kraken REST public GET success', {
          endpoint: path,
        });

        return json.result;
      } finally {
        clearTimeout(timeout);
      }
    });
  }

  /**
   * Low-level helper for private POST endpoints.
   * Handles nonce, signing, and Kraken error wrapper.
   * @internal
   */
  public async privatePost<T>(
    path: string, // e.g. "/0/private/Balance"
    params?: Record<string, string | number | boolean | undefined>,
  ): Promise<T> {
    if (!this.apiKey || !this.apiSecret) {
      throw new KrakenApiError(
        'Missing apiKey or apiSecret for Kraken private API call',
        { endpoint: path },
      );
    }

    const url = new URL(path, this.baseUrl);

    // Retry wrapper must include JSON parsing + Kraken error decoding
    return this.scheduleWithRetry(path, async () => {
      const nonce = this.createNonce();

      // Build body
      const bodyParams = new URLSearchParams();
      bodyParams.set('nonce', nonce);

      if (params) {
        for (const [key, value] of Object.entries(params)) {
          if (value === undefined) continue;
          bodyParams.set(key, String(value));
        }
      }

      const bodyString = bodyParams.toString();

      // Kraken signing:
      // signature = base64( HMAC-SHA512( urlPath + SHA256(nonce + POSTdata) , base64Decode(apiSecret) ) )
      const sha256 = createHash('sha256')
        .update(nonce + bodyString)
        .digest();
      const secretBuffer = Buffer.from(this.apiSecret!, 'base64');

      const hmac = createHmac('sha512', secretBuffer);
      hmac.update(path);
      hmac.update(sha256);
      const signature = hmac.digest('base64');

      this.logger?.debug?.('Kraken REST private POST request', {
        endpoint: path,
        url: url.toString(),
        hasParams: !!params,
      });

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        const resp = await fetch(url, {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'API-Key': this.apiKey!,
            'API-Sign': signature,
            ...(this.userAgent ? { 'User-Agent': this.userAgent } : {}),
          },
          body: bodyString,
        });

        if (!resp.ok) {
          this.logger?.error?.('Kraken REST private HTTP error', {
            endpoint: path,
            status: resp.status,
            statusText: resp.statusText,
          });

          throw new KrakenApiError(
            `HTTP error from Kraken private API: ${resp.status} ${resp.statusText}`,
            {
              endpoint: path,
              httpStatus: resp.status,
              httpStatusText: resp.statusText,
            },
          );
        }

        let json: KrakenApiResponse<T>;
        try {
          json = (await resp.json()) as KrakenApiResponse<T>;
        } catch (e) {
          this.logger?.error?.('Kraken REST private JSON parse error', {
            endpoint: path,
            error: e,
          });

          throw new KrakenApiError(
            'Failed to parse Kraken private API response JSON',
            {
              endpoint: path,
              httpStatus: resp.status,
            },
          );
        }

        if (json.error?.length) {
          this.logger?.warn?.('Kraken REST private API error', {
            endpoint: path,
            krakenErrors: json.error,
          });

          throw new KrakenApiError(
            `Kraken private API error: ${json.error.join(', ')}`,
            {
              endpoint: path,
              httpStatus: resp.status,
              krakenErrorCodes: json.error,
              rawBody: json,
            },
          );
        }

        this.logger?.debug?.('Kraken REST private POST success', {
          endpoint: path,
        });

        return json.result;
      } finally {
        clearTimeout(timeout);
      }
    });
  }

  /**
   * Perform a signed POST to a private Kraken endpoint and return
   * the raw binary body (ArrayBuffer).
   *
   * This is used for endpoints like /0/private/RetrieveExport which
   * return application/octet-stream (ZIP) instead of JSON.
   *
   * - Still signs the request and sends nonce like other private calls.
   * - If Kraken returns JSON with an `error` array, it throws.
   * - Otherwise it returns the raw ArrayBuffer.
   */
  protected async privatePostBinary(
    path: string,
    body?: Record<string, string>,
  ): Promise<ArrayBuffer> {
    if (!this.apiKey || !this.apiSecret) {
      throw new Error(
        'KrakenRestBase: apiKey and apiSecret are required for private endpoints',
      );
    }

    const url = new URL(path, this.baseUrl);

    return this.scheduleWithRetry(path, async () => {
      const nonce = this.createNonce();

      // Body is x-www-form-urlencoded; include nonce
      const params = new URLSearchParams({
        nonce,
        ...(body ?? {}),
      });

      const postData = params.toString();

      // Sign the request
      const apiSign = this.signPrivateRequest(path, nonce, postData);

      this.logger?.debug?.('[KrakenRestBase] privatePostBinary request', {
        url: url.toString(),
        path,
        body,
      });

      // Ensure HeadersInit contains only strings (TS + runtime friendliness)
      const headers: Record<string, string> = {
        'API-Key': this.apiKey!,
        'API-Sign': apiSign,
        'User-Agent': this.userAgent ?? 'lynx-crypto-kraken-client/0.1.0',
        'Content-Type': 'application/x-www-form-urlencoded',
      };

      const res = await fetch(url.toString(), {
        method: 'POST',
        headers,
        body: postData,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        this.logger?.error?.('[KrakenRestBase] privatePostBinary HTTP error', {
          status: res.status,
          statusText: res.statusText,
          body: text,
        });

        throw new Error(
          `Kraken privatePostBinary failed: ${res.status} ${res.statusText} – ${text}`,
        );
      }

      const contentType = res.headers.get('content-type') ?? '';

      // Kraken will return JSON if there is an error, even for binary endpoints
      if (contentType.includes('application/json')) {
        const json = (await res.json().catch(() => null)) as {
          error?: string[];
          result?: unknown;
        } | null;

        if (!json) {
          throw new Error(
            'Kraken privatePostBinary: expected JSON body for error response',
          );
        }

        const errors = json.error ?? [];
        if (errors.length > 0) {
          const message = `Kraken API error: ${errors.join(', ')}`;
          this.logger?.error?.(
            '[KrakenRestBase] Kraken API error (binary response)',
            { errors },
          );
          const err = new Error(message);
          (err as any).krakenErrors = errors;
          throw err;
        }

        // JSON but no errors on a binary endpoint = weird, treat as error
        throw new Error(
          'Kraken privatePostBinary: expected binary data but got JSON without errors',
        );
      }

      // Happy path: application/octet-stream (ZIP)
      const buffer = await res.arrayBuffer();

      this.logger?.debug?.('[KrakenRestBase] privatePostBinary success', {
        bytes: buffer.byteLength,
      });

      return buffer;
    });
  }

  /**
   * Sign a private Kraken request.
   *
   * API-Sign = base64( HMAC_SHA512( path + SHA256(nonce + postData), base64_decode(apiSecret) ) )
   */
  protected signPrivateRequest(
    path: string,
    nonce: string,
    postData: string,
  ): string {
    if (!this.apiSecret) {
      throw new Error(
        'KrakenRestBase: apiSecret is required for private endpoints',
      );
    }

    const secret = Buffer.from(this.apiSecret, 'base64');

    // SHA256(nonce + POST data)
    const sha256 = createHash('sha256')
      .update(nonce + postData)
      .digest();

    // HMAC-SHA512(path + sha256)
    const hmac = createHmac('sha512', secret);
    hmac.update(path);
    hmac.update(sha256);
    return hmac.digest('base64');
  }

  private async scheduleWithRetry<T>(
    path: string,
    fn: () => Promise<T>,
  ): Promise<T> {
    const limiter = isTradingEndpoint(path)
      ? this.tradingLimiter
      : this.restLimiter;

    const cost = isTradingEndpoint(path)
      ? this.tradingCostFn(path)
      : this.restCostFn(path);

    const run = () => (limiter ? limiter.schedule(fn, { cost }) : fn());

    // No retries desired
    if (!this.rateLimitOptions.retryOnRateLimit) {
      return run();
    }

    const maxRetries = this.rateLimitOptions.maxRetries;

    let attempt = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        return await run();
      } catch (err: any) {
        attempt++;

        const msg: string =
          err?.message ?? (typeof err === 'string' ? err : '') ?? '';

        const krakenErrors: string[] | undefined =
          err?.krakenErrorCodes ?? err?.krakenErrors;

        const isRateExceeded =
          msg.includes('EAPI:Rate limit exceeded') ||
          (Array.isArray(krakenErrors) &&
            krakenErrors.some((e) => e.includes('EAPI:Rate limit exceeded')));

        const throttledUntil = (() => {
          const fromMsg = parseThrottledUntilUnixSeconds(msg);
          if (fromMsg) return fromMsg;

          if (Array.isArray(krakenErrors)) {
            for (const e of krakenErrors) {
              const ts = parseThrottledUntilUnixSeconds(e);
              if (ts) return ts;
            }
          }
          return null;
        })();

        const isHttp429 = err?.httpStatus === 429;

        const isRateLimit =
          isRateExceeded || throttledUntil !== null || isHttp429;

        if (!isRateLimit || attempt > maxRetries) {
          throw err;
        }

        // Compute wait time
        let waitMs = 0;

        if (throttledUntil !== null) {
          // UNIX timestamp from Kraken looks like seconds
          const nowSec = Math.floor(Date.now() / 1000);
          const deltaSec = Math.max(0, throttledUntil - nowSec);
          waitMs = deltaSec * 1000;
        } else {
          // exponential backoff with jitter, capped
          const base = 250 * Math.pow(2, attempt - 1); // 250, 500, 1000, 2000...
          waitMs = Math.min(base, 10_000);
        }

        waitMs = jitter(waitMs);

        this.logger?.warn?.('Kraken rate limited; retrying', {
          endpoint: path,
          attempt,
          waitMs,
          reason: isHttp429
            ? 'HTTP 429'
            : throttledUntil
              ? 'EService: Throttled'
              : 'EAPI: Rate limit exceeded',
        });

        await sleep(waitMs);
      }
    }
  }
}
