import { describe, it, expect } from 'vitest';
import { getClosedOrders } from '../../../../../src/spot/rest/account-data/getClosedOrders';
import {
  mockRestBase,
  expectPrivatePostOnce,
  getPrivatePostBody,
  expectBodyOmits,
} from '../../../../utils/restBaseMock';

describe('getClosedOrders', () => {
  it('calls base.privatePost with empty body when params omitted', async () => {
    const { base, privatePost } = mockRestBase();
    privatePost.mockResolvedValue({ closed: {}, count: 0 });

    const res = await getClosedOrders(base);

    expectPrivatePostOnce(privatePost, '/0/private/ClosedOrders', {});
    expect(res).toEqual({ closed: {}, count: 0 });
  });

  it('maps params to correct body fields (strings + true/false)', async () => {
    const { base, privatePost } = mockRestBase();
    privatePost.mockResolvedValue({ closed: {}, count: 123 });

    const res = await getClosedOrders(base, {
      trades: true,
      userref: 42,
      cl_ord_id: 'client-abc',
      start: 1700000000,
      end: 'OQCLTX-FAKE-ID',
      ofs: 50,
      closetime: 'close',
      consolidate_taker: false,
      without_count: true,
      rebase_multiplier: 'base',
    });

    expectPrivatePostOnce(privatePost, '/0/private/ClosedOrders', {
      trades: 'true',
      userref: '42',
      cl_ord_id: 'client-abc',
      start: '1700000000',
      end: 'OQCLTX-FAKE-ID',
      ofs: '50',
      closetime: 'close',
      consolidate_taker: 'false',
      without_count: 'true',
      rebase_multiplier: 'base',
    });

    expect(res).toEqual({ closed: {}, count: 123 });
  });

  it('omits optional keys when params are undefined', async () => {
    const { base, privatePost } = mockRestBase();
    privatePost.mockResolvedValue({ closed: {}, count: 0 });

    await getClosedOrders(base, { trades: false });

    expectPrivatePostOnce(privatePost, '/0/private/ClosedOrders', {
      trades: 'false',
    });

    const body = getPrivatePostBody(privatePost);

    expectBodyOmits(body, [
      'userref',
      'cl_ord_id',
      'start',
      'end',
      'ofs',
      'closetime',
      'consolidate_taker',
      'without_count',
      'rebase_multiplier',
    ]);
  });
});
