import { describe, it, expect, vi } from 'vitest';
import type { KrakenWebsocketBase } from '../../../../../src/base/websocketBase';
import {
  editOrder,
  type KrakenWsEditOrderResponse,
} from '../../../../../src/spot/websocket-v2/user-trading/editOrder';

describe('spot/websocket-v2/user-trading/editOrder', () => {
  it('forwards to ws.request("edit_order", params, options) with defaults', async () => {
    const mocked: KrakenWsEditOrderResponse = {
      method: 'edit_order',
      success: true,
      result: {
        order_id: 'NEW_ORDER_ID',
        original_order_id: 'ORIG_ORDER_ID',
      },
    } as KrakenWsEditOrderResponse;

    const ws = {
      request: vi.fn().mockResolvedValue(mocked),
    } as unknown as KrakenWebsocketBase;

    const params = {
      order_id: 'ORIG_ORDER_ID',
      symbol: 'BTC/USD',
      order_qty: 1.23,
      limit_price: 42000,
    };

    const res = await editOrder(ws, params);

    expect(ws.request).toHaveBeenCalledTimes(1);
    expect(ws.request).toHaveBeenCalledWith('edit_order', params, {
      reqId: undefined,
      timeoutMs: undefined,
      attachAuthToken: undefined,
    });
    expect(res).toBe(mocked);
  });

  it('forwards provided options', async () => {
    const mocked: KrakenWsEditOrderResponse = {
      method: 'edit_order',
      success: true,
      result: {
        order_id: 'NEW_ORDER_ID',
        original_order_id: 'ORIG_ORDER_ID',
        warnings: ['hello'],
      },
      req_id: 99,
    } as KrakenWsEditOrderResponse;

    const ws = {
      request: vi.fn().mockResolvedValue(mocked),
    } as unknown as KrakenWebsocketBase;

    const params = {
      order_id: 'ORIG_ORDER_ID',
      symbol: 'ETH/USD',
      // include a couple fields to ensure passthrough of optional params
      order_qty: 0.5,
      post_only: true,
      reduce_only: false,
      fee_preference: 'quote' as const,
      validate: true,
      deadline: '2025-01-01T00:00:05.000Z',
    };

    const options = { reqId: 99, timeoutMs: 1234, attachAuthToken: true };

    const res = await editOrder(ws, params, options);

    expect(ws.request).toHaveBeenCalledTimes(1);
    expect(ws.request).toHaveBeenCalledWith('edit_order', params, options);
    expect(res).toBe(mocked);
  });

  it('passes through explicit options values (including false)', async () => {
    const mocked: KrakenWsEditOrderResponse = {
      method: 'edit_order',
      success: true,
      result: {
        order_id: 'NEW_ORDER_ID',
        original_order_id: 'ORIG_ORDER_ID',
      },
    } as KrakenWsEditOrderResponse;

    const ws = {
      request: vi.fn().mockResolvedValue(mocked),
    } as unknown as KrakenWebsocketBase;

    const params = {
      order_id: 'ORIG_ORDER_ID',
      symbol: 'BTC/USD',
      order_qty: 2,
    };

    await editOrder(ws, params, { attachAuthToken: false });

    expect(ws.request).toHaveBeenCalledTimes(1);
    expect(ws.request).toHaveBeenCalledWith('edit_order', params, {
      reqId: undefined,
      timeoutMs: undefined,
      attachAuthToken: false,
    });
  });
});
