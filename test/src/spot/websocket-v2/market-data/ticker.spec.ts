import { describe, it, expect, vi } from 'vitest';
import type { KrakenWebsocketBase } from '../../../../../src/base/websocketBase';
import {
  subscribeTicker,
  unsubscribeTicker,
  type KrakenWsTickerSubscribeResponse,
  type KrakenWsTickerUnsubscribeResponse,
} from '../../../../../src/spot/websocket-v2/market-data/ticker';

describe('spot/websocket-v2/market-data/ticker', () => {
  describe('subscribeTicker', () => {
    it('calls ws.request("subscribe", body, options) with attachAuthToken defaulting to false', async () => {
      const mocked: KrakenWsTickerSubscribeResponse = {
        method: 'subscribe',
        success: true,
        result: {
          channel: 'ticker',
          symbol: ['BTC/USD', 'ETH/USD'],
          event_trigger: 'trades',
        },
      } as KrakenWsTickerSubscribeResponse;

      const ws = {
        request: vi.fn().mockResolvedValue(mocked),
      } as unknown as KrakenWebsocketBase;

      const params = {
        symbol: ['BTC/USD', 'ETH/USD'] as const,
        event_trigger: 'trades' as const,
        snapshot: true,
      };

      const res = await subscribeTicker(ws, params);

      expect(ws.request).toHaveBeenCalledTimes(1);
      expect(ws.request).toHaveBeenCalledWith(
        'subscribe',
        {
          channel: 'ticker',
          ...params,
        },
        {
          reqId: undefined,
          timeoutMs: undefined,
          attachAuthToken: false,
        },
      );
      expect(res).toBe(mocked);
    });

    it('passes through provided options (including attachAuthToken: true)', async () => {
      const mocked: KrakenWsTickerSubscribeResponse = {
        method: 'subscribe',
        success: true,
        result: {
          channel: 'ticker',
          symbol: ['BTC/USD'],
          event_trigger: 'bbo',
        },
        req_id: 1,
      } as KrakenWsTickerSubscribeResponse;

      const ws = {
        request: vi.fn().mockResolvedValue(mocked),
      } as unknown as KrakenWebsocketBase;

      const params = {
        symbol: ['BTC/USD'] as const,
        event_trigger: 'bbo' as const,
      };

      const res = await subscribeTicker(ws, params, {
        reqId: 1,
        timeoutMs: 1234,
        attachAuthToken: true,
      });

      expect(ws.request).toHaveBeenCalledTimes(1);
      expect(ws.request).toHaveBeenCalledWith(
        'subscribe',
        {
          channel: 'ticker',
          ...params,
        },
        {
          reqId: 1,
          timeoutMs: 1234,
          attachAuthToken: true,
        },
      );
      expect(res).toBe(mocked);
    });

    it('keeps explicit attachAuthToken: false', async () => {
      const mocked: KrakenWsTickerSubscribeResponse = {
        method: 'subscribe',
        success: true,
        result: {
          channel: 'ticker',
          symbol: ['BTC/USD'],
        },
      } as KrakenWsTickerSubscribeResponse;

      const ws = {
        request: vi.fn().mockResolvedValue(mocked),
      } as unknown as KrakenWebsocketBase;

      await subscribeTicker(
        ws,
        { symbol: ['BTC/USD'] },
        { attachAuthToken: false },
      );

      expect(ws.request).toHaveBeenCalledTimes(1);
      expect(ws.request).toHaveBeenCalledWith(
        'subscribe',
        {
          channel: 'ticker',
          symbol: ['BTC/USD'],
        },
        {
          reqId: undefined,
          timeoutMs: undefined,
          attachAuthToken: false,
        },
      );
    });
  });

  describe('unsubscribeTicker', () => {
    it('calls ws.request("unsubscribe", body, options) with attachAuthToken defaulting to false', async () => {
      const mocked: KrakenWsTickerUnsubscribeResponse = {
        method: 'unsubscribe',
        success: true,
        result: {
          channel: 'ticker',
          symbol: ['BTC/USD', 'ETH/USD'],
        },
      } as KrakenWsTickerUnsubscribeResponse;

      const ws = {
        request: vi.fn().mockResolvedValue(mocked),
      } as unknown as KrakenWebsocketBase;

      const params = {
        symbol: ['BTC/USD', 'ETH/USD'] as const,
      };

      const res = await unsubscribeTicker(ws, params);

      expect(ws.request).toHaveBeenCalledTimes(1);
      expect(ws.request).toHaveBeenCalledWith(
        'unsubscribe',
        {
          channel: 'ticker',
          ...params,
        },
        {
          reqId: undefined,
          timeoutMs: undefined,
          attachAuthToken: false,
        },
      );
      expect(res).toBe(mocked);
    });

    it('passes through provided options (including attachAuthToken: true)', async () => {
      const mocked: KrakenWsTickerUnsubscribeResponse = {
        method: 'unsubscribe',
        success: true,
        result: {
          channel: 'ticker',
          symbol: ['BTC/USD'],
          event_trigger: 'bbo',
        },
        req_id: 2,
      } as KrakenWsTickerUnsubscribeResponse;

      const ws = {
        request: vi.fn().mockResolvedValue(mocked),
      } as unknown as KrakenWebsocketBase;

      const params = {
        symbol: ['BTC/USD'] as const,
        event_trigger: 'bbo' as const,
      };

      const res = await unsubscribeTicker(ws, params, {
        reqId: 2,
        timeoutMs: 777,
        attachAuthToken: true,
      });

      expect(ws.request).toHaveBeenCalledTimes(1);
      expect(ws.request).toHaveBeenCalledWith(
        'unsubscribe',
        {
          channel: 'ticker',
          ...params,
        },
        {
          reqId: 2,
          timeoutMs: 777,
          attachAuthToken: true,
        },
      );
      expect(res).toBe(mocked);
    });

    it('keeps explicit attachAuthToken: false', async () => {
      const mocked: KrakenWsTickerUnsubscribeResponse = {
        method: 'unsubscribe',
        success: true,
        result: {
          channel: 'ticker',
          symbol: ['BTC/USD'],
        },
      } as KrakenWsTickerUnsubscribeResponse;

      const ws = {
        request: vi.fn().mockResolvedValue(mocked),
      } as unknown as KrakenWebsocketBase;

      await unsubscribeTicker(
        ws,
        { symbol: ['BTC/USD'] },
        { attachAuthToken: false },
      );

      expect(ws.request).toHaveBeenCalledTimes(1);
      expect(ws.request).toHaveBeenCalledWith(
        'unsubscribe',
        {
          channel: 'ticker',
          symbol: ['BTC/USD'],
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
