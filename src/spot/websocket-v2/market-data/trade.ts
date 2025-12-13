import {
  KrakenWebsocketBase,
  KrakenWsMethodResponseEnvelope,
} from '../../../base/websocketBase';

/**
 * Trade side for the taker order.
 */
export type KrakenWsTradeSide = 'buy' | 'sell';

/**
 * Taker order type for a trade event.
 */
export type KrakenWsTradeOrderType = 'limit' | 'market';

/**
 * Single trade event from the `trade` channel.
 *
 * Used in both snapshot and update messages.
 */
export interface KrakenWsTradeEntry {
  /**
   * Symbol of the currency pair, e.g. "BTC/USD".
   */
  symbol: string;

  /**
   * Side of the taker order ("buy" or "sell").
   */
  side: KrakenWsTradeSide;

  /**
   * Size of the trade (in base asset).
   */
  qty: number;

  /**
   * Average price of the trade.
   */
  price: number;

  /**
   * Order type of the taker order ("limit" or "market").
   */
  ord_type: KrakenWsTradeOrderType;

  /**
   * Trade identifier – sequence number, unique per book.
   */
  trade_id: number;

  /**
   * Book order update timestamp (RFC3339 with fractional seconds).
   */
  timestamp: string;
}

/**
 * Snapshot message for the `trade` channel.
 *
 * Snapshot reflects the most recent 50 trades.
 */
export interface KrakenWsTradeSnapshotMessage {
  channel: 'trade';
  type: 'snapshot';
  /**
   * List of trade events (most recent 50).
   */
  data: KrakenWsTradeEntry[];
  /**
   * Subscription message sequence number.
   */
  sequence: number;
}

/**
 * Update message for the `trade` channel.
 *
 * Multiple trades may be batched in a single message.
 */
export interface KrakenWsTradeUpdateMessage {
  channel: 'trade';
  type: 'update';
  /**
   * List of trade events.
   */
  data: KrakenWsTradeEntry[];
  /**
   * Subscription message sequence number.
   */
  sequence: number;
}

/**
 * Union of possible `trade` channel messages.
 */
export type KrakenWsTradeMessage =
  | KrakenWsTradeSnapshotMessage
  | KrakenWsTradeUpdateMessage;

/**
 * Parameters for subscribing to the `trade` channel.
 *
 * NOTE:
 * - `channel` is automatically set to "trade" by the helper.
 */
export interface KrakenWsTradeSubscribeParams {
  /**
   * A list of currency pairs, e.g. ["BTC/USD", "MATIC/GBP"].
   */
  symbol: ReadonlyArray<string>;

  /**
   * Whether to request an initial snapshot.
   * Default: false (Kraken default).
   */
  snapshot?: boolean;

  /**
   * Index signature so this type satisfies Record<string, unknown>.
   */
  [key: string]: unknown;
}

/**
 * Options for subscribeTrade wrapper – mapped to KrakenWebsocketBase.request.
 */
export interface KrakenWsTradeSubscribeOptions {
  reqId?: number;
  timeoutMs?: number;
  /**
   * Trades is a public channel; auth token is not required.
   */
  attachAuthToken?: boolean;
}

/**
 * Result payload inside the subscribe ack envelope for `trade`.
 */
export interface KrakenWsTradeSubscribeResult {
  channel: 'trade';
  symbol: ReadonlyArray<string>;
  snapshot?: boolean;
  [key: string]: unknown;
}

/**
 * Full WS envelope returned from subscribe (ack) for `trade`.
 */
export type KrakenWsTradeSubscribeResponse =
  KrakenWsMethodResponseEnvelope<KrakenWsTradeSubscribeResult>;

/**
 * Subscribe to the `trade` channel.
 *
 * Streams:
 * - an optional **snapshot** of the most recent 50 trades per symbol, then
 * - **update** messages for new trades as they occur.
 *
 * @example
 * ```ts
 * // 1) Subscribe to trades for BTC/USD and ETH/USD
 * const ack = await wsClient.marketData.subscribeTrade(
 *   {
 *     symbol: ["BTC/USD", "ETH/USD"],
 *     snapshot: true,
 *   },
 *   { reqId: 1001 },
 * );
 *
 * if (!ack.success) {
 *   console.error("trade subscribe error:", ack.error);
 * }
 *
 * // 2) Handle stream messages
 * ws.onMessage((raw) => {
 *   const msg = JSON.parse(raw);
 *
 *   if (msg.channel === "trade" && (msg.type === "snapshot" || msg.type === "update")) {
 *     const tmsg = msg as KrakenWsTradeMessage;
 *
 *     for (const trade of tmsg.data) {
 *       console.log(
 *         `[${tmsg.type}]`,
 *         trade.symbol,
 *         trade.side,
 *         "qty:",
 *         trade.qty,
 *         "price:",
 *         trade.price,
 *         "ord_type:",
 *         trade.ord_type,
 *         "trade_id:",
 *         trade.trade_id,
 *         "ts:",
 *         trade.timestamp,
 *       );
 *     }
 *   }
 * });
 * ```
 */
export async function subscribeTrade(
  ws: KrakenWebsocketBase,
  params: KrakenWsTradeSubscribeParams,
  options: KrakenWsTradeSubscribeOptions = {},
): Promise<KrakenWsTradeSubscribeResponse> {
  const body = {
    channel: 'trade' as const,
    ...params,
  };

  return ws.request<typeof body, KrakenWsTradeSubscribeResult>(
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
 * Parameters for unsubscribing from the `trade` channel.
 *
 * NOTE:
 * - Must match the symbols you want to remove.
 */
export interface KrakenWsTradeUnsubscribeParams {
  /**
   * A list of currency pairs to unsubscribe.
   */
  symbol: ReadonlyArray<string>;

  [key: string]: unknown;
}

/**
 * Options for unsubscribeTrade wrapper.
 */
export interface KrakenWsTradeUnsubscribeOptions {
  reqId?: number;
  timeoutMs?: number;
  attachAuthToken?: boolean;
}

/**
 * Result payload inside the unsubscribe ack envelope for `trade`.
 */
export interface KrakenWsTradeUnsubscribeResult {
  channel: 'trade';
  symbol: ReadonlyArray<string>;
  [key: string]: unknown;
}

/**
 * Full WS envelope returned from unsubscribe (ack) for `trade`.
 */
export type KrakenWsTradeUnsubscribeResponse =
  KrakenWsMethodResponseEnvelope<KrakenWsTradeUnsubscribeResult>;

/**
 * Unsubscribe from the `trade` channel.
 *
 * @example
 * ```ts
 * const ack = await wsClient.marketData.unsubscribeTrade(
 *   {
 *     symbol: ["BTC/USD", "ETH/USD"],
 *   },
 *   { reqId: 1002 },
 * );
 *
 * if (!ack.success) {
 *   console.error("trade unsubscribe error:", ack.error);
 * }
 * ```
 */
export async function unsubscribeTrade(
  ws: KrakenWebsocketBase,
  params: KrakenWsTradeUnsubscribeParams,
  options: KrakenWsTradeUnsubscribeOptions = {},
): Promise<KrakenWsTradeUnsubscribeResponse> {
  const body = {
    channel: 'trade' as const,
    ...params,
  };

  return ws.request<typeof body, KrakenWsTradeUnsubscribeResult>(
    'unsubscribe',
    body,
    {
      reqId: options.reqId,
      timeoutMs: options.timeoutMs,
      attachAuthToken: options.attachAuthToken ?? false,
    },
  );
}
