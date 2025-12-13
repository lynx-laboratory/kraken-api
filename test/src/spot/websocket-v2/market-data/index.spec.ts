import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { KrakenWebsocketBase } from '../../../../../src/base/websocketBase';

// Mock each module that market-data/index.ts imports.
vi.mock('../../../../../src/spot/websocket-v2/market-data/ticker', () => ({
  subscribeTicker: vi.fn(),
  unsubscribeTicker: vi.fn(),
}));

vi.mock('../../../../../src/spot/websocket-v2/market-data/book', () => ({
  subscribeBook: vi.fn(),
  unsubscribeBook: vi.fn(),
}));

vi.mock('../../../../../src/spot/websocket-v2/market-data/level3', () => ({
  subscribeLevel3: vi.fn(),
  unsubscribeLevel3: vi.fn(),
}));

vi.mock('../../../../../src/spot/websocket-v2/market-data/ohlc', () => ({
  subscribeOhlc: vi.fn(),
  unsubscribeOhlc: vi.fn(),
}));

vi.mock('../../../../../src/spot/websocket-v2/market-data/trade', () => ({
  subscribeTrade: vi.fn(),
  unsubscribeTrade: vi.fn(),
}));

vi.mock('../../../../../src/spot/websocket-v2/market-data/instrument', () => ({
  subscribeInstrument: vi.fn(),
  unsubscribeInstrument: vi.fn(),
}));

describe('spot/websocket-v2/market-data/index', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('subscribeTicker delegates to Ticker.subscribeTicker(ws, params, options)', async () => {
    const ws = {} as KrakenWebsocketBase;

    const Ticker =
      await import('../../../../../src/spot/websocket-v2/market-data/ticker');
    const { KrakenSpotWsMarketDataApi } =
      await import('../../../../../src/spot/websocket-v2/market-data');

    const mocked = { method: 'subscribe', success: true };
    (Ticker.subscribeTicker as any).mockResolvedValue(mocked);

    const api = new KrakenSpotWsMarketDataApi(ws);

    const params = { symbol: ['BTC/USD'] };
    const options = { reqId: 1 };

    const res = await api.subscribeTicker(params as any, options as any);

    expect(Ticker.subscribeTicker).toHaveBeenCalledTimes(1);
    expect(Ticker.subscribeTicker).toHaveBeenCalledWith(ws, params, options);
    expect(res).toBe(mocked);
  });

  it('unsubscribeTicker delegates to Ticker.unsubscribeTicker(ws, params, options)', async () => {
    const ws = {} as KrakenWebsocketBase;

    const Ticker =
      await import('../../../../../src/spot/websocket-v2/market-data/ticker');
    const { KrakenSpotWsMarketDataApi } =
      await import('../../../../../src/spot/websocket-v2/market-data');

    const mocked = { method: 'unsubscribe', success: true };
    (Ticker.unsubscribeTicker as any).mockResolvedValue(mocked);

    const api = new KrakenSpotWsMarketDataApi(ws);

    const params = { symbol: ['BTC/USD'] };
    const options = { reqId: 2 };

    const res = await api.unsubscribeTicker(params as any, options as any);

    expect(Ticker.unsubscribeTicker).toHaveBeenCalledTimes(1);
    expect(Ticker.unsubscribeTicker).toHaveBeenCalledWith(ws, params, options);
    expect(res).toBe(mocked);
  });

  it('subscribeBook delegates to Book.subscribeBook(ws, params, options)', async () => {
    const ws = {} as KrakenWebsocketBase;

    const Book =
      await import('../../../../../src/spot/websocket-v2/market-data/book');
    const { KrakenSpotWsMarketDataApi } =
      await import('../../../../../src/spot/websocket-v2/market-data');

    const mocked = { method: 'subscribe', success: true };
    (Book.subscribeBook as any).mockResolvedValue(mocked);

    const api = new KrakenSpotWsMarketDataApi(ws);

    const params = { symbol: ['BTC/USD'], depth: 10 };
    const options = { reqId: 1101 };

    const res = await api.subscribeBook(params as any, options as any);

    expect(Book.subscribeBook).toHaveBeenCalledTimes(1);
    expect(Book.subscribeBook).toHaveBeenCalledWith(ws, params, options);
    expect(res).toBe(mocked);
  });

  it('unsubscribeBook delegates to Book.unsubscribeBook(ws, params, options)', async () => {
    const ws = {} as KrakenWebsocketBase;

    const Book =
      await import('../../../../../src/spot/websocket-v2/market-data/book');
    const { KrakenSpotWsMarketDataApi } =
      await import('../../../../../src/spot/websocket-v2/market-data');

    const mocked = { method: 'unsubscribe', success: true };
    (Book.unsubscribeBook as any).mockResolvedValue(mocked);

    const api = new KrakenSpotWsMarketDataApi(ws);

    const params = { symbol: ['BTC/USD'], depth: 10 };
    const options = { reqId: 1102 };

    const res = await api.unsubscribeBook(params as any, options as any);

    expect(Book.unsubscribeBook).toHaveBeenCalledTimes(1);
    expect(Book.unsubscribeBook).toHaveBeenCalledWith(ws, params, options);
    expect(res).toBe(mocked);
  });

  it('subscribeLevel3 delegates to Level3.subscribeLevel3(ws, params, options)', async () => {
    const ws = {} as KrakenWebsocketBase;

    const Level3 =
      await import('../../../../../src/spot/websocket-v2/market-data/level3');
    const { KrakenSpotWsMarketDataApi } =
      await import('../../../../../src/spot/websocket-v2/market-data');

    const mocked = { method: 'subscribe', success: true };
    (Level3.subscribeLevel3 as any).mockResolvedValue(mocked);

    const api = new KrakenSpotWsMarketDataApi(ws);

    const params = { symbol: ['BTC/USD'], depth: 10, token: 'token' };
    const options = { reqId: 1201, attachAuthToken: true };

    const res = await api.subscribeLevel3(params as any, options as any);

    expect(Level3.subscribeLevel3).toHaveBeenCalledTimes(1);
    expect(Level3.subscribeLevel3).toHaveBeenCalledWith(ws, params, options);
    expect(res).toBe(mocked);
  });

  it('unsubscribeLevel3 delegates to Level3.unsubscribeLevel3(ws, params, options)', async () => {
    const ws = {} as KrakenWebsocketBase;

    const Level3 =
      await import('../../../../../src/spot/websocket-v2/market-data/level3');
    const { KrakenSpotWsMarketDataApi } =
      await import('../../../../../src/spot/websocket-v2/market-data');

    const mocked = { method: 'unsubscribe', success: true };
    (Level3.unsubscribeLevel3 as any).mockResolvedValue(mocked);

    const api = new KrakenSpotWsMarketDataApi(ws);

    const params = { symbol: ['BTC/USD'], depth: 10, token: 'token' };
    const options = { reqId: 1202, attachAuthToken: true };

    const res = await api.unsubscribeLevel3(params as any, options as any);

    expect(Level3.unsubscribeLevel3).toHaveBeenCalledTimes(1);
    expect(Level3.unsubscribeLevel3).toHaveBeenCalledWith(ws, params, options);
    expect(res).toBe(mocked);
  });

  it('subscribeOhlc delegates to Ohlc.subscribeOhlc(ws, params, options)', async () => {
    const ws = {} as KrakenWebsocketBase;

    const Ohlc =
      await import('../../../../../src/spot/websocket-v2/market-data/ohlc');
    const { KrakenSpotWsMarketDataApi } =
      await import('../../../../../src/spot/websocket-v2/market-data');

    const mocked = { method: 'subscribe', success: true };
    (Ohlc.subscribeOhlc as any).mockResolvedValue(mocked);

    const api = new KrakenSpotWsMarketDataApi(ws);

    const params = { symbol: ['BTC/USD'], interval: 1 };
    const options = { reqId: 1301 };

    const res = await api.subscribeOhlc(params as any, options as any);

    expect(Ohlc.subscribeOhlc).toHaveBeenCalledTimes(1);
    expect(Ohlc.subscribeOhlc).toHaveBeenCalledWith(ws, params, options);
    expect(res).toBe(mocked);
  });

  it('unsubscribeOhlc delegates to Ohlc.unsubscribeOhlc(ws, params, options)', async () => {
    const ws = {} as KrakenWebsocketBase;

    const Ohlc =
      await import('../../../../../src/spot/websocket-v2/market-data/ohlc');
    const { KrakenSpotWsMarketDataApi } =
      await import('../../../../../src/spot/websocket-v2/market-data');

    const mocked = { method: 'unsubscribe', success: true };
    (Ohlc.unsubscribeOhlc as any).mockResolvedValue(mocked);

    const api = new KrakenSpotWsMarketDataApi(ws);

    const params = { symbol: ['BTC/USD'], interval: 1 };
    const options = { reqId: 1302 };

    const res = await api.unsubscribeOhlc(params as any, options as any);

    expect(Ohlc.unsubscribeOhlc).toHaveBeenCalledTimes(1);
    expect(Ohlc.unsubscribeOhlc).toHaveBeenCalledWith(ws, params, options);
    expect(res).toBe(mocked);
  });

  it('subscribeTrade delegates to Trade.subscribeTrade(ws, params, options)', async () => {
    const ws = {} as KrakenWebsocketBase;

    const Trade =
      await import('../../../../../src/spot/websocket-v2/market-data/trade');
    const { KrakenSpotWsMarketDataApi } =
      await import('../../../../../src/spot/websocket-v2/market-data');

    const mocked = { method: 'subscribe', success: true };
    (Trade.subscribeTrade as any).mockResolvedValue(mocked);

    const api = new KrakenSpotWsMarketDataApi(ws);

    const params = { symbol: ['BTC/USD'], snapshot: true };
    const options = { reqId: 1401 };

    const res = await api.subscribeTrade(params as any, options as any);

    expect(Trade.subscribeTrade).toHaveBeenCalledTimes(1);
    expect(Trade.subscribeTrade).toHaveBeenCalledWith(ws, params, options);
    expect(res).toBe(mocked);
  });

  it('unsubscribeTrade delegates to Trade.unsubscribeTrade(ws, params, options)', async () => {
    const ws = {} as KrakenWebsocketBase;

    const Trade =
      await import('../../../../../src/spot/websocket-v2/market-data/trade');
    const { KrakenSpotWsMarketDataApi } =
      await import('../../../../../src/spot/websocket-v2/market-data');

    const mocked = { method: 'unsubscribe', success: true };
    (Trade.unsubscribeTrade as any).mockResolvedValue(mocked);

    const api = new KrakenSpotWsMarketDataApi(ws);

    const params = { symbol: ['BTC/USD'] };
    const options = { reqId: 1402 };

    const res = await api.unsubscribeTrade(params as any, options as any);

    expect(Trade.unsubscribeTrade).toHaveBeenCalledTimes(1);
    expect(Trade.unsubscribeTrade).toHaveBeenCalledWith(ws, params, options);
    expect(res).toBe(mocked);
  });

  it('subscribeInstrument delegates to Instrument.subscribeInstrument(ws, params, options) (default params allowed)', async () => {
    const ws = {} as KrakenWebsocketBase;

    const Instrument =
      await import('../../../../../src/spot/websocket-v2/market-data/instrument');
    const { KrakenSpotWsMarketDataApi } =
      await import('../../../../../src/spot/websocket-v2/market-data');

    const mocked = { method: 'subscribe', success: true };
    (Instrument.subscribeInstrument as any).mockResolvedValue(mocked);

    const api = new KrakenSpotWsMarketDataApi(ws);

    const params = { snapshot: true };
    const options = { reqId: 1501 };

    const res = await api.subscribeInstrument(params as any, options as any);

    expect(Instrument.subscribeInstrument).toHaveBeenCalledTimes(1);
    expect(Instrument.subscribeInstrument).toHaveBeenCalledWith(
      ws,
      params,
      options,
    );
    expect(res).toBe(mocked);
  });

  it('unsubscribeInstrument delegates to Instrument.unsubscribeInstrument(ws, params, options) (default params allowed)', async () => {
    const ws = {} as KrakenWebsocketBase;

    const Instrument =
      await import('../../../../../src/spot/websocket-v2/market-data/instrument');
    const { KrakenSpotWsMarketDataApi } =
      await import('../../../../../src/spot/websocket-v2/market-data');

    const mocked = { method: 'unsubscribe', success: true };
    (Instrument.unsubscribeInstrument as any).mockResolvedValue(mocked);

    const api = new KrakenSpotWsMarketDataApi(ws);

    const res = await api.unsubscribeInstrument({}, { reqId: 1502 } as any);

    expect(Instrument.unsubscribeInstrument).toHaveBeenCalledTimes(1);
    expect(Instrument.unsubscribeInstrument).toHaveBeenCalledWith(
      ws,
      {},
      { reqId: 1502 },
    );
    expect(res).toBe(mocked);
  });
});
