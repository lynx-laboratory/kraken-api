import type { KrakenWebsocketBase } from '../../../base/websocketBase';

import * as Ticker from './ticker';
import * as Book from './book';
import * as Level3 from './level3';
import * as Ohlc from './ohlc';
import * as Trade from './trade';
import * as Instrument from './instrument';

/**
 * Kraken Spot WebSocket v2 – Market Data API.
 *
 * Thin wrapper around public market data channels:
 *
 * - `ticker`   – Level 1 (top of book) ticker data
 * - `book`     – Level 2 order book
 * - `level3`   – Level 3 per-order book (authenticated, on ws-l3)
 * - `ohlc`     – Candles (OHLC)
 * - `trade`    – Public trade prints
 * - `instrument` – Reference data for assets and tradable pairs
 *
 * Each method here is a thin wrapper over the corresponding
 * `subscribeXxx` / `unsubscribeXxx` helper in this folder.
 */
export class KrakenSpotWsMarketDataApi {
  constructor(private readonly ws: KrakenWebsocketBase) {}

  // -------------------------
  // TICKER (LEVEL 1)
  // -------------------------

  /**
   * Subscribe to the **ticker** (Level 1) channel.
   *
   * Streams:
   * - a snapshot (optional) with current L1 data per symbol
   * - update messages on **trade** or **bbo** events (depending on `event_trigger`)
   *
   * @example
   * ```ts
   * const ack = await wsClient.marketData.subscribeTicker(
   *   {
   *     symbol: ["BTC/USD", "ETH/USD"],
   *     event_trigger: "trades",
   *     snapshot: true,
   *   },
   *   { reqId: 1001 },
   * );
   *
   * if (!ack.success) {
   *   console.error("ticker subscribe error:", ack.error);
   * }
   * ```
   */
  subscribeTicker(
    params: Ticker.KrakenWsTickerSubscribeParams,
    options: Ticker.KrakenWsTickerSubscribeOptions = {},
  ) {
    return Ticker.subscribeTicker(this.ws, params, options);
  }

  /**
   * Unsubscribe from the **ticker** channel.
   *
   * @example
   * ```ts
   * await wsClient.marketData.unsubscribeTicker(
   *   {
   *     symbol: ["BTC/USD", "ETH/USD"],
   *   },
   *   { reqId: 1002 },
   * );
   * ```
   */
  unsubscribeTicker(
    params: Ticker.KrakenWsTickerUnsubscribeParams,
    options: Ticker.KrakenWsTickerUnsubscribeOptions = {},
  ) {
    return Ticker.unsubscribeTicker(this.ws, params, options);
  }

  // -------------------------
  // BOOK (LEVEL 2)
  // -------------------------

  /**
   * Subscribe to the **book** (Level 2) channel.
   *
   * Streams:
   * - a snapshot with up to `depth` levels of bids / asks
   * - updates with changed levels + CRC32 checksum
   *
   * @example
   * ```ts
   * const ack = await wsClient.marketData.subscribeBook(
   *   {
   *     symbol: ["BTC/USD"],
   *     depth: 100,
   *     snapshot: true,
   *   },
   *   { reqId: 1101 },
   * );
   *
   * if (!ack.success) {
   *   console.error("book subscribe error:", ack.error);
   * }
   * ```
   */
  subscribeBook(
    params: Book.KrakenWsBookSubscribeParams,
    options: Book.KrakenWsBookSubscribeOptions = {},
  ) {
    return Book.subscribeBook(this.ws, params, options);
  }

  /**
   * Unsubscribe from the **book** (Level 2) channel.
   *
   * @example
   * ```ts
   * await wsClient.marketData.unsubscribeBook(
   *   {
   *     symbol: ["BTC/USD"],
   *     depth: 100,
   *   },
   *   { reqId: 1102 },
   * );
   * ```
   */
  unsubscribeBook(
    params: Book.KrakenWsBookUnsubscribeParams,
    options: Book.KrakenWsBookUnsubscribeOptions = {},
  ) {
    return Book.unsubscribeBook(this.ws, params, options);
  }

  // -------------------------
  // LEVEL 3 (ORDERS)
  // -------------------------

  /**
   * Subscribe to the **level3** (per-order) book channel.
   *
   * This is the most granular order book:
   * per-order resting in the visible book (no hidden size, no in-flight orders).
   *
   * Requires the **ws-l3.kraken.com/v2** endpoint and an auth token.
   *
   * @example
   * ```ts
   * const ack = await wsClient.marketData.subscribeLevel3(
   *   {
   *     symbol: ["BTC/USD"],
   *     depth: 10,
   *     snapshot: true,
   *   },
   *   {
   *     reqId: 1201,
   *     attachAuthToken: true,
   *   },
   * );
   *
   * if (!ack.success) {
   *   console.error("level3 subscribe error:", ack.error);
   * }
   * ```
   */
  subscribeLevel3(
    params: Level3.KrakenWsLevel3SubscribeParams,
    options: Level3.KrakenWsLevel3SubscribeOptions = {},
  ) {
    return Level3.subscribeLevel3(this.ws, params, options);
  }

  /**
   * Unsubscribe from the **level3** channel.
   *
   * @example
   * ```ts
   * await wsClient.marketData.unsubscribeLevel3(
   *   {
   *     symbol: ["BTC/USD"],
   *     depth: 10,
   *   },
   *   {
   *     reqId: 1202,
   *     attachAuthToken: true,
   *   },
   * );
   * ```
   */
  unsubscribeLevel3(
    params: Level3.KrakenWsLevel3UnsubscribeParams,
    options: Level3.KrakenWsLevel3UnsubscribeOptions = {},
  ) {
    return Level3.unsubscribeLevel3(this.ws, params, options);
  }

  // -------------------------
  // OHLC (CANDLES)
  // -------------------------

  /**
   * Subscribe to **ohlc** candles.
   *
   * Streams:
   * - a snapshot (optional) of existing candles
   * - update messages on trade events for the given interval.
   *
   * @example
   * ```ts
   * const ack = await wsClient.marketData.subscribeOhlc(
   *   {
   *     symbol: ["BTC/USD"],
   *     interval: 1,  // 1-minute candles
   *     snapshot: true,
   *   },
   *   { reqId: 1301 },
   * );
   * ```
   */
  subscribeOhlc(
    params: Ohlc.KrakenWsOhlcSubscribeParams,
    options: Ohlc.KrakenWsOhlcSubscribeOptions = {},
  ) {
    return Ohlc.subscribeOhlc(this.ws, params, options);
  }

  /**
   * Unsubscribe from **ohlc** candles.
   *
   * @example
   * ```ts
   * await wsClient.marketData.unsubscribeOhlc(
   *   {
   *     symbol: ["BTC/USD"],
   *     interval: 1,
   *   },
   *   { reqId: 1302 },
   * );
   * ```
   */
  unsubscribeOhlc(
    params: Ohlc.KrakenWsOhlcUnsubscribeParams,
    options: Ohlc.KrakenWsOhlcUnsubscribeOptions = {},
  ) {
    return Ohlc.unsubscribeOhlc(this.ws, params, options);
  }

  // -------------------------
  // TRADE PRINTS
  // -------------------------

  /**
   * Subscribe to public **trade** prints.
   *
   * Streams:
   * - an optional snapshot (most recent 50 trades)
   * - update messages on every new trade.
   *
   * @example
   * ```ts
   * const ack = await wsClient.marketData.subscribeTrade(
   *   {
   *     symbol: ["BTC/USD", "ETH/USD"],
   *     snapshot: true,
   *   },
   *   { reqId: 1401 },
   * );
   * ```
   */
  subscribeTrade(
    params: Trade.KrakenWsTradeSubscribeParams,
    options: Trade.KrakenWsTradeSubscribeOptions = {},
  ) {
    return Trade.subscribeTrade(this.ws, params, options);
  }

  /**
   * Unsubscribe from **trade** prints.
   *
   * @example
   * ```ts
   * await wsClient.marketData.unsubscribeTrade(
   *   {
   *     symbol: ["BTC/USD", "ETH/USD"],
   *   },
   *   { reqId: 1402 },
   * );
   * ```
   */
  unsubscribeTrade(
    params: Trade.KrakenWsTradeUnsubscribeParams,
    options: Trade.KrakenWsTradeUnsubscribeOptions = {},
  ) {
    return Trade.unsubscribeTrade(this.ws, params, options);
  }

  // -------------------------
  // INSTRUMENT METADATA
  // -------------------------

  /**
   * Subscribe to **instrument** reference data.
   *
   * Streams:
   * - a snapshot of all active assets and tradable pairs
   * - update messages as metadata changes.
   *
   * @example
   * ```ts
   * const ack = await wsClient.marketData.subscribeInstrument(
   *   {
   *     snapshot: true,
   *     include_tokenized_assets: false,
   *   },
   *   { reqId: 1501 },
   * );
   * ```
   */
  subscribeInstrument(
    params: Instrument.KrakenWsInstrumentSubscribeParams = {},
    options: Instrument.KrakenWsInstrumentSubscribeOptions = {},
  ) {
    return Instrument.subscribeInstrument(this.ws, params, options);
  }

  /**
   * Unsubscribe from the **instrument** channel.
   *
   * @example
   * ```ts
   * await wsClient.marketData.unsubscribeInstrument(
   *   {},
   *   { reqId: 1502 },
   * );
   * ```
   */
  unsubscribeInstrument(
    params: Instrument.KrakenWsInstrumentUnsubscribeParams = {},
    options: Instrument.KrakenWsInstrumentUnsubscribeOptions = {},
  ) {
    return Instrument.unsubscribeInstrument(this.ws, params, options);
  }
}

// ---------------------------------------------------------------------------
// Type re-exports for consumers
// ---------------------------------------------------------------------------

// Ticker
export type KrakenWsTickerData = Ticker.KrakenWsTickerData;
export type KrakenWsTickerSnapshotMessage =
  Ticker.KrakenWsTickerSnapshotMessage;
export type KrakenWsTickerUpdateMessage = Ticker.KrakenWsTickerUpdateMessage;
export type KrakenWsTickerMessage = Ticker.KrakenWsTickerMessage;
export type KrakenWsTickerSubscribeParams =
  Ticker.KrakenWsTickerSubscribeParams;
export type KrakenWsTickerSubscribeOptions =
  Ticker.KrakenWsTickerSubscribeOptions;
export type KrakenWsTickerSubscribeResponse =
  Ticker.KrakenWsTickerSubscribeResponse;
export type KrakenWsTickerUnsubscribeParams =
  Ticker.KrakenWsTickerUnsubscribeParams;
export type KrakenWsTickerUnsubscribeOptions =
  Ticker.KrakenWsTickerUnsubscribeOptions;
export type KrakenWsTickerUnsubscribeResponse =
  Ticker.KrakenWsTickerUnsubscribeResponse;

// Book (Level 2)
export type KrakenWsBookLevel = Book.KrakenWsBookLevel;
export type KrakenWsBookSnapshotMessage = Book.KrakenWsBookSnapshotMessage;
export type KrakenWsBookUpdateMessage = Book.KrakenWsBookUpdateMessage;
export type KrakenWsBookMessage = Book.KrakenWsBookMessage;
export type KrakenWsBookSubscribeParams = Book.KrakenWsBookSubscribeParams;
export type KrakenWsBookSubscribeOptions = Book.KrakenWsBookSubscribeOptions;
export type KrakenWsBookSubscribeResponse = Book.KrakenWsBookSubscribeResponse;
export type KrakenWsBookUnsubscribeParams = Book.KrakenWsBookUnsubscribeParams;
export type KrakenWsBookUnsubscribeOptions =
  Book.KrakenWsBookUnsubscribeOptions;
export type KrakenWsBookUnsubscribeResponse =
  Book.KrakenWsBookUnsubscribeResponse;

// Level 3
export type KrakenWsLevel3Depth = Level3.KrakenWsLevel3Depth;
export type KrakenWsLevel3OrderEventType = Level3.KrakenWsLevel3OrderEventType;
export type KrakenWsLevel3SnapshotMessage =
  Level3.KrakenWsLevel3SnapshotMessage;
export type KrakenWsLevel3UpdateMessage = Level3.KrakenWsLevel3UpdateMessage;
export type KrakenWsLevel3Message = Level3.KrakenWsLevel3Message;
export type KrakenWsLevel3SubscribeParams =
  Level3.KrakenWsLevel3SubscribeParams;
export type KrakenWsLevel3SubscribeOptions =
  Level3.KrakenWsLevel3SubscribeOptions;
export type KrakenWsLevel3SubscribeResponse =
  Level3.KrakenWsLevel3SubscribeResponse;
export type KrakenWsLevel3UnsubscribeParams =
  Level3.KrakenWsLevel3UnsubscribeParams;
export type KrakenWsLevel3UnsubscribeOptions =
  Level3.KrakenWsLevel3UnsubscribeOptions;
export type KrakenWsLevel3UnsubscribeResponse =
  Level3.KrakenWsLevel3UnsubscribeResponse;

// OHLC
export type KrakenWsOhlcSnapshotMessage = Ohlc.KrakenWsOhlcSnapshotMessage;
export type KrakenWsOhlcUpdateMessage = Ohlc.KrakenWsOhlcUpdateMessage;
export type KrakenWsOhlcMessage = Ohlc.KrakenWsOhlcMessage;
export type KrakenWsOhlcSubscribeParams = Ohlc.KrakenWsOhlcSubscribeParams;
export type KrakenWsOhlcSubscribeOptions = Ohlc.KrakenWsOhlcSubscribeOptions;
export type KrakenWsOhlcSubscribeResponse = Ohlc.KrakenWsOhlcSubscribeResponse;
export type KrakenWsOhlcUnsubscribeParams = Ohlc.KrakenWsOhlcUnsubscribeParams;
export type KrakenWsOhlcUnsubscribeOptions =
  Ohlc.KrakenWsOhlcUnsubscribeOptions;
export type KrakenWsOhlcUnsubscribeResponse =
  Ohlc.KrakenWsOhlcUnsubscribeResponse;

// Trade
export type KrakenWsTradeSide = Trade.KrakenWsTradeSide;
export type KrakenWsTradeOrderType = Trade.KrakenWsTradeOrderType;
export type KrakenWsTradeEntry = Trade.KrakenWsTradeEntry;
export type KrakenWsTradeSnapshotMessage = Trade.KrakenWsTradeSnapshotMessage;
export type KrakenWsTradeUpdateMessage = Trade.KrakenWsTradeUpdateMessage;
export type KrakenWsTradeMessage = Trade.KrakenWsTradeMessage;
export type KrakenWsTradeSubscribeParams = Trade.KrakenWsTradeSubscribeParams;
export type KrakenWsTradeSubscribeOptions = Trade.KrakenWsTradeSubscribeOptions;
export type KrakenWsTradeSubscribeResponse =
  Trade.KrakenWsTradeSubscribeResponse;
export type KrakenWsTradeUnsubscribeParams =
  Trade.KrakenWsTradeUnsubscribeParams;
export type KrakenWsTradeUnsubscribeOptions =
  Trade.KrakenWsTradeUnsubscribeOptions;
export type KrakenWsTradeUnsubscribeResponse =
  Trade.KrakenWsTradeUnsubscribeResponse;

// Instrument
export type KrakenWsInstrumentAssetStatus =
  Instrument.KrakenWsInstrumentAssetStatus;
export type KrakenWsInstrumentPairStatus =
  Instrument.KrakenWsInstrumentPairStatus;
export type KrakenWsInstrumentAsset = Instrument.KrakenWsInstrumentAsset;
export type KrakenWsInstrumentPair = Instrument.KrakenWsInstrumentPair;
export type KrakenWsInstrumentData = Instrument.KrakenWsInstrumentData;
export type KrakenWsInstrumentSnapshotMessage =
  Instrument.KrakenWsInstrumentSnapshotMessage;
export type KrakenWsInstrumentUpdateMessage =
  Instrument.KrakenWsInstrumentUpdateMessage;
export type KrakenWsInstrumentMessage = Instrument.KrakenWsInstrumentMessage;
export type KrakenWsInstrumentSubscribeParams =
  Instrument.KrakenWsInstrumentSubscribeParams;
export type KrakenWsInstrumentSubscribeOptions =
  Instrument.KrakenWsInstrumentSubscribeOptions;
export type KrakenWsInstrumentSubscribeResponse =
  Instrument.KrakenWsInstrumentSubscribeResponse;
export type KrakenWsInstrumentUnsubscribeParams =
  Instrument.KrakenWsInstrumentUnsubscribeParams;
export type KrakenWsInstrumentUnsubscribeOptions =
  Instrument.KrakenWsInstrumentUnsubscribeOptions;
export type KrakenWsInstrumentUnsubscribeResponse =
  Instrument.KrakenWsInstrumentUnsubscribeResponse;
