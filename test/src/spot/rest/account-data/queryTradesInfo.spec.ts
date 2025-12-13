import { describe, it, expect } from 'vitest';
import { queryTradesInfo } from '../../../../../src/spot/rest/account-data/queryTradesInfo';
import {
  mockRestBase,
  expectPrivatePostOnce,
} from '../../../../utils/restBaseMock';

describe('queryTradesInfo', () => {
  it('sends required txid when provided as string', async () => {
    const { base, privatePost } = mockRestBase();
    privatePost.mockResolvedValue({});

    const res = await queryTradesInfo(base, { txid: 'TID123' });

    expectPrivatePostOnce(privatePost, '/0/private/QueryTrades', {
      txid: 'TID123',
    });
    expect(res).toEqual({});
  });

  it('joins txid array with commas', async () => {
    const { base, privatePost } = mockRestBase();
    privatePost.mockResolvedValue({});

    await queryTradesInfo(base, { txid: ['T1', 'T2', 'T3'] });

    expectPrivatePostOnce(privatePost, '/0/private/QueryTrades', {
      txid: 'T1,T2,T3',
    });
  });

  it('stringifies trades boolean and includes false', async () => {
    const { base, privatePost } = mockRestBase();
    privatePost.mockResolvedValue({});

    await queryTradesInfo(base, { txid: 'T999', trades: false });

    expectPrivatePostOnce(privatePost, '/0/private/QueryTrades', {
      txid: 'T999',
      trades: 'false',
    });
  });

  it('passes rebase_multiplier', async () => {
    const { base, privatePost } = mockRestBase();
    privatePost.mockResolvedValue({});

    await queryTradesInfo(base, {
      txid: 'T777',
      trades: true,
      rebase_multiplier: 'base',
    });

    expectPrivatePostOnce(privatePost, '/0/private/QueryTrades', {
      txid: 'T777',
      trades: 'true',
      rebase_multiplier: 'base',
    });
  });
});
