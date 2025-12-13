import { describe, it, expect, vi } from 'vitest';
import type { KrakenRestBase } from '../../../../../src/base/restBase';
import { KrakenSpotSubaccountsApi } from '../../../../../src/spot/rest/subaccounts';

describe('spot/rest/subaccounts/index', () => {
  it('createSubaccount delegates to /0/private/CreateSubaccount', async () => {
    const privatePost = vi.fn().mockResolvedValueOnce(true);

    const base = { privatePost } as unknown as KrakenRestBase;
    const api = new KrakenSpotSubaccountsApi(base);

    const res = await api.createSubaccount({
      username: 'my-sub-user',
      email: 'subuser@example.com',
    });

    expect(privatePost).toHaveBeenCalledTimes(1);
    expect(privatePost).toHaveBeenCalledWith('/0/private/CreateSubaccount', {
      username: 'my-sub-user',
      email: 'subuser@example.com',
    });
    expect(res).toBe(true);
  });

  it('accountTransfer delegates to /0/private/AccountTransfer (stringifies amount)', async () => {
    const privatePost = vi.fn().mockResolvedValueOnce({
      transfer_id: 'TR-123',
      status: 'pending',
    });

    const base = { privatePost } as unknown as KrakenRestBase;
    const api = new KrakenSpotSubaccountsApi(base);

    const res = await api.accountTransfer({
      asset: 'USDT',
      amount: 50,
      from: 'IIBAN-MASTER',
      to: 'IIBAN-SUB-1',
    });

    expect(privatePost).toHaveBeenCalledTimes(1);
    expect(privatePost).toHaveBeenCalledWith('/0/private/AccountTransfer', {
      asset: 'USDT',
      amount: '50',
      from: 'IIBAN-MASTER',
      to: 'IIBAN-SUB-1',
    });

    expect(res).toEqual({ transfer_id: 'TR-123', status: 'pending' });
  });

  it('accountTransfer includes asset_class when provided', async () => {
    const privatePost = vi.fn().mockResolvedValueOnce({
      transfer_id: 'TR-456',
      status: 'complete',
    });

    const base = { privatePost } as unknown as KrakenRestBase;
    const api = new KrakenSpotSubaccountsApi(base);

    await api.accountTransfer({
      asset: 'AAPL',
      asset_class: 'tokenized_asset',
      amount: '1.25',
      from: 'IIBAN-MASTER',
      to: 'IIBAN-SUB-2',
    });

    expect(privatePost).toHaveBeenCalledWith('/0/private/AccountTransfer', {
      asset: 'AAPL',
      asset_class: 'tokenized_asset',
      amount: '1.25',
      from: 'IIBAN-MASTER',
      to: 'IIBAN-SUB-2',
    });
  });
});
