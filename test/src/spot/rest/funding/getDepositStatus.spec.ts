import { describe, it, expect, vi } from 'vitest';
import type { KrakenRestBase } from '../../../../../src/base/restBase';
import {
  getDepositStatus,
  type KrakenDepositStatusEntry,
} from '../../../../../src/spot/rest/funding/getDepositStatus';

describe('getDepositStatus', () => {
  it('calls DepositStatus with empty body when no params', async () => {
    const base = { privatePost: vi.fn() } as unknown as KrakenRestBase;

    const mocked: KrakenDepositStatusEntry[] = [];
    (base.privatePost as any).mockResolvedValueOnce(mocked);

    const res = await getDepositStatus(base);

    expect(base.privatePost).toHaveBeenCalledTimes(1);
    expect(base.privatePost).toHaveBeenCalledWith(
      '/0/private/DepositStatus',
      {},
    );
    expect(res).toBe(mocked);
  });

  it('stringifies numeric params and passes through cursor/rebase_multiplier', async () => {
    const base = { privatePost: vi.fn() } as unknown as KrakenRestBase;

    const mocked: KrakenDepositStatusEntry[] = [
      {
        method: 'Bitcoin',
        aclass: 'currency',
        asset: 'XBT',
        refid: 'R123',
        txid: 'TX123',
        info: 'info',
        amount: '0.1',
        fee: '0.0',
        time: 123,
        status: 'Success',
      },
    ];

    (base.privatePost as any).mockResolvedValueOnce(mocked);

    await getDepositStatus(base, {
      asset: 'XBT',
      aclass: 'currency',
      method: 'Bitcoin',
      start: 111,
      end: '222',
      cursor: 'CURSOR_TOKEN',
      limit: 25,
      rebase_multiplier: 'rebased',
    });

    expect(base.privatePost).toHaveBeenCalledWith('/0/private/DepositStatus', {
      asset: 'XBT',
      aclass: 'currency',
      method: 'Bitcoin',
      start: '111',
      end: '222',
      cursor: 'CURSOR_TOKEN',
      limit: '25',
      rebase_multiplier: 'rebased',
    });
  });
});
