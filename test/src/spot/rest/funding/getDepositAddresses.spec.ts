import { describe, it, expect, vi } from 'vitest';
import type { KrakenRestBase } from '../../../../../src/base/restBase';
import {
  getDepositAddresses,
  type KrakenGetDepositAddressesResult,
} from '../../../../../src/spot/rest/funding/getDepositAddresses';

describe('getDepositAddresses', () => {
  it('calls /0/private/DepositAddresses with required fields only', async () => {
    const base = { privatePost: vi.fn() } as unknown as KrakenRestBase;

    const mocked: KrakenGetDepositAddressesResult = [
      { address: 'bc1qexample', expiretm: '0', new: false },
    ];

    (base.privatePost as any).mockResolvedValueOnce(mocked);

    const res = await getDepositAddresses(base, {
      asset: 'BTC',
      method: 'Bitcoin',
    });

    expect(base.privatePost).toHaveBeenCalledTimes(1);
    expect(base.privatePost).toHaveBeenCalledWith(
      '/0/private/DepositAddresses',
      {
        asset: 'BTC',
        method: 'Bitcoin',
      },
    );

    expect(res).toEqual(mocked);
  });

  it('includes aclass, new, and amount when provided (serializes to strings)', async () => {
    const base = { privatePost: vi.fn() } as unknown as KrakenRestBase;

    const mocked: KrakenGetDepositAddressesResult = [
      {
        address: 'lnbc1example',
        expiretm: '1700000000',
        new: true,
        tag: 'memo123',
      },
    ];

    (base.privatePost as any).mockResolvedValueOnce(mocked);

    const res = await getDepositAddresses(base, {
      asset: 'USDT',
      aclass: 'tokenized_asset',
      method: 'Bitcoin Lightning',
      new: true,
      amount: 123.45,
    });

    expect(base.privatePost).toHaveBeenCalledTimes(1);
    expect(base.privatePost).toHaveBeenCalledWith(
      '/0/private/DepositAddresses',
      {
        asset: 'USDT',
        method: 'Bitcoin Lightning',
        aclass: 'tokenized_asset',
        new: 'true',
        amount: '123.45',
      },
    );

    expect(res).toEqual(mocked);
  });

  it('serializes new=false to "false" and amount string via String()', async () => {
    const base = { privatePost: vi.fn() } as unknown as KrakenRestBase;

    const mocked: KrakenGetDepositAddressesResult = [];
    (base.privatePost as any).mockResolvedValueOnce(mocked);

    await getDepositAddresses(base, {
      asset: 'XRP',
      method: 'Ripple',
      new: false,
      amount: '0.01',
    });

    expect(base.privatePost).toHaveBeenCalledWith(
      '/0/private/DepositAddresses',
      {
        asset: 'XRP',
        method: 'Ripple',
        new: 'false',
        amount: '0.01',
      },
    );
  });
});
