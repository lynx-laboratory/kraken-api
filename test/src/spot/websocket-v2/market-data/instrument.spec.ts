import { describe, it, expect, vi } from 'vitest';
import type { KrakenWebsocketBase } from '../../../../../src/base/websocketBase';
import {
  subscribeInstrument,
  unsubscribeInstrument,
  type KrakenWsInstrumentSubscribeResponse,
  type KrakenWsInstrumentUnsubscribeResponse,
} from '../../../../../src/spot/websocket-v2/market-data/instrument';

describe('spot/websocket-v2/market-data/instrument', () => {
  describe('subscribeInstrument', () => {
    it('calls ws.request("subscribe", body, options) with attachAuthToken defaulting to false', async () => {
      const mocked: KrakenWsInstrumentSubscribeResponse = {
        method: 'subscribe',
        success: true,
        result: {
          channel: 'instrument',
          snapshot: true,
        },
      } as KrakenWsInstrumentSubscribeResponse;

      const ws = {
        request: vi.fn().mockResolvedValue(mocked),
      } as unknown as KrakenWebsocketBase;

      const params = {
        snapshot: true,
      };

      const res = await subscribeInstrument(ws, params);

      expect(ws.request).toHaveBeenCalledTimes(1);
      expect(ws.request).toHaveBeenCalledWith(
        'subscribe',
        {
          channel: 'instrument',
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

    it('passes through provided params and options', async () => {
      const mocked: KrakenWsInstrumentSubscribeResponse = {
        method: 'subscribe',
        success: true,
        result: {
          channel: 'instrument',
          include_tokenized_assets: true,
          snapshot: false,
        },
        req_id: 2001,
      } as KrakenWsInstrumentSubscribeResponse;

      const ws = {
        request: vi.fn().mockResolvedValue(mocked),
      } as unknown as KrakenWebsocketBase;

      const params = {
        include_tokenized_assets: true,
        snapshot: false,
      };

      const res = await subscribeInstrument(ws, params, {
        reqId: 2001,
        timeoutMs: 1234,
        attachAuthToken: true,
      });

      expect(ws.request).toHaveBeenCalledTimes(1);
      expect(ws.request).toHaveBeenCalledWith(
        'subscribe',
        {
          channel: 'instrument',
          ...params,
        },
        {
          reqId: 2001,
          timeoutMs: 1234,
          attachAuthToken: true,
        },
      );
      expect(res).toBe(mocked);
    });

    it('keeps explicit attachAuthToken: false', async () => {
      const mocked: KrakenWsInstrumentSubscribeResponse = {
        method: 'subscribe',
        success: true,
        result: { channel: 'instrument' },
      } as KrakenWsInstrumentSubscribeResponse;

      const ws = {
        request: vi.fn().mockResolvedValue(mocked),
      } as unknown as KrakenWebsocketBase;

      await subscribeInstrument(ws, {}, { attachAuthToken: false });

      expect(ws.request).toHaveBeenCalledTimes(1);
      expect(ws.request).toHaveBeenCalledWith(
        'subscribe',
        {
          channel: 'instrument',
        },
        {
          reqId: undefined,
          timeoutMs: undefined,
          attachAuthToken: false,
        },
      );
    });
  });

  describe('unsubscribeInstrument', () => {
    it('calls ws.request("unsubscribe", body, options) with attachAuthToken defaulting to false', async () => {
      const mocked: KrakenWsInstrumentUnsubscribeResponse = {
        method: 'unsubscribe',
        success: true,
        result: {
          channel: 'instrument',
        },
      } as KrakenWsInstrumentUnsubscribeResponse;

      const ws = {
        request: vi.fn().mockResolvedValue(mocked),
      } as unknown as KrakenWebsocketBase;

      const res = await unsubscribeInstrument(ws);

      expect(ws.request).toHaveBeenCalledTimes(1);
      expect(ws.request).toHaveBeenCalledWith(
        'unsubscribe',
        {
          channel: 'instrument',
        },
        {
          reqId: undefined,
          timeoutMs: undefined,
          attachAuthToken: false,
        },
      );
      expect(res).toBe(mocked);
    });

    it('passes through provided params and options', async () => {
      const mocked: KrakenWsInstrumentUnsubscribeResponse = {
        method: 'unsubscribe',
        success: true,
        result: {
          channel: 'instrument',
        },
        req_id: 2002,
      } as KrakenWsInstrumentUnsubscribeResponse;

      const ws = {
        request: vi.fn().mockResolvedValue(mocked),
      } as unknown as KrakenWebsocketBase;

      const res = await unsubscribeInstrument(
        ws,
        {},
        {
          reqId: 2002,
          timeoutMs: 777,
          attachAuthToken: true,
        },
      );

      expect(ws.request).toHaveBeenCalledTimes(1);
      expect(ws.request).toHaveBeenCalledWith(
        'unsubscribe',
        {
          channel: 'instrument',
        },
        {
          reqId: 2002,
          timeoutMs: 777,
          attachAuthToken: true,
        },
      );
      expect(res).toBe(mocked);
    });

    it('keeps explicit attachAuthToken: false', async () => {
      const mocked: KrakenWsInstrumentUnsubscribeResponse = {
        method: 'unsubscribe',
        success: true,
        result: { channel: 'instrument' },
      } as KrakenWsInstrumentUnsubscribeResponse;

      const ws = {
        request: vi.fn().mockResolvedValue(mocked),
      } as unknown as KrakenWebsocketBase;

      await unsubscribeInstrument(ws, {}, { attachAuthToken: false });

      expect(ws.request).toHaveBeenCalledTimes(1);
      expect(ws.request).toHaveBeenCalledWith(
        'unsubscribe',
        {
          channel: 'instrument',
        },
        {
          reqId: undefined,
          timeoutMs: undefined,
          attachAuthToken: false,
        },
      );
    });

    it('passes through extra params for future extensibility', async () => {
      const mocked: KrakenWsInstrumentUnsubscribeResponse = {
        method: 'unsubscribe',
        success: true,
        result: { channel: 'instrument' },
      } as KrakenWsInstrumentUnsubscribeResponse;

      const ws = {
        request: vi.fn().mockResolvedValue(mocked),
      } as unknown as KrakenWebsocketBase;

      const params = { foo: 'bar' } as const;

      await unsubscribeInstrument(ws, params);

      expect(ws.request).toHaveBeenCalledTimes(1);
      expect(ws.request).toHaveBeenCalledWith(
        'unsubscribe',
        {
          channel: 'instrument',
          ...params,
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
