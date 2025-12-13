import { describe, it, expect, vi } from 'vitest';
import type { KrakenRestBase } from '../../../../../src/base/restBase';
import { allocateEarnFunds } from '../../../../../src/spot/rest/earn/allocateEarnFunds';

describe('allocateEarnFunds', () => {
  it('calls /0/private/Earn/Allocate with amount coerced to string', async () => {
    const privatePost = vi.fn().mockResolvedValue(true);

    // KrakenRestBase is an abstract class; for unit tests we only need the method we call.
    const base = { privatePost } as unknown as KrakenRestBase;

    const res = await allocateEarnFunds(base, {
      amount: 123.45,
      strategy_id: 'STRAT_1',
    });

    expect(res).toBe(true);
    expect(privatePost).toHaveBeenCalledTimes(1);
    expect(privatePost).toHaveBeenCalledWith('/0/private/Earn/Allocate', {
      amount: '123.45',
      strategy_id: 'STRAT_1',
    });
  });

  it('passes through null result (async endpoint can return null)', async () => {
    const privatePost = vi.fn().mockResolvedValue(null);
    const base = { privatePost } as unknown as KrakenRestBase;

    const res = await allocateEarnFunds(base, {
      amount: '10',
      strategy_id: 'STRAT_2',
    });

    expect(res).toBeNull();
    expect(privatePost).toHaveBeenCalledWith('/0/private/Earn/Allocate', {
      amount: '10',
      strategy_id: 'STRAT_2',
    });
  });
});
