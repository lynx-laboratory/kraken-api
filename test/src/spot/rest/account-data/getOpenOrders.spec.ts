import { describe, it, expect } from 'vitest';
import { getOpenOrders } from '../../../../../src/spot/rest/account-data/getOpenOrders';
import {
  mockRestBase,
  expectPrivatePostOnce,
  getPrivatePostBody,
  expectBodyOmits,
} from '../../../../utils/restBaseMock';

describe('getOpenOrders', () => {
  it('calls base.privatePost with empty body when params omitted', async () => {
    const { base, privatePost } = mockRestBase();
    privatePost.mockResolvedValue({ open: {} });

    const res = await getOpenOrders(base);

    expectPrivatePostOnce(privatePost, '/0/private/OpenOrders', {});
    expect(res).toEqual({ open: {} });
  });

  it('maps params to correct body fields (strings + true/false)', async () => {
    const { base, privatePost } = mockRestBase();
    privatePost.mockResolvedValue({ open: {} });

    const res = await getOpenOrders(base, {
      trades: true,
      userref: 123,
      cl_ord_id: 'client-xyz',
      rebase_multiplier: 'base',
    });

    expectPrivatePostOnce(privatePost, '/0/private/OpenOrders', {
      trades: 'true',
      userref: '123',
      cl_ord_id: 'client-xyz',
      rebase_multiplier: 'base',
    });

    expect(res).toEqual({ open: {} });
  });

  it('omits optional keys when not provided', async () => {
    const { base, privatePost } = mockRestBase();
    privatePost.mockResolvedValue({ open: {} });

    await getOpenOrders(base, { trades: false });

    expectPrivatePostOnce(privatePost, '/0/private/OpenOrders', {
      trades: 'false',
    });

    const body = getPrivatePostBody(privatePost);

    expectBodyOmits(body, ['userref', 'cl_ord_id', 'rebase_multiplier']);
  });
});
