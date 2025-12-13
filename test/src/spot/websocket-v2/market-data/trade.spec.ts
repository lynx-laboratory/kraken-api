import { describe, it, expect, vi } from 'vitest';
import type { KrakenWebsocketBase } from '../../../../../src/base/websocketBase';
import {
  subscribeTrade,
  unsubscribeTrade,
  type KrakenWsTradeSubscribeResponse,
  type KrakenWsTradeUnsubscribeResponse,
} from '../../../../../src/spot/websocket-v2/market-data/trade';

describe('spot/websocket-v2/market-data/trade', () => {
  describe('subscribeTrade', () => {
    it('calls ws.request("subscribe", body, options) with attachAuthToken defaulting to false', async () => {
      const mocked: KrakenWsTradeSubscribeResponse = {
        method: 'subscribe',
        success: true,
        result: {
          channel: 'trade',
          symbol: ['BTC/USD', 'ETH/USD'],
          snapshot: true,
        },
      } as KrakenWsTradeSubscribeResponse;

      const ws = {
        request: vi.fn().mockResolvedValue(mocked),
      } as unknown as KrakenWebsocketBase;

      const params = {
        symbol: ['BTC/USD', 'ETH/USD'] as const,
        snapshot: true,
      };

      const res = await subscribeTrade(ws, params);

      expect(ws.request).toHaveBeenCalledTimes(1);
      expect(ws.request).toHaveBeenCalledWith(
        'subscribe',
        {
          channel: 'trade',
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
      const mocked: KrakenWsTradeSubscribeResponse = {
        method: 'subscribe',
        success: true,
        result: {
          channel: 'trade',
          symbol: ['BTC/USD'],
          snapshot: false,
        },
        req_id: 1001,
      } as KrakenWsTradeSubscribeResponse;

      const ws = {
        request: vi.fn().mockResolvedValue(mocked),
      } as unknown as KrakenWebsocketBase;

      const params = {
        symbol: ['BTC/USD'] as const,
        snapshot: false,
      };

      const res = await subscribeTrade(ws, params, {
        reqId: 1001,
        timeoutMs: 1234,
        attachAuthToken: true,
      });

      expect(ws.request).toHaveBeenCalledTimes(1);
      expect(ws.request).toHaveBeenCalledWith(
        'subscribe',
        {
          channel: 'trade',
          ...params,
        },
        {
          reqId: 1001,
          timeoutMs: 1234,
          attachAuthToken: true,
        },
      );
      expect(res).toBe(mocked);
    });

    it('keeps explicit attachAuthToken: false', async () => {
      const mocked: KrakenWsTradeSubscribeResponse = {
        method: 'subscribe',
        success: true,
        result: {
          channel: 'trade',
          symbol: ['BTC/USD'],
        },
      } as KrakenWsTradeSubscribeResponse;

      const ws = {
        request: vi.fn().mockResolvedValue(mocked),
      } as unknown as KrakenWebsocketBase;

      await subscribeTrade(
        ws,
        { symbol: ['BTC/USD'] },
        { attachAuthToken: false },
      );

      expect(ws.request).toHaveBeenCalledTimes(1);
      expect(ws.request).toHaveBeenCalledWith(
        'subscribe',
        {
          channel: 'trade',
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

  describe('unsubscribeTrade', () => {
    it('calls ws.request("unsubscribe", body, options) with attachAuthToken defaulting to false', async () => {
      const mocked: KrakenWsTradeUnsubscribeResponse = {
        method: 'unsubscribe',
        success: true,
        result: {
          channel: 'trade',
          symbol: ['BTC/USD', 'ETH/USD'],
        },
      } as KrakenWsTradeUnsubscribeResponse;

      const ws = {
        request: vi.fn().mockResolvedValue(mocked),
      } as unknown as KrakenWebsocketBase;

      const params = {
        symbol: ['BTC/USD', 'ETH/USD'] as const,
      };

      const res = await unsubscribeTrade(ws, params);

      expect(ws.request).toHaveBeenCalledTimes(1);
      expect(ws.request).toHaveBeenCalledWith(
        'unsubscribe',
        {
          channel: 'trade',
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
      const mocked: KrakenWsTradeUnsubscribeResponse = {
        method: 'unsubscribe',
        success: true,
        result: {
          channel: 'trade',
          symbol: ['BTC/USD'],
        },
        req_id: 1002,
      } as KrakenWsTradeUnsubscribeResponse;

      const ws = {
        request: vi.fn().mockResolvedValue(mocked),
      } as unknown as KrakenWebsocketBase;

      const params = {
        symbol: ['BTC/USD'] as const,
      };

      const res = await unsubscribeTrade(ws, params, {
        reqId: 1002,
        timeoutMs: 777,
        attachAuthToken: true,
      });

      expect(ws.request).toHaveBeenCalledTimes(1);
      expect(ws.request).toHaveBeenCalledWith(
        'unsubscribe',
        {
          channel: 'trade',
          ...params,
        },
        {
          reqId: 1002,
          timeoutMs: 777,
          attachAuthToken: true,
        },
      );
      expect(res).toBe(mocked);
    });

    it('keeps explicit attachAuthToken: false', async () => {
      const mocked: KrakenWsTradeUnsubscribeResponse = {
        method: 'unsubscribe',
        success: true,
        result: {
          channel: 'trade',
          symbol: ['BTC/USD'],
        },
      } as KrakenWsTradeUnsubscribeResponse;

      const ws = {
        request: vi.fn().mockResolvedValue(mocked),
      } as unknown as KrakenWebsocketBase;

      await unsubscribeTrade(
        ws,
        { symbol: ['BTC/USD'] },
        { attachAuthToken: false },
      );

      expect(ws.request).toHaveBeenCalledTimes(1);
      expect(ws.request).toHaveBeenCalledWith(
        'unsubscribe',
        {
          channel: 'trade',
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
