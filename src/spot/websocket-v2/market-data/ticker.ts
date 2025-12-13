import {
  KrakenWebsocketBase,
  KrakenWsMethodResponseEnvelope,
} from '../../../base/websocketBase';

/**
 * Event trigger for the ticker channel.
 *
 * - "bbo"    → update on best-bid-offer changes
 * - "trades" → update on every trade (default)
 */
export type KrakenWsTickerEventTrigger = 'bbo' | 'trades';

/**
 * Ticker payload (top of book + 24h stats).
 *
 * The ticker element is always the first (and only) item in the `data` array.
 */
export interface KrakenWsTickerData {
  /** Best ask price. */
  ask: number;

  /** Best ask quantity. */
  ask_qty: number;

  /** Best bid price. */
  bid: number;

  /** Best bid quantity. */
  bid_qty: number;

  /** 24-hour price change (in quote currency). */
  change: number;

  /** 24-hour price change (percentage points). */
  change_pct: number;

  /** 24-hour highest trade price. */
  high: number;

  /** Last traded price (only guaranteed if traded within past 24h). */
  last: number;

  /** 24-hour lowest trade price. */
  low: number;

  /** The symbol of the currency pair (e.g. "BTC/USD"). */
  symbol: string;

  /** 24-hour traded volume (in base currency). */
  volume: number;

  /** 24-hour volume weighted average price. */
  vwap: number;
}

/**
 * Snapshot message for the `ticker` channel.
 *
 * `data` will always contain exactly one ticker entry.
 */
export interface KrakenWsTickerSnapshotMessage {
  channel: 'ticker';
  type: 'snapshot';
  data: KrakenWsTickerData[];
  /**
   * Subscription message sequence number.
   */
  sequence: number;
}

/**
 * Update message for the `ticker` channel.
 *
 * `data` will always contain exactly one ticker entry.
 */
export interface KrakenWsTickerUpdateMessage {
  channel: 'ticker';
  type: 'update';
  data: KrakenWsTickerData[];
  /**
   * Subscription message sequence number.
   */
  sequence: number;
}

/**
 * Union of possible ticker messages.
 */
export type KrakenWsTickerMessage =
  | KrakenWsTickerSnapshotMessage
  | KrakenWsTickerUpdateMessage;

/**
 * Parameters for subscribing to the `ticker` channel.
 *
 * NOTE:
 * - `channel` is automatically set to "ticker" by the helper.
 */
export interface KrakenWsTickerSubscribeParams {
  /**
   * A list of currency pairs, e.g. ["BTC/USD", "MATIC/GBP"].
   */
  symbol: ReadonlyArray<string>;

  /**
   * The book event that triggers updates.
   * - "bbo"    → on best-bid-offer change.
   * - "trades" → on trade event (default).
   */
  event_trigger?: KrakenWsTickerEventTrigger;

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
 * Options for subscribeTicker wrapper – mapped to KrakenWebsocketBase.request.
 */
export interface KrakenWsTickerSubscribeOptions {
  reqId?: number;
  timeoutMs?: number;
  /**
   * For public channels this should generally be false (default).
   */
  attachAuthToken?: boolean;
}

/**
 * Result payload inside the subscribe ack envelope for ticker.
 */
export interface KrakenWsTickerSubscribeResult {
  channel: 'ticker';
  /**
   * List of subscribed symbols.
   */
  symbol: ReadonlyArray<string>;
  /**
   * Event trigger used for updates.
   */
  event_trigger?: KrakenWsTickerEventTrigger;
  [key: string]: unknown;
}

/**
 * Full WS envelope returned from subscribe (ack) for ticker.
 */
export type KrakenWsTickerSubscribeResponse =
  KrakenWsMethodResponseEnvelope<KrakenWsTickerSubscribeResult>;

/**
 * Subscribe to the `ticker` channel.
 *
 * Streams:
 * - a **snapshot** (if `snapshot: true`, default), then
 * - **update** messages on trade events or BBO changes (depending on `event_trigger`).
 *
 * @example
 * ```ts
 * // 1) Subscribe to BTC/USD and ETH/USD ticker
 * const ack = await wsClient.marketData.subscribeTicker(
 *   {
 *     symbol: ["BTC/USD", "ETH/USD"],
 *     event_trigger: "trades",
 *   },
 *   { reqId: 1 },
 * );
 *
 * if (!ack.success) {
 *   console.error("ticker subscribe error:", ack.error);
 * }
 *
 * // 2) Handle stream messages
 * ws.onMessage((raw) => {
 *   const msg = JSON.parse(raw);
 *
 *   if (msg.channel === "ticker" && (msg.type === "snapshot" || msg.type === "update")) {
 *     const tmsg = msg as KrakenWsTickerMessage;
 *     const ticker = tmsg.data[0]; // always a single element
 *
 *     console.log(
 *       "[ticker]",
 *       ticker.symbol,
 *       "bid:",
 *       ticker.bid,
 *       "ask:",
 *       ticker.ask,
 *       "last:",
 *       ticker.last,
 *     );
 *   }
 * });
 * ```
 */
export async function subscribeTicker(
  ws: KrakenWebsocketBase,
  params: KrakenWsTickerSubscribeParams,
  options: KrakenWsTickerSubscribeOptions = {},
): Promise<KrakenWsTickerSubscribeResponse> {
  const body = {
    channel: 'ticker' as const,
    ...params,
  };

  return ws.request<typeof body, KrakenWsTickerSubscribeResult>(
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
 * Parameters for unsubscribing from the `ticker` channel.
 *
 * NOTE:
 * - Must match the symbols (and optionally event_trigger) you want to remove.
 */
export interface KrakenWsTickerUnsubscribeParams {
  /**
   * A list of currency pairs to unsubscribe.
   */
  symbol: ReadonlyArray<string>;

  /**
   * The book event that triggers updates.
   * Must match the subscription combination.
   */
  event_trigger?: KrakenWsTickerEventTrigger;

  [key: string]: unknown;
}

/**
 * Options for unsubscribeTicker wrapper.
 */
export interface KrakenWsTickerUnsubscribeOptions {
  reqId?: number;
  timeoutMs?: number;
  attachAuthToken?: boolean;
}

/**
 * Result payload inside the unsubscribe ack envelope for ticker.
 */
export interface KrakenWsTickerUnsubscribeResult {
  channel: 'ticker';
  symbol: ReadonlyArray<string>;
  event_trigger?: KrakenWsTickerEventTrigger;
  [key: string]: unknown;
}

/**
 * Full WS envelope returned from unsubscribe (ack) for ticker.
 */
export type KrakenWsTickerUnsubscribeResponse =
  KrakenWsMethodResponseEnvelope<KrakenWsTickerUnsubscribeResult>;

/**
 * Unsubscribe from the `ticker` channel.
 *
 * @example
 * ```ts
 * const ack = await wsClient.marketData.unsubscribeTicker({
 *   symbol: ["BTC/USD", "ETH/USD"],
 * });
 *
 * if (!ack.success) {
 *   console.error("ticker unsubscribe error:", ack.error);
 * }
 * ```
 */
export async function unsubscribeTicker(
  ws: KrakenWebsocketBase,
  params: KrakenWsTickerUnsubscribeParams,
  options: KrakenWsTickerUnsubscribeOptions = {},
): Promise<KrakenWsTickerUnsubscribeResponse> {
  const body = {
    channel: 'ticker' as const,
    ...params,
  };

  return ws.request<typeof body, KrakenWsTickerUnsubscribeResult>(
    'unsubscribe',
    body,
    {
      reqId: options.reqId,
      timeoutMs: options.timeoutMs,
      attachAuthToken: options.attachAuthToken ?? false,
    },
  );
}
