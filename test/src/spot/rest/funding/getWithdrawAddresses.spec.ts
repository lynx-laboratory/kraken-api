import { describe, it, expect, vi } from 'vitest';
import type { KrakenRestBase } from '../../../../../src/base/restBase';
import {
  getWithdrawAddresses,
  type KrakenWithdrawAddress,
} from '../../../../../src/spot/rest/funding/getWithdrawAddresses';

describe('getWithdrawAddresses', () => {
  it('calls WithdrawAddresses with required asset only', async () => {
    const base = { privatePost: vi.fn() } as unknown as KrakenRestBase;

    const mocked: KrakenWithdrawAddress[] = [];
    (base.privatePost as any).mockResolvedValueOnce(mocked);

    const res = await getWithdrawAddresses(base, { asset: 'USDT' });

    expect(base.privatePost).toHaveBeenCalledTimes(1);
    expect(base.privatePost).toHaveBeenCalledWith(
      '/0/private/WithdrawAddresses',
      {
        asset: 'USDT',
      },
    );
    expect(res).toBe(mocked);
  });

  it('encodes optional params and boolean verified', async () => {
    const base = { privatePost: vi.fn() } as unknown as KrakenRestBase;

    const mocked: KrakenWithdrawAddress[] = [
      {
        address: 'addr',
        asset: 'USDT',
        method: 'Tether',
        key: 'my_key',
        verified: true,
      },
    ];
    (base.privatePost as any).mockResolvedValueOnce(mocked);

    await getWithdrawAddresses(base, {
      asset: 'USDT',
      aclass: 'currency',
      method: 'Tether',
      key: 'my_key',
      verified: true,
    });

    expect(base.privatePost).toHaveBeenCalledWith(
      '/0/private/WithdrawAddresses',
      {
        asset: 'USDT',
        aclass: 'currency',
        method: 'Tether',
        key: 'my_key',
        verified: 'true',
      },
    );
  });
});
