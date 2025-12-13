import { describe, it, expect, vi } from 'vitest';
import type { KrakenWebsocketBase } from '../../../../../src/base/websocketBase';
import {
  ping,
  type KrakenWsPingResponse,
} from '../../../../../src/spot/websocket-v2/admin/ping';

describe('spot/websocket-v2/admin/ping', () => {
  it('forwards to ws.request("ping", params, options) with defaults', async () => {
    const mocked: KrakenWsPingResponse = {
      method: 'ping',
      success: true,
      result: {},
    } as KrakenWsPingResponse;

    const ws = {
      request: vi.fn().mockResolvedValue(mocked),
    } as unknown as KrakenWebsocketBase;

    const res = await ping(ws);

    expect(ws.request).toHaveBeenCalledTimes(1);
    expect(ws.request).toHaveBeenCalledWith(
      'ping',
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
    const mocked: KrakenWsPingResponse = {
      method: 'ping',
      success: true,
      result: { warnings: ['hello'] },
      req_id: 42,
    } as KrakenWsPingResponse;

    const ws = {
      request: vi.fn().mockResolvedValue(mocked),
    } as unknown as KrakenWebsocketBase;

    const res = await ping(
      ws,
      {},
      { reqId: 42, timeoutMs: 1234, attachAuthToken: true },
    );

    expect(ws.request).toHaveBeenCalledTimes(1);
    expect(ws.request).toHaveBeenCalledWith(
      'ping',
      {},
      {
        reqId: 42,
        timeoutMs: 1234,
        attachAuthToken: true,
      },
    );
    expect(res).toBe(mocked);
  });

  it('passes through explicit options values (including false)', async () => {
    const mocked: KrakenWsPingResponse = {
      method: 'ping',
      success: true,
      result: {},
    } as KrakenWsPingResponse;

    const ws = {
      request: vi.fn().mockResolvedValue(mocked),
    } as unknown as KrakenWebsocketBase;

    await ping(ws, {}, { attachAuthToken: false });

    expect(ws.request).toHaveBeenCalledTimes(1);
    expect(ws.request).toHaveBeenCalledWith(
      'ping',
      {},
      {
        reqId: undefined,
        timeoutMs: undefined,
        attachAuthToken: false,
      },
    );
  });

  it('passes non-empty params through verbatim (future-proof)', async () => {
    // Even though params is currently empty in typings, this guards behavior if Kraken adds fields later.
    const mocked: KrakenWsPingResponse = {
      method: 'ping',
      success: true,
      result: {},
    } as KrakenWsPingResponse;

    const ws = {
      request: vi.fn().mockResolvedValue(mocked),
    } as unknown as KrakenWebsocketBase;

    const params = { foo: 'bar' } as unknown as Record<string, unknown>;

    await ping(ws, params as any, { reqId: 1 });

    expect(ws.request).toHaveBeenCalledTimes(1);
    expect(ws.request).toHaveBeenCalledWith('ping', params, {
      reqId: 1,
      timeoutMs: undefined,
      attachAuthToken: undefined,
    });
  });
});
