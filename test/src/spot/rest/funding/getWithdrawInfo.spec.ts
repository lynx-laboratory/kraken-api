import { describe, it, expect, vi } from 'vitest';
import type { KrakenRestBase } from '../../../../../src/base/restBase';
import {
  getWithdrawInfo,
  type KrakenWithdrawInfo,
} from '../../../../../src/spot/rest/funding/getWithdrawInfo';

describe('getWithdrawInfo', () => {
  it('calls WithdrawInfo with stringified amount', async () => {
    const base = { privatePost: vi.fn() } as unknown as KrakenRestBase;

    const mocked: KrakenWithdrawInfo = {
      method: 'Tether',
      limit: '1000.0',
      amount: '99.0',
      fee: '1.0',
    };
    (base.privatePost as any).mockResolvedValueOnce(mocked);

    const res = await getWithdrawInfo(base, {
      asset: 'USDT',
      key: 'my_key',
      amount: 123.45,
    });

    expect(base.privatePost).toHaveBeenCalledTimes(1);
    expect(base.privatePost).toHaveBeenCalledWith('/0/private/WithdrawInfo', {
      asset: 'USDT',
      key: 'my_key',
      amount: '123.45',
    });
    expect(res).toBe(mocked);
  });
});
