import { describe, it, expect } from 'vitest';
import { getTradeVolume } from '../../../../../src/spot/rest/account-data/getTradeVolume';
import {
  mockRestBase,
  expectPrivatePostOnce,
} from '../../../../utils/restBaseMock';

describe('getTradeVolume', () => {
  it('calls base.privatePost with empty body when params omitted', async () => {
    const { base, privatePost } = mockRestBase();
    privatePost.mockResolvedValue({ currency: 'USD', volume: '0' });

    const res = await getTradeVolume(base);

    expectPrivatePostOnce(privatePost, '/0/private/TradeVolume', {});
    expect(res).toEqual({ currency: 'USD', volume: '0' });
  });

  it('joins pair array with commas', async () => {
    const { base, privatePost } = mockRestBase();
    privatePost.mockResolvedValue({ currency: 'USD', volume: '123.45' });

    const res = await getTradeVolume(base, {
      pair: ['XBTUSD', 'ETHUSD'],
    });

    expectPrivatePostOnce(privatePost, '/0/private/TradeVolume', {
      pair: 'XBTUSD,ETHUSD',
    });

    expect(res.currency).toBe('USD');
  });

  it('passes pair + rebase_multiplier when provided', async () => {
    const { base, privatePost } = mockRestBase();
    privatePost.mockResolvedValue({
      currency: 'USD',
      volume: '999',
      fees: {
        XBTUSD: {
          fee: '0.26',
          min_fee: '0.0',
          max_fee: '0.26',
          next_fee: null,
          tier_volume: null,
          next_volume: null,
        },
      },
    });

    const res = await getTradeVolume(base, {
      pair: 'XBTUSD',
      rebase_multiplier: 'base',
    });

    expectPrivatePostOnce(privatePost, '/0/private/TradeVolume', {
      pair: 'XBTUSD',
      rebase_multiplier: 'base',
    });

    expect(res.fees?.XBTUSD?.fee).toBe('0.26');
  });
});
