import { describe, it, expect, vi } from 'vitest';
import type { KrakenRestBase } from '../../../../../src/base/restBase';
import { accountTransfer } from '../../../../../src/spot/rest/subaccounts/accountTransfer';

describe('spot/rest/subaccounts/accountTransfer', () => {
  it('calls /0/private/AccountTransfer with required fields and stringifies amount', async () => {
    const privatePost = vi.fn().mockResolvedValueOnce({
      transfer_id: 'TR123',
      status: 'pending',
    });

    const base = { privatePost } as unknown as KrakenRestBase;

    const res = await accountTransfer(base, {
      asset: 'USDT',
      amount: 12.34,
      from: 'IIBAN-FROM',
      to: 'IIBAN-TO',
    });

    expect(privatePost).toHaveBeenCalledTimes(1);
    expect(privatePost).toHaveBeenCalledWith('/0/private/AccountTransfer', {
      asset: 'USDT',
      amount: '12.34',
      from: 'IIBAN-FROM',
      to: 'IIBAN-TO',
    });

    expect(res).toEqual({ transfer_id: 'TR123', status: 'pending' });
  });

  it('includes asset_class when provided', async () => {
    const privatePost = vi.fn().mockResolvedValueOnce({
      transfer_id: 'TR999',
      status: 'complete',
    });

    const base = { privatePost } as unknown as KrakenRestBase;

    const res = await accountTransfer(base, {
      asset: 'AAPL',
      asset_class: 'tokenized_asset',
      amount: '1',
      from: 'IIBAN-FROM',
      to: 'IIBAN-TO',
    });

    expect(privatePost).toHaveBeenCalledTimes(1);
    expect(privatePost).toHaveBeenCalledWith('/0/private/AccountTransfer', {
      asset: 'AAPL',
      asset_class: 'tokenized_asset',
      amount: '1',
      from: 'IIBAN-FROM',
      to: 'IIBAN-TO',
    });

    expect(res).toEqual({ transfer_id: 'TR999', status: 'complete' });
  });
});
