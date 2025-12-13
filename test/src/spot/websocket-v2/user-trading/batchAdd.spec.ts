import { describe, it, expect, vi } from 'vitest';
import type { KrakenWebsocketBase } from '../../../../../src/base/websocketBase';
import {
  batchAdd,
  type KrakenWsBatchAddResponse,
} from '../../../../../src/spot/websocket-v2/user-trading/batchAdd';

describe('spot/websocket-v2/user-trading/batchAdd', () => {
  it('forwards to ws.request("batch_add", params, options) with defaults', async () => {
    const mocked: KrakenWsBatchAddResponse = {
      method: 'batch_add',
      success: true,
      result: [{ order_id: 'OID1' }, { order_id: 'OID2' }],
    } as KrakenWsBatchAddResponse;

    const ws = {
      request: vi.fn().mockResolvedValue(mocked),
    } as unknown as KrakenWebsocketBase;

    const params = {
      symbol: 'BTC/USD',
      orders: [
        { side: 'buy', order_type: 'limit', order_qty: 1, limit_price: 100 },
        { side: 'sell', order_type: 'limit', order_qty: 1, limit_price: 101 },
      ],
    };

    const res = await batchAdd(ws, params as any);

    expect(ws.request).toHaveBeenCalledTimes(1);
    expect(ws.request).toHaveBeenCalledWith('batch_add', params, {
      reqId: undefined,
      timeoutMs: undefined,
      attachAuthToken: undefined,
    });
    expect(res).toBe(mocked);
  });

  it('forwards provided options', async () => {
    const mocked: KrakenWsBatchAddResponse = {
      method: 'batch_add',
      success: true,
      result: [{ order_id: 'OID1', warnings: ['hello'] }, { order_id: 'OID2' }],
      req_id: 42,
    } as KrakenWsBatchAddResponse;

    const ws = {
      request: vi.fn().mockResolvedValue(mocked),
    } as unknown as KrakenWebsocketBase;

    const params = {
      symbol: 'ETH/USD',
      deadline: '2025-01-01T00:00:00.000Z',
      validate: true,
      token: 'token-abc',
      orders: [
        { side: 'buy', order_type: 'market', order_qty: 1 },
        { side: 'sell', order_type: 'limit', order_qty: 2, limit_price: 2000 },
      ],
    };

    const res = await batchAdd(ws, params as any, {
      reqId: 42,
      timeoutMs: 1234,
      attachAuthToken: true,
    });

    expect(ws.request).toHaveBeenCalledTimes(1);
    expect(ws.request).toHaveBeenCalledWith('batch_add', params, {
      reqId: 42,
      timeoutMs: 1234,
      attachAuthToken: true,
    });
    expect(res).toBe(mocked);
  });

  it('passes through explicit options values (including false)', async () => {
    const mocked: KrakenWsBatchAddResponse = {
      method: 'batch_add',
      success: true,
      result: [{ order_id: 'OID1' }, { order_id: 'OID2' }],
    } as KrakenWsBatchAddResponse;

    const ws = {
      request: vi.fn().mockResolvedValue(mocked),
    } as unknown as KrakenWebsocketBase;

    const params = {
      symbol: 'BTC/USD',
      orders: [
        { side: 'buy', order_type: 'limit', order_qty: 1, limit_price: 100 },
        { side: 'sell', order_type: 'limit', order_qty: 1, limit_price: 101 },
      ],
    };

    await batchAdd(ws, params as any, { attachAuthToken: false });

    expect(ws.request).toHaveBeenCalledTimes(1);
    expect(ws.request).toHaveBeenCalledWith('batch_add', params, {
      reqId: undefined,
      timeoutMs: undefined,
      attachAuthToken: false,
    });
  });

  it('throws if orders has fewer than 2 entries', async () => {
    const ws = { request: vi.fn() } as unknown as KrakenWebsocketBase;

    const params = {
      symbol: 'BTC/USD',
      orders: [
        { side: 'buy', order_type: 'limit', order_qty: 1, limit_price: 100 },
      ],
    };

    await expect(batchAdd(ws, params as any)).rejects.toThrow(
      'orders` must contain at least 2 entries',
    );
    expect(ws.request).not.toHaveBeenCalled();
  });

  it('throws if orders has more than 15 entries', async () => {
    const ws = { request: vi.fn() } as unknown as KrakenWebsocketBase;

    const orders = Array.from({ length: 16 }, (_, i) => ({
      side: 'buy',
      order_type: 'limit',
      order_qty: 1,
      limit_price: 100 + i,
    }));

    const params = { symbol: 'BTC/USD', orders };

    await expect(batchAdd(ws, params as any)).rejects.toThrow(
      'orders` must not contain more than 15 entries',
    );
    expect(ws.request).not.toHaveBeenCalled();
  });

  it('throws if any order specifies both cl_ord_id and order_userref', async () => {
    const ws = { request: vi.fn() } as unknown as KrakenWebsocketBase;

    const params = {
      symbol: 'BTC/USD',
      orders: [
        { side: 'buy', order_type: 'limit', order_qty: 1, limit_price: 100 },
        {
          side: 'sell',
          order_type: 'limit',
          order_qty: 1,
          limit_price: 101,
          cl_ord_id: 'CLIENT-1',
          order_userref: 123,
        },
      ],
    };

    await expect(batchAdd(ws, params as any)).rejects.toThrow(
      'order at index 1 must not specify both cl_ord_id and order_userref',
    );
    expect(ws.request).not.toHaveBeenCalled();
  });
});
