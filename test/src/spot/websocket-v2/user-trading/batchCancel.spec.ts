import { describe, it, expect, vi } from 'vitest';
import type { KrakenWebsocketBase } from '../../../../../src/base/websocketBase';
import {
  batchCancel,
  type KrakenWsBatchCancelResponse,
} from '../../../../../src/spot/websocket-v2/user-trading/batchCancel';

describe('spot/websocket-v2/user-trading/batchCancel', () => {
  it('forwards to ws.request("batch_cancel", params, options) with defaults', async () => {
    const mocked: KrakenWsBatchCancelResponse = {
      method: 'batch_cancel',
      success: true,
      result: { count: 2 },
    } as KrakenWsBatchCancelResponse;

    const ws = {
      request: vi.fn().mockResolvedValue(mocked),
    } as unknown as KrakenWebsocketBase;

    const params = {
      orders: ['OID1', 'OID2'],
    };

    const res = await batchCancel(ws, params);

    expect(ws.request).toHaveBeenCalledTimes(1);
    expect(ws.request).toHaveBeenCalledWith('batch_cancel', params, {
      reqId: undefined,
      timeoutMs: undefined,
      attachAuthToken: undefined,
    });
    expect(res).toBe(mocked);
  });

  it('forwards provided params and options', async () => {
    const mocked: KrakenWsBatchCancelResponse = {
      method: 'batch_cancel',
      success: true,
      result: { count: 3, warnings: ['hello'] },
      req_id: 99,
    } as KrakenWsBatchCancelResponse;

    const ws = {
      request: vi.fn().mockResolvedValue(mocked),
    } as unknown as KrakenWebsocketBase;

    const params = {
      orders: ['OID1', 'OID2', '12345'], // can include userref-like strings too
      cl_ord_id: ['CLIENT-1', 'CLIENT-2'],
      token: 'token-abc',
    };

    const res = await batchCancel(ws, params, {
      reqId: 99,
      timeoutMs: 1234,
      attachAuthToken: true,
    });

    expect(ws.request).toHaveBeenCalledTimes(1);
    expect(ws.request).toHaveBeenCalledWith('batch_cancel', params, {
      reqId: 99,
      timeoutMs: 1234,
      attachAuthToken: true,
    });
    expect(res).toBe(mocked);
  });

  it('passes through explicit options values (including false)', async () => {
    const mocked: KrakenWsBatchCancelResponse = {
      method: 'batch_cancel',
      success: true,
      result: { count: 2 },
    } as KrakenWsBatchCancelResponse;

    const ws = {
      request: vi.fn().mockResolvedValue(mocked),
    } as unknown as KrakenWebsocketBase;

    const params = { orders: ['OID1', 'OID2'] };

    await batchCancel(ws, params, { attachAuthToken: false });

    expect(ws.request).toHaveBeenCalledTimes(1);
    expect(ws.request).toHaveBeenCalledWith('batch_cancel', params, {
      reqId: undefined,
      timeoutMs: undefined,
      attachAuthToken: false,
    });
  });

  it('throws if orders has fewer than 2 identifiers', async () => {
    const ws = { request: vi.fn() } as unknown as KrakenWebsocketBase;

    const params = { orders: ['OID1'] };

    await expect(batchCancel(ws, params)).rejects.toThrow(
      'orders` must contain at least 2 identifiers',
    );
    expect(ws.request).not.toHaveBeenCalled();
  });

  it('throws if orders has more than 50 identifiers', async () => {
    const ws = { request: vi.fn() } as unknown as KrakenWebsocketBase;

    const params = {
      orders: Array.from({ length: 51 }, (_, i) => `OID${i + 1}`),
    };

    await expect(batchCancel(ws, params)).rejects.toThrow(
      'orders` must not contain more than 50 identifiers',
    );
    expect(ws.request).not.toHaveBeenCalled();
  });
});
