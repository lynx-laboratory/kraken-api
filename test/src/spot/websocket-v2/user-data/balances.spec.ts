import { describe, it, expect, vi } from 'vitest';
import type { KrakenWebsocketBase } from '../../../../../src/base/websocketBase';
import {
  subscribeBalances,
  unsubscribeBalances,
  type KrakenWsBalancesSubscribeResponse,
  type KrakenWsBalancesUnsubscribeResponse,
} from '../../../../../src/spot/websocket-v2/user-data/balances';

describe('spot/websocket-v2/user-data/balances', () => {
  describe('subscribeBalances', () => {
    it('calls ws.request("subscribe", body, options) with attachAuthToken defaulting to true', async () => {
      const mocked: KrakenWsBalancesSubscribeResponse = {
        method: 'subscribe',
        success: true,
        result: { channel: 'balances' },
      } as KrakenWsBalancesSubscribeResponse;

      const ws = {
        request: vi.fn().mockResolvedValue(mocked),
      } as unknown as KrakenWebsocketBase;

      const res = await subscribeBalances(ws);

      expect(ws.request).toHaveBeenCalledTimes(1);
      expect(ws.request).toHaveBeenCalledWith(
        'subscribe',
        {
          channel: 'balances',
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
      const mocked: KrakenWsBalancesSubscribeResponse = {
        method: 'subscribe',
        success: true,
        result: { channel: 'balances' },
        req_id: 123,
      } as KrakenWsBalancesSubscribeResponse;

      const ws = {
        request: vi.fn().mockResolvedValue(mocked),
      } as unknown as KrakenWebsocketBase;

      const params = {
        snapshot: true,
        rebased: false,
        users: 'all' as const,
        token: 'token-abc',
      };

      const res = await subscribeBalances(ws, params, {
        reqId: 123,
        timeoutMs: 5000,
        attachAuthToken: true,
      });

      expect(ws.request).toHaveBeenCalledTimes(1);
      expect(ws.request).toHaveBeenCalledWith(
        'subscribe',
        {
          channel: 'balances',
          ...params,
        },
        {
          reqId: 123,
          timeoutMs: 5000,
          attachAuthToken: true,
        },
      );
      expect(res).toBe(mocked);
    });

    it('keeps explicit attachAuthToken: false', async () => {
      const mocked: KrakenWsBalancesSubscribeResponse = {
        method: 'subscribe',
        success: true,
        result: { channel: 'balances' },
      } as KrakenWsBalancesSubscribeResponse;

      const ws = {
        request: vi.fn().mockResolvedValue(mocked),
      } as unknown as KrakenWebsocketBase;

      await subscribeBalances(ws, {}, { attachAuthToken: false });

      expect(ws.request).toHaveBeenCalledTimes(1);
      expect(ws.request).toHaveBeenCalledWith(
        'subscribe',
        {
          channel: 'balances',
        },
        {
          reqId: undefined,
          timeoutMs: undefined,
          attachAuthToken: false,
        },
      );
    });
  });

  describe('unsubscribeBalances', () => {
    it('calls ws.request("unsubscribe", body, options) with attachAuthToken defaulting to true', async () => {
      const mocked: KrakenWsBalancesUnsubscribeResponse = {
        method: 'unsubscribe',
        success: true,
        result: { channel: 'balances' },
      } as KrakenWsBalancesUnsubscribeResponse;

      const ws = {
        request: vi.fn().mockResolvedValue(mocked),
      } as unknown as KrakenWebsocketBase;

      const res = await unsubscribeBalances(ws);

      expect(ws.request).toHaveBeenCalledTimes(1);
      expect(ws.request).toHaveBeenCalledWith(
        'unsubscribe',
        {
          channel: 'balances',
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
      const mocked: KrakenWsBalancesUnsubscribeResponse = {
        method: 'unsubscribe',
        success: true,
        result: { channel: 'balances' },
        req_id: 124,
      } as KrakenWsBalancesUnsubscribeResponse;

      const ws = {
        request: vi.fn().mockResolvedValue(mocked),
      } as unknown as KrakenWebsocketBase;

      const params = { token: 'token-xyz' };

      const res = await unsubscribeBalances(ws, params, {
        reqId: 124,
        timeoutMs: 1234,
        attachAuthToken: true,
      });

      expect(ws.request).toHaveBeenCalledTimes(1);
      expect(ws.request).toHaveBeenCalledWith(
        'unsubscribe',
        {
          channel: 'balances',
          ...params,
        },
        {
          reqId: 124,
          timeoutMs: 1234,
          attachAuthToken: true,
        },
      );
      expect(res).toBe(mocked);
    });

    it('keeps explicit attachAuthToken: false', async () => {
      const mocked: KrakenWsBalancesUnsubscribeResponse = {
        method: 'unsubscribe',
        success: true,
        result: { channel: 'balances' },
      } as KrakenWsBalancesUnsubscribeResponse;

      const ws = {
        request: vi.fn().mockResolvedValue(mocked),
      } as unknown as KrakenWebsocketBase;

      await unsubscribeBalances(ws, {}, { attachAuthToken: false });

      expect(ws.request).toHaveBeenCalledTimes(1);
      expect(ws.request).toHaveBeenCalledWith(
        'unsubscribe',
        {
          channel: 'balances',
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
