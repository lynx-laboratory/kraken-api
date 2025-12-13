import { describe, it, expect } from 'vitest';
import { getTradesHistory } from '../../../../../src/spot/rest/account-data/getTradesHistory';
import {
  mockRestBase,
  expectPrivatePostOnce,
} from '../../../../utils/restBaseMock';

describe('getTradesHistory', () => {
  it('calls base.privatePost with empty body when params omitted', async () => {
    const { base, privatePost } = mockRestBase();
    privatePost.mockResolvedValue({ count: 0, trades: {} });

    const res = await getTradesHistory(base);

    expectPrivatePostOnce(privatePost, '/0/private/TradesHistory', {});
    expect(res).toEqual({ count: 0, trades: {} });
  });

  it('maps params to correct body fields (strings + true/false)', async () => {
    const { base, privatePost } = mockRestBase();
    privatePost.mockResolvedValue({ count: 123, trades: {} });

    const res = await getTradesHistory(base, {
      type: 'no position',
      trades: true,
      start: 1700000000,
      end: 'TRADE_END_ID',
      ofs: 50,
      consolidate_taker: false,
      ledgers: true,
      rebase_multiplier: 'base',
    });

    expectPrivatePostOnce(privatePost, '/0/private/TradesHistory', {
      type: 'no position',
      trades: 'true',
      start: '1700000000',
      end: 'TRADE_END_ID',
      ofs: '50',
      consolidate_taker: 'false',
      ledgers: 'true',
      rebase_multiplier: 'base',
    });

    expect(res).toEqual({ count: 123, trades: {} });
  });

  it('handles boolean false values (must still be included)', async () => {
    const { base, privatePost } = mockRestBase();
    privatePost.mockResolvedValue({ count: 0, trades: {} });

    await getTradesHistory(base, {
      trades: false,
      consolidate_taker: false,
      ledgers: false,
    });

    expectPrivatePostOnce(privatePost, '/0/private/TradesHistory', {
      trades: 'false',
      consolidate_taker: 'false',
      ledgers: 'false',
    });
  });
});
