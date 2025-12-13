import type { KrakenRestBase } from '../../../base/restBase';
import type { KrakenRebaseMultiplier } from './getAccountBalance';

export type KrakenOrderStatus =
  | 'pending'
  | 'open'
  | 'closed'
  | 'canceled'
  | 'expired';

export type KrakenOrderSide = 'buy' | 'sell';

export type KrakenOrderType =
  | 'market'
  | 'limit'
  | 'iceberg'
  | 'stop-loss'
  | 'take-profit'
  | 'stop-loss-limit'
  | 'take-profit-limit'
  | 'trailing-stop'
  | 'trailing-stop-limit'
  | 'settle-position';

export type KrakenOrderTrigger = 'last' | 'index';

export interface KrakenOpenOrderDescription {
  /** Asset pair (e.g. "XBTUSD") */
  pair: string;

  /** Type of order: "buy" or "sell" */
  type: KrakenOrderSide;

  /** Execution model of the order (market, limit, stop-loss, etc.) */
  ordertype: KrakenOrderType;

  /** Primary price */
  price: string;

  /** Secondary price (if applicable) */
  price2: string;

  /** Amount of leverage */
  leverage: string;

  /** Order description text */
  order: string;

  /** Conditional close order description (if any) */
  close?: string;
}

/**
 * Open order as returned by Kraken.
 *
 * Note:
 * - Some fields are optional or nullable depending on order type.
 * - `margin` is documented as boolean; we keep it boolean | string for safety.
 */
export interface KrakenOpenOrder {
  /** Referral order transaction ID that created this order (nullable) */
  refid?: string | null;

  /** Optional numeric client identifier */
  userref?: number | null;

  /** Optional alphanumeric client order ID */
  cl_ord_id?: string | null;

  /** Status of order */
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
   * type is triggered)
   */
  limitprice?: string;

  /**
   * Price signal used to trigger stop/take-profit orders.
   * If not set, "last" is implied.
   */
  trigger?: KrakenOrderTrigger;

  /**
   * Indicates if the order is funded on margin.
   * (Docs show boolean; keeping union in case of API quirks.)
   */
  margin?: boolean | string;

  /** Comma-delimited list of miscellaneous info */
  misc: string;

  /**
   * Comma-delimited list of order flags (post, fcib, fciq, viqc, etc.)
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
}

/** Map of order ID -> open order */
export type KrakenOpenOrdersMap = Record<string, KrakenOpenOrder>;

export interface KrakenOpenOrdersResult {
  open: KrakenOpenOrdersMap;
}

export interface KrakenGetOpenOrdersParams {
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
 * POST /0/private/OpenOrders
 *
 * Retrieve information about currently open orders.
 *
 * Note:
 * - `nonce` is handled automatically by the client.
 * - API key must have "Orders and trades – Query open orders & trades".
 */
export function getOpenOrders(
  base: KrakenRestBase,
  params?: KrakenGetOpenOrdersParams,
): Promise<KrakenOpenOrdersResult> {
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

  if (params?.rebase_multiplier) {
    body.rebase_multiplier = params.rebase_multiplier;
  }

  return base.privatePost<KrakenOpenOrdersResult>(
    '/0/private/OpenOrders',
    body,
  );
}
