import { describe, it, expect, vi } from 'vitest';
import type { KrakenWebsocketBase } from '../../../../../src/base/websocketBase';
import {
  subscribeBook,
  unsubscribeBook,
  type KrakenWsBookSubscribeResponse,
  type KrakenWsBookUnsubscribeResponse,
} from '../../../../../src/spot/websocket-v2/market-data/book';

describe('spot/websocket-v2/market-data/book', () => {
  describe('subscribeBook', () => {
    it('calls ws.request("subscribe", body, options) with attachAuthToken defaulting to false', async () => {
      const mocked: KrakenWsBookSubscribeResponse = {
        method: 'subscribe',
        success: true,
        result: {
          channel: 'book',
          symbol: ['BTC/USD'],
          depth: 10,
        },
      } as KrakenWsBookSubscribeResponse;

      const ws = {
        request: vi.fn().mockResolvedValue(mocked),
      } as unknown as KrakenWebsocketBase;

      const params = {
        symbol: ['BTC/USD'],
        depth: 10,
        snapshot: true,
      } as const;

      const res = await subscribeBook(ws, params);

      expect(ws.request).toHaveBeenCalledTimes(1);
      expect(ws.request).toHaveBeenCalledWith(
        'subscribe',
        {
          channel: 'book',
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
      const mocked: KrakenWsBookSubscribeResponse = {
        method: 'subscribe',
        success: true,
        result: {
          channel: 'book',
          symbol: ['BTC/USD', 'ETH/USD'],
          depth: 25,
        },
        req_id: 2,
      } as KrakenWsBookSubscribeResponse;

      const ws = {
        request: vi.fn().mockResolvedValue(mocked),
      } as unknown as KrakenWebsocketBase;

      const params = {
        symbol: ['BTC/USD', 'ETH/USD'],
        depth: 25,
      } as const;

      const res = await subscribeBook(ws, params, {
        reqId: 2,
        timeoutMs: 1234,
        attachAuthToken: true,
      });

      expect(ws.request).toHaveBeenCalledTimes(1);
      expect(ws.request).toHaveBeenCalledWith(
        'subscribe',
        {
          channel: 'book',
          ...params,
        },
        {
          reqId: 2,
          timeoutMs: 1234,
          attachAuthToken: true,
        },
      );
      expect(res).toBe(mocked);
    });

    it('keeps explicit attachAuthToken: false (does not coerce to default)', async () => {
      const mocked: KrakenWsBookSubscribeResponse = {
        method: 'subscribe',
        success: true,
        result: {
          channel: 'book',
          symbol: ['BTC/USD'],
        },
      } as KrakenWsBookSubscribeResponse;

      const ws = {
        request: vi.fn().mockResolvedValue(mocked),
      } as unknown as KrakenWebsocketBase;

      await subscribeBook(
        ws,
        { symbol: ['BTC/USD'] },
        { attachAuthToken: false },
      );

      expect(ws.request).toHaveBeenCalledTimes(1);
      expect(ws.request).toHaveBeenCalledWith(
        'subscribe',
        {
          channel: 'book',
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

  describe('unsubscribeBook', () => {
    it('calls ws.request("unsubscribe", body, options) with attachAuthToken defaulting to false', async () => {
      const mocked: KrakenWsBookUnsubscribeResponse = {
        method: 'unsubscribe',
        success: true,
        result: {
          channel: 'book',
          symbol: ['BTC/USD'],
          depth: 10,
        },
      } as KrakenWsBookUnsubscribeResponse;

      const ws = {
        request: vi.fn().mockResolvedValue(mocked),
      } as unknown as KrakenWebsocketBase;

      const params = {
        symbol: ['BTC/USD'],
        depth: 10,
      } as const;

      const res = await unsubscribeBook(ws, params);

      expect(ws.request).toHaveBeenCalledTimes(1);
      expect(ws.request).toHaveBeenCalledWith(
        'unsubscribe',
        {
          channel: 'book',
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
      const mocked: KrakenWsBookUnsubscribeResponse = {
        method: 'unsubscribe',
        success: true,
        result: {
          channel: 'book',
          symbol: ['BTC/USD', 'ETH/USD'],
          depth: 25,
        },
        req_id: 9,
      } as KrakenWsBookUnsubscribeResponse;

      const ws = {
        request: vi.fn().mockResolvedValue(mocked),
      } as unknown as KrakenWebsocketBase;

      const params = {
        symbol: ['BTC/USD', 'ETH/USD'],
        depth: 25,
      } as const;

      const res = await unsubscribeBook(ws, params, {
        reqId: 9,
        timeoutMs: 777,
        attachAuthToken: true,
      });

      expect(ws.request).toHaveBeenCalledTimes(1);
      expect(ws.request).toHaveBeenCalledWith(
        'unsubscribe',
        {
          channel: 'book',
          ...params,
        },
        {
          reqId: 9,
          timeoutMs: 777,
          attachAuthToken: true,
        },
      );
      expect(res).toBe(mocked);
    });

    it('keeps explicit attachAuthToken: false', async () => {
      const mocked: KrakenWsBookUnsubscribeResponse = {
        method: 'unsubscribe',
        success: true,
        result: {
          channel: 'book',
          symbol: ['BTC/USD'],
        },
      } as KrakenWsBookUnsubscribeResponse;

      const ws = {
        request: vi.fn().mockResolvedValue(mocked),
      } as unknown as KrakenWebsocketBase;

      await unsubscribeBook(
        ws,
        { symbol: ['BTC/USD'] },
        { attachAuthToken: false },
      );

      expect(ws.request).toHaveBeenCalledTimes(1);
      expect(ws.request).toHaveBeenCalledWith(
        'unsubscribe',
        {
          channel: 'book',
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
