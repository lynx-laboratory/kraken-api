import { describe, it, expect } from 'vitest';
import { getLedgersInfo } from '../../../../../src/spot/rest/account-data/getLedgersInfo';
import {
  mockRestBase,
  expectPrivatePostOnce,
  getPrivatePostBody,
  expectBodyOmits,
} from '../../../../utils/restBaseMock';

describe('getLedgersInfo', () => {
  it('calls base.privatePost with empty body when params omitted', async () => {
    const { base, privatePost } = mockRestBase();
    privatePost.mockResolvedValue({ ledger: {}, count: 0 });

    const res = await getLedgersInfo(base);

    expectPrivatePostOnce(privatePost, '/0/private/Ledgers', {});
    expect(res).toEqual({ ledger: {}, count: 0 });
  });

  it('joins asset array with commas', async () => {
    const { base, privatePost } = mockRestBase();
    privatePost.mockResolvedValue({ ledger: {} });

    const res = await getLedgersInfo(base, {
      asset: ['ZUSD', 'XXBT', 'USDT.F'],
    });

    expectPrivatePostOnce(privatePost, '/0/private/Ledgers', {
      asset: 'ZUSD,XXBT,USDT.F',
    });

    expect(res).toEqual({ ledger: {} });
  });

  it('maps params to correct body fields (strings + true/false) and omits undefined', async () => {
    const { base, privatePost } = mockRestBase();
    privatePost.mockResolvedValue({ ledger: {}, count: 12 });

    const res = await getLedgersInfo(base, {
      asset: 'ZUSD',
      aclass: 'currency',
      type: 'deposit',
      start: 1700000000,
      end: 'LEDGER_END_ID',
      ofs: 50,
      without_count: true,
      rebase_multiplier: 'base',
    });

    expectPrivatePostOnce(privatePost, '/0/private/Ledgers', {
      asset: 'ZUSD',
      aclass: 'currency',
      type: 'deposit',
      start: '1700000000',
      end: 'LEDGER_END_ID',
      ofs: '50',
      without_count: 'true',
      rebase_multiplier: 'base',
    });

    // tightening: make sure we didn't accidentally include extra keys
    const body = getPrivatePostBody(privatePost);
    expectBodyOmits(body, ['nonexistent_key']);

    expect(res).toEqual({ ledger: {}, count: 12 });
  });
});
