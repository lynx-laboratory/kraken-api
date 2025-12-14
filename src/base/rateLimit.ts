export type KrakenRateLimitTier = 'starter' | 'intermediate' | 'pro';

export interface KrakenRateLimitOptions {
  /**
   * Enable Kraken-style throttling.
   * - "auto" = default in-memory limiter
   * - "off"  = no throttling (caller handles it)
   */
  mode?: 'auto' | 'off';

  /**
   * Verification tier approximation for REST counter sizing/decay.
   * If unknown, default to "starter" (safest).
   */
  tier?: KrakenRateLimitTier;

  /**
   * If true (default), apply automatic retries for rate limiting responses.
   */
  retryOnRateLimit?: boolean;

  /**
   * Max number of retries for rate limit responses.
   * Default: 5
   */
  maxRetries?: number;

  /**
   * Optional custom cost function for REST endpoints.
   * Return 2 for ledger/trade history calls, etc.
   */
  restCostFn?: (path: string) => number;

  /**
   * Optional custom cost function for *trading* endpoints.
   * These are on a separate limiter.
   */
  tradingCostFn?: (path: string) => number;
}

export interface Limiter {
  schedule<T>(fn: () => Promise<T>, meta?: { cost?: number }): Promise<T>;
}

/**
 * Kraken REST counter model:
 * - "call counter" increases by cost (mostly 1, some endpoints 2)
 * - it decays over time
 * - must not exceed max counter
 */
export class TokenBucketLimiter implements Limiter {
  private counter = 0;
  private lastTs = Date.now();
  private queue: Array<{
    fn: () => Promise<unknown>;
    resolve: (v: any) => void;
    reject: (e: any) => void;
    cost: number;
  }> = [];
  private draining = false;

  constructor(
    private readonly maxCounter: number,
    private readonly decayPerSec: number,
  ) {}

  schedule<T>(fn: () => Promise<T>, meta?: { cost?: number }): Promise<T> {
    const cost = Math.max(0, meta?.cost ?? 1);

    return new Promise<T>((resolve, reject) => {
      this.queue.push({ fn, resolve, reject, cost });
      void this.drain();
    });
  }

  private decayNow() {
    const now = Date.now();
    const dtSec = (now - this.lastTs) / 1000;
    if (dtSec > 0) {
      this.counter = Math.max(0, this.counter - dtSec * this.decayPerSec);
      this.lastTs = now;
    }
  }

  private async drain() {
    if (this.draining) return;
    this.draining = true;

    try {
      while (this.queue.length > 0) {
        this.decayNow();

        const next = this.queue[0];
        // If we can afford it, run now
        if (this.counter + next.cost <= this.maxCounter) {
          this.queue.shift();
          this.counter += next.cost;

          try {
            const out = await next.fn();
            next.resolve(out);
          } catch (e) {
            next.reject(e);
          }

          // loop to handle next item
          continue;
        }

        // Otherwise wait until enough counter decays
        const needed = this.counter + next.cost - this.maxCounter;
        const waitSec = needed / this.decayPerSec;

        // Kraken says counter reduced “every couple seconds”; we can wait precisely,
        // but put a small floor to avoid busy looping.
        const waitMs = Math.max(50, Math.ceil(waitSec * 1000));
        await sleep(waitMs);
      }
    } finally {
      this.draining = false;
    }
  }
}

export function tierToRestParams(tier: KrakenRateLimitTier): {
  maxCounter: number;
  decayPerSec: number;
} {
  // From your snippet:
  // Starter: 15, -0.33/sec
  // Intermediate: 20, -0.5/sec
  // Pro: 20, -1/sec
  switch (tier) {
    case 'pro':
      return { maxCounter: 20, decayPerSec: 1.0 };
    case 'intermediate':
      return { maxCounter: 20, decayPerSec: 0.5 };
    case 'starter':
    default:
      return { maxCounter: 15, decayPerSec: 0.33 };
  }
}

export function defaultRestCostFn(path: string): number {
  // Kraken docs: "Ledger/trade history calls increase by 2"
  // Heuristic based on common endpoint names:
  if (
    path.includes('TradesHistory') ||
    path.includes('Ledgers') ||
    path.includes('TradeBalance') // optional; you can tweak
  ) {
    return 2;
  }
  return 1;
}

export function isTradingEndpoint(path: string): boolean {
  // Trading engine limiter applies to add/cancel/amend etc. (as per your snippet)
  return (
    path.includes('/AddOrder') ||
    path.includes('/CancelOrder') ||
    path.includes('/CancelAll') ||
    path.includes('/EditOrder') ||
    path.includes('/AddOrderBatch') ||
    path.includes('/CancelOrderBatch')
  );
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export function jitter(ms: number): number {
  // +/- 20%
  const delta = ms * 0.2;
  return Math.max(0, Math.floor(ms + (Math.random() * 2 - 1) * delta));
}

export function parseThrottledUntilUnixSeconds(msg: string): number | null {
  // "EService: Throttled: [UNIX timestamp]"
  const m = msg.match(/EService:\s*Throttled:\s*(\d+)/i);
  if (!m) return null;
  const ts = Number(m[1]);
  return Number.isFinite(ts) ? ts : null;
}
