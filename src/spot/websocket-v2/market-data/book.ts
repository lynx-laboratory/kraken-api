import {
  KrakenWebsocketBase,
  KrakenWsMethodResponseEnvelope,
} from '../../../base/websocketBase';

/**
 * Allowed depth values for the book channel.
 */
export type KrakenWsBookDepth = 10 | 25 | 100 | 500 | 1000;

/**
 * Single price level entry in the L2 order book.
 */
export interface KrakenWsBookLevel {
  /** Price at this level. */
  price: number;
  /** Aggregate quantity at this level. */
  qty: number;
}

/**
 * Core book payload (used in both snapshot and update).
 *
 * The book element is always the first and only item in the `data` array.
 */
export interface KrakenWsBookData {
  /** Ask side levels. */
  asks: KrakenWsBookLevel[];
  /** Bid side levels. */
  bids: KrakenWsBookLevel[];
  /** CRC32 checksum for top 10 bids/asks. */
  checksum: number;
  /** The symbol of the currency pair (e.g. "BTC/USD"). */
  symbol: string;
}

/**
 * Snapshot message for the `book` channel.
 */
export interface KrakenWsBookSnapshotMessage {
  channel: 'book';
  type: 'snapshot';
  data: KrakenWsBookData[];
  /**
   * Subscription message sequence number.
   */
  sequence: number;
}

/**
 * Update message for the `book` channel.
 *
 * Includes a timestamp for the book update.
 */
export interface KrakenWsBookUpdateMessage {
  channel: 'book';
  type: 'update';
  data: Array<
    KrakenWsBookData & {
      /**
       * Order book update timestamp (RFC3339 with fractional seconds).
       */
      timestamp: string;
    }
  >;
  /**
   * Subscription message sequence number.
   */
  sequence: number;
}

/**
 * Union of possible book messages.
 */
export type KrakenWsBookMessage =
  | KrakenWsBookSnapshotMessage
  | KrakenWsBookUpdateMessage;

/**
 * Parameters for subscribing to the `book` channel.
 *
 * NOTE:
 * - `channel` is automatically set to "book" by the helper.
 */
export interface KrakenWsBookSubscribeParams {
  /**
   * A list of currency pairs, e.g. ["BTC/USD", "MATIC/GBP"].
   */
  symbol: ReadonlyArray<string>;

  /**
   * Number of price levels to receive.
   * Default: 10.
   */
  depth?: KrakenWsBookDepth;

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
 * Options for subscribeBook wrapper – mapped to KrakenWebsocketBase.request.
 */
export interface KrakenWsBookSubscribeOptions {
  reqId?: number;
  timeoutMs?: number;
  /**
   * For public channels this should generally be false (default).
   */
  attachAuthToken?: boolean;
}

/**
 * Result payload inside the subscribe ack envelope for book.
 */
export interface KrakenWsBookSubscribeResult {
  channel: 'book';
  symbol: ReadonlyArray<string>;
  depth?: KrakenWsBookDepth;
  [key: string]: unknown;
}

/**
 * Full WS envelope returned from subscribe (ack) for book.
 */
export type KrakenWsBookSubscribeResponse =
  KrakenWsMethodResponseEnvelope<KrakenWsBookSubscribeResult>;

/**
 * Subscribe to the `book` (L2 order book) channel.
 *
 * Streams:
 * - a **snapshot** of bids/asks up to `depth` levels, then
 * - **update** messages containing incremental changes + checksum.
 *
 * @example
 * ```ts
 * // 1) Subscribe to BTC/USD and ETH/USD L2 book with 25 levels
 * const ack = await wsClient.marketData.subscribeBook(
 *   {
 *     symbol: ["BTC/USD", "ETH/USD"],
 *     depth: 25,
 *   },
 *   { reqId: 2 },
 * );
 *
 * if (!ack.success) {
 *   console.error("book subscribe error:", ack.error);
 * }
 *
 * // 2) Handle stream messages
 * ws.onMessage((raw) => {
 *   const msg = JSON.parse(raw);
 *
 *   if (msg.channel === "book" && (msg.type === "snapshot" || msg.type === "update")) {
 *     const bmsg = msg as KrakenWsBookMessage;
 *     const book = bmsg.data[0]; // always a single element
 *
 *     if (bmsg.type === "snapshot") {
 *       console.log(
 *         "[book snapshot]",
 *         book.symbol,
 *         "bids:",
 *         book.bids.length,
 *         "asks:",
 *         book.asks.length,
 *       );
 *     } else {
 *       console.log(
 *         "[book update]",
 *         book.symbol,
 *         "checksum:",
 *         book.checksum,
 *         "top bid:",
 *         book.bids[0]?.price,
 *         "top ask:",
 *         book.asks[0]?.price,
 *       );
 *     }
 *   }
 * });
 * ```
 */
export async function subscribeBook(
  ws: KrakenWebsocketBase,
  params: KrakenWsBookSubscribeParams,
  options: KrakenWsBookSubscribeOptions = {},
): Promise<KrakenWsBookSubscribeResponse> {
  const body = {
    channel: 'book' as const,
    ...params,
  };

  return ws.request<typeof body, KrakenWsBookSubscribeResult>(
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
 * Parameters for unsubscribing from the `book` channel.
 *
 * NOTE:
 * - Must match the symbols (and depth, if used) you want to remove.
 */
export interface KrakenWsBookUnsubscribeParams {
  /**
   * A list of currency pairs to unsubscribe.
   */
  symbol: ReadonlyArray<string>;

  /**
   * Number of price levels to unsub.
   * Must match the subscribed depth if specified.
   */
  depth?: KrakenWsBookDepth;

  [key: string]: unknown;
}

/**
 * Options for unsubscribeBook wrapper.
 */
export interface KrakenWsBookUnsubscribeOptions {
  reqId?: number;
  timeoutMs?: number;
  attachAuthToken?: boolean;
}

/**
 * Result payload inside the unsubscribe ack envelope for book.
 */
export interface KrakenWsBookUnsubscribeResult {
  channel: 'book';
  symbol: ReadonlyArray<string>;
  depth?: KrakenWsBookDepth;
  [key: string]: unknown;
}

/**
 * Full WS envelope returned from unsubscribe (ack) for book.
 */
export type KrakenWsBookUnsubscribeResponse =
  KrakenWsMethodResponseEnvelope<KrakenWsBookUnsubscribeResult>;

/**
 * Unsubscribe from the `book` channel.
 *
 * @example
 * ```ts
 * const ack = await wsClient.marketData.unsubscribeBook({
 *   symbol: ["BTC/USD", "ETH/USD"],
 *   depth: 25,
 * });
 *
 * if (!ack.success) {
 *   console.error("book unsubscribe error:", ack.error);
 * }
 * ```
 */
export async function unsubscribeBook(
  ws: KrakenWebsocketBase,
  params: KrakenWsBookUnsubscribeParams,
  options: KrakenWsBookUnsubscribeOptions = {},
): Promise<KrakenWsBookUnsubscribeResponse> {
  const body = {
    channel: 'book' as const,
    ...params,
  };

  return ws.request<typeof body, KrakenWsBookUnsubscribeResult>(
    'unsubscribe',
    body,
    {
      reqId: options.reqId,
      timeoutMs: options.timeoutMs,
      attachAuthToken: options.attachAuthToken ?? false,
    },
  );
}
