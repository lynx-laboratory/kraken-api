import type { KrakenRestBase } from '../../../base/restBase';
import type { KrakenRebaseMultiplier } from './getAccountBalance';
import type {
  KrakenOrderStatus,
  KrakenOrderTrigger,
  KrakenOpenOrderDescription,
} from './getOpenOrders';

/**
 * Closed order as returned by Kraken.
 *
 * This extends the open-order shape with:
 * - closetm: Unix timestamp when order was closed
 * - reason : Additional info on status (if any)
 */
export interface KrakenClosedOrder {
  /** Referral order transaction ID that created this order (nullable) */
  refid?: string | null;

  /** Optional numeric client identifier */
  userref?: number | null;

  /** Optional alphanumeric client order ID */
  cl_ord_id?: string | null;

  /** Status of order (pending, open, closed, canceled, expired) */
  status: KrakenOrderStatus;

  /** Unix timestamp when order was placed */
  opentm: number;

  /** Unix timestamp of order start time (or 0 if not set) */
  starttm: number;

  /** Unix timestamp of order end time (or 0 if not set) */
  expiretm: number;

  /** Order description info */
  descr: KrakenOpenOrderDescription;

  /** Volume of order (base currency) */
  vol: string;

  /** Volume executed (base currency) */
  vol_exec: string;

  /** Total cost (quote currency) */
  cost: string;

  /** Total fee (quote currency) */
  fee: string;

  /** Average price (quote currency) */
  price: string;

  /** Stop price (quote currency) */
  stopprice?: string;

  /**
   * Triggered limit price (quote currency, when limit-based order
   * type triggered)
   */
  limitprice?: string;

  /**
   * Price signal used to trigger stop/take-profit orders.
   * If not set, "last" is implied.
   */
  trigger?: KrakenOrderTrigger;

  /**
   * Indicates if the order is funded on margin.
   * (Docs show boolean; keep union in case of API quirks.)
   */
  margin?: boolean | string;

  /** Comma-delimited list of miscellaneous info */
  misc: string;

  /**
   * Comma-delimited list of order flags:
   * - post, fcib, fciq, nompp, viqc, ...
   */
  oflags?: string;

  /**
   * List of trade IDs related to the order (if `trades=true`
   * and data is available)
   */
  trades?: string[];

  /**
   * For institutional accounts, identifies underlying sub-account/trader
   * for STP.
   */
  sender_sub_id?: string | null;

  /** Unix timestamp of when order was closed */
  closetm: number;

  /** Additional info on status (if any) */
  reason?: string;
}

/** Map of txid -> closed order */
export type KrakenClosedOrdersMap = Record<string, KrakenClosedOrder>;

export interface KrakenClosedOrdersResult {
  /** Closed orders keyed by transaction ID */
  closed: KrakenClosedOrdersMap;

  /**
   * Amount of available order info matching criteria.
   * Used with `ofs` for pagination.
   */
  count: number;
}

export type KrakenClosedOrdersCloseTime = 'open' | 'close' | 'both';

export interface KrakenGetClosedOrdersParams {
  /**
   * Whether or not to include trades related to position in output.
   * Default on Kraken is false.
   */
  trades?: boolean;

  /**
   * Restrict results to given user reference.
   */
  userref?: number;

  /**
   * Restrict results to given client order id.
   */
  cl_ord_id?: string;

  /**
   * Starting unix timestamp or order tx ID of results (exclusive).
   */
  start?: number | string;

  /**
   * Ending unix timestamp or order tx ID of results (inclusive).
   */
  end?: number | string;

  /**
   * Result offset for pagination.
   * 50 results are returned per page by default.
   */
  ofs?: number;

  /**
   * Which time to use to search:
   * - "open"  : opentm
   * - "close" : closetm
   * - "both"  : both
   *
   * Default on Kraken is "both".
   */
  closetime?: KrakenClosedOrdersCloseTime;

  /**
   * Whether or not to consolidate trades by individual taker trades.
   * Default on Kraken is true.
   */
  consolidate_taker?: boolean;

  /**
   * Whether or not to include page count in result.
   * `true` is faster for users with many closed orders.
   * (If true, `count` may be omitted by Kraken.)
   */
  without_count?: boolean;

  /**
   * Optional parameter for viewing xstocks data.
   *
   * - "rebased": Display in terms of underlying equity.
   * - "base":    Display in terms of SPV tokens.
   *
   * Default on Kraken is "rebased" if omitted.
   */
  rebase_multiplier?: KrakenRebaseMultiplier;
}

/**
 * POST /0/private/ClosedOrders
 *
 * Retrieve information about orders that have been closed
 * (filled or cancelled). 50 results are returned at a time,
 * most recent by default.
 *
 * Note:
 * - `nonce` is handled automatically by the client.
 * - API key must have "Orders and trades – Query closed orders & trades".
 */
export function getClosedOrders(
  base: KrakenRestBase,
  params?: KrakenGetClosedOrdersParams,
): Promise<KrakenClosedOrdersResult> {
  const body: Record<string, string> = {};

  if (params?.trades !== undefined) {
    body.trades = params.trades ? 'true' : 'false';
  }

  if (params?.userref !== undefined) {
    body.userref = String(params.userref);
  }

  if (params?.cl_ord_id) {
    body.cl_ord_id = params.cl_ord_id;
  }

  if (params?.start !== undefined) {
    body.start = String(params.start);
  }

  if (params?.end !== undefined) {
    body.end = String(params.end);
  }

  if (params?.ofs !== undefined) {
    body.ofs = String(params.ofs);
  }

  if (params?.closetime) {
    body.closetime = params.closetime;
  }

  if (params?.consolidate_taker !== undefined) {
    body.consolidate_taker = params.consolidate_taker ? 'true' : 'false';
  }

  if (params?.without_count !== undefined) {
    body.without_count = params.without_count ? 'true' : 'false';
  }

  if (params?.rebase_multiplier) {
    body.rebase_multiplier = params.rebase_multiplier;
  }

  return base.privatePost<KrakenClosedOrdersResult>(
    '/0/private/ClosedOrders',
    body,
  );
}
