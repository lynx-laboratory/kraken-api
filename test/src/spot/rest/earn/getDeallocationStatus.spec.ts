import { describe, it, expect, vi } from 'vitest';
import type { KrakenRestBase } from '../../../../../src/base/restBase';
import { getDeallocationStatus } from '../../../../../src/spot/rest/earn/getDeallocationStatus';

describe('getDeallocationStatus', () => {
  it('calls /0/private/Earn/DeallocateStatus with strategy_id', async () => {
    const privatePost = vi.fn().mockResolvedValue({ pending: true } as const);

    const base = { privatePost } as unknown as KrakenRestBase;

    const res = await getDeallocationStatus(base, { strategy_id: 'STRAT_1' });

    expect(res).toEqual({ pending: true });
    expect(privatePost).toHaveBeenCalledTimes(1);
    expect(privatePost).toHaveBeenCalledWith(
      '/0/private/Earn/DeallocateStatus',
      {
        strategy_id: 'STRAT_1',
      },
    );
  });

  it('passes through null result', async () => {
    const privatePost = vi.fn().mockResolvedValue(null);
    const base = { privatePost } as unknown as KrakenRestBase;

    const res = await getDeallocationStatus(base, { strategy_id: 'STRAT_2' });

    expect(res).toBeNull();
    expect(privatePost).toHaveBeenCalledWith(
      '/0/private/Earn/DeallocateStatus',
      {
        strategy_id: 'STRAT_2',
      },
    );
  });
});
