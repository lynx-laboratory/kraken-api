import { describe, it, expect, vi } from 'vitest';
import type { KrakenRestBase } from '../../../../../src/base/restBase';
import { deallocateEarnFunds } from '../../../../../src/spot/rest/earn/deallocateEarnFunds';

describe('deallocateEarnFunds', () => {
  it('calls /0/private/Earn/Deallocate with amount coerced to string', async () => {
    const privatePost = vi.fn().mockResolvedValue(true);
    const base = { privatePost } as unknown as KrakenRestBase;

    const res = await deallocateEarnFunds(base, {
      amount: 123.45,
      strategy_id: 'STRAT_1',
    });

    expect(res).toBe(true);
    expect(privatePost).toHaveBeenCalledTimes(1);
    expect(privatePost).toHaveBeenCalledWith('/0/private/Earn/Deallocate', {
      amount: '123.45',
      strategy_id: 'STRAT_1',
    });
  });

  it('passes through null result', async () => {
    const privatePost = vi.fn().mockResolvedValue(null);
    const base = { privatePost } as unknown as KrakenRestBase;

    const res = await deallocateEarnFunds(base, {
      amount: '10',
      strategy_id: 'STRAT_2',
    });

    expect(res).toBeNull();
    expect(privatePost).toHaveBeenCalledWith('/0/private/Earn/Deallocate', {
      amount: '10',
      strategy_id: 'STRAT_2',
    });
  });
});
