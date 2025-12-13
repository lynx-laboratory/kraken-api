import { describe, it, expect, vi } from 'vitest';
import type { KrakenWebsocketBase } from '../../../../../src/base/websocketBase';
import {
  amendOrder,
  type KrakenWsAmendOrderResponse,
} from '../../../../../src/spot/websocket-v2/user-trading/amendOrder';

describe('spot/websocket-v2/user-trading/amendOrder', () => {
  it('forwards to ws.request("amend_order", params, options) when order_id is provided', async () => {
    const mocked: KrakenWsAmendOrderResponse = {
      method: 'amend_order',
      success: true,
      result: {
        amend_id: 'AID123',
        order_id: 'OID123',
      },
    } as KrakenWsAmendOrderResponse;

    const ws = {
      request: vi.fn().mockResolvedValue(mocked),
    } as unknown as KrakenWebsocketBase;

    const params = {
      order_id: 'OID123',
      order_qty: 2,
      limit_price: 123.45,
    };

    const res = await amendOrder(ws, params);

    expect(ws.request).toHaveBeenCalledTimes(1);
    expect(ws.request).toHaveBeenCalledWith('amend_order', params, {
      reqId: undefined,
      timeoutMs: undefined,
      attachAuthToken: undefined,
    });
    expect(res).toBe(mocked);
  });

  it('forwards to ws.request("amend_order", params, options) when cl_ord_id is provided', async () => {
    const mocked: KrakenWsAmendOrderResponse = {
      method: 'amend_order',
      success: true,
      result: {
        amend_id: 'AID456',
        cl_ord_id: 'CLIENT-1',
      },
      req_id: 42,
    } as KrakenWsAmendOrderResponse;

    const ws = {
      request: vi.fn().mockResolvedValue(mocked),
    } as unknown as KrakenWebsocketBase;

    const params = {
      cl_ord_id: 'CLIENT-1',
      order_qty: 5,
      post_only: true,
      trigger_price: 99.5,
      trigger_price_type: 'static',
      token: 'token-abc',
    } as const;

    const res = await amendOrder(ws, params as any, {
      reqId: 42,
      timeoutMs: 1234,
      attachAuthToken: true,
    });

    expect(ws.request).toHaveBeenCalledTimes(1);
    expect(ws.request).toHaveBeenCalledWith('amend_order', params, {
      reqId: 42,
      timeoutMs: 1234,
      attachAuthToken: true,
    });
    expect(res).toBe(mocked);
  });

  it('passes through explicit options values (including false)', async () => {
    const mocked: KrakenWsAmendOrderResponse = {
      method: 'amend_order',
      success: true,
      result: { amend_id: 'AID789' },
    } as KrakenWsAmendOrderResponse;

    const ws = {
      request: vi.fn().mockResolvedValue(mocked),
    } as unknown as KrakenWebsocketBase;

    const params = {
      order_id: 'OID999',
      order_qty: 1,
    };

    await amendOrder(ws, params, { attachAuthToken: false });

    expect(ws.request).toHaveBeenCalledTimes(1);
    expect(ws.request).toHaveBeenCalledWith('amend_order', params, {
      reqId: undefined,
      timeoutMs: undefined,
      attachAuthToken: false,
    });
  });

  it('throws if both order_id and cl_ord_id are provided', async () => {
    const ws = {
      request: vi.fn(),
    } as unknown as KrakenWebsocketBase;

    const params = {
      order_id: 'OID123',
      cl_ord_id: 'CLIENT-1',
      order_qty: 1,
    };

    await expect(amendOrder(ws, params as any)).rejects.toThrow(
      'exactly one of `order_id` or `cl_ord_id` must be provided',
    );

    expect(ws.request).not.toHaveBeenCalled();
  });

  it('throws if neither order_id nor cl_ord_id are provided', async () => {
    const ws = {
      request: vi.fn(),
    } as unknown as KrakenWebsocketBase;

    const params = {
      order_qty: 1,
      limit_price: 10,
    };

    await expect(amendOrder(ws, params as any)).rejects.toThrow(
      'exactly one of `order_id` or `cl_ord_id` must be provided',
    );

    expect(ws.request).not.toHaveBeenCalled();
  });
});
