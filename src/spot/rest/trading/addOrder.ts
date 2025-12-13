import type { KrakenRestBase } from '../../../base/restBase';
import type {
  KrakenOrderSide,
  KrakenOrderType,
  KrakenOrderTrigger,
} from '../account-data/getOpenOrders';

export type KrakenAddOrderTimeInForce = 'GTC' | 'IOC' | 'GTD';

export type KrakenAddOrderStpType =
  | 'cancel-newest'
  | 'cancel-oldest'
  | 'cancel-both';

/**
 * Conditional close order parameters.
 *
 * These are mapped to:
 * - close[ordertype]
 * - close[price]
 * - close[price2]
 */
export interface KrakenAddOrderCloseParams {
  /**
   * Conditional close order type.
   * Docs list a subset, but we reuse KrakenOrderType for now.
   */
  ordertype: KrakenOrderType;

  /** Conditional close order price */
  price?: string;

  /** Conditional close order secondary price */
  price2?: string;
}

export interface KrakenAddOrderParams {
  /**
   * Optional non-unique numeric identifier for grouping orders.
   * Mutually exclusive with `cl_ord_id`.
   */
  userref?: number;

  /**
   * Client order ID, unique per client.
   * Mutually exclusive with `userref`.
   *
   * Long / short UUID or free-text up to 18 chars.
   */
  cl_ord_id?: string;

  /**
   * Execution model of the order.
   * e.g. "market", "limit", "stop-loss", etc.
   */
  ordertype: KrakenOrderType;

  /** Order direction ("buy" / "sell") */
  type: KrakenOrderSide;

  /**
   * Order quantity in terms of the base asset.
   *
   * Note: Volume can be specified as "0" for closing margin orders
   * to automatically fill the requisite quantity.
   */
  volume: string;

  /**
   * For iceberg orders: quantity to show in the book while the rest
   * of the order remains hidden. Minimum = 1/15 of `volume`.
   */
  displayvol?: string;

  /** Asset pair id or altname (e.g. "XBTUSD") */
  pair: string;

  /**
   * Required for non-crypto pairs (xstocks).
   * e.g. "tokenized_asset"
   */
  asset_class?: 'tokenized_asset';

  /**
   * Price:
   *  - Limit price for limit/iceberg
   *  - Trigger price for stop/TP/trailing orders
   *
   * Relative formats (+,-,#, %) are supported by Kraken.
   */
  price?: string;

  /**
   * Secondary price:
   *  - Limit price for *-limit order types (e.g. stop-loss-limit)
   *  - For trailing-stop-limit, relative price offset from trigger.
   */
  price2?: string;

  /**
   * Price signal used to trigger stop/TP/trailing orders.
   *
   * Default on Kraken is "last".
   */
  trigger?: KrakenOrderTrigger;

  /**
   * Amount of leverage desired (quote string, e.g. "5").
   * Default is no leverage if omitted.
   */
  leverage?: string;

  /**
   * If true, order will only reduce a currently open position,
   * not increase it or open a new one.
   */
  reduce_only?: boolean;

  /**
   * Self Trade Prevention mode:
   *  - "cancel-newest" (default)
   *  - "cancel-oldest"
   *  - "cancel-both"
   */
  stptype?: KrakenAddOrderStpType;

  /**
   * Comma-delimited list of order flags:
   *  - post, fcib, fciq, nompp, viqc
   */
  oflags?: string;

  /**
   * Time-in-force:
   *  - GTC (default)
   *  - IOC
   *  - GTD (must coincide with expiretm)
   */
  timeinforce?: KrakenAddOrderTimeInForce;

  /**
   * Scheduled start time:
   *  - "0"      now (default)
   *  - "<n>"    unix timestamp
   *  - "+<n>"   seconds from now (must be URL-encoded as %2b)
   */
  starttm?: string;

  /**
   * Expiry time (for GTD or other good-until orders):
   *  - "0"      no expiration (default)
   *  - "<n>"    unix timestamp
   *  - "+<n>"   expire <n> seconds from now (min 5s)
   */
  expiretm?: string;

  /**
   * Optional conditional close order that will be placed
   * once the primary order executes.
   */
  close?: KrakenAddOrderCloseParams;

  /**
   * RFC3339 deadline timestamp.
   * e.g. "2021-04-01T00:18:45Z"
   * min now()+2s, max now()+60s.
   */
  deadline?: string;

  /**
   * If true, the order will be validated only and will not
   * actually be sent to the matching engine.
   */
  validate?: boolean;
}

export interface KrakenAddOrderDescription {
  /** Order description text */
  order: string;

  /** Conditional close order description (if applicable) */
  close?: string;
}

export interface KrakenAddOrderResult {
  /** Order description info */
  descr: KrakenAddOrderDescription;

  /**
   * Transaction IDs for the order (if it was added successfully).
   *
   * Note: If `validate=true`, Kraken may omit txid since
   * the order isn’t actually created.
   */
  txid?: string[];
}

/**
 * POST /0/private/AddOrder
 *
 * Place a new order.
 *
 * Note:
 * - `nonce` is handled automatically by the client.
 * - Requires "Orders and trades – Create & modify orders".
 */
export function addOrder(
  base: KrakenRestBase,
  params: KrakenAddOrderParams,
): Promise<KrakenAddOrderResult> {
  // Enforce documented mutual exclusion client-side
  if (params.userref !== undefined && params.cl_ord_id) {
    throw new Error(
      'KrakenAddOrderParams: userref and cl_ord_id are mutually exclusive',
    );
  }

  const body: Record<string, string> = {
    ordertype: params.ordertype,
    type: params.type,
    volume: params.volume,
    pair: params.pair,
  };

  if (params.userref !== undefined) {
    body.userref = String(params.userref);
  }

  if (params.cl_ord_id) {
    body.cl_ord_id = params.cl_ord_id;
  }

  if (params.displayvol) {
    body.displayvol = params.displayvol;
  }

  if (params.asset_class) {
    body.asset_class = params.asset_class;
  }

  if (params.price !== undefined) {
    body.price = params.price;
  }

  if (params.price2 !== undefined) {
    body.price2 = params.price2;
  }

  if (params.trigger) {
    body.trigger = params.trigger;
  }

  if (params.leverage !== undefined) {
    body.leverage = params.leverage;
  }

  if (params.reduce_only !== undefined) {
    body.reduce_only = params.reduce_only ? 'true' : 'false';
  }

  if (params.stptype) {
    body.stptype = params.stptype;
  }

  if (params.oflags) {
    body.oflags = params.oflags;
  }

  if (params.timeinforce) {
    body.timeinforce = params.timeinforce;
  }

  if (params.starttm !== undefined) {
    body.starttm = params.starttm;
  }

  if (params.expiretm !== undefined) {
    body.expiretm = params.expiretm;
  }

  if (params.deadline !== undefined) {
    body.deadline = params.deadline;
  }

  if (params.validate !== undefined) {
    body.validate = params.validate ? 'true' : 'false';
  }

  if (params.close) {
    body['close[ordertype]'] = params.close.ordertype;

    if (params.close.price !== undefined) {
      body['close[price]'] = params.close.price;
    }

    if (params.close.price2 !== undefined) {
      body['close[price2]'] = params.close.price2;
    }
  }

  return base.privatePost<KrakenAddOrderResult>('/0/private/AddOrder', body);
}
