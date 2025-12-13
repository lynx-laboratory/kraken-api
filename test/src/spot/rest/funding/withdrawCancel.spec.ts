import { describe, it, expect, vi } from 'vitest';
import type { KrakenRestBase } from '../../../../../src/base/restBase';
import { withdrawCancel } from '../../../../../src/spot/rest/funding/withdrawCancel';

describe('withdrawCancel', () => {
  it('posts WithdrawCancel with asset + refid', async () => {
    const base = { privatePost: vi.fn() } as unknown as KrakenRestBase;
    (base.privatePost as any).mockResolvedValueOnce(true);

    const res = await withdrawCancel(base, { asset: 'USDT', refid: 'REF123' });

    expect(base.privatePost).toHaveBeenCalledTimes(1);
    expect(base.privatePost).toHaveBeenCalledWith('/0/private/WithdrawCancel', {
      asset: 'USDT',
      refid: 'REF123',
    });
    expect(res).toBe(true);
  });

  it('returns false when API returns false', async () => {
    const base = { privatePost: vi.fn() } as unknown as KrakenRestBase;
    (base.privatePost as any).mockResolvedValueOnce(false);

    const res = await withdrawCancel(base, { asset: 'XBT', refid: 'REF999' });

    expect(res).toBe(false);
  });
});
