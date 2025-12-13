import {
  KrakenWebsocketBase,
  KrakenWsMethodResponseEnvelope,
} from '../../../base/websocketBase';

/**
 * Allowed depth values for the level3 channel.
 */
export type KrakenWsLevel3Depth = 10 | 100 | 1000;

/**
 * Event type for Level 3 order updates.
 *
 * - "add"    → new order resting in the book
 * - "modify" → quantity modified (typically due to a fill)
 * - "delete" → order removed (full fill or cancel)
 */
export type KrakenWsLevel3OrderEventType = 'add' | 'modify' | 'delete';

/**
 * Single Level 3 order snapshot entry.
 *
 * Used in the initial snapshot (no event field).
 */
export interface KrakenWsLevel3OrderSnapshotEntry {
  /** Kraken order identifier of the order in the book. */
  order_id: string;

  /** Limit price of the order. */
  limit_price: number;

  /** Remaining visible quantity. */
  order_qty: number;

  /** Time the order was inserted or amended (RFC3339). */
  timestamp: string;
}

/**
 * Single Level 3 order event entry (update).
 *
 * Used in the update stream (adds/modifies/deletes).
 */
export interface KrakenWsLevel3OrderEventEntry extends KrakenWsLevel3OrderSnapshotEntry {
  /** Type of order event. */
  event: KrakenWsLevel3OrderEventType;
}

/**
 * Core Level 3 snapshot payload.
 *
 * The book element is always the first and only item in the `data` array.
 */
export interface KrakenWsLevel3SnapshotData {
  /** Symbol of the currency pair, e.g. "BTC/USD". */
  symbol: string;

  /** List of resting bid orders in the book. */
  bids: KrakenWsLevel3OrderSnapshotEntry[];

  /** List of resting ask orders in the book. */
  asks: KrakenWsLevel3OrderSnapshotEntry[];

  /** CRC32 checksum for the top 10 price levels on both sides. */
  checksum: number;

  /** Time this market data message was generated (RFC3339). */
  timestamp: string;
}

/**
 * Core Level 3 update payload.
 *
 * The book element is always the first and only item in the `data` array.
 */
export interface KrakenWsLevel3UpdateData {
  /** Symbol of the currency pair, e.g. "BTC/USD". */
  symbol: string;

  /** Time this market data message was generated (RFC3339). */
  timestamp: string;

  /** CRC32 checksum for the top 10 price levels on both sides. */
  checksum: number;

  /**
   * Order events on bid side.
   *
   * Each entry describes an add/modify/delete event for an order.
   */
  bids: KrakenWsLevel3OrderEventEntry[];

  /**
   * Order events on ask side.
   *
   * Each entry describes an add/modify/delete event for an order.
   */
  asks: KrakenWsLevel3OrderEventEntry[];
}

/**
 * Snapshot message for the `level3` channel.
 */
export interface KrakenWsLevel3SnapshotMessage {
  channel: 'level3';
  type: 'snapshot';
  data: KrakenWsLevel3SnapshotData[];
  /**
   * Subscription message sequence number.
   */
  sequence: number;
}

/**
 * Update message for the `level3` channel.
 */
export interface KrakenWsLevel3UpdateMessage {
  channel: 'level3';
  type: 'update';
  data: KrakenWsLevel3UpdateData[];
  /**
   * Subscription message sequence number.
   */
  sequence: number;
}

/**
 * Union of possible Level 3 messages.
 */
export type KrakenWsLevel3Message =
  | KrakenWsLevel3SnapshotMessage
  | KrakenWsLevel3UpdateMessage;

/**
 * Parameters for subscribing to the `level3` channel.
 *
 * NOTE:
 * - `channel` is automatically set to "level3" by the helper.
 * - `token` is required (authenticated feed).
 */
export interface KrakenWsLevel3SubscribeParams {
  /**
   * A list of currency pairs, e.g. ["BTC/USD", "MATIC/GBP"].
   */
  symbol: ReadonlyArray<string>;

  /**
   * Number of price levels to receive.
   * Default: 10.
   */
  depth?: KrakenWsLevel3Depth;

  /**
   * Whether to request an initial snapshot.
   * Default: true.
   */
  snapshot?: boolean;

  /**
   * Auth session token from the REST API.
   */
  token: string;

  /**
   * Index signature so this type satisfies Record<string, unknown>.
   */
  [key: string]: unknown;
}

/**
 * Options for subscribeLevel3 wrapper – mapped to KrakenWebsocketBase.request.
 */
export interface KrakenWsLevel3SubscribeOptions {
  reqId?: number;
  timeoutMs?: number;
  /**
   * For authenticated channels, this should generally be true (default).
   */
  attachAuthToken?: boolean;
}

/**
 * Result payload inside the subscribe ack envelope for level3.
 */
export interface KrakenWsLevel3SubscribeResult {
  channel: 'level3';
  symbol: ReadonlyArray<string>;
  depth?: KrakenWsLevel3Depth;
  snapshot?: boolean;
  [key: string]: unknown;
}

/**
 * Full WS envelope returned from subscribe (ack) for level3.
 */
export type KrakenWsLevel3SubscribeResponse =
  KrakenWsMethodResponseEnvelope<KrakenWsLevel3SubscribeResult>;

/**
 * Subscribe to the `level3` (L3 order book) channel.
 *
 * Streams:
 * - a **snapshot** of individual orders up to `depth` price levels, then
 * - **update** messages with per-order add/modify/delete events.
 *
 * @example
 * ```ts
 * // 1) Subscribe to BTC/USD L3 book with 100 levels
 * const ack = await wsClient.marketData.subscribeLevel3(
 *   {
 *     symbol: ["BTC/USD"],
 *     depth: 100,
 *     token: myAuthToken,
 *   },
 *   { reqId: 42 },
 * );
 *
 * if (!ack.success) {
 *   console.error("level3 subscribe error:", ack.error);
 * }
 *
 * // 2) Handle stream messages
 * ws.onMessage((raw) => {
 *   const msg = JSON.parse(raw);
 *
 *   if (msg.channel === "level3" && (msg.type === "snapshot" || msg.type === "update")) {
 *     const l3msg = msg as KrakenWsLevel3Message;
 *     const book = l3msg.data[0]; // always a single element
 *
 *     if (l3msg.type === "snapshot") {
 *       console.log(
 *         "[level3 snapshot]",
 *         book.symbol,
 *         "bids:",
 *         book.bids.length,
 *         "asks:",
 *         book.asks.length,
 *       );
 *     } else {
 *       console.log(
 *         "[level3 update]",
 *         book.symbol,
 *         "events (bids):",
 *         book.bids.length,
 *         "events (asks):",
 *         book.asks.length,
 *         "checksum:",
 *         book.checksum,
 *       );
 *     }
 *   }
 * });
 * ```
 */
export async function subscribeLevel3(
  ws: KrakenWebsocketBase,
  params: KrakenWsLevel3SubscribeParams,
  options: KrakenWsLevel3SubscribeOptions = {},
): Promise<KrakenWsLevel3SubscribeResponse> {
  const body = {
    channel: 'level3' as const,
    ...params,
  };

  return ws.request<typeof body, KrakenWsLevel3SubscribeResult>(
    'subscribe',
    body,
    {
      reqId: options.reqId,
      timeoutMs: options.timeoutMs,
      // Authenticated feed by default
      attachAuthToken: options.attachAuthToken ?? true,
    },
  );
}

/**
 * Parameters for unsubscribing from the `level3` channel.
 *
 * NOTE:
 * - Must match the symbols (and depth, if used) you want to remove.
 * - `token` is required (authenticated feed).
 */
export interface KrakenWsLevel3UnsubscribeParams {
  /**
   * A list of currency pairs to unsubscribe.
   */
  symbol: ReadonlyArray<string>;

  /**
   * Number of price levels to unsubscribe.
   * Must match the subscribed depth if specified.
   */
  depth?: KrakenWsLevel3Depth;

  /**
   * Auth session token from the REST API.
   */
  token: string;

  [key: string]: unknown;
}

/**
 * Options for unsubscribeLevel3 wrapper.
 */
export interface KrakenWsLevel3UnsubscribeOptions {
  reqId?: number;
  timeoutMs?: number;
  attachAuthToken?: boolean;
}

/**
 * Result payload inside the unsubscribe ack envelope for level3.
 */
export interface KrakenWsLevel3UnsubscribeResult {
  channel: 'level3';
  symbol: ReadonlyArray<string>;
  depth?: KrakenWsLevel3Depth;
  [key: string]: unknown;
}

/**
 * Full WS envelope returned from unsubscribe (ack) for level3.
 */
export type KrakenWsLevel3UnsubscribeResponse =
  KrakenWsMethodResponseEnvelope<KrakenWsLevel3UnsubscribeResult>;

/**
 * Unsubscribe from the `level3` channel.
 *
 * @example
 * ```ts
 * const ack = await wsClient.marketData.unsubscribeLevel3(
 *   {
 *     symbol: ["BTC/USD"],
 *     depth: 100,
 *     token: myAuthToken,
 *   },
 *   { reqId: 43 },
 * );
 *
 * if (!ack.success) {
 *   console.error("level3 unsubscribe error:", ack.error);
 * }
 * ```
 */
export async function unsubscribeLevel3(
  ws: KrakenWebsocketBase,
  params: KrakenWsLevel3UnsubscribeParams,
  options: KrakenWsLevel3UnsubscribeOptions = {},
): Promise<KrakenWsLevel3UnsubscribeResponse> {
  const body = {
    channel: 'level3' as const,
    ...params,
  };

  return ws.request<typeof body, KrakenWsLevel3UnsubscribeResult>(
    'unsubscribe',
    body,
    {
      reqId: options.reqId,
      timeoutMs: options.timeoutMs,
      attachAuthToken: options.attachAuthToken ?? true,
    },
  );
}
