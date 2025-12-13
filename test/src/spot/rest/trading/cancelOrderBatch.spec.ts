import { describe, it, expect, vi } from 'vitest';
import type { KrakenRestBase } from '../../../../../src/base/restBase';
import {
  cancelOrderBatch,
  type KrakenCancelOrderBatchParams,
} from '../../../../../src/spot/rest/trading/cancelOrderBatch';

describe('spot/rest/trading/cancelOrderBatch', () => {
  it('throws if neither orders nor clOrdIds provided', () => {
    const base = { privatePost: vi.fn() } as unknown as KrakenRestBase;

    expect(() =>
      cancelOrderBatch(base, {} as unknown as KrakenCancelOrderBatchParams),
    ).toThrow(
      'KrakenCancelOrderBatchParams: at least one txid/userref or cl_ord_id is required',
    );
  });

  it('throws if total ids/references > 50', () => {
    const base = { privatePost: vi.fn() } as unknown as KrakenRestBase;

    const orders = Array.from({ length: 30 }, (_, i) => ({ txid: `O${i}` }));
    const clOrdIds = Array.from({ length: 21 }, (_, i) => `C${i}`);

    expect(() => cancelOrderBatch(base, { orders, clOrdIds })).toThrow(
      'KrakenCancelOrderBatchParams: maximum 50 total ids/references allowed, got 51',
    );
  });

  it('sends only orders as JSON (stringifies txid numbers)', async () => {
    const privatePost = vi.fn().mockResolvedValueOnce({ count: 2 });

    const base = { privatePost } as unknown as KrakenRestBase;

    const res = await cancelOrderBatch(base, {
      orders: [{ txid: 'OABC' }, { txid: 12345 }],
    });

    expect(res).toEqual({ count: 2 });

    expect(privatePost).toHaveBeenCalledTimes(1);

    const [path, body] = privatePost.mock.calls[0];
    expect(path).toBe('/0/private/CancelOrderBatch');

    expect(body).toEqual({
      orders: JSON.stringify([{ txid: 'OABC' }, { txid: '12345' }]),
    });
  });

  it('sends only clOrdIds as JSON', async () => {
    const privatePost = vi
      .fn()
      .mockResolvedValueOnce({ count: 3, pending: true });

    const base = { privatePost } as unknown as KrakenRestBase;

    const res = await cancelOrderBatch(base, {
      clOrdIds: ['CLIENT-1', 'CLIENT-2', 'CLIENT-3'],
    });

    expect(res).toEqual({ count: 3, pending: true });

    const [path, body] = privatePost.mock.calls[0];
    expect(path).toBe('/0/private/CancelOrderBatch');

    expect(body).toEqual({
      cl_ord_ids: JSON.stringify([
        { cl_ord_id: 'CLIENT-1' },
        { cl_ord_id: 'CLIENT-2' },
        { cl_ord_id: 'CLIENT-3' },
      ]),
    });
  });

  it('sends both orders and cl_ord_ids when both provided', async () => {
    const privatePost = vi.fn().mockResolvedValueOnce({ count: 4 });

    const base = { privatePost } as unknown as KrakenRestBase;

    const res = await cancelOrderBatch(base, {
      orders: [{ txid: 'O1' }, { txid: 'O2' }],
      clOrdIds: ['C1', 'C2'],
    });

    expect(res).toEqual({ count: 4 });

    const [path, body] = privatePost.mock.calls[0];
    expect(path).toBe('/0/private/CancelOrderBatch');

    expect(body).toEqual({
      orders: JSON.stringify([{ txid: 'O1' }, { txid: 'O2' }]),
      cl_ord_ids: JSON.stringify([{ cl_ord_id: 'C1' }, { cl_ord_id: 'C2' }]),
    });
  });
});
