import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { KrakenRestBase } from '../../../../../src/base/restBase';
import { getWithdrawStatus } from '../../../../../src/spot/rest/funding/getWithdrawStatus';

describe('spot/rest/funding/getWithdrawStatus', () => {
  let base: KrakenRestBase;
  let privatePost: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    privatePost = vi.fn();
    base = { privatePost } as unknown as KrakenRestBase;
  });

  it('calls WithdrawStatus with an empty body when params omitted', async () => {
    privatePost.mockResolvedValueOnce([]);

    const res = await getWithdrawStatus(base);

    expect(privatePost).toHaveBeenCalledTimes(1);
    expect(privatePost).toHaveBeenCalledWith('/0/private/WithdrawStatus', {});
    expect(res).toEqual([]);
  });

  it('only includes provided fields in the request body', async () => {
    privatePost.mockResolvedValueOnce([]);

    await getWithdrawStatus(base, {
      asset: 'USDT',
      aclass: 'currency',
      method: 'ERC20',
      start: 123,
      end: '1700000000',
      limit: 500,
    });

    expect(privatePost).toHaveBeenCalledWith('/0/private/WithdrawStatus', {
      asset: 'USDT',
      aclass: 'currency',
      method: 'ERC20',
      start: 123,
      end: '1700000000',
      limit: 500,
    });
  });

  it('supports cursor as boolean (pagination enable/disable)', async () => {
    privatePost.mockResolvedValueOnce([]);

    await getWithdrawStatus(base, { cursor: true });

    expect(privatePost).toHaveBeenCalledWith('/0/private/WithdrawStatus', {
      cursor: true,
    });
  });

  it('supports cursor as string (pagination token)', async () => {
    privatePost.mockResolvedValueOnce([]);

    await getWithdrawStatus(base, { cursor: 'next-page-token' });

    expect(privatePost).toHaveBeenCalledWith('/0/private/WithdrawStatus', {
      cursor: 'next-page-token',
    });
  });

  it('passes rebase_multiplier when provided', async () => {
    privatePost.mockResolvedValueOnce([]);

    await getWithdrawStatus(base, { rebase_multiplier: 'rebased' as any });

    expect(privatePost).toHaveBeenCalledWith('/0/private/WithdrawStatus', {
      rebase_multiplier: 'rebased',
    });
  });

  it('returns the result from base.privatePost', async () => {
    const mocked = [
      {
        method: 'ERC20',
        network: 'Ethereum',
        aclass: 'currency',
        asset: 'USDT',
        refid: 'abc',
        txid: '0x123',
        info: '0xabc',
        amount: '10.0',
        fee: '1.0',
        time: 1700000000,
        status: 'Success',
        key: 'my-key',
      },
    ];

    privatePost.mockResolvedValueOnce(mocked);

    const res = await getWithdrawStatus(base, { asset: 'USDT' });

    expect(res).toEqual(mocked);
  });
});
