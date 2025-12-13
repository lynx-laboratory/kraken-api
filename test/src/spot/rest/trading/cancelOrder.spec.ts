import { describe, it, expect, vi } from 'vitest';
import type { KrakenRestBase } from '../../../../../src/base/restBase';
import {
  cancelOrder,
  type KrakenCancelOrderParams,
} from '../../../../../src/spot/rest/trading/cancelOrder';

describe('spot/rest/trading/cancelOrder', () => {
  it('throws if none of txid/userref/cl_ord_id provided', () => {
    const base = { privatePost: vi.fn() } as unknown as KrakenRestBase;

    expect(() =>
      cancelOrder(base, {} as unknown as KrakenCancelOrderParams),
    ).toThrow(
      'KrakenCancelOrderParams: one of txid, userref, or cl_ord_id must be provided',
    );
  });

  it('throws if more than one of txid/userref/cl_ord_id provided', () => {
    const base = { privatePost: vi.fn() } as unknown as KrakenRestBase;

    expect(() => cancelOrder(base, { txid: 'O123', userref: 7 })).toThrow(
      'KrakenCancelOrderParams: txid, userref, and cl_ord_id are mutually exclusive; provide exactly one',
    );

    expect(() => cancelOrder(base, { txid: 'O123', cl_ord_id: 'C1' })).toThrow(
      'KrakenCancelOrderParams: txid, userref, and cl_ord_id are mutually exclusive; provide exactly one',
    );

    expect(() => cancelOrder(base, { userref: 7, cl_ord_id: 'C1' })).toThrow(
      'KrakenCancelOrderParams: txid, userref, and cl_ord_id are mutually exclusive; provide exactly one',
    );
  });

  it('cancels by txid (single)', async () => {
    const privatePost = vi
      .fn()
      .mockResolvedValueOnce({ count: 1, pending: false });

    const base = { privatePost } as unknown as KrakenRestBase;

    const res = await cancelOrder(base, { txid: 'OABC' });

    expect(res).toEqual({ count: 1, pending: false });
    expect(privatePost).toHaveBeenCalledTimes(1);
    expect(privatePost).toHaveBeenCalledWith('/0/private/CancelOrder', {
      txid: 'OABC',
    });
  });

  it('cancels by txid (array -> comma joined)', async () => {
    const privatePost = vi.fn().mockResolvedValueOnce({ count: 2 });

    const base = { privatePost } as unknown as KrakenRestBase;

    const res = await cancelOrder(base, { txid: ['O1', 'O2'] });

    expect(res).toEqual({ count: 2 });
    expect(privatePost).toHaveBeenCalledWith('/0/private/CancelOrder', {
      txid: 'O1,O2',
    });
  });

  it('cancels by userref (sent as txid string)', async () => {
    const privatePost = vi.fn().mockResolvedValueOnce({ count: 3 });

    const base = { privatePost } as unknown as KrakenRestBase;

    const res = await cancelOrder(base, { userref: 12345 });

    expect(res).toEqual({ count: 3 });
    expect(privatePost).toHaveBeenCalledWith('/0/private/CancelOrder', {
      txid: '12345',
    });
  });

  it('cancels by cl_ord_id (single)', async () => {
    const privatePost = vi.fn().mockResolvedValueOnce({ count: 1 });

    const base = { privatePost } as unknown as KrakenRestBase;

    const res = await cancelOrder(base, { cl_ord_id: 'CLIENT-1' });

    expect(res).toEqual({ count: 1 });
    expect(privatePost).toHaveBeenCalledWith('/0/private/CancelOrder', {
      cl_ord_id: 'CLIENT-1',
    });
  });

  it('cancels by cl_ord_id (array -> comma joined)', async () => {
    const privatePost = vi.fn().mockResolvedValueOnce({ count: 2 });

    const base = { privatePost } as unknown as KrakenRestBase;

    const res = await cancelOrder(base, {
      cl_ord_id: ['CLIENT-1', 'CLIENT-2'],
    });

    expect(res).toEqual({ count: 2 });
    expect(privatePost).toHaveBeenCalledWith('/0/private/CancelOrder', {
      cl_ord_id: 'CLIENT-1,CLIENT-2',
    });
  });
});
