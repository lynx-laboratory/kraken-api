import { describe, it, expect, vi } from 'vitest';
import type { KrakenWebsocketBase } from '../../../../../src/base/websocketBase';
import {
  cancelAllOrdersAfter,
  type KrakenWsCancelAllOrdersAfterResponse,
} from '../../../../../src/spot/websocket-v2/user-trading/cancelAllOrdersAfter';

describe('spot/websocket-v2/user-trading/cancelAllOrdersAfter', () => {
  it('forwards to ws.request("cancel_all_orders_after", params, options) with defaults', async () => {
    const mocked: KrakenWsCancelAllOrdersAfterResponse = {
      method: 'cancel_all_orders_after',
      success: true,
      result: {
        currentTime: '2025-01-01T00:00:00.000Z',
        triggerTime: '2025-01-01T00:01:00.000Z',
      },
    } as KrakenWsCancelAllOrdersAfterResponse;

    const ws = {
      request: vi.fn().mockResolvedValue(mocked),
    } as unknown as KrakenWebsocketBase;

    const params = { timeout: 60 };

    const res = await cancelAllOrdersAfter(ws, params);

    expect(ws.request).toHaveBeenCalledTimes(1);
    expect(ws.request).toHaveBeenCalledWith('cancel_all_orders_after', params, {
      reqId: undefined,
      timeoutMs: undefined,
      attachAuthToken: undefined,
    });
    expect(res).toBe(mocked);
  });

  it('forwards provided params and options', async () => {
    const mocked: KrakenWsCancelAllOrdersAfterResponse = {
      method: 'cancel_all_orders_after',
      success: true,
      result: {
        currentTime: '2025-01-01T00:00:00.000Z',
        triggerTime: '2025-01-01T00:10:00.000Z',
        warnings: ['hello'],
      },
      req_id: 5,
    } as KrakenWsCancelAllOrdersAfterResponse;

    const ws = {
      request: vi.fn().mockResolvedValue(mocked),
    } as unknown as KrakenWebsocketBase;

    const params = { timeout: 600, token: 'token-abc' };
    const options = { reqId: 5, timeoutMs: 1234, attachAuthToken: true };

    const res = await cancelAllOrdersAfter(ws, params, options);

    expect(ws.request).toHaveBeenCalledTimes(1);
    expect(ws.request).toHaveBeenCalledWith(
      'cancel_all_orders_after',
      params,
      options,
    );
    expect(res).toBe(mocked);
  });

  it('passes through explicit options values (including false)', async () => {
    const mocked: KrakenWsCancelAllOrdersAfterResponse = {
      method: 'cancel_all_orders_after',
      success: true,
      result: {
        currentTime: '2025-01-01T00:00:00.000Z',
        triggerTime: '2025-01-01T00:00:00.000Z',
      },
    } as KrakenWsCancelAllOrdersAfterResponse;

    const ws = {
      request: vi.fn().mockResolvedValue(mocked),
    } as unknown as KrakenWebsocketBase;

    await cancelAllOrdersAfter(ws, { timeout: 0 }, { attachAuthToken: false });

    expect(ws.request).toHaveBeenCalledTimes(1);
    expect(ws.request).toHaveBeenCalledWith(
      'cancel_all_orders_after',
      { timeout: 0 },
      {
        reqId: undefined,
        timeoutMs: undefined,
        attachAuthToken: false,
      },
    );
  });

  it('throws if timeout is not finite', async () => {
    const ws = { request: vi.fn() } as unknown as KrakenWebsocketBase;

    await expect(
      cancelAllOrdersAfter(ws, { timeout: Number.NaN }),
    ).rejects.toThrow('timeout` must be a finite number');

    await expect(
      cancelAllOrdersAfter(ws, { timeout: Number.POSITIVE_INFINITY }),
    ).rejects.toThrow('timeout` must be a finite number');

    expect(ws.request).not.toHaveBeenCalled();
  });

  it('throws if timeout is out of range (< 0 or >= 86400)', async () => {
    const ws = { request: vi.fn() } as unknown as KrakenWebsocketBase;

    await expect(cancelAllOrdersAfter(ws, { timeout: -1 })).rejects.toThrow(
      'timeout` must be >= 0 and < 86400 seconds',
    );

    await expect(cancelAllOrdersAfter(ws, { timeout: 86400 })).rejects.toThrow(
      'timeout` must be >= 0 and < 86400 seconds',
    );

    expect(ws.request).not.toHaveBeenCalled();
  });
});
