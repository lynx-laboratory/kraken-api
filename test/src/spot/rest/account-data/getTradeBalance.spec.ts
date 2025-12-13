import { describe, it, expect } from 'vitest';
import { getTradeBalance } from '../../../../../src/spot/rest/account-data/getTradeBalance';
import {
  mockRestBase,
  expectPrivatePostOnce,
} from '../../../../utils/restBaseMock';

describe('getTradeBalance', () => {
  it('calls base.privatePost with empty body when params omitted', async () => {
    const { base, privatePost } = mockRestBase();

    privatePost.mockResolvedValue({
      eb: '0',
      tb: '0',
      m: '0',
      n: '0',
      c: '0',
      v: '0',
      e: '0',
      mf: '0',
      ml: '0',
      uv: '0',
    });

    const res = await getTradeBalance(base);

    expectPrivatePostOnce(privatePost, '/0/private/TradeBalance', {});
    expect(res.ml).toBe('0');
  });

  it('passes asset and rebase_multiplier when provided', async () => {
    const { base, privatePost } = mockRestBase();

    privatePost.mockResolvedValue({
      eb: '1',
      tb: '2',
      m: '3',
      n: '4',
      c: '5',
      v: '6',
      e: '7',
      mf: '8',
      ml: '9',
      uv: '10',
    });

    const res = await getTradeBalance(base, {
      asset: 'ZUSD',
      rebase_multiplier: 'base',
    });

    expectPrivatePostOnce(privatePost, '/0/private/TradeBalance', {
      asset: 'ZUSD',
      rebase_multiplier: 'base',
    });

    expect(res).toEqual({
      eb: '1',
      tb: '2',
      m: '3',
      n: '4',
      c: '5',
      v: '6',
      e: '7',
      mf: '8',
      ml: '9',
      uv: '10',
    });
  });
});
