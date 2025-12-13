import type { KrakenRestBase } from '../../../base/restBase';
import type { KrakenRebaseMultiplier } from './getAccountBalance';
import type {
  KrakenOrderStatus,
  KrakenOrderTrigger,
  KrakenOpenOrderDescription,
} from './getOpenOrders';

/**
 * Order as returned by QueryOrders.
 *
 * It’s basically the same shape as a closed order, but may represent
 * open or closed orders depending on txid/status, so `closetm`/`reason`
 * are optional.
 */
export interface KrakenQueriedOrder {
  /** Referral order transaction ID that created this order (nullable) */
  refid?: string | null;

  /** Optional numeric, client identifier associated with one or more orders */
  userref?: number | null;

  /** Optional alphanumeric, client identifier associated with the order */
  cl_ord_id?: string | null;

  /** Status of order (pending, open, closed, canceled, expired) */
  status: KrakenOrderStatus;

  /** Unix timestamp of when order was placed */
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
   * Triggered limit price (quote currency, when limit-based
   * order type triggered)
   */
  limitprice?: string;

  /**
   * Price signal used to trigger stop/take-profit orders.
   * If not set, "last" is implied.
   */
  trigger?: KrakenOrderTrigger;

  /**
   * Indicates if the order is funded on margin.
   * (Docs show boolean; union kept for API quirks.)
   */
  margin?: boolean | string;

  /** Comma-delimited list of miscellaneous info */
  misc: string;

  /**
   * Comma-delimited list of order flags:
   *  - post, fcib, fciq, nompp, viqc, ...
   */
  oflags?: string;

  /**
   * List of trade IDs related to order (if trades info requested
   * and data available)
   */
  trades?: string[];

  /**
   * For institutional accounts, identifies underlying sub-account/trader
   * for STP.
   */
  sender_sub_id?: string | null;

  /** Unix timestamp of when order was closed (for closed orders) */
  closetm?: number;

  /** Additional info on status (if any) */
  reason?: string;
}

/** Map of txid -> queried order */
export type KrakenQueriedOrdersMap = Record<string, KrakenQueriedOrder>;

export interface KrakenGetOrdersInfoParams {
  /**
   * Whether or not to include trades related to position in output.
   * Default on Kraken is false.
   */
  trades?: boolean;

  /**
   * Restrict results to given user reference id.
   */
  userref?: number;

  /**
   * The Kraken order identifier(s).
   * Up to 50 ids. Will be sent as a comma-delimited list.
   */
  txid: string | string[];

  /**
   * Whether or not to consolidate trades by individual taker trades.
   * Default on Kraken is true.
   */
  consolidate_taker?: boolean;

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
 * POST /0/private/QueryOrders
 *
 * Retrieve information about specific orders.
 *
 * Note:
 * - `nonce` is handled automatically by the client.
 * - Requires "Query open orders & trades" or "Query closed orders & trades"
 *   depending on the status of the orders queried.
 */
export function queryOrdersInfo(
  base: KrakenRestBase,
  params: KrakenGetOrdersInfoParams,
): Promise<KrakenQueriedOrdersMap> {
  const body: Record<string, string> = {};

  if (params.trades !== undefined) {
    body.trades = params.trades ? 'true' : 'false';
  }

  if (params.userref !== undefined) {
    body.userref = String(params.userref);
  }

  // txid is required; support string or string[]
  if (Array.isArray(params.txid)) {
    body.txid = params.txid.join(',');
  } else {
    body.txid = params.txid;
  }

  if (params.consolidate_taker !== undefined) {
    body.consolidate_taker = params.consolidate_taker ? 'true' : 'false';
  }

  if (params.rebase_multiplier) {
    body.rebase_multiplier = params.rebase_multiplier;
  }

  return base.privatePost<KrakenQueriedOrdersMap>(
    '/0/private/QueryOrders',
    body,
  );
}
