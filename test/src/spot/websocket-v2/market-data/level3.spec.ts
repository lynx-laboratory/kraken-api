import { describe, it, expect, vi } from 'vitest';
import type { KrakenWebsocketBase } from '../../../../../src/base/websocketBase';
import {
  subscribeLevel3,
  unsubscribeLevel3,
  type KrakenWsLevel3SubscribeResponse,
  type KrakenWsLevel3UnsubscribeResponse,
} from '../../../../../src/spot/websocket-v2/market-data/level3';

describe('spot/websocket-v2/market-data/level3', () => {
  describe('subscribeLevel3', () => {
    it('calls ws.request("subscribe", body, options) with attachAuthToken defaulting to true', async () => {
      const mocked: KrakenWsLevel3SubscribeResponse = {
        method: 'subscribe',
        success: true,
        result: {
          channel: 'level3',
          symbol: ['BTC/USD'],
          depth: 100,
          snapshot: true,
        },
      } as KrakenWsLevel3SubscribeResponse;

      const ws = {
        request: vi.fn().mockResolvedValue(mocked),
      } as unknown as KrakenWebsocketBase;

      const params = {
        symbol: ['BTC/USD'],
        depth: 100 as const,
        snapshot: true,
        token: 'token-123',
      };

      const res = await subscribeLevel3(ws, params);

      expect(ws.request).toHaveBeenCalledTimes(1);
      expect(ws.request).toHaveBeenCalledWith(
        'subscribe',
        {
          channel: 'level3',
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

    it('passes through provided options (including attachAuthToken: false)', async () => {
      const mocked: KrakenWsLevel3SubscribeResponse = {
        method: 'subscribe',
        success: true,
        result: {
          channel: 'level3',
          symbol: ['BTC/USD'],
          depth: 10,
          snapshot: true,
        },
        req_id: 42,
      } as KrakenWsLevel3SubscribeResponse;

      const ws = {
        request: vi.fn().mockResolvedValue(mocked),
      } as unknown as KrakenWebsocketBase;

      const params = {
        symbol: ['BTC/USD'],
        depth: 10 as const,
        token: 'token-abc',
      };

      const res = await subscribeLevel3(ws, params, {
        reqId: 42,
        timeoutMs: 1234,
        attachAuthToken: false,
      });

      expect(ws.request).toHaveBeenCalledTimes(1);
      expect(ws.request).toHaveBeenCalledWith(
        'subscribe',
        {
          channel: 'level3',
          ...params,
        },
        {
          reqId: 42,
          timeoutMs: 1234,
          attachAuthToken: false,
        },
      );
      expect(res).toBe(mocked);
    });
  });

  describe('unsubscribeLevel3', () => {
    it('calls ws.request("unsubscribe", body, options) with attachAuthToken defaulting to true', async () => {
      const mocked: KrakenWsLevel3UnsubscribeResponse = {
        method: 'unsubscribe',
        success: true,
        result: {
          channel: 'level3',
          symbol: ['BTC/USD'],
          depth: 100,
        },
      } as KrakenWsLevel3UnsubscribeResponse;

      const ws = {
        request: vi.fn().mockResolvedValue(mocked),
      } as unknown as KrakenWebsocketBase;

      const params = {
        symbol: ['BTC/USD'],
        depth: 100 as const,
        token: 'token-123',
      };

      const res = await unsubscribeLevel3(ws, params);

      expect(ws.request).toHaveBeenCalledTimes(1);
      expect(ws.request).toHaveBeenCalledWith(
        'unsubscribe',
        {
          channel: 'level3',
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

    it('passes through provided options (including attachAuthToken: false)', async () => {
      const mocked: KrakenWsLevel3UnsubscribeResponse = {
        method: 'unsubscribe',
        success: true,
        result: {
          channel: 'level3',
          symbol: ['BTC/USD', 'ETH/USD'],
          depth: 10,
        },
        req_id: 43,
      } as KrakenWsLevel3UnsubscribeResponse;

      const ws = {
        request: vi.fn().mockResolvedValue(mocked),
      } as unknown as KrakenWebsocketBase;

      const params = {
        symbol: ['BTC/USD', 'ETH/USD'],
        depth: 10 as const,
        token: 'token-xyz',
      };

      const res = await unsubscribeLevel3(ws, params, {
        reqId: 43,
        timeoutMs: 777,
        attachAuthToken: false,
      });

      expect(ws.request).toHaveBeenCalledTimes(1);
      expect(ws.request).toHaveBeenCalledWith(
        'unsubscribe',
        {
          channel: 'level3',
          ...params,
        },
        {
          reqId: 43,
          timeoutMs: 777,
          attachAuthToken: false,
        },
      );
      expect(res).toBe(mocked);
    });
  });
});
