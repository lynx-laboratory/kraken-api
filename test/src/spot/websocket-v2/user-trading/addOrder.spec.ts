import { describe, it, expect, vi } from 'vitest';
import type { KrakenWebsocketBase } from '../../../../../src/base/websocketBase';
import {
  addOrder,
  type KrakenWsAddOrderResponse,
} from '../../../../../src/spot/websocket-v2/user-trading/addOrder';

describe('spot/websocket-v2/user-trading/add-order', () => {
  it('forwards to ws.request("add_order", params, options) with defaults', async () => {
    const mocked: KrakenWsAddOrderResponse = {
      method: 'add_order',
      success: true,
      result: {
        order_id: 'OID123',
      },
    } as KrakenWsAddOrderResponse;

    const ws = {
      request: vi.fn().mockResolvedValue(mocked),
    } as unknown as KrakenWebsocketBase;

    const params = {
      order_type: 'limit',
      side: 'buy',
      order_qty: 1,
      symbol: 'BTC/USD',
      limit_price: 50000,
    } as const;

    const res = await addOrder(ws, params as any);

    expect(ws.request).toHaveBeenCalledTimes(1);
    expect(ws.request).toHaveBeenCalledWith('add_order', params, {
      reqId: undefined,
      timeoutMs: undefined,
      attachAuthToken: undefined,
    });
    expect(res).toBe(mocked);
  });

  it('forwards provided options', async () => {
    const mocked: KrakenWsAddOrderResponse = {
      method: 'add_order',
      success: true,
      result: {
        order_id: 'OID456',
        warnings: ['hello'],
      },
      req_id: 42,
    } as KrakenWsAddOrderResponse;

    const ws = {
      request: vi.fn().mockResolvedValue(mocked),
    } as unknown as KrakenWebsocketBase;

    const params = {
      order_type: 'market',
      side: 'sell',
      order_qty: 2,
      symbol: 'ETH/USD',
      validate: true,
      token: 'token-abc',
    };

    const res = await addOrder(ws, params as any, {
      reqId: 42,
      timeoutMs: 1234,
      attachAuthToken: true,
    });

    expect(ws.request).toHaveBeenCalledTimes(1);
    expect(ws.request).toHaveBeenCalledWith('add_order', params, {
      reqId: 42,
      timeoutMs: 1234,
      attachAuthToken: true,
    });
    expect(res).toBe(mocked);
  });

  it('passes through explicit options values (including false)', async () => {
    const mocked: KrakenWsAddOrderResponse = {
      method: 'add_order',
      success: true,
      result: {
        order_id: 'OID789',
      },
    } as KrakenWsAddOrderResponse;

    const ws = {
      request: vi.fn().mockResolvedValue(mocked),
    } as unknown as KrakenWebsocketBase;

    const params = {
      order_type: 'limit',
      side: 'buy',
      order_qty: 1,
      symbol: 'BTC/USD',
      limit_price: 100,
    };

    await addOrder(ws, params as any, { attachAuthToken: false });

    expect(ws.request).toHaveBeenCalledTimes(1);
    expect(ws.request).toHaveBeenCalledWith('add_order', params, {
      reqId: undefined,
      timeoutMs: undefined,
      attachAuthToken: false,
    });
  });
});
