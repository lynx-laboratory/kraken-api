import { describe, it, expect, vi } from 'vitest';
import type { KrakenRestBase } from '../../../../../src/base/restBase';
import {
  getWithdrawMethods,
  type KrakenWithdrawMethod,
} from '../../../../../src/spot/rest/funding/getWithdrawMethods';

describe('getWithdrawMethods', () => {
  it('calls WithdrawMethods with required + optional fields', async () => {
    const base = { privatePost: vi.fn() } as unknown as KrakenRestBase;

    const mocked: KrakenWithdrawMethod[] = [
      { asset: 'USDT', method: 'Tether', network: 'ERC20', minimum: '10.0' },
    ];
    (base.privatePost as any).mockResolvedValueOnce(mocked);

    const res = await getWithdrawMethods(base, {
      asset: 'USDT',
      aclass: 'currency',
      network: 'ERC20',
      rebase_multiplier: 'rebased',
    });

    expect(base.privatePost).toHaveBeenCalledTimes(1);
    expect(base.privatePost).toHaveBeenCalledWith(
      '/0/private/WithdrawMethods',
      {
        asset: 'USDT',
        aclass: 'currency',
        network: 'ERC20',
        rebase_multiplier: 'rebased',
      },
    );
    expect(res).toBe(mocked);
  });

  it('omits undefined optional fields', async () => {
    const base = { privatePost: vi.fn() } as unknown as KrakenRestBase;

    const mocked: KrakenWithdrawMethod[] = [];
    (base.privatePost as any).mockResolvedValueOnce(mocked);

    await getWithdrawMethods(base, { asset: 'XBT' });

    expect(base.privatePost).toHaveBeenCalledWith(
      '/0/private/WithdrawMethods',
      {
        asset: 'XBT',
      },
    );
  });
});
