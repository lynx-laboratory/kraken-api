import { describe, it, expect, vi } from 'vitest';
import type { KrakenWebsocketBase } from '../../../../../src/base/websocketBase';
import {
  cancelOrder,
  type KrakenWsCancelOrderResponse,
} from '../../../../../src/spot/websocket-v2/user-trading/cancelOrder';

describe('spot/websocket-v2/user-trading/cancelOrder', () => {
  it('forwards to ws.request("cancel_order", params, options) with defaults', async () => {
    const mocked: KrakenWsCancelOrderResponse = {
      method: 'cancel_order',
      success: true,
      result: { order_id: 'OID1' },
    } as KrakenWsCancelOrderResponse;

    const ws = {
      request: vi.fn().mockResolvedValue(mocked),
    } as unknown as KrakenWebsocketBase;

    const params = { order_id: ['OID1'] };

    const res = await cancelOrder(ws, params);

    expect(ws.request).toHaveBeenCalledTimes(1);
    expect(ws.request).toHaveBeenCalledWith('cancel_order', params, {
      reqId: undefined,
      timeoutMs: undefined,
      attachAuthToken: undefined,
    });
    expect(res).toBe(mocked);
  });

  it('accepts cl_ord_id identifiers', async () => {
    const mocked: KrakenWsCancelOrderResponse = {
      method: 'cancel_order',
      success: true,
      result: { order_id: 'OID1', cl_ord_id: 'CLIENT-1' },
    } as KrakenWsCancelOrderResponse;

    const ws = {
      request: vi.fn().mockResolvedValue(mocked),
    } as unknown as KrakenWebsocketBase;

    const params = { cl_ord_id: ['CLIENT-1'] };

    const res = await cancelOrder(ws, params);

    expect(ws.request).toHaveBeenCalledTimes(1);
    expect(ws.request).toHaveBeenCalledWith('cancel_order', params, {
      reqId: undefined,
      timeoutMs: undefined,
      attachAuthToken: undefined,
    });
    expect(res).toBe(mocked);
  });

  it('accepts order_userref identifiers', async () => {
    const mocked: KrakenWsCancelOrderResponse = {
      method: 'cancel_order',
      success: true,
      result: { order_id: 'OID1' },
    } as KrakenWsCancelOrderResponse;

    const ws = {
      request: vi.fn().mockResolvedValue(mocked),
    } as unknown as KrakenWebsocketBase;

    const params = { order_userref: [123] };

    const res = await cancelOrder(ws, params);

    expect(ws.request).toHaveBeenCalledTimes(1);
    expect(ws.request).toHaveBeenCalledWith('cancel_order', params, {
      reqId: undefined,
      timeoutMs: undefined,
      attachAuthToken: undefined,
    });
    expect(res).toBe(mocked);
  });

  it('forwards provided params and options', async () => {
    const mocked: KrakenWsCancelOrderResponse = {
      method: 'cancel_order',
      success: true,
      result: { order_id: 'OID1', warnings: ['hello'] },
      req_id: 10,
    } as KrakenWsCancelOrderResponse;

    const ws = {
      request: vi.fn().mockResolvedValue(mocked),
    } as unknown as KrakenWebsocketBase;

    const params = {
      order_id: ['OID1', 'OID2'],
      cl_ord_id: ['CLIENT-1'],
      order_userref: [999],
      token: 'token-abc',
    };

    const res = await cancelOrder(ws, params, {
      reqId: 10,
      timeoutMs: 1234,
      attachAuthToken: true,
    });

    expect(ws.request).toHaveBeenCalledTimes(1);
    expect(ws.request).toHaveBeenCalledWith('cancel_order', params, {
      reqId: 10,
      timeoutMs: 1234,
      attachAuthToken: true,
    });
    expect(res).toBe(mocked);
  });

  it('passes through explicit options values (including false)', async () => {
    const mocked: KrakenWsCancelOrderResponse = {
      method: 'cancel_order',
      success: true,
      result: { order_id: 'OID1' },
    } as KrakenWsCancelOrderResponse;

    const ws = {
      request: vi.fn().mockResolvedValue(mocked),
    } as unknown as KrakenWebsocketBase;

    await cancelOrder(ws, { order_id: ['OID1'] }, { attachAuthToken: false });

    expect(ws.request).toHaveBeenCalledTimes(1);
    expect(ws.request).toHaveBeenCalledWith(
      'cancel_order',
      { order_id: ['OID1'] },
      {
        reqId: undefined,
        timeoutMs: undefined,
        attachAuthToken: false,
      },
    );
  });

  it('throws if none of order_id / cl_ord_id / order_userref contains entries', async () => {
    const ws = { request: vi.fn() } as any;

    await expect(
      cancelOrder(ws, {}), // <- no identifiers
    ).rejects.toThrow(
      'Kraken WS cancel_order: at least one of `order_id`, `cl_ord_id`, or `order_userref` must contain at least one entry',
    );

    expect(ws.request).not.toHaveBeenCalled();
  });
});
