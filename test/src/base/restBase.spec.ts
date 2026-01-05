import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { KrakenRestBase } from '../../../src/base/restBase';
import { KrakenApiError } from '../../../src/base/errors';

function makeKrakenErrorJsonResponse(
  errors: string[],
  init?: Partial<ResponseLike>,
): ResponseLike {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    json: vi.fn(async () => ({ error: errors, result: {} })),
    text: vi.fn(async () => JSON.stringify({ error: errors, result: {} })),
    arrayBuffer: vi.fn(async () => new ArrayBuffer(0)),
    headers: {
      get: vi.fn(() => 'application/json'),
    },
    ...init,
  };
}

function makeOkJsonResponse<T>(
  result: T,
  init?: Partial<ResponseLike>,
): ResponseLike {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    json: vi.fn(async () => ({ error: [], result })),
    text: vi.fn(async () => JSON.stringify({ error: [], result })),
    arrayBuffer: vi.fn(async () => new ArrayBuffer(0)),
    headers: {
      get: vi.fn(() => 'application/json'),
    },
    ...init,
  };
}

function makeHttpErrorResponse(init?: Partial<ResponseLike>): ResponseLike {
  return {
    ok: false,
    status: 500,
    statusText: 'Internal Server Error',
    json: vi.fn(async () => {
      throw new Error('should not call json on http error in these tests');
    }),
    text: vi.fn(async () => 'oops'),
    arrayBuffer: vi.fn(async () => new ArrayBuffer(0)),
    headers: {
      get: vi.fn(() => 'text/plain'),
    },
    ...init,
  };
}

type ResponseLike = {
  ok: boolean;
  status: number;
  statusText: string;
  json: () => Promise<any>;
  text: () => Promise<string>;
  arrayBuffer: () => Promise<ArrayBuffer>;
  headers: { get: (name: string) => string | null };
};

class TestRestBase extends KrakenRestBase {
  // expose protected methods for unit tests
  _createNonce() {
    return this.createNonce();
  }
  _signPrivateRequest(path: string, nonce: string, postData: string) {
    return this.signPrivateRequest(path, nonce, postData);
  }
  async _privatePostBinary(path: string, body?: Record<string, string>) {
    return this.privatePostBinary(path, body);
  }
}

describe('KrakenRestBase', () => {
  const apiSecret = Buffer.from('super-secret').toString('base64');

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    (globalThis as any).fetch = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('createNonce() is strictly increasing within the same millisecond', () => {
    const now = 1700000000000;
    vi.spyOn(Date, 'now').mockReturnValue(now);

    const base = new TestRestBase({ rateLimit: { mode: 'off' } });
    const a = BigInt(base._createNonce());
    const b = BigInt(base._createNonce());
    const c = BigInt(base._createNonce());

    expect(b).toBe(a + 1n);
    expect(c).toBe(b + 1n);
  });

  it('createNonce() jumps base on a new millisecond', () => {
    const spy = vi.spyOn(Date, 'now');
    spy.mockReturnValueOnce(1700000000000);
    spy.mockReturnValueOnce(1700000000000);
    spy.mockReturnValueOnce(1700000000001);

    const base = new TestRestBase({ rateLimit: { mode: 'off' } });
    const a = BigInt(base._createNonce());
    const b = BigInt(base._createNonce());
    const c = BigInt(base._createNonce());

    expect(b).toBe(a + 1n);
    expect(c).toBe(BigInt(1700000000001) * 1000n);
  });

  it('publicGet() builds query string, sends User-Agent header when provided, and returns result', async () => {
    const fetchMock = vi.fn(async (_url: any, _init: any) =>
      makeOkJsonResponse({ hello: 'world' }),
    );
    (globalThis as any).fetch = fetchMock;

    const base = new TestRestBase({
      baseUrl: 'https://api.kraken.com',
      userAgent: 'UA_TEST',
    });

    const res = await base.publicGet('/0/public/Test', { a: 1, b: 'x' });

    expect(res).toEqual({ hello: 'world' });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [urlArg, init] = fetchMock.mock.calls[0]!;
    expect(String(urlArg)).toContain('/0/public/Test');
    expect(String(urlArg)).toContain('a=1');
    expect(String(urlArg)).toContain('b=x');
    expect(init.method).toBe('GET');
    expect(init.headers).toEqual({ 'User-Agent': 'UA_TEST' });
  });

  it('publicGet() throws KrakenApiError on HTTP error', async () => {
    const fetchMock = vi.fn(async () =>
      makeHttpErrorResponse({ status: 418, statusText: "I'm a teapot" }),
    );
    (globalThis as any).fetch = fetchMock;

    const base = new TestRestBase();

    await expect(base.publicGet('/0/public/Test')).rejects.toBeInstanceOf(
      KrakenApiError,
    );
    await expect(base.publicGet('/0/public/Test')).rejects.toThrow(
      /HTTP error/i,
    );
  });

  it('publicGet() throws KrakenApiError on JSON parse error', async () => {
    const badResp: ResponseLike = {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: vi.fn(async () => {
        throw new Error('bad json');
      }),
      text: vi.fn(async () => 'not json'),
      arrayBuffer: vi.fn(async () => new ArrayBuffer(0)),
      headers: { get: vi.fn(() => 'application/json') },
    };

    (globalThis as any).fetch = vi.fn(async () => badResp);

    const base = new TestRestBase();

    await expect(base.publicGet('/0/public/Test')).rejects.toBeInstanceOf(
      KrakenApiError,
    );
    await expect(base.publicGet('/0/public/Test')).rejects.toThrow(/parse/i);
  });

  it('publicGet() throws KrakenApiError when Kraken returns error[]', async () => {
    const resp: ResponseLike = {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: vi.fn(async () => ({
        error: ['EGeneral:Permission denied'],
        result: {},
      })),
      text: vi.fn(async () => 'x'),
      arrayBuffer: vi.fn(async () => new ArrayBuffer(0)),
      headers: { get: vi.fn(() => 'application/json') },
    };

    (globalThis as any).fetch = vi.fn(async () => resp);

    const base = new TestRestBase();

    await expect(base.publicGet('/0/public/Test')).rejects.toBeInstanceOf(
      KrakenApiError,
    );
    await expect(base.publicGet('/0/public/Test')).rejects.toThrow(
      /Kraken API error/i,
    );
  });

  it('publicGet() aborts via timeoutMs (covers AbortController timeout path)', async () => {
    vi.useFakeTimers();

    const fetchMock = vi.fn((_: any, init: any) => {
      const signal = init?.signal as AbortSignal | undefined;

      return new Promise((_resolve, reject) => {
        const onAbort = () => reject(new Error('Aborted'));
        // node AbortSignal supports addEventListener
        (signal as any)?.addEventListener?.('abort', onAbort);
      });
    });

    (globalThis as any).fetch = fetchMock;

    const base = new TestRestBase({ timeoutMs: 5 });

    const p = base.publicGet('/0/public/Test');
    const assertion = expect(p).rejects.toThrow(/Aborted/i);

    await vi.advanceTimersByTimeAsync(6);
    await assertion;
  });

  it('privatePost() throws KrakenApiError if apiKey/apiSecret missing', async () => {
    const base = new TestRestBase();

    await expect(base.privatePost('/0/private/Balance')).rejects.toBeInstanceOf(
      KrakenApiError,
    );
    await expect(base.privatePost('/0/private/Balance')).rejects.toThrow(
      /Missing apiKey/i,
    );
  });

  it('privatePost() signs, includes nonce, stringifies params, and skips undefined', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1700000000000);

    const base = new TestRestBase({
      apiKey: 'KEY',
      apiSecret,
      userAgent: 'UA_TEST',
    });

    const fetchMock = vi.fn<(url: any, init?: any) => Promise<ResponseLike>>(
      async (_url, _init) => makeOkJsonResponse({ ok: true }),
    );
    (globalThis as any).fetch = fetchMock;

    const res = await base.privatePost('/0/private/Test', {
      a: 1,
      b: true,
      c: undefined,
    });

    expect(res).toEqual({ ok: true });

    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [urlArg, init] = fetchMock.mock.calls[0]!;
    expect(String(urlArg)).toContain('/0/private/Test');
    expect(init.method).toBe('POST');
    expect(init.headers['API-Key']).toBe('KEY');
    expect(typeof init.headers['API-Sign']).toBe('string');
    expect(init.headers['Content-Type']).toBe(
      'application/x-www-form-urlencoded',
    );
    expect(init.headers['User-Agent']).toBe('UA_TEST');

    const body = String(init.body);
    expect(body).toMatch(/nonce=\d+/);
    expect(body).toContain('a=1');
    expect(body).toContain('b=true');
    expect(body).not.toContain('c=');
  });

  it('privatePost() throws KrakenApiError on HTTP error', async () => {
    (globalThis as any).fetch = vi.fn(async () =>
      makeHttpErrorResponse({ status: 401, statusText: 'Unauthorized' }),
    );

    const base = new TestRestBase({
      apiKey: 'KEY',
      apiSecret,
    });

    await expect(base.privatePost('/0/private/Test')).rejects.toBeInstanceOf(
      KrakenApiError,
    );
    await expect(base.privatePost('/0/private/Test')).rejects.toThrow(
      /HTTP error/i,
    );
  });

  it('privatePost() throws KrakenApiError on JSON parse error', async () => {
    const resp: ResponseLike = {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: vi.fn(async () => {
        throw new Error('bad json');
      }),
      text: vi.fn(async () => 'x'),
      arrayBuffer: vi.fn(async () => new ArrayBuffer(0)),
      headers: { get: vi.fn(() => 'application/json') },
    };

    (globalThis as any).fetch = vi.fn(async () => resp);

    const base = new TestRestBase({
      apiKey: 'KEY',
      apiSecret,
    });

    await expect(base.privatePost('/0/private/Test')).rejects.toBeInstanceOf(
      KrakenApiError,
    );
    await expect(base.privatePost('/0/private/Test')).rejects.toThrow(/parse/i);
  });

  it('privatePost() throws KrakenApiError when Kraken returns error[]', async () => {
    const resp: ResponseLike = {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: vi.fn(async () => ({
        error: ['EGeneral:Bad request'],
        result: {},
      })),
      text: vi.fn(async () => 'x'),
      arrayBuffer: vi.fn(async () => new ArrayBuffer(0)),
      headers: { get: vi.fn(() => 'application/json') },
    };

    (globalThis as any).fetch = vi.fn(async () => resp);

    const base = new TestRestBase({
      apiKey: 'KEY',
      apiSecret,
    });

    await expect(base.privatePost('/0/private/Test')).rejects.toBeInstanceOf(
      KrakenApiError,
    );
    await expect(base.privatePost('/0/private/Test')).rejects.toThrow(
      /Kraken private API error/i,
    );
  });

  it('signPrivateRequest() throws if apiSecret is missing', () => {
    const base = new TestRestBase({ apiKey: 'KEY' });

    expect(() =>
      base._signPrivateRequest('/0/private/Test', '1', 'nonce=1'),
    ).toThrow(/apiSecret/i);
  });

  it('privatePostBinary() throws if apiKey/apiSecret missing', async () => {
    const base = new TestRestBase();

    await expect(
      base._privatePostBinary('/0/private/RetrieveExport'),
    ).rejects.toThrow(/apiKey and apiSecret/i);
  });

  it('privatePostBinary() throws on non-ok response and includes response text', async () => {
    const resp: ResponseLike = {
      ok: false,
      status: 502,
      statusText: 'Bad Gateway',
      json: vi.fn(async () => ({})),
      text: vi.fn(async () => 'gateway down'),
      arrayBuffer: vi.fn(async () => new ArrayBuffer(0)),
      headers: { get: vi.fn(() => 'text/plain') },
    };

    (globalThis as any).fetch = vi.fn(async () => resp);

    const base = new TestRestBase({
      apiKey: 'KEY',
      apiSecret,
      userAgent: 'UA_TEST',
    });

    await expect(
      base._privatePostBinary('/0/private/RetrieveExport', { id: 'X' }),
    ).rejects.toThrow(/gateway down/i);
  });

  it("privatePostBinary() JSON content-type: throws if JSON body can't be parsed", async () => {
    const resp: ResponseLike = {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: vi.fn(async () => {
        throw new Error('bad json');
      }),
      text: vi.fn(async () => 'x'),
      arrayBuffer: vi.fn(async () => new ArrayBuffer(0)),
      headers: { get: vi.fn(() => 'application/json') },
    };

    (globalThis as any).fetch = vi.fn(async () => resp);

    const base = new TestRestBase({ apiKey: 'KEY', apiSecret });

    await expect(
      base._privatePostBinary('/0/private/RetrieveExport', { id: 'X' }),
    ).rejects.toThrow(/expected JSON body/i);
  });

  it('privatePostBinary() JSON content-type: throws and attaches krakenErrors when error[] present', async () => {
    const resp: ResponseLike = {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: vi.fn(async () => ({
        error: ['EGeneral:Permission denied'],
        result: null,
      })),
      text: vi.fn(async () => 'x'),
      arrayBuffer: vi.fn(async () => new ArrayBuffer(0)),
      headers: { get: vi.fn(() => 'application/json') },
    };

    (globalThis as any).fetch = vi.fn(async () => resp);

    const base = new TestRestBase({ apiKey: 'KEY', apiSecret });

    try {
      await base._privatePostBinary('/0/private/RetrieveExport', { id: 'X' });
      throw new Error('expected to throw');
    } catch (e: any) {
      expect(String(e.message)).toMatch(/Kraken API error/i);
      expect(e.krakenErrors).toEqual(['EGeneral:Permission denied']);
    }
  });

  it('privatePostBinary() JSON content-type: JSON without errors is treated as error', async () => {
    const resp: ResponseLike = {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: vi.fn(async () => ({ error: [], result: { weird: true } })),
      text: vi.fn(async () => 'x'),
      arrayBuffer: vi.fn(async () => new ArrayBuffer(0)),
      headers: { get: vi.fn(() => 'application/json') },
    };

    (globalThis as any).fetch = vi.fn(async () => resp);

    const base = new TestRestBase({ apiKey: 'KEY', apiSecret });

    await expect(
      base._privatePostBinary('/0/private/RetrieveExport', { id: 'X' }),
    ).rejects.toThrow(/expected binary data/i);
  });

  it('privatePostBinary() returns ArrayBuffer on non-JSON content-type and uses default UA when none provided', async () => {
    const buf = new ArrayBuffer(16);

    const resp: ResponseLike = {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: vi.fn(async () => ({})),
      text: vi.fn(async () => 'x'),
      arrayBuffer: vi.fn(async () => buf),
      headers: { get: vi.fn(() => 'application/octet-stream') },
    };

    const fetchMock = vi.fn(async (_url: any, init: any) => resp);
    (globalThis as any).fetch = fetchMock;

    const base = new TestRestBase({
      apiKey: 'KEY',
      apiSecret,
      // no userAgent => should use default in privatePostBinary()
    });

    const out = await base._privatePostBinary('/0/private/RetrieveExport', {
      id: 'EXPORT123',
    });

    expect(out).toBe(buf);

    const [, init] = fetchMock.mock.calls[0]!;
    expect(init.headers['User-Agent']).toBe('lynx-crypto-kraken-client/0.1.0');
    expect(String(init.body)).toMatch(/nonce=\d+/);
    expect(String(init.body)).toContain('id=EXPORT123');
  });

  it('retries on Kraken EAPI:Rate limit exceeded and eventually returns result', async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    const rateLimitResp: ResponseLike = {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: vi.fn(async () => ({
        error: ['EAPI:Rate limit exceeded'],
        result: {},
      })),
      text: vi.fn(async () => 'x'),
      arrayBuffer: vi.fn(async () => new ArrayBuffer(0)),
      headers: { get: vi.fn(() => 'application/json') },
    };

    const okResp = makeOkJsonResponse({ hello: 'world' });

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(rateLimitResp)
      .mockResolvedValueOnce(okResp);

    (globalThis as any).fetch = fetchMock;

    const base = new TestRestBase(); // default: retry enabled

    const p = base.publicGet('/0/public/Test');

    // first retry uses exponential base 250ms (jitter deterministic)
    await vi.advanceTimersByTimeAsync(250);

    await expect(p).resolves.toEqual({ hello: 'world' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('retries on Kraken EService: Throttled: <unix timestamp> and waits until timestamp', async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    // now = 1700000000000ms => 1700000000s
    vi.spyOn(Date, 'now').mockReturnValue(1700000000000);

    const throttledResp: ResponseLike = {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: vi.fn(async () => ({
        error: ['EService: Throttled: 1700000001'],
        result: {},
      })),
      text: vi.fn(async () => 'x'),
      arrayBuffer: vi.fn(async () => new ArrayBuffer(0)),
      headers: { get: vi.fn(() => 'application/json') },
    };

    const okResp = makeOkJsonResponse({ ok: true });

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(throttledResp)
      .mockResolvedValueOnce(okResp);

    (globalThis as any).fetch = fetchMock;

    const base = new TestRestBase();

    const p = base.publicGet('/0/public/Test');

    // should wait ~1000ms (until unix second 1700000001)
    await vi.advanceTimersByTimeAsync(1000);

    await expect(p).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('retries on HTTP 429 and succeeds on next attempt', async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        makeHttpErrorResponse({ status: 429, statusText: 'Too Many Requests' }),
      )
      .mockResolvedValueOnce(makeOkJsonResponse({ ok: true }));

    (globalThis as any).fetch = fetchMock;

    const base = new TestRestBase();

    const p = base.publicGet('/0/public/Test');

    // first retry uses exponential base 250ms (jitter deterministic)
    await vi.advanceTimersByTimeAsync(250);

    await expect(p).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does NOT retry when retryOnRateLimit=false (covers "No retries desired" early return)', async () => {
    const rateLimitResp: ResponseLike = {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: vi.fn(async () => ({
        error: ['EAPI:Rate limit exceeded'],
        result: {},
      })),
      text: vi.fn(async () => 'x'),
      arrayBuffer: vi.fn(async () => new ArrayBuffer(0)),
      headers: { get: vi.fn(() => 'application/json') },
    };

    const fetchMock = vi.fn(async () => rateLimitResp);
    (globalThis as any).fetch = fetchMock;

    const base = new TestRestBase({
      rateLimit: {
        mode: 'off',
        retryOnRateLimit: false, // <-- key line
        // maxRetries can be anything; it should not matter when retryOnRateLimit is false
        maxRetries: 5,
      },
    });

    await expect(base.publicGet('/0/public/Test')).rejects.toBeInstanceOf(
      KrakenApiError,
    );

    // Should NOT retry -> only 1 call
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('constructor: sets default tradingCostFn when not provided (rl.tradingCostFn ?? (() => 1))', async () => {
    const tradingCosts: number[] = [];

    const tradingLimiter = {
      schedule: vi.fn(async (fn: any, opts: any) => {
        tradingCosts.push(opts?.cost);
        return fn();
      }),
    };

    (globalThis as any).fetch = vi.fn(async () =>
      makeOkJsonResponse({ ok: true }),
    );
    vi.spyOn(Date, 'now').mockReturnValue(1700000000000);

    const base = new TestRestBase({
      apiKey: 'KEY',
      apiSecret,
      limiter: { trading: tradingLimiter as any },
      rateLimit: { mode: 'auto' }, // no tradingCostFn passed
    });

    // NOTE: must be a "trading" endpoint per isTradingEndpoint()
    await base.privatePost('/0/private/AddOrder', { a: 1 } as any);

    expect(tradingLimiter.schedule).toHaveBeenCalledTimes(1);
    expect(tradingCosts[0]).toBe(1);
  });

  it('constructor: uses provided limiters and custom tradingCostFn/restCostFn (covers limiter assignment + cost selection)', async () => {
    const restCosts: number[] = [];
    const tradingCosts: number[] = [];

    const restLimiter = {
      schedule: vi.fn(async (fn: any, opts: any) => {
        restCosts.push(opts?.cost);
        return fn();
      }),
    };

    const tradingLimiter = {
      schedule: vi.fn(async (fn: any, opts: any) => {
        tradingCosts.push(opts?.cost);
        return fn();
      }),
    };

    const fetchMock = vi.fn<(url: any, init?: any) => Promise<ResponseLike>>(
      async () => makeOkJsonResponse({ ok: true }),
    );
    (globalThis as any).fetch = fetchMock;

    vi.spyOn(Date, 'now').mockReturnValue(1700000000000);

    const base = new TestRestBase({
      apiKey: 'KEY',
      apiSecret,
      limiter: {
        rest: restLimiter as any,
        trading: tradingLimiter as any,
      },
      rateLimit: {
        mode: 'auto',
        restCostFn: () => 7,
        tradingCostFn: () => 9,
      },
    });

    await base.publicGet('/0/public/Test');
    await base.privatePost('/0/private/AddOrder', { a: 1 } as any);

    expect(restLimiter.schedule).toHaveBeenCalledTimes(1);
    expect(tradingLimiter.schedule).toHaveBeenCalledTimes(1);
    expect(restCosts[0]).toBe(7);
    expect(tradingCosts[0]).toBe(9);
  });

  it('constructor: creates default in-memory limiters when mode != off and none provided (covers TokenBucketLimiter creation branches)', () => {
    expect(
      () =>
        new TestRestBase({
          rateLimit: { mode: 'auto', tier: 'starter' },
        }),
    ).not.toThrow();
  });

  it('privatePostBinary(): when body is undefined, URLSearchParams only includes nonce (covers ...(body ?? {}) nullish branch)', async () => {
    const buf = new ArrayBuffer(4);

    const fetchMock = vi.fn<(url: any, init?: any) => Promise<ResponseLike>>(
      async (_url, init) => {
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          json: vi.fn(async () => ({})),
          text: vi.fn(async () => ''),
          arrayBuffer: vi.fn(async () => buf),
          headers: { get: vi.fn(() => 'application/octet-stream') },
        };
      },
    );
    (globalThis as any).fetch = fetchMock;

    vi.spyOn(Date, 'now').mockReturnValue(1700000000000);

    const base = new TestRestBase({
      apiKey: 'KEY',
      apiSecret,
      rateLimit: { mode: 'off' },
    });

    const out = await base._privatePostBinary('/0/private/RetrieveExport'); // <-- body undefined
    expect(out).toBe(buf);

    const [, init] = fetchMock.mock.calls[0]!;
    const body = String(init.body);
    expect(body).toMatch(/^nonce=\d+$/);
  });

  it('privatePostBinary(): missing content-type header falls back to "" and is treated as binary (covers ?? "" branch)', async () => {
    const buf = new ArrayBuffer(8);

    (globalThis as any).fetch = vi.fn(async () => {
      const resp: ResponseLike = {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: vi.fn(async () => ({})),
        text: vi.fn(async () => ''),
        arrayBuffer: vi.fn(async () => buf),
        headers: { get: vi.fn(() => null) }, // <-- content-type missing
      };
      return resp;
    });

    const base = new TestRestBase({
      apiKey: 'KEY',
      apiSecret,
      rateLimit: { mode: 'off' },
    });

    await expect(
      base._privatePostBinary('/0/private/RetrieveExport', { id: 'X' }),
    ).resolves.toBe(buf);
  });

  it('privatePostBinary(): JSON response with missing error field uses [] (covers json.error ?? []) and throws JSON-without-errors error', async () => {
    (globalThis as any).fetch = vi.fn(async () => {
      const resp: ResponseLike = {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: vi.fn(async () => ({ result: { weird: true } })), // <-- no "error" field
        text: vi.fn(async () => 'x'),
        arrayBuffer: vi.fn(async () => new ArrayBuffer(0)),
        headers: { get: vi.fn(() => 'application/json') },
      };
      return resp;
    });

    const base = new TestRestBase({
      apiKey: 'KEY',
      apiSecret,
      rateLimit: { mode: 'off' },
    });

    await expect(
      base._privatePostBinary('/0/private/RetrieveExport', { id: 'X' }),
    ).rejects.toThrow(/expected binary data but got JSON without errors/i);
  });

  it('scheduleWithRetry(): msg uses thrown string when err is a string (covers typeof err === "string" branch)', async () => {
    const restLimiter = {
      schedule: vi.fn(async (_fn: any, _opts: any) => {
        throw 'EAPI:Rate limit exceeded'; // <-- string error
      }),
    };

    (globalThis as any).fetch = vi.fn(); // should never run

    const base = new TestRestBase({
      limiter: { rest: restLimiter as any },
      rateLimit: { mode: 'auto', retryOnRateLimit: true, maxRetries: 0 },
    });

    await expect(base.publicGet('/0/public/Test')).rejects.toBe(
      'EAPI:Rate limit exceeded',
    );
    expect((globalThis as any).fetch).not.toHaveBeenCalled();
  });

  it('scheduleWithRetry(): parses throttledUntil from krakenErrorCodes array (covers loop "if (ts) return ts" + msg fallback to "")', async () => {
    const restLimiter = {
      schedule: vi.fn(async (_fn: any, _opts: any) => {
        throw {
          // no message => msg falls back to ""
          krakenErrorCodes: ['EService: Throttled: 1700000001'],
        };
      }),
    };

    (globalThis as any).fetch = vi.fn();

    const base = new TestRestBase({
      limiter: { rest: restLimiter as any },
      rateLimit: { mode: 'auto', retryOnRateLimit: true, maxRetries: 0 },
    });

    await expect(base.publicGet('/0/public/Test')).rejects.toMatchObject({
      krakenErrorCodes: ['EService: Throttled: 1700000001'],
    });
  });

  it('scheduleWithRetry(): logger reason branch = "HTTP 429"', async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    const logger = {
      warn: vi.fn(),
      debug: vi.fn(),
      info: vi.fn(),
      error: vi.fn(),
    };

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        makeHttpErrorResponse({ status: 429, statusText: 'Too Many Requests' }),
      )
      .mockResolvedValueOnce(makeOkJsonResponse({ ok: true }));

    (globalThis as any).fetch = fetchMock;

    const base = new TestRestBase({
      logger,
      rateLimit: { mode: 'off', retryOnRateLimit: true, maxRetries: 1 },
    });

    const p = base.publicGet('/0/public/Test');
    await vi.advanceTimersByTimeAsync(250);
    await expect(p).resolves.toEqual({ ok: true });

    const meta = logger.warn.mock.calls[0]![1] as any;
    expect(meta.reason).toBe('HTTP 429');
  });

  it('scheduleWithRetry(): logger reason branch = "EService: Throttled"', async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    vi.spyOn(Date, 'now').mockReturnValue(1700000000000);

    const logger = {
      warn: vi.fn(),
      debug: vi.fn(),
      info: vi.fn(),
      error: vi.fn(),
    };

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        makeKrakenErrorJsonResponse(['EService: Throttled: 1700000001']),
      )
      .mockResolvedValueOnce(makeOkJsonResponse({ ok: true }));

    (globalThis as any).fetch = fetchMock;

    const base = new TestRestBase({
      logger,
      rateLimit: { mode: 'off', retryOnRateLimit: true, maxRetries: 1 },
    });

    const p = base.publicGet('/0/public/Test');
    await vi.advanceTimersByTimeAsync(1000);
    await expect(p).resolves.toEqual({ ok: true });

    const rateWarn = logger.warn.mock.calls.find(
      (c) => String(c[0]) === 'Kraken rate limited; retrying',
    );

    expect(rateWarn).toBeTruthy();
    const meta = rateWarn![1] as any;
    expect(meta.reason).toBe('EService: Throttled');
  });

  it('scheduleWithRetry(): logger reason branch = "EAPI: Rate limit exceeded"', async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    const logger = {
      warn: vi.fn(),
      debug: vi.fn(),
      info: vi.fn(),
      error: vi.fn(),
    };

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        makeKrakenErrorJsonResponse(['EAPI:Rate limit exceeded']),
      )
      .mockResolvedValueOnce(makeOkJsonResponse({ ok: true }));

    (globalThis as any).fetch = fetchMock;

    const base = new TestRestBase({
      logger,
      rateLimit: { mode: 'off', retryOnRateLimit: true, maxRetries: 1 },
    });

    const p = base.publicGet('/0/public/Test');
    await vi.advanceTimersByTimeAsync(250);
    await expect(p).resolves.toEqual({ ok: true });

    const rateWarn = logger.warn.mock.calls.find(
      (c) => String(c[0]) === 'Kraken rate limited; retrying',
    );

    expect(rateWarn).toBeTruthy();
    const meta = rateWarn![1] as any;
    expect(meta.reason).toBe('EAPI: Rate limit exceeded');
  });
});
