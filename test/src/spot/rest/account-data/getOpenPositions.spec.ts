import { describe, it, expect } from 'vitest';
import { getOpenPositions } from '../../../../../src/spot/rest/account-data/getOpenPositions';
import {
  mockRestBase,
  expectPrivatePostOnce,
  getPrivatePostBody,
  expectBodyOmits,
} from '../../../../utils/restBaseMock';

describe('getOpenPositions', () => {
  it('calls base.privatePost with empty body when params omitted', async () => {
    const { base, privatePost } = mockRestBase();
    privatePost.mockResolvedValue({});

    const res = await getOpenPositions(base);

    expectPrivatePostOnce(privatePost, '/0/private/OpenPositions', {});
    expect(res).toEqual({});
  });

  it('joins txid array with commas', async () => {
    const { base, privatePost } = mockRestBase();
    privatePost.mockResolvedValue({});

    const res = await getOpenPositions(base, {
      txid: ['TXID1', 'TXID2', 'TXID3'],
    });

    expectPrivatePostOnce(privatePost, '/0/private/OpenPositions', {
      txid: 'TXID1,TXID2,TXID3',
    });

    expect(res).toEqual({});
  });

  it('maps params to correct body fields (strings + true/false) and omits undefined', async () => {
    const { base, privatePost } = mockRestBase();
    privatePost.mockResolvedValue({});

    const res = await getOpenPositions(base, {
      txid: 'TXID_SINGLE',
      docalcs: false,
      consolidation: 'market',
      rebase_multiplier: 'base',
    });

    expectPrivatePostOnce(privatePost, '/0/private/OpenPositions', {
      txid: 'TXID_SINGLE',
      docalcs: 'false',
      consolidation: 'market',
      rebase_multiplier: 'base',
    });

    const body = getPrivatePostBody(privatePost);
    expectBodyOmits(body, ['some_other_key']);

    expect(res).toEqual({});
  });
});
