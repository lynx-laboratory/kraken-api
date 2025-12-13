import { describe, it, expect } from 'vitest';
import { queryOrdersInfo } from '../../../../../src/spot/rest/account-data/queryOrdersInfo';
import {
  mockRestBase,
  expectPrivatePostOnce,
} from '../../../../utils/restBaseMock';

describe('queryOrdersInfo', () => {
  it('sends required txid when provided as string', async () => {
    const { base, privatePost } = mockRestBase();
    privatePost.mockResolvedValue({});

    const res = await queryOrdersInfo(base, { txid: 'OID123' });

    expectPrivatePostOnce(privatePost, '/0/private/QueryOrders', {
      txid: 'OID123',
    });
    expect(res).toEqual({});
  });

  it('joins txid array with commas', async () => {
    const { base, privatePost } = mockRestBase();
    privatePost.mockResolvedValue({});

    await queryOrdersInfo(base, { txid: ['OID1', 'OID2', 'OID3'] });

    expectPrivatePostOnce(privatePost, '/0/private/QueryOrders', {
      txid: 'OID1,OID2,OID3',
    });
  });

  it('stringifies booleans and includes false values', async () => {
    const { base, privatePost } = mockRestBase();
    privatePost.mockResolvedValue({});

    await queryOrdersInfo(base, {
      txid: 'OID999',
      trades: false,
      consolidate_taker: false,
    });

    expectPrivatePostOnce(privatePost, '/0/private/QueryOrders', {
      txid: 'OID999',
      trades: 'false',
      consolidate_taker: 'false',
    });
  });

  it('stringifies userref and passes rebase_multiplier', async () => {
    const { base, privatePost } = mockRestBase();
    privatePost.mockResolvedValue({});

    await queryOrdersInfo(base, {
      txid: 'OID777',
      userref: 42,
      trades: true,
      consolidate_taker: true,
      rebase_multiplier: 'base',
    });

    expectPrivatePostOnce(privatePost, '/0/private/QueryOrders', {
      txid: 'OID777',
      userref: '42',
      trades: 'true',
      consolidate_taker: 'true',
      rebase_multiplier: 'base',
    });
  });
});
