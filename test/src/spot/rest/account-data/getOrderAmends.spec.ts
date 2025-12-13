import { describe, it, expect } from 'vitest';
import { getOrderAmends } from '../../../../../src/spot/rest/account-data/getOrderAmends';
import {
  mockRestBase,
  expectPrivatePostOnce,
} from '../../../../utils/restBaseMock';

describe('getOrderAmends', () => {
  it('calls base.privatePost with required order_id', async () => {
    const { base, privatePost } = mockRestBase();

    privatePost.mockResolvedValue({
      count: 1,
      amends: [
        {
          amend_id: 'A1',
          amend_type: 'original',
          order_qty: '1.0',
          display_qty: '1.0',
          remaining_qty: '1.0',
          limit_price: '100.0',
          trigger_price: '0',
          reason: 'initial',
          post_only: false,
          timestamp: 1700000000,
        },
      ],
    });

    const res = await getOrderAmends(base, { order_id: 'OID123' });

    expectPrivatePostOnce(privatePost, '/0/private/OrderAmends', {
      order_id: 'OID123',
    });

    expect(res.count).toBe(1);
    expect(res.amends[0]?.amend_type).toBe('original');
  });

  it('passes rebase_multiplier when provided', async () => {
    const { base, privatePost } = mockRestBase();
    privatePost.mockResolvedValue({ count: 0, amends: [] });

    const res = await getOrderAmends(base, {
      order_id: 'OID999',
      rebase_multiplier: 'base',
    });

    expectPrivatePostOnce(privatePost, '/0/private/OrderAmends', {
      order_id: 'OID999',
      rebase_multiplier: 'base',
    });

    expect(res).toEqual({ count: 0, amends: [] });
  });
});
