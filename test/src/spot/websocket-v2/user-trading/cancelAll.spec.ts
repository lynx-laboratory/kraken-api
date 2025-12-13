import { describe, it, expect, vi } from 'vitest';
import type { KrakenWebsocketBase } from '../../../../../src/base/websocketBase';
import {
  cancelAll,
  type KrakenWsCancelAllResponse,
} from '../../../../../src/spot/websocket-v2/user-trading/cancelAll';

describe('spot/websocket-v2/user-trading/cancelAll', () => {
  it('forwards to ws.request("cancel_all", params, options) with defaults', async () => {
    const mocked: KrakenWsCancelAllResponse = {
      method: 'cancel_all',
      success: true,
      result: { count: 0 },
    } as KrakenWsCancelAllResponse;

    const ws = {
      request: vi.fn().mockResolvedValue(mocked),
    } as unknown as KrakenWebsocketBase;

    const res = await cancelAll(ws);

    expect(ws.request).toHaveBeenCalledTimes(1);
    expect(ws.request).toHaveBeenCalledWith(
      'cancel_all',
      {},
      {
        reqId: undefined,
        timeoutMs: undefined,
        attachAuthToken: undefined,
      },
    );
    expect(res).toBe(mocked);
  });

  it('forwards provided params and options', async () => {
    const mocked: KrakenWsCancelAllResponse = {
      method: 'cancel_all',
      success: true,
      result: { count: 12, warnings: ['hello'] },
      req_id: 77,
    } as KrakenWsCancelAllResponse;

    const ws = {
      request: vi.fn().mockResolvedValue(mocked),
    } as unknown as KrakenWebsocketBase;

    const params = { token: 'token-abc' };
    const options = { reqId: 77, timeoutMs: 1234, attachAuthToken: true };

    const res = await cancelAll(ws, params, options);

    expect(ws.request).toHaveBeenCalledTimes(1);
    expect(ws.request).toHaveBeenCalledWith('cancel_all', params, options);
    expect(res).toBe(mocked);
  });

  it('passes through explicit options values (including false)', async () => {
    const mocked: KrakenWsCancelAllResponse = {
      method: 'cancel_all',
      success: true,
      result: { count: 1 },
    } as KrakenWsCancelAllResponse;

    const ws = {
      request: vi.fn().mockResolvedValue(mocked),
    } as unknown as KrakenWebsocketBase;

    await cancelAll(ws, {}, { attachAuthToken: false });

    expect(ws.request).toHaveBeenCalledTimes(1);
    expect(ws.request).toHaveBeenCalledWith(
      'cancel_all',
      {},
      {
        reqId: undefined,
        timeoutMs: undefined,
        attachAuthToken: false,
      },
    );
  });
});
