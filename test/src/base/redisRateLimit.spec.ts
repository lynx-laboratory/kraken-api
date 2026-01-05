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

  it('constructor defaults ttlSeconds=30 and minWaitMs=50 when not provided (?? branches)', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(10_000);

    const evalFn: RedisEvalFn = vi.fn(async () => 0);

    // NOTE: no ttlSeconds / minWaitMs provided
    const limiter = new RedisTokenBucketLimiter({
      key: 'k',
      maxCounter: 10,
      decayPerSec: 1,
      evalRedis: evalFn,
    });

    await expect(limiter.schedule(async () => 'ok')).resolves.toBe('ok');

    expect(evalFn).toHaveBeenCalledTimes(1);
    const call = (evalFn as any).mock.calls[0] as any[];

    // args: key, maxCounter, decayPerSec, cost, ttlSeconds, minWaitMs
    expect(call[4]).toBe(30);
    expect(call[5]).toBe(50);
  });

  it('schedule() normalizes cost via Math.max(0, meta?.cost ?? 1) (default + negative branches)', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(20_000);

    const evalFn: RedisEvalFn = vi.fn(async () => 0);

    const limiter = new RedisTokenBucketLimiter({
      key: 'k',
      maxCounter: 10,
      decayPerSec: 1,
      evalRedis: evalFn,
    });

    const p1 = limiter.schedule(async () => 'a'); // meta undefined => cost=1
    const p2 = limiter.schedule(async () => 'b', { cost: -5 }); // negative => cost=0

    await expect(Promise.all([p1, p2])).resolves.toEqual(['a', 'b']);

    expect(evalFn).toHaveBeenCalledTimes(2);
    expect((evalFn as any).mock.calls[0][3]).toBe(1);
    expect((evalFn as any).mock.calls[1][3]).toBe(0);
  });

  it('drain() does not start a second drain while already draining (if (this.draining) return branch)', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(30_000);

    // First acquireOnce says "wait", keeping drain in-flight.
    // If schedule() wrongly starts a second drain, we'd see extra evalRedis calls immediately.
    const evalRedis: RedisEvalFn = vi
      .fn()
      .mockResolvedValueOnce(100) // wait first
      .mockResolvedValueOnce(0) // then allow first
      .mockResolvedValue(0); // allow second

    const limiter = new RedisTokenBucketLimiter({
      key: 'k',
      maxCounter: 1,
      decayPerSec: 1,
      ttlSeconds: 30,
      minWaitMs: 50,
      evalRedis,
    });

    const fn1 = vi.fn(async () => 'a');
    const fn2 = vi.fn(async () => 'b');

    const p1 = limiter.schedule(fn1, { cost: 1 });
    const p2 = limiter.schedule(fn2, { cost: 1 });

    // drain() starts synchronously until its first await; evalRedis should be called once
    expect(evalRedis).toHaveBeenCalledTimes(1);
    expect(fn2).toHaveBeenCalledTimes(0);

    // Let the sleep(100) elapse, then processing continues.
    await vi.advanceTimersByTimeAsync(100);
    await vi.runOnlyPendingTimersAsync();

    await expect(p1).resolves.toBe('a');
    await expect(p2).resolves.toBe('b');

    // Total: wait + proceed for fn1 + proceed for fn2
    expect(evalRedis).toHaveBeenCalledTimes(3);
  });
});
