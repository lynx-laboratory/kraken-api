import { describe, it, expect, vi } from 'vitest';
import type { KrakenWebsocketBase } from '../../../../../src/base/websocketBase';
import {
  subscribeExecutions,
  unsubscribeExecutions,
  type KrakenWsExecutionsSubscribeResponse,
  type KrakenWsExecutionsUnsubscribeResponse,
} from '../../../../../src/spot/websocket-v2/user-data/executions';

describe('spot/websocket-v2/user-data/executions', () => {
  describe('subscribeExecutions', () => {
    it('calls ws.request("subscribe", body, options) with attachAuthToken defaulting to true', async () => {
      const mocked: KrakenWsExecutionsSubscribeResponse = {
        method: 'subscribe',
        success: true,
        result: { channel: 'executions' },
      } as KrakenWsExecutionsSubscribeResponse;

      const ws = {
        request: vi.fn().mockResolvedValue(mocked),
      } as unknown as KrakenWebsocketBase;

      const params = {
        snap_trades: true,
        snap_orders: true,
        order_status: true,
      };

      const res = await subscribeExecutions(ws, params);

      expect(ws.request).toHaveBeenCalledTimes(1);
      expect(ws.request).toHaveBeenCalledWith(
        'subscribe',
        {
          channel: 'executions',
          ...params,
        },
        {
          reqId: undefined,
          timeoutMs: undefined,
          attachAuthToken: true,
        },
      );
      expect(res).toBe(mocked);
    });

    it('passes through provided params and options', async () => {
      const mocked: KrakenWsExecutionsSubscribeResponse = {
        method: 'subscribe',
        success: true,
        result: { channel: 'executions' },
        req_id: 500,
      } as KrakenWsExecutionsSubscribeResponse;

      const ws = {
        request: vi.fn().mockResolvedValue(mocked),
      } as unknown as KrakenWebsocketBase;

      const params = {
        snap_trades: true,
        snap_orders: false,
        order_status: false,
        rebased: false,
        ratecounter: true,
        users: 'all' as const,
        snapshot_trades: true,
        snapshot: true,
        token: 'token-abc',
      };

      const res = await subscribeExecutions(ws, params, {
        reqId: 500,
        timeoutMs: 1234,
        attachAuthToken: true,
      });

      expect(ws.request).toHaveBeenCalledTimes(1);
      expect(ws.request).toHaveBeenCalledWith(
        'subscribe',
        {
          channel: 'executions',
          ...params,
        },
        {
          reqId: 500,
          timeoutMs: 1234,
          attachAuthToken: true,
        },
      );
      expect(res).toBe(mocked);
    });

    it('keeps explicit attachAuthToken: false', async () => {
      const mocked: KrakenWsExecutionsSubscribeResponse = {
        method: 'subscribe',
        success: true,
        result: { channel: 'executions' },
      } as KrakenWsExecutionsSubscribeResponse;

      const ws = {
        request: vi.fn().mockResolvedValue(mocked),
      } as unknown as KrakenWebsocketBase;

      await subscribeExecutions(
        ws,
        { snap_orders: true },
        { attachAuthToken: false },
      );

      expect(ws.request).toHaveBeenCalledTimes(1);
      expect(ws.request).toHaveBeenCalledWith(
        'subscribe',
        {
          channel: 'executions',
          snap_orders: true,
        },
        {
          reqId: undefined,
          timeoutMs: undefined,
          attachAuthToken: false,
        },
      );
    });
  });

  describe('unsubscribeExecutions', () => {
    it('calls ws.request("unsubscribe", body, options) with attachAuthToken defaulting to true', async () => {
      const mocked: KrakenWsExecutionsUnsubscribeResponse = {
        method: 'unsubscribe',
        success: true,
        result: { channel: 'executions' },
      } as KrakenWsExecutionsUnsubscribeResponse;

      const ws = {
        request: vi.fn().mockResolvedValue(mocked),
      } as unknown as KrakenWebsocketBase;

      const res = await unsubscribeExecutions(ws);

      expect(ws.request).toHaveBeenCalledTimes(1);
      expect(ws.request).toHaveBeenCalledWith(
        'unsubscribe',
        {
          channel: 'executions',
        },
        {
          reqId: undefined,
          timeoutMs: undefined,
          attachAuthToken: true,
        },
      );
      expect(res).toBe(mocked);
    });

    it('passes through provided params and options', async () => {
      const mocked: KrakenWsExecutionsUnsubscribeResponse = {
        method: 'unsubscribe',
        success: true,
        result: { channel: 'executions' },
        req_id: 501,
      } as KrakenWsExecutionsUnsubscribeResponse;

      const ws = {
        request: vi.fn().mockResolvedValue(mocked),
      } as unknown as KrakenWebsocketBase;

      const params = { token: 'token-xyz' };

      const res = await unsubscribeExecutions(ws, params, {
        reqId: 501,
        timeoutMs: 777,
        attachAuthToken: true,
      });

      expect(ws.request).toHaveBeenCalledTimes(1);
      expect(ws.request).toHaveBeenCalledWith(
        'unsubscribe',
        {
          channel: 'executions',
          ...params,
        },
        {
          reqId: 501,
          timeoutMs: 777,
          attachAuthToken: true,
        },
      );
      expect(res).toBe(mocked);
    });

    it('keeps explicit attachAuthToken: false', async () => {
      const mocked: KrakenWsExecutionsUnsubscribeResponse = {
        method: 'unsubscribe',
        success: true,
        result: { channel: 'executions' },
      } as KrakenWsExecutionsUnsubscribeResponse;

      const ws = {
        request: vi.fn().mockResolvedValue(mocked),
      } as unknown as KrakenWebsocketBase;

      await unsubscribeExecutions(ws, {}, { attachAuthToken: false });

      expect(ws.request).toHaveBeenCalledTimes(1);
      expect(ws.request).toHaveBeenCalledWith(
        'unsubscribe',
        {
          channel: 'executions',
        },
        {
          reqId: undefined,
          timeoutMs: undefined,
          attachAuthToken: false,
        },
      );
    });
  });
});
