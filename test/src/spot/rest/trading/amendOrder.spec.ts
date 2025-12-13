import { describe, it, expect, vi } from 'vitest';
import type { KrakenRestBase } from '../../../../../src/base/restBase';
import { amendOrder } from '../../../../../src/spot/rest/trading/amendOrder';

describe('spot/rest/trading/amendOrder', () => {
  it('throws if neither txid nor cl_ord_id is provided', () => {
    const base = { privatePost: vi.fn() } as unknown as KrakenRestBase;

    expect(() =>
      amendOrder(base, {
        // nothing
      }),
    ).toThrow(/either txid or cl_ord_id must be provided/i);

    expect(base.privatePost).not.toHaveBeenCalled();
  });

  it('posts with txid only and includes provided fields', async () => {
    const privatePost = vi.fn().mockResolvedValueOnce({ amend_id: 'A1' });
    const base = { privatePost } as unknown as KrakenRestBase;

    const res = await amendOrder(base, {
      txid: 'O-ORDER-1',
      order_qty: '1.5',
      limit_price: '50000',
      post_only: true,
      deadline: '2025-12-10T04:18:45Z',
    });

    expect(res).toEqual({ amend_id: 'A1' });

    expect(privatePost).toHaveBeenCalledTimes(1);
    const [path, body] = privatePost.mock.calls[0] as [
      string,
      Record<string, string>,
    ];

    expect(path).toBe('/0/private/AmendOrder');
    expect(body).toEqual({
      txid: 'O-ORDER-1',
      order_qty: '1.5',
      limit_price: '50000',
      post_only: 'true',
      deadline: '2025-12-10T04:18:45Z',
    });
  });

  it('posts with cl_ord_id only and includes provided fields', async () => {
    const privatePost = vi.fn().mockResolvedValueOnce({ amend_id: 'A2' });
    const base = { privatePost } as unknown as KrakenRestBase;

    const res = await amendOrder(base, {
      cl_ord_id: 'CLIENT-ORDER-123',
      display_qty: '0.1',
      trigger_price: '+5%',
      post_only: false,
    });

    expect(res).toEqual({ amend_id: 'A2' });

    const [path, body] = privatePost.mock.calls[0] as [
      string,
      Record<string, string>,
    ];

    expect(path).toBe('/0/private/AmendOrder');
    expect(body).toEqual({
      cl_ord_id: 'CLIENT-ORDER-123',
      display_qty: '0.1',
      trigger_price: '+5%',
      post_only: 'false',
    });
  });

  it('includes both txid and cl_ord_id if both are provided', async () => {
    const privatePost = vi.fn().mockResolvedValueOnce({ amend_id: 'A3' });
    const base = { privatePost } as unknown as KrakenRestBase;

    await amendOrder(base, {
      txid: 'O-ORDER-2',
      cl_ord_id: 'CLIENT-ORDER-2',
      pair: 'AAPL/USD',
    });

    const [, body] = privatePost.mock.calls[0] as [
      string,
      Record<string, string>,
    ];

    expect(body).toEqual({
      txid: 'O-ORDER-2',
      cl_ord_id: 'CLIENT-ORDER-2',
      pair: 'AAPL/USD',
    });
  });

  it('omits optional fields when undefined', async () => {
    const privatePost = vi.fn().mockResolvedValueOnce({ amend_id: 'A4' });
    const base = { privatePost } as unknown as KrakenRestBase;

    await amendOrder(base, { txid: 'O-ORDER-3' });

    const [path, body] = privatePost.mock.calls[0] as [
      string,
      Record<string, string>,
    ];

    expect(path).toBe('/0/private/AmendOrder');
    expect(body).toEqual({ txid: 'O-ORDER-3' });
  });
});
