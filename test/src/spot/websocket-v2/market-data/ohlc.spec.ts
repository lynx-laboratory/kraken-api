import { describe, it, expect, vi } from 'vitest';
import type { KrakenWebsocketBase } from '../../../../../src/base/websocketBase';
import {
  subscribeOhlc,
  unsubscribeOhlc,
  type KrakenWsOhlcSubscribeResponse,
  type KrakenWsOhlcUnsubscribeResponse,
} from '../../../../../src/spot/websocket-v2/market-data/ohlc';

describe('spot/websocket-v2/market-data/ohlc', () => {
  describe('subscribeOhlc', () => {
    it('calls ws.request("subscribe", body, options) with attachAuthToken defaulting to false', async () => {
      const mocked: KrakenWsOhlcSubscribeResponse = {
        method: 'subscribe',
        success: true,
        result: {
          channel: 'ohlc',
          symbol: ['BTC/USD', 'ETH/USD'],
          interval: 1,
        },
      } as KrakenWsOhlcSubscribeResponse;

      const ws = {
        request: vi.fn().mockResolvedValue(mocked),
      } as unknown as KrakenWebsocketBase;

      const params = {
        symbol: ['BTC/USD', 'ETH/USD'],
        interval: 1 as const,
        snapshot: true,
      };

      const res = await subscribeOhlc(ws, params);

      expect(ws.request).toHaveBeenCalledTimes(1);
      expect(ws.request).toHaveBeenCalledWith(
        'subscribe',
        {
          channel: 'ohlc',
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
      const mocked: KrakenWsOhlcSubscribeResponse = {
        method: 'subscribe',
        success: true,
        result: {
          channel: 'ohlc',
          symbol: ['BTC/USD'],
          interval: 5,
        },
        req_id: 10,
      } as KrakenWsOhlcSubscribeResponse;

      const ws = {
        request: vi.fn().mockResolvedValue(mocked),
      } as unknown as KrakenWebsocketBase;

      const params = {
        symbol: ['BTC/USD'],
        interval: 5 as const,
      };

      const res = await subscribeOhlc(ws, params, {
        reqId: 10,
        timeoutMs: 1234,
        attachAuthToken: true,
      });

      expect(ws.request).toHaveBeenCalledTimes(1);
      expect(ws.request).toHaveBeenCalledWith(
        'subscribe',
        {
          channel: 'ohlc',
          ...params,
        },
        {
          reqId: 10,
          timeoutMs: 1234,
          attachAuthToken: true,
        },
      );
      expect(res).toBe(mocked);
    });

    it('keeps explicit attachAuthToken: false', async () => {
      const mocked: KrakenWsOhlcSubscribeResponse = {
        method: 'subscribe',
        success: true,
        result: {
          channel: 'ohlc',
          symbol: ['BTC/USD'],
        },
      } as KrakenWsOhlcSubscribeResponse;

      const ws = {
        request: vi.fn().mockResolvedValue(mocked),
      } as unknown as KrakenWebsocketBase;

      await subscribeOhlc(
        ws,
        { symbol: ['BTC/USD'] },
        { attachAuthToken: false },
      );

      expect(ws.request).toHaveBeenCalledTimes(1);
      expect(ws.request).toHaveBeenCalledWith(
        'subscribe',
        {
          channel: 'ohlc',
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

  describe('unsubscribeOhlc', () => {
    it('calls ws.request("unsubscribe", body, options) with attachAuthToken defaulting to false', async () => {
      const mocked: KrakenWsOhlcUnsubscribeResponse = {
        method: 'unsubscribe',
        success: true,
        result: {
          channel: 'ohlc',
          symbol: ['BTC/USD', 'ETH/USD'],
          interval: 1,
        },
      } as KrakenWsOhlcUnsubscribeResponse;

      const ws = {
        request: vi.fn().mockResolvedValue(mocked),
      } as unknown as KrakenWebsocketBase;

      const params = {
        symbol: ['BTC/USD', 'ETH/USD'],
        interval: 1 as const,
      };

      const res = await unsubscribeOhlc(ws, params);

      expect(ws.request).toHaveBeenCalledTimes(1);
      expect(ws.request).toHaveBeenCalledWith(
        'unsubscribe',
        {
          channel: 'ohlc',
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
      const mocked: KrakenWsOhlcUnsubscribeResponse = {
        method: 'unsubscribe',
        success: true,
        result: {
          channel: 'ohlc',
          symbol: ['BTC/USD'],
          interval: 5,
        },
        req_id: 11,
      } as KrakenWsOhlcUnsubscribeResponse;

      const ws = {
        request: vi.fn().mockResolvedValue(mocked),
      } as unknown as KrakenWebsocketBase;

      const params = {
        symbol: ['BTC/USD'],
        interval: 5 as const,
      };

      const res = await unsubscribeOhlc(ws, params, {
        reqId: 11,
        timeoutMs: 777,
        attachAuthToken: true,
      });

      expect(ws.request).toHaveBeenCalledTimes(1);
      expect(ws.request).toHaveBeenCalledWith(
        'unsubscribe',
        {
          channel: 'ohlc',
          ...params,
        },
        {
          reqId: 11,
          timeoutMs: 777,
          attachAuthToken: true,
        },
      );
      expect(res).toBe(mocked);
    });

    it('keeps explicit attachAuthToken: false', async () => {
      const mocked: KrakenWsOhlcUnsubscribeResponse = {
        method: 'unsubscribe',
        success: true,
        result: {
          channel: 'ohlc',
          symbol: ['BTC/USD'],
        },
      } as KrakenWsOhlcUnsubscribeResponse;

      const ws = {
        request: vi.fn().mockResolvedValue(mocked),
      } as unknown as KrakenWebsocketBase;

      await unsubscribeOhlc(
        ws,
        { symbol: ['BTC/USD'] },
        { attachAuthToken: false },
      );

      expect(ws.request).toHaveBeenCalledTimes(1);
      expect(ws.request).toHaveBeenCalledWith(
        'unsubscribe',
        {
          channel: 'ohlc',
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
