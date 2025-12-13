import {
  KrakenWebsocketBase,
  KrakenWsMethodResponseEnvelope,
} from '../../../base/websocketBase';

/**
 * Status values for assets in the instrument feed.
 */
export type KrakenWsInstrumentAssetStatus =
  | 'depositonly'
  | 'disabled'
  | 'enabled'
  | 'fundingtemporarilydisabled'
  | 'withdrawalonly'
  | 'workinprogress';

/**
 * Status values for pairs in the instrument feed.
 */
export type KrakenWsInstrumentPairStatus =
  | 'cancel_only'
  | 'delisted'
  | 'limit_only'
  | 'maintenance'
  | 'online'
  | 'post_only'
  | 'reduce_only'
  | 'work_in_progress';

/**
 * Single asset entry in the instrument feed.
 */
export interface KrakenWsInstrumentAsset {
  /** Asset identifier (e.g. "XBT", "USD"). */
  id: string;

  /** Flag if asset is borrowable. */
  borrowable: boolean;

  /** Valuation as margin collateral (if applicable). */
  collateral_value: number;

  /** Interest rate to borrow the asset. */
  margin_rate: number;

  /** Maximum precision for asset ledger / balances. */
  precision: number;

  /** Recommended display precision. */
  precision_display: number;

  /**
   * Multiplier of the tokenised asset (fixed conversion rate of the token).
   * Only meaningful for tokenized assets / xStocks.
   */
  multiplier?: number;

  /** Status of asset. */
  status: KrakenWsInstrumentAssetStatus;

  /** Allow future extension without breaking typing. */
  [key: string]: unknown;
}

/**
 * Single pair entry in the instrument feed.
 */
export interface KrakenWsInstrumentPair {
  /** Asset identifier of the base currency. */
  base: string;

  /** Asset identifier of the quote currency. */
  quote: string;

  /** Minimum cost (price * qty) for new orders (string as in docs). */
  cost_min: string;

  /** Maximum precision used for cost prices. */
  cost_precision: number;

  /** Whether the pair has an index available (e.g. for stop-loss triggers). */
  has_index: boolean;

  /** Whether the pair can be traded on margin. */
  marginable: boolean;

  /** Initial margin requirement (percent) – marginable pairs only. */
  margin_initial?: number;

  /** Limit for long positions – marginable pairs only. */
  position_limit_long?: number;

  /** Limit for short positions – marginable pairs only. */
  position_limit_short?: number;

  /** Minimum price increment for new orders. */
  price_increment: number;

  /** Maximum precision used for order prices. */
  price_precision: number;

  /** Minimum quantity increment for new orders. */
  qty_increment: number;

  /** Minimum quantity (base currency) for new orders. */
  qty_min: number;

  /** Maximum precision used for order quantities. */
  qty_precision: number;

  /** Status of pair. */
  status: KrakenWsInstrumentPairStatus;

  /** The symbol of the currency pair, e.g. "BTC/USD". */
  symbol: string;

  /**
   * DEPRECATED: Use `price_increment`.
   * Minimum price increment for new orders.
   */
  tick_size?: number;

  [key: string]: unknown;
}

/**
 * Instrument payload: reference data for active assets and tradable pairs.
 */
export interface KrakenWsInstrumentData {
  /** List of assets. */
  assets: KrakenWsInstrumentAsset[];
  /** List of tradable pairs. */
  pairs: KrakenWsInstrumentPair[];

  [key: string]: unknown;
}

/**
 * Snapshot message for the `instrument` channel.
 *
 * Snapshot provides reference data of all active assets and tradable pairs.
 */
export interface KrakenWsInstrumentSnapshotMessage {
  channel: 'instrument';
  type: 'snapshot';
  data: KrakenWsInstrumentData;
  /**
   * Subscription message sequence number.
   */
  sequence: number;
}

/**
 * Update message for the `instrument` channel.
 *
 * Updates stream changes to assets / pairs over time.
 */
export interface KrakenWsInstrumentUpdateMessage {
  channel: 'instrument';
  type: 'update';
  data: KrakenWsInstrumentData;
  /**
   * Subscription message sequence number.
   */
  sequence: number;
}

/**
 * Union of possible `instrument` channel messages.
 */
export type KrakenWsInstrumentMessage =
  | KrakenWsInstrumentSnapshotMessage
  | KrakenWsInstrumentUpdateMessage;

/**
 * Parameters for subscribing to the `instrument` channel.
 *
 * NOTE:
 * - `channel` is automatically set to "instrument" by the helper.
 */
export interface KrakenWsInstrumentSubscribeParams {
  /**
   * If true, include tokenized assets / xStocks in the response.
   * If false or omitted, include crypto spot pairs only.
   */
  include_tokenized_assets?: boolean;

  /**
   * Whether to request an initial snapshot.
   * Default: true (Kraken default).
   */
  snapshot?: boolean;

  /**
   * Index signature so this type satisfies Record<string, unknown>.
   */
  [key: string]: unknown;
}

/**
 * Options for subscribeInstrument wrapper – mapped to KrakenWebsocketBase.request.
 */
export interface KrakenWsInstrumentSubscribeOptions {
  reqId?: number;
  timeoutMs?: number;
  /**
   * Instrument is a public channel; auth token is not required.
   */
  attachAuthToken?: boolean;
}

/**
 * Result payload inside the subscribe ack envelope for `instrument`.
 */
export interface KrakenWsInstrumentSubscribeResult {
  channel: 'instrument';
  include_tokenized_assets?: boolean;
  snapshot?: boolean;
  [key: string]: unknown;
}

/**
 * Full WS envelope returned from subscribe (ack) for `instrument`.
 */
export type KrakenWsInstrumentSubscribeResponse =
  KrakenWsMethodResponseEnvelope<KrakenWsInstrumentSubscribeResult>;

/**
 * Subscribe to the `instrument` channel.
 *
 * Streams:
 * - a **snapshot** of all active assets and tradable pairs (by default),
 * - plus **update** messages when reference data changes.
 *
 * @example
 * ```ts
 * // 1) Subscribe to instrument feed (crypto only)
 * const ack = await wsClient.marketData.subscribeInstrument(
 *   {
 *     snapshot: true,
 *   },
 *   { reqId: 2001 },
 * );
 *
 * if (!ack.success) {
 *   console.error("instrument subscribe error:", ack.error);
 * } else {
 *   console.log("instrument subscribed:", ack.result);
 * }
 *
 * // 2) Handle stream messages
 * ws.onMessage((raw) => {
 *   const msg = JSON.parse(raw);
 *
 *   if (msg.channel === "instrument" && (msg.type === "snapshot" || msg.type === "update")) {
 *     const imsg = msg as KrakenWsInstrumentMessage;
 *
 *     console.log(`[${imsg.type}] assets:`, imsg.data.assets.length, "pairs:", imsg.data.pairs.length);
 *
 *     // Example: log the first BTC/USD pair if present
 *     const btcUsd = imsg.data.pairs.find((p) => p.symbol === "BTC/USD");
 *     if (btcUsd) {
 *       console.log(
 *         "BTC/USD price_increment:",
 *         btcUsd.price_increment,
 *         "qty_min:",
 *         btcUsd.qty_min,
 *         "marginable:",
 *         btcUsd.marginable,
 *       );
 *     }
 *   }
 * });
 * ```
 */
export async function subscribeInstrument(
  ws: KrakenWebsocketBase,
  params: KrakenWsInstrumentSubscribeParams = {},
  options: KrakenWsInstrumentSubscribeOptions = {},
): Promise<KrakenWsInstrumentSubscribeResponse> {
  const body = {
    channel: 'instrument' as const,
    ...params,
  };

  return ws.request<typeof body, KrakenWsInstrumentSubscribeResult>(
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
 * Parameters for unsubscribing from the `instrument` channel.
 *
 * NOTE:
 * - Kraken's API only requires `channel` for this unsubscribe.
 * - This is kept as an object for consistency / future extensibility.
 */
export interface KrakenWsInstrumentUnsubscribeParams {
  [key: string]: unknown;
}

/**
 * Options for unsubscribeInstrument wrapper.
 */
export interface KrakenWsInstrumentUnsubscribeOptions {
  reqId?: number;
  timeoutMs?: number;
  attachAuthToken?: boolean;
}

/**
 * Result payload inside the unsubscribe ack envelope for `instrument`.
 */
export interface KrakenWsInstrumentUnsubscribeResult {
  channel: 'instrument';
  [key: string]: unknown;
}

/**
 * Full WS envelope returned from unsubscribe (ack) for `instrument`.
 */
export type KrakenWsInstrumentUnsubscribeResponse =
  KrakenWsMethodResponseEnvelope<KrakenWsInstrumentUnsubscribeResult>;

/**
 * Unsubscribe from the `instrument` channel.
 *
 * @example
 * ```ts
 * const ack = await wsClient.marketData.unsubscribeInstrument(
 *   {},
 *   { reqId: 2002 },
 * );
 *
 * if (!ack.success) {
 *   console.error("instrument unsubscribe error:", ack.error);
 * }
 * ```
 */
export async function unsubscribeInstrument(
  ws: KrakenWebsocketBase,
  params: KrakenWsInstrumentUnsubscribeParams = {},
  options: KrakenWsInstrumentUnsubscribeOptions = {},
): Promise<KrakenWsInstrumentUnsubscribeResponse> {
  const body = {
    channel: 'instrument' as const,
    ...params,
  };

  return ws.request<typeof body, KrakenWsInstrumentUnsubscribeResult>(
    'unsubscribe',
    body,
    {
      reqId: options.reqId,
      timeoutMs: options.timeoutMs,
      attachAuthToken: options.attachAuthToken ?? false,
    },
  );
}
