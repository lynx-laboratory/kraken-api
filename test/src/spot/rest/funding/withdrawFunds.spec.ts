import { describe, it, expect, vi } from 'vitest';
import type { KrakenRestBase } from '../../../../../src/base/restBase';
import { withdrawFunds } from '../../../../../src/spot/rest/funding/withdrawFunds';

describe('withdrawFunds', () => {
  it('posts Withdraw with required fields', async () => {
    const base = { privatePost: vi.fn() } as unknown as KrakenRestBase;
    (base.privatePost as any).mockResolvedValueOnce({ refid: 'REF123' });

    const res = await withdrawFunds(base, {
      asset: 'USDT',
      key: 'my-key',
      amount: 12.34,
    });

    expect(base.privatePost).toHaveBeenCalledTimes(1);
    expect(base.privatePost).toHaveBeenCalledWith('/0/private/Withdraw', {
      asset: 'USDT',
      key: 'my-key',
      amount: '12.34',
    });
    expect(res).toEqual({ refid: 'REF123' });
  });

  it('includes optional fields when provided', async () => {
    const base = { privatePost: vi.fn() } as unknown as KrakenRestBase;
    (base.privatePost as any).mockResolvedValueOnce({ refid: 'REF999' });

    await withdrawFunds(base, {
      asset: 'XBT',
      aclass: 'currency',
      key: 'btc-key',
      address: 'bc1qexample',
      amount: '0.01',
      max_fee: 0.0002,
      rebase_multiplier: 'rebased',
    });

    expect(base.privatePost).toHaveBeenCalledWith('/0/private/Withdraw', {
      asset: 'XBT',
      aclass: 'currency',
      key: 'btc-key',
      address: 'bc1qexample',
      amount: '0.01',
      max_fee: '0.0002',
      rebase_multiplier: 'rebased',
    });
  });
});
