import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  TokenBucketLimiter,
  tierToRestParams,
  defaultRestCostFn,
  isTradingEndpoint,
  jitter,
  parseThrottledUntilUnixSeconds,
  sleep,
} from '../../../src/base/rateLimit';

describe('rateLimit utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('tierToRestParams()', () => {
    it('returns correct params for starter tier', () => {
      expect(tierToRestParams('starter')).toEqual({
        maxCounter: 15,
        decayPerSec: 0.33,
      });
    });

    it('returns correct params for intermediate tier', () => {
      expect(tierToRestParams('intermediate')).toEqual({
        maxCounter: 20,
        decayPerSec: 0.5,
      });
    });

    it('returns correct params for pro tier', () => {
      expect(tierToRestParams('pro')).toEqual({
        maxCounter: 20,
        decayPerSec: 1.0,
      });
    });
  });

  describe('defaultRestCostFn()', () => {
    it('returns cost 2 for ledger/trade-history style endpoints', () => {
      expect(defaultRestCostFn('/0/private/TradesHistory')).toBe(2);
      expect(defaultRestCostFn('/0/private/Ledgers')).toBe(2);
      expect(defaultRestCostFn('/0/private/TradeBalance')).toBe(2);
    });

    it('returns cost 1 for normal endpoints', () => {
      expect(defaultRestCostFn('/0/public/Ticker')).toBe(1);
      expect(defaultRestCostFn('/0/private/Balance')).toBe(1);
    });
  });

  describe('isTradingEndpoint()', () => {
    it('detects trading endpoints', () => {
      expect(isTradingEndpoint('/0/private/AddOrder')).toBe(true);
      expect(isTradingEndpoint('/0/private/CancelOrder')).toBe(true);
      expect(isTradingEndpoint('/0/private/EditOrder')).toBe(true);
      expect(isTradingEndpoint('/0/private/AddOrderBatch')).toBe(true);
      expect(isTradingEndpoint('/0/private/CancelOrderBatch')).toBe(true);
    });

    it('returns false for non-trading endpoints', () => {
      expect(isTradingEndpoint('/0/public/Ticker')).toBe(false);
      expect(isTradingEndpoint('/0/private/Balance')).toBe(false);
    });
  });

  describe('parseThrottledUntilUnixSeconds()', () => {
    it('parses unix timestamp from throttled message', () => {
      const msg = 'EService: Throttled: 1700000001';
      expect(parseThrottledUntilUnixSeconds(msg)).toBe(1700000001);
    });

    it('returns null if no throttled timestamp present', () => {
      expect(parseThrottledUntilUnixSeconds('EAPI:Rate limit exceeded')).toBe(
        null,
      );
    });

    it('returns null for malformed timestamps', () => {
      expect(
        parseThrottledUntilUnixSeconds('EService: Throttled: abc'),
      ).toBeNull();
    });
  });

  describe('jitter()', () => {
    it('applies deterministic jitter when Math.random is mocked', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      // midpoint => no change
      expect(jitter(1000)).toBe(1000);
    });

    it('never returns negative values', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0);
      expect(jitter(10)).toBeGreaterThanOrEqual(0);
    });
  });

  describe('sleep()', () => {
    it('resolves after given time', async () => {
      const spy = vi.fn();
      const p = sleep(100).then(spy);

      await vi.advanceTimersByTimeAsync(99);
      expect(spy).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(1);
      await p;
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('TokenBucketLimiter', () => {
    it('executes immediately when under limit', async () => {
      const limiter = new TokenBucketLimiter(10, 1);

      const fn = vi.fn(async () => 'ok');

      const res = await limiter.schedule(fn);

      expect(res).toBe('ok');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('queues calls when limit exceeded and drains after decay', async () => {
      // maxCounter = 1, decay = 1/sec
      const limiter = new TokenBucketLimiter(1, 1);

      const fn1 = vi.fn(async () => 'a');
      const fn2 = vi.fn(async () => 'b');

      const p1 = limiter.schedule(fn1, { cost: 1 });
      const p2 = limiter.schedule(fn2, { cost: 1 });

      // First executes immediately
      await expect(p1).resolves.toBe('a');
      expect(fn1).toHaveBeenCalledTimes(1);
      expect(fn2).not.toHaveBeenCalled();

      // Advance 1 second for decay
      await vi.advanceTimersByTimeAsync(1000);

      await expect(p2).resolves.toBe('b');
      expect(fn2).toHaveBeenCalledTimes(1);
    });

    it('propagates errors from scheduled function', async () => {
      const limiter = new TokenBucketLimiter(5, 1);
      const err = new Error('boom');

      const fn = vi.fn(async () => {
        throw err;
      });

      await expect(limiter.schedule(fn)).rejects.toThrow('boom');
    });

    it('respects per-call cost', async () => {
      // maxCounter = 2, decay irrelevant here
      const limiter = new TokenBucketLimiter(2, 1);

      const fn1 = vi.fn(async () => 'x');
      const fn2 = vi.fn(async () => 'y');

      const p1 = limiter.schedule(fn1, { cost: 2 });
      const p2 = limiter.schedule(fn2, { cost: 1 });

      await expect(p1).resolves.toBe('x');
      expect(fn2).not.toHaveBeenCalled();

      // need 1 second to decay cost=1
      await vi.advanceTimersByTimeAsync(1000);

      await expect(p2).resolves.toBe('y');
    });
  });
});
