import type { Limiter } from './rateLimit';
import { sleep } from './rateLimit';

export type RedisEvalFn = (
  key: string,
  maxCounter: number,
  decayPerSec: number,
  cost: number,
  ttlSeconds: number,
  minWaitMs: number,
) => Promise<number>;

export interface RedisTokenBucketLimiterOptions {
  key: string;
  maxCounter: number;
  decayPerSec: number;
  ttlSeconds?: number;
  minWaitMs?: number;
  evalRedis: RedisEvalFn;
}

type QueueItem<T> = {
  fn: () => Promise<T>;
  resolve: (v: T) => void;
  reject: (e: any) => void;
  cost: number;
};

export class RedisTokenBucketLimiter implements Limiter {
  private readonly key: string;
  private readonly maxCounter: number;
  private readonly decayPerSec: number;
  private readonly ttlSeconds: number;
  private readonly minWaitMs: number;
  private readonly evalRedis: RedisEvalFn;

  private queue: Array<QueueItem<any>> = [];
  private draining = false;

  constructor(opts: RedisTokenBucketLimiterOptions) {
    this.key = opts.key;
    this.maxCounter = opts.maxCounter;
    this.decayPerSec = opts.decayPerSec;
    this.ttlSeconds = opts.ttlSeconds ?? 30;
    this.minWaitMs = opts.minWaitMs ?? 50;
    this.evalRedis = opts.evalRedis;
  }

  schedule<T>(fn: () => Promise<T>, meta?: { cost?: number }): Promise<T> {
    const cost = Math.max(0, meta?.cost ?? 1);

    return new Promise<T>((resolve, reject) => {
      this.queue.push({ fn, resolve, reject, cost });

      // prevent Vitest "Unhandled Rejection" even if drain() ever rejects
      void this.drain().catch(() => {});
    });
  }

  private async drain(): Promise<void> {
    if (this.draining) return;
    this.draining = true;

    try {
      while (this.queue.length > 0) {
        const next = this.queue.shift()!;

        try {
          await this.acquire(next.cost);
          const out = await next.fn();
          next.resolve(out);
        } catch (e) {
          next.reject(e);
        }
      }
    } finally {
      this.draining = false;
    }
  }

  private async acquire(cost: number): Promise<void> {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const waitMs = await this.acquireOnce(cost);
      if (waitMs <= 0) return;

      const safeWait = Math.max(this.minWaitMs, Math.ceil(waitMs));
      await sleep(safeWait);
    }
  }

  private acquireOnce(cost: number): Promise<number> {
    return this.evalRedis(
      this.key,
      this.maxCounter,
      this.decayPerSec,
      cost,
      this.ttlSeconds,
      this.minWaitMs,
    );
  }
}
