import { describe, it, expect, vi } from 'vitest';
import type { KrakenRestBase } from '../../../../../src/base/restBase';
import { getAllocationStatus } from '../../../../../src/spot/rest/earn/getAllocationStatus';

describe('getAllocationStatus', () => {
  it('calls /0/private/Earn/AllocateStatus with strategy_id', async () => {
    const privatePost = vi.fn().mockResolvedValue({ pending: true } as const);

    const base = { privatePost } as unknown as KrakenRestBase;

    const res = await getAllocationStatus(base, { strategy_id: 'STRAT_1' });

    expect(res).toEqual({ pending: true });
    expect(privatePost).toHaveBeenCalledTimes(1);
    expect(privatePost).toHaveBeenCalledWith('/0/private/Earn/AllocateStatus', {
      strategy_id: 'STRAT_1',
    });
  });

  it('passes through null result', async () => {
    const privatePost = vi.fn().mockResolvedValue(null);
    const base = { privatePost } as unknown as KrakenRestBase;

    const res = await getAllocationStatus(base, { strategy_id: 'STRAT_2' });

    expect(res).toBeNull();
    expect(privatePost).toHaveBeenCalledWith('/0/private/Earn/AllocateStatus', {
      strategy_id: 'STRAT_2',
    });
  });
});
