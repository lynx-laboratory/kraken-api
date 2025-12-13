import { describe, it, expect, vi } from 'vitest';
import type { KrakenRestBase } from '../../../../../src/base/restBase';
import {
  getDepositMethods,
  type KrakenGetDepositMethodsResult,
} from '../../../../../src/spot/rest/funding/getDepositMethods';

describe('getDepositMethods', () => {
  it('calls /0/private/DepositMethods with required fields only', async () => {
    const base = { privatePost: vi.fn() } as unknown as KrakenRestBase;

    const mocked: KrakenGetDepositMethodsResult = [
      {
        method: 'Bitcoin',
        limit: false,
        fee: '0.0000',
        'address-setup-fee': '0',
        'gen-address': true,
        minimum: '0.0001',
      },
    ];

    (base.privatePost as any).mockResolvedValueOnce(mocked);

    const res = await getDepositMethods(base, { asset: 'BTC' });

    expect(base.privatePost).toHaveBeenCalledTimes(1);
    expect(base.privatePost).toHaveBeenCalledWith('/0/private/DepositMethods', {
      asset: 'BTC',
    });

    expect(res).toEqual(mocked);
  });

  it('includes optional aclass and rebase_multiplier when provided', async () => {
    const base = { privatePost: vi.fn() } as unknown as KrakenRestBase;

    const mocked: KrakenGetDepositMethodsResult = [];
    (base.privatePost as any).mockResolvedValueOnce(mocked);

    await getDepositMethods(base, {
      asset: 'USDT',
      aclass: 'tokenized_asset',
      rebase_multiplier: 'rebased',
    });

    expect(base.privatePost).toHaveBeenCalledWith('/0/private/DepositMethods', {
      asset: 'USDT',
      aclass: 'tokenized_asset',
      rebase_multiplier: 'rebased',
    });
  });
});
