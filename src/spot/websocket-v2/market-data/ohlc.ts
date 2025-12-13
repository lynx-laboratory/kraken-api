import {
  KrakenWebsocketBase,
  KrakenWsMethodResponseEnvelope,
} from '../../../base/websocketBase';

/**
 * Allowed OHLC intervals in minutes.
 */
export type KrakenWsOhlcInterval =
  | 1
  | 5
  | 15
  | 30
  | 60
  | 240
  | 1440
  | 10080
  | 21600;

/**
 * Single OHLC candle entry.
 *
 * Used in both snapshot and update messages.
 */
export interface KrakenWsOhlcCandle {
  /** Symbol of the currency pair, e.g. "BTC/USD". */
  symbol: string;

  /** Opening trade price within the interval. */
  open: number;

  /** Highest trade price within the interval. */
  high: number;

  /** Lowest trade price within the interval. */
  low: number;

  /** Last trade price within the interval. */
  close: number;

  /** Volume-weighted average trade price within the interval. */
  vwap: number;

  /** Number of trades within the interval. */
  trades: number;

  /** Total traded volume (base asset) within the interval. */
  volume: number;

  /**
   * Timestamp of the start of the interval (RFC3339 with fractional seconds).
   */
  interval_begin: string;

  /**
   * Interval timeframe in minutes.
   */
  interval: KrakenWsOhlcInterval;

  /**
   * DEPRECATED: Use `interval_begin`.
   *
   * Timestamp of start of the interval.
   */
  timestamp?: string;
}

/**
 * Snapshot message for the `ohlc` channel.
 */
export interface KrakenWsOhlcSnapshotMessage {
  channel: 'ohlc';
  type: 'snapshot';
  /**
   * List of candle events.
   */
  data: KrakenWsOhlcCandle[];
  /**
   * Subscription message sequence number.
   */
  sequence: number;
}

/**
 * Update message for the `ohlc` channel.
 */
export interface KrakenWsOhlcUpdateMessage {
  channel: 'ohlc';
  type: 'update';
  /**
   * List of candle events.
   */
  data: KrakenWsOhlcCandle[];
  /**
   * Subscription message sequence number.
   */
  sequence: number;
}

/**
 * Union of possible OHLC messages.
 */
export type KrakenWsOhlcMessage =
  | KrakenWsOhlcSnapshotMessage
  | KrakenWsOhlcUpdateMessage;

/**
 * Parameters for subscribing to the `ohlc` channel.
 *
 * NOTE:
 * - `channel` is automatically set to "ohlc" by the helper.
 */
export interface KrakenWsOhlcSubscribeParams {
  /**
   * A list of currency pairs, e.g. ["BTC/USD", "MATIC/GBP"].
   */
  symbol: ReadonlyArray<string>;

  /**
   * Interval timeframe in minutes.
   *
   * If omitted, Kraken will use its default (docs list valid values only).
   */
  interval?: KrakenWsOhlcInterval;

  /**
   * Whether to request an initial snapshot.
   * Default: true.
   */
  snapshot?: boolean;

  /**
   * Index signature so this type satisfies Record<string, unknown>.
   */
  [key: string]: unknown;
}

/**
 * Options for subscribeOhlc wrapper – mapped to KrakenWebsocketBase.request.
 */
export interface KrakenWsOhlcSubscribeOptions {
  reqId?: number;
  timeoutMs?: number;
  /**
   * OHLC is a public channel; auth token is not required.
   */
  attachAuthToken?: boolean;
}

/**
 * Result payload inside the subscribe ack envelope for ohlc.
 */
export interface KrakenWsOhlcSubscribeResult {
  channel: 'ohlc';
  symbol: ReadonlyArray<string>;
  interval?: KrakenWsOhlcInterval;
  [key: string]: unknown;
}

/**
 * Full WS envelope returned from subscribe (ack) for ohlc.
 */
export type KrakenWsOhlcSubscribeResponse =
  KrakenWsMethodResponseEnvelope<KrakenWsOhlcSubscribeResult>;

/**
 * Subscribe to the `ohlc` (candles) channel.
 *
 * Streams:
 * - a **snapshot** of recent candles for the requested pairs/interval, then
 * - **update** messages on trade events.
 *
 * @example
 * ```ts
 * // 1) Subscribe to 1-minute BTC/USD and 5-minute ETH/USD candles
 * const ack = await wsClient.marketData.subscribeOhlc(
 *   {
 *     symbol: ["BTC/USD", "ETH/USD"],
 *     interval: 1,
 *   },
 *   { reqId: 10 },
 * );
 *
 * if (!ack.success) {
 *   console.error("ohlc subscribe error:", ack.error);
 * }
 *
 * // 2) Handle stream messages
 * ws.onMessage((raw) => {
 *   const msg = JSON.parse(raw);
 *
 *   if (msg.channel === "ohlc" && (msg.type === "snapshot" || msg.type === "update")) {
 *     const cmsg = msg as KrakenWsOhlcMessage;
 *
 *     for (const candle of cmsg.data) {
 *       console.log(
 *         `[${cmsg.type}]`,
 *         candle.symbol,
 *         "interval:",
 *         candle.interval,
 *         "open:",
 *         candle.open,
 *         "high:",
 *         candle.high,
 *         "low:",
 *         candle.low,
 *         "close:",
 *         candle.close,
 *         "volume:",
 *         candle.volume,
 *         "begin:",
 *         candle.interval_begin,
 *       );
 *     }
 *   }
 * });
 * ```
 */
export async function subscribeOhlc(
  ws: KrakenWebsocketBase,
  params: KrakenWsOhlcSubscribeParams,
  options: KrakenWsOhlcSubscribeOptions = {},
): Promise<KrakenWsOhlcSubscribeResponse> {
  const body = {
    channel: 'ohlc' as const,
    ...params,
  };

  return ws.request<typeof body, KrakenWsOhlcSubscribeResult>(
    'subscribe',
    body,
    {
      reqId: options.reqId,
      timeoutMs: options.timeoutMs,
      attachAuthToken: options.attachAuthToken ?? false,
    },
  );
}

/**
 * Parameters for unsubscribing from the `ohlc` channel.
 *
 * NOTE:
 * - Must match the symbols (and interval, if used) you want to remove.
 */
export interface KrakenWsOhlcUnsubscribeParams {
  /**
   * A list of currency pairs to unsubscribe.
   */
  symbol: ReadonlyArray<string>;

  /**
   * Interval timeframe in minutes (must match the subscribed interval).
   */
  interval?: KrakenWsOhlcInterval;

  [key: string]: unknown;
}

/**
 * Options for unsubscribeOhlc wrapper.
 */
export interface KrakenWsOhlcUnsubscribeOptions {
  reqId?: number;
  timeoutMs?: number;
  attachAuthToken?: boolean;
}

/**
 * Result payload inside the unsubscribe ack envelope for ohlc.
 */
export interface KrakenWsOhlcUnsubscribeResult {
  channel: 'ohlc';
  symbol: ReadonlyArray<string>;
  interval?: KrakenWsOhlcInterval;
  [key: string]: unknown;
}

/**
 * Full WS envelope returned from unsubscribe (ack) for ohlc.
 */
export type KrakenWsOhlcUnsubscribeResponse =
  KrakenWsMethodResponseEnvelope<KrakenWsOhlcUnsubscribeResult>;

/**
 * Unsubscribe from the `ohlc` channel.
 *
 * @example
 * ```ts
 * const ack = await wsClient.marketData.unsubscribeOhlc(
 *   {
 *     symbol: ["BTC/USD", "ETH/USD"],
 *     interval: 1,
 *   },
 *   { reqId: 11 },
 * );
 *
 * if (!ack.success) {
 *   console.error("ohlc unsubscribe error:", ack.error);
 * }
 * ```
 */
export async function unsubscribeOhlc(
  ws: KrakenWebsocketBase,
  params: KrakenWsOhlcUnsubscribeParams,
  options: KrakenWsOhlcUnsubscribeOptions = {},
): Promise<KrakenWsOhlcUnsubscribeResponse> {
  const body = {
    channel: 'ohlc' as const,
    ...params,
  };

  return ws.request<typeof body, KrakenWsOhlcUnsubscribeResult>(
    'unsubscribe',
    body,
    {
      reqId: options.reqId,
      timeoutMs: options.timeoutMs,
      attachAuthToken: options.attachAuthToken ?? false,
    },
  );
}
