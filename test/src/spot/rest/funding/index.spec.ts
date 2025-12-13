import { describe, it, expect, vi, afterEach } from 'vitest';
import type { KrakenRestBase } from '../../../../../src/base/restBase';
import { KrakenSpotFundingApi } from '../../../../../src/spot/rest/funding';

import * as GetDepositMethods from '../../../../../src/spot/rest/funding/getDepositMethods';
import * as GetDepositAddresses from '../../../../../src/spot/rest/funding/getDepositAddresses';
import * as GetDepositStatus from '../../../../../src/spot/rest/funding/getDepositStatus';
import * as GetWithdrawMethods from '../../../../../src/spot/rest/funding/getWithdrawMethods';
import * as GetWithdrawAddresses from '../../../../../src/spot/rest/funding/getWithdrawAddresses';
import * as GetWithdrawInfo from '../../../../../src/spot/rest/funding/getWithdrawInfo';
import * as WithdrawFunds from '../../../../../src/spot/rest/funding/withdrawFunds';
import * as GetWithdrawStatus from '../../../../../src/spot/rest/funding/getWithdrawStatus';
import * as WithdrawCancel from '../../../../../src/spot/rest/funding/withdrawCancel';
import * as WalletTransfer from '../../../../../src/spot/rest/funding/walletTransfer';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('KrakenSpotFundingApi (index)', () => {
  it('getDepositMethods forwards to module fn', async () => {
    const base = {} as unknown as KrakenRestBase;
    const api = new KrakenSpotFundingApi(base);

    const params = { asset: 'USDT' };
    const expected = { result: [] };

    const spy = vi
      .spyOn(GetDepositMethods, 'getDepositMethods')
      .mockResolvedValueOnce(expected as any);

    const res = await api.getDepositMethods(params);

    expect(spy).toHaveBeenCalledWith(base, params);
    expect(res).toBe(expected);
  });

  it('getDepositAddresses forwards to module fn', async () => {
    const base = {} as unknown as KrakenRestBase;
    const api = new KrakenSpotFundingApi(base);

    const params = { asset: 'USDT', method: 'ERC20', new: false };
    const expected = { result: [] };

    const spy = vi
      .spyOn(GetDepositAddresses, 'getDepositAddresses')
      .mockResolvedValueOnce(expected as any);

    const res = await api.getDepositAddresses(params);

    expect(spy).toHaveBeenCalledWith(base, params);
    expect(res).toBe(expected);
  });

  it('getDepositStatus forwards to module fn with default {}', async () => {
    const base = {} as unknown as KrakenRestBase;
    const api = new KrakenSpotFundingApi(base);

    const expected: any[] = [];
    const spy = vi
      .spyOn(GetDepositStatus, 'getDepositStatus')
      .mockResolvedValueOnce(expected as any);

    const res = await api.getDepositStatus();

    expect(spy).toHaveBeenCalledWith(base, {});
    expect(res).toBe(expected);
  });

  it('getWithdrawMethods forwards to module fn', async () => {
    const base = {} as unknown as KrakenRestBase;
    const api = new KrakenSpotFundingApi(base);

    const params = { asset: 'USDT', network: 'ERC20' };
    const expected: any[] = [];

    const spy = vi
      .spyOn(GetWithdrawMethods, 'getWithdrawMethods')
      .mockResolvedValueOnce(expected as any);

    const res = await api.getWithdrawMethods(params as any);

    expect(spy).toHaveBeenCalledWith(base, params);
    expect(res).toBe(expected);
  });

  it('getWithdrawAddresses forwards to module fn', async () => {
    const base = {} as unknown as KrakenRestBase;
    const api = new KrakenSpotFundingApi(base);

    const params = { asset: 'USDT', method: 'ERC20' };
    const expected: any[] = [];

    const spy = vi
      .spyOn(GetWithdrawAddresses, 'getWithdrawAddresses')
      .mockResolvedValueOnce(expected as any);

    const res = await api.getWithdrawAddresses(params);

    expect(spy).toHaveBeenCalledWith(base, params);
    expect(res).toBe(expected);
  });

  it('getWithdrawInfo forwards to module fn', async () => {
    const base = {} as unknown as KrakenRestBase;
    const api = new KrakenSpotFundingApi(base);

    const params = { asset: 'USDT', key: 'my-key', amount: 100 };
    const expected = { method: 'USDT', limit: '0', amount: '100', fee: '1' };

    const spy = vi
      .spyOn(GetWithdrawInfo, 'getWithdrawInfo')
      .mockResolvedValueOnce(expected as any);

    const res = await api.getWithdrawInfo(params);

    expect(spy).toHaveBeenCalledWith(base, params);
    expect(res).toBe(expected);
  });

  it('withdrawFunds forwards to module fn', async () => {
    const base = {} as unknown as KrakenRestBase;
    const api = new KrakenSpotFundingApi(base);

    const params = { asset: 'USDT', key: 'my-key', amount: '100' };
    const expected = { refid: 'REF123' };

    const spy = vi
      .spyOn(WithdrawFunds, 'withdrawFunds')
      .mockResolvedValueOnce(expected as any);

    const res = await api.withdrawFunds(params);

    expect(spy).toHaveBeenCalledWith(base, params);
    expect(res).toBe(expected);
  });

  it('getWithdrawStatus forwards to module fn with default {}', async () => {
    const base = {} as unknown as KrakenRestBase;
    const api = new KrakenSpotFundingApi(base);

    const expected: any[] = [];
    const spy = vi
      .spyOn(GetWithdrawStatus, 'getWithdrawStatus')
      .mockResolvedValueOnce(expected as any);

    const res = await api.getWithdrawStatus();

    expect(spy).toHaveBeenCalledWith(base, {});
    expect(res).toBe(expected);
  });

  it('withdrawCancel forwards to module fn', async () => {
    const base = {} as unknown as KrakenRestBase;
    const api = new KrakenSpotFundingApi(base);

    const params = { asset: 'USDT', refid: 'ABC123' };
    const expected = true;

    const spy = vi
      .spyOn(WithdrawCancel, 'withdrawCancel')
      .mockResolvedValueOnce(expected as any);

    const res = await api.withdrawCancel(params);

    expect(spy).toHaveBeenCalledWith(base, params);
    expect(res).toBe(expected);
  });

  it('walletTransfer forwards to module fn', async () => {
    const base = {} as unknown as KrakenRestBase;
    const api = new KrakenSpotFundingApi(base);

    const params = {
      asset: 'USDT',
      from: 'Spot Wallet',
      to: 'Futures Wallet',
      amount: '50',
    } as const;

    const expected = { refid: 'WALLET-XFER-1' };

    const spy = vi
      .spyOn(WalletTransfer, 'walletTransfer')
      .mockResolvedValueOnce(expected as any);

    const res = await api.walletTransfer(params as any);

    expect(spy).toHaveBeenCalledWith(base, params);
    expect(res).toBe(expected);
  });
});
