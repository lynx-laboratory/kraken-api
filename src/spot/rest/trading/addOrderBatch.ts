import type { KrakenRestBase } from '../../../base/restBase';
import type {
  KrakenOrderSide,
  KrakenOrderType,
  KrakenOrderTrigger,
} from '../account-data/getOpenOrders';
import type {
  KrakenAddOrderTimeInForce,
  KrakenAddOrderStpType,
} from './addOrder';

/**
 * Parameters for a single order inside AddOrderBatch.
 *
 * NOTE:
 * - Pair / asset_class are top-level on the batch, not per order.
 * - userref and cl_ord_id are mutually exclusive per order.
 */
export interface KrakenAddOrderBatchOrderParams {
  /**
   * Optional non-unique numeric identifier for grouping orders.
   * Mutually exclusive with `cl_ord_id`.
   */
  userref?: number;

  /**
   * Client order ID, unique per client.
   * Mutually exclusive with `userref`.
   */
  cl_ord_id?: string;

  /** Execution model of the order. */
  ordertype: KrakenOrderType;

  /** Order direction ("buy" / "sell"). */
  type: KrakenOrderSide;

  /**
   * Order quantity in base asset terms.
   * Volume can be "0" for closing margin orders.
   */
  volume: string;

  /**
   * Iceberg quantity to display in the book (optional).
   * Minimum = 1/15 of volume.
   */
  displayvol?: string;

  /**
   * Price:
   *  - Limit price for limit / iceberg
   *  - Trigger price for stop / take-profit order types
   * Relative formats (+, -, #, %) supported by Kraken.
   */
  price?: string;

  /**
   * Secondary price:
   *  - Limit price for *-limit variants (stop-loss-limit, take-profit-limit)
   */
  price2?: string;

  /**
   * Trigger reference price for triggered orders.
   * Default is "last" if omitted.
   */
  trigger?: KrakenOrderTrigger;

  /**
   * Leverage amount as a string (e.g. "5").
   * Default = none if omitted.
   */
  leverage?: string;

  /**
   * If true, order will only reduce existing position.
   */
  reduce_only?: boolean;

  /**
   * Self Trade Prevention mode.
   * Default: "cancel-newest".
   */
  stptype?: KrakenAddOrderStpType;

  /**
   * Comma-delimited order flags:
   *  - post, fcib, fciq, nompp, viqc
   */
  oflags?: string;

  /**
   * Time-in-force:
   *  - GTC (default)
   *  - IOC
   *  - GTD
   */
  timeinforce?: KrakenAddOrderTimeInForce;

  /**
   * Scheduled start time:
   *  - "0"      now (default)
   *  - "<n>"    unix timestamp
   *  - "+<n>"   seconds from now
   */
  starttm?: string;

  /**
   * Expiry time:
   *  - "0"      no expiration (default)
   *  - "<n>"    unix timestamp
   *  - "+<n>"   expire <n> seconds from now (min 5s)
   */
  expiretm?: string;
}

/**
 * Top-level params for AddOrderBatch.
 *
 * All orders must be for the same pair.
 */
export interface KrakenAddOrderBatchParams {
  /**
   * List of orders to place.
   * Must contain between 2 and 15 orders.
   */
  orders: KrakenAddOrderBatchOrderParams[];

  /**
   * Asset pair id or altname (e.g. "XBTUSD").
   * All orders in the batch will use this pair.
   */
  pair: string;

  /**
   * Required for non-crypto pairs (xstocks).
   * e.g. "tokenized_asset".
   */
  asset_class?: 'tokenized_asset';

  /**
   * RFC3339 timestamp after which the matching engine
   * should reject the batch (latency / queuing protection).
   *
   * min now()+2s, max now()+60s.
   */
  deadline?: string;

  /**
   * If true, validate inputs only and do not actually
   * submit the orders.
   */
  validate?: boolean;
}

/**
 * Description of an individual order in the batch result.
 */
export interface KrakenAddOrderBatchOrderDescription {
  /** Order description text. */
  order: string;
}

/**
 * Result for a single order inside the batch.
 *
 * Notes:
 * - `error` is set if that individual order failed (while others may succeed).
 * - `txid` is set if that individual order was accepted.
 */
export interface KrakenAddOrderBatchOrderResult {
  descr: KrakenAddOrderBatchOrderDescription;
  error?: string;
  txid?: string;
}

/**
 * Full result payload for AddOrderBatch.
 *
 * The order of elements in `orders` matches the order
 * of the `orders` array sent in the request.
 */
export interface KrakenAddOrderBatchResult {
  orders: KrakenAddOrderBatchOrderResult[];
}

/**
 * POST /0/private/AddOrderBatch
 *
 * Send a batch of orders (2–15) for a single pair.
 *
 * Notes:
 * - Validation is performed on the whole batch before engine submission.
 * - On engine submission, failing orders are rejected individually.
 * - All orders must be for the same `pair`.
 * - `nonce` & signing handled by KrakenRestBase.
 */
export function addOrderBatch(
  base: KrakenRestBase,
  params: KrakenAddOrderBatchParams,
): Promise<KrakenAddOrderBatchResult> {
  const { orders, pair, asset_class, deadline, validate } = params;

  if (!Array.isArray(orders) || orders.length < 2 || orders.length > 15) {
    throw new Error(
      `KrakenAddOrderBatchParams: orders must contain between 2 and 15 items (got ${orders.length})`,
    );
  }

  // Enforce userref vs cl_ord_id exclusivity per order (runtime)
  for (const [index, o] of orders.entries()) {
    if (o.userref !== undefined && o.cl_ord_id !== undefined) {
      throw new Error(
        `KrakenAddOrderBatchParams: order[${index}] cannot have both userref and cl_ord_id`,
      );
    }
  }

  const body: Record<string, string> = {
    pair,
  };

  if (asset_class) {
    body.asset_class = asset_class;
  }

  if (deadline !== undefined) {
    body.deadline = deadline;
  }

  if (validate !== undefined) {
    body.validate = validate ? 'true' : 'false';
  }

  // Kraken expects "orders" as a JSON-encoded array in the POST body.
  const wireOrders = orders.map((o) => {
    const wire: Record<string, string> = {
      ordertype: o.ordertype,
      type: o.type,
      volume: o.volume,
    };

    if (o.userref !== undefined) {
      wire.userref = String(o.userref);
    }
    if (o.cl_ord_id !== undefined) {
      wire.cl_ord_id = o.cl_ord_id;
    }
    if (o.displayvol !== undefined) {
      wire.displayvol = o.displayvol;
    }
    if (o.price !== undefined) {
      wire.price = o.price;
    }
    if (o.price2 !== undefined) {
      wire.price2 = o.price2;
    }
    if (o.trigger !== undefined) {
      wire.trigger = o.trigger;
    }
    if (o.leverage !== undefined) {
      wire.leverage = o.leverage;
    }
    if (o.reduce_only !== undefined) {
      wire.reduce_only = o.reduce_only ? 'true' : 'false';
    }
    if (o.stptype !== undefined) {
      wire.stptype = o.stptype;
    }
    if (o.oflags !== undefined) {
      wire.oflags = o.oflags;
    }
    if (o.timeinforce !== undefined) {
      wire.timeinforce = o.timeinforce;
    }
    if (o.starttm !== undefined) {
      wire.starttm = o.starttm;
    }
    if (o.expiretm !== undefined) {
      wire.expiretm = o.expiretm;
    }

    return wire;
  });

  body.orders = JSON.stringify(wireOrders);

  return base.privatePost<KrakenAddOrderBatchResult>(
    '/0/private/AddOrderBatch',
    body,
  );
}
