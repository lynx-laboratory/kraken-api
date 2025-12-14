import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  RedisTokenBucketLimiter,
  type RedisEvalFn,
} from '../../../src/base/redisRateLimit';

type State = {
  counter: number;
  lastMs: number;
  expiresAtMs: number;
};

function makeEvalStub() {
  const store = new Map<string, State>();

  const evalFn: RedisEvalFn = vi.fn(
    async (
      key: string,
      maxCounter: number,
      decayPerSec: number,
      cost: number,
      ttlSeconds: number,
      minWaitMs: number,
    ) => {
      const now = Date.now();

      const st0 = store.get(key);
      const st =
        !st0 || st0.expiresAtMs <= now
          ? { counter: 0, lastMs: now, expiresAtMs: now + ttlSeconds * 1000 }
          : st0;

      const dtSec = (now - st.lastMs) / 1000;
      const decayed = Math.max(0, st.counter - dtSec * decayPerSec);
      st.counter = decayed;
      st.lastMs = now;
      st.expiresAtMs = now + ttlSeconds * 1000;

      if (st.counter + cost <= maxCounter) {
        st.counter += cost;
        store.set(key, st);
        return 0;
      }

      const needed = st.counter + cost - maxCounter;
      const waitSec = needed / decayPerSec;
      const waitMs = Math.max(minWaitMs, Math.ceil(waitSec * 1000));
      store.set(key, st);
      return waitMs;
    },
  );

  return { evalFn, store };
}

describe('RedisTokenBucketLimiter', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('runs immediately when under the maxCounter', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000_000);

    const { evalFn } = makeEvalStub();

    const limiter = new RedisTokenBucketLimiter({
      key: 'k',
      maxCounter: 10,
      decayPerSec: 1,
      ttlSeconds: 30,
      minWaitMs: 50,
      evalRedis: evalFn,
    });

    const fn = vi.fn(async () => 'ok');

    const p = limiter.schedule(fn);
    await vi.runAllTimersAsync();

    await expect(p).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('queues and waits when over limit, then proceeds after enough decay', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000_000);

    const { evalFn } = makeEvalStub();

    const limiter = new RedisTokenBucketLimiter({
      key: 'k',
      maxCounter: 1,
      decayPerSec: 1, // 1 per sec
      ttlSeconds: 30,
      minWaitMs: 50,
      evalRedis: evalFn,
    });

    const fn1 = vi.fn(async () => 'a');
    const fn2 = vi.fn(async () => 'b');

    const p1 = limiter.schedule(fn1, { cost: 1 });
    await vi.runOnlyPendingTimersAsync();
    await expect(p1).resolves.toBe('a');
    expect(fn1).toHaveBeenCalledTimes(1);

    const p2 = limiter.schedule(fn2, { cost: 1 });

    await vi.advanceTimersByTimeAsync(999);
    expect(fn2).toHaveBeenCalledTimes(0);

    await vi.advanceTimersByTimeAsync(1);
    await vi.runOnlyPendingTimersAsync();

    await expect(p2).resolves.toBe('b');
    expect(fn2).toHaveBeenCalledTimes(1);
  });

  it('respects minWaitMs floor to avoid busy looping', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000_000);

    const { evalFn } = makeEvalStub();

    const limiter = new RedisTokenBucketLimiter({
      key: 'k',
      maxCounter: 1,
      decayPerSec: 10, // fast decay would compute very small waits
      ttlSeconds: 30,
      minWaitMs: 50,
      evalRedis: evalFn,
    });

    const fn1 = vi.fn(async () => 'a');
    const fn2 = vi.fn(async () => 'b');

    await expect(limiter.schedule(fn1, { cost: 1 })).resolves.toBe('a');
    expect(fn1).toHaveBeenCalledTimes(1);

    const p2 = limiter.schedule(fn2, { cost: 1 });

    await vi.advanceTimersByTimeAsync(49);
    expect(fn2).toHaveBeenCalledTimes(0);

    await vi.advanceTimersByTimeAsync(1);
    await vi.runOnlyPendingTimersAsync();

    await expect(p2).resolves.toBe('b');
    expect(fn2).toHaveBeenCalledTimes(1);
  });

  it('applies cost: higher cost delays longer', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(2_000_000);

    const { evalFn } = makeEvalStub();

    const limiter = new RedisTokenBucketLimiter({
      key: 'k',
      maxCounter: 2,
      decayPerSec: 1, // 1 per sec
      ttlSeconds: 30,
      minWaitMs: 50,
      evalRedis: evalFn,
    });

    const fn1 = vi.fn(async () => 'c1');
    const fn2 = vi.fn(async () => 'c2');

    await expect(limiter.schedule(fn1, { cost: 2 })).resolves.toBe('c1');
    expect(fn1).toHaveBeenCalledTimes(1);

    const p2 = limiter.schedule(fn2, { cost: 2 });

    await vi.advanceTimersByTimeAsync(1999);
    expect(fn2).toHaveBeenCalledTimes(0);

    await vi.advanceTimersByTimeAsync(1);
    await vi.runOnlyPendingTimersAsync();

    await expect(p2).resolves.toBe('c2');
    expect(fn2).toHaveBeenCalledTimes(1);
  });

  it('uses TTL: state expires and resets after ttlSeconds', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(3_000_000);

    const { evalFn } = makeEvalStub();

    const limiter = new RedisTokenBucketLimiter({
      key: 'k',
      maxCounter: 1,
      decayPerSec: 0.001, // practically no decay
      ttlSeconds: 1,
      minWaitMs: 50,
      evalRedis: evalFn,
    });

    const fn1 = vi.fn(async () => 'a');
    const fn2 = vi.fn(async () => 'b');

    await expect(limiter.schedule(fn1, { cost: 1 })).resolves.toBe('a');
    expect(fn1).toHaveBeenCalledTimes(1);

    vi.setSystemTime(3_000_000 + 1100);

    await expect(limiter.schedule(fn2, { cost: 1 })).resolves.toBe('b');
    expect(fn2).toHaveBeenCalledTimes(1);
  });

  it('rejects the scheduled fn if Redis eval throws (no unhandled rejection)', async () => {
    vi.useFakeTimers();

    let shouldThrow = true;
    const evalRedis = vi.fn(async () => {
      if (shouldThrow) {
        shouldThrow = false;
        throw new Error('redis down');
      }
      return 0;
    });

    const limiter = new RedisTokenBucketLimiter({
      key: 'kraken:test',
      maxCounter: 1,
      decayPerSec: 1,
      ttlSeconds: 60,
      minWaitMs: 50,
      evalRedis,
    });

    const p = limiter.schedule(async () => 'ok');

    await expect(p).rejects.toThrow('redis down');

    vi.useRealTimers();
  });

  it('serializes calls per limiter instance (FIFO)', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(5_000_000);

    const { evalFn } = makeEvalStub();

    const limiter = new RedisTokenBucketLimiter({
      key: 'k',
      maxCounter: 1,
      decayPerSec: 1,
      ttlSeconds: 30,
      minWaitMs: 50,
      evalRedis: evalFn,
    });

    const fn1 = vi.fn(async () => 'a');
    const fn2 = vi.fn(async () => 'b');

    const p1 = limiter.schedule(fn1, { cost: 1 });
    await vi.runOnlyPendingTimersAsync();
    await expect(p1).resolves.toBe('a');

    const p2 = limiter.schedule(fn2, { cost: 1 });

    await vi.advanceTimersByTimeAsync(999);
    expect(fn2).toHaveBeenCalledTimes(0);

    await vi.advanceTimersByTimeAsync(1);
    await vi.runOnlyPendingTimersAsync();

    await expect(p2).resolves.toBe('b');
    expect(fn2).toHaveBeenCalledTimes(1);
  });

  it('passes correct args to eval (maxCounter, decayPerSec, cost, ttlSeconds, minWaitMs)', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(6_000_000);

    const evalFn: RedisEvalFn = vi.fn(async () => 0);

    const limiter = new RedisTokenBucketLimiter({
      key: 'kraken:rest',
      maxCounter: 15,
      decayPerSec: 0.33,
      ttlSeconds: 17,
      minWaitMs: 55,
      evalRedis: evalFn,
    });

    const fn = vi.fn(async () => 'ok');

    const p = limiter.schedule(fn, { cost: 2 });
    await vi.runAllTimersAsync();
    await expect(p).resolves.toBe('ok');

    expect(evalFn).toHaveBeenCalledTimes(1);

    const call = (evalFn as any).mock.calls[0] as any[];
    expect(call[0]).toBe('kraken:rest');
    expect(call[1]).toBe(15);
    expect(call[2]).toBe(0.33);
    expect(call[3]).toBe(2);
    expect(call[4]).toBe(17);
    expect(call[5]).toBe(55);
  });
});
