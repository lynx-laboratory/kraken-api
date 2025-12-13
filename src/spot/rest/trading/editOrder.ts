import type { KrakenRestBase } from '../../../base/restBase';

/**
 * Parameters to edit an existing live order.
 *
 * Notes / caveats (per Kraken docs):
 * - triggered stop-loss / take-profit orders are NOT supported
 * - orders with conditional close terms are NOT supported
 * - orders where executed volume > new volume will be rejected
 * - cl_ord_id is NOT supported
 * - queue position is NOT maintained
 * - executions remain associated with original order
 */
export interface KrakenEditOrderParams {
  /**
   * Original Order ID (txid) or userref of the original order.
   *
   * If userref is not unique and was used with multiple orders,
   * the edit request will be rejected.
   */
  txid: string | number;

  /**
   * Optional user reference for this *edit request*.
   *
   * Note: userref from parent order is NOT retained on the
   * new order after edit. This is only for the edit itself.
   */
  userref?: number;

  /**
   * New order quantity in terms of the base asset.
   * Optional – omit to keep original volume.
   */
  volume?: string;

  /**
   * For iceberg orders only, defines the quantity to show in
   * the book. Minimum = 1/15 of volume.
   */
  displayvol?: string;

  /**
   * Asset pair id or altname (e.g. "XBTUSD").
   */
  pair: string;

  /**
   * Required for non-crypto pairs (xstocks).
   * e.g. "tokenized_asset".
   */
  asset_class?: 'tokenized_asset';

  /**
   * New price:
   *  - Limit price for limit/iceberg
   *  - Trigger price for stop/TP/trailing types
   *
   * Relative formats (+, -, #, %) supported by Kraken.
   */
  price?: string;

  /**
   * New secondary price for *-limit order types:
   *  - Limit price for stop-loss-limit, take-profit-limit,
   *    trailing-stop-limit.
   */
  price2?: string;

  /**
   * Comma-delimited list of order flags.
   *
   * Only these can actually be changed by EditOrder:
   *  - post  (post-only)
   *
   * All other flags from the parent order are retained.
   * If you want the edited order to remain post-only,
   * you must explicitly include "post".
   */
  oflags?: string;

  /**
   * RFC3339 timestamp after which the matching engine should
   * reject the edit request in presence of latency/queuing.
   *
   * Example: "2021-04-01T00:18:45Z"
   * min now()+2s, max now()+60s.
   */
  deadline?: string;

  /**
   * If true, the API may return a "pending replace" response
   * before the order is fully replaced.
   */
  cancel_response?: boolean;

  /**
   * If true, validate inputs only and do not actually submit
   * the edited order.
   */
  validate?: boolean;
}

/**
 * Description of the edited order.
 */
export interface KrakenEditOrderDescription {
  /** Order description text */
  order: string;
}

/**
 * Result payload for EditOrder.
 */
export interface KrakenEditOrderResult {
  /** Description info of the new order */
  descr: KrakenEditOrderDescription;

  /** New transaction ID (if edit succeeded and order created) */
  txid?: string;

  /** New userref if specified on the edit request */
  newuserref?: string;

  /** Original userref (from parent order) if present */
  olduserref?: string;

  /** Number of orders cancelled (0 or 1) */
  orders_cancelled: number;

  /** Original transaction ID */
  originaltxid: string;

  /** Status of the edit, e.g. "Ok" or "Err" */
  status: string;

  /** Updated volume (if provided) */
  volume?: string;

  /** Updated price (if provided) */
  price?: string;

  /** Updated secondary price (if provided) */
  price2?: string;

  /** Error message if unsuccessful */
  error_message?: string;
}

/**
 * POST /0/private/EditOrder
 *
 * Edit an existing live order by cancelling the original and
 * creating a new order with adjusted parameters.
 *
 * Notes:
 * - Prefer /0/private/AmendOrder for new integrations when possible.
 * - `nonce` & signing handled by KrakenRestBase.
 * - Requires both:
 *   - "Create & modify orders"
 *   - "Cancel & close orders"
 */
export function editOrder(
  base: KrakenRestBase,
  params: KrakenEditOrderParams,
): Promise<KrakenEditOrderResult> {
  const body: Record<string, string> = {
    txid: String(params.txid),
    pair: params.pair,
  };

  if (params.userref !== undefined) {
    body.userref = String(params.userref);
  }

  if (params.volume !== undefined) {
    body.volume = params.volume;
  }

  if (params.displayvol !== undefined) {
    body.displayvol = params.displayvol;
  }

  if (params.asset_class !== undefined) {
    body.asset_class = params.asset_class;
  }

  if (params.price !== undefined) {
    body.price = params.price;
  }

  if (params.price2 !== undefined) {
    body.price2 = params.price2;
  }

  if (params.oflags !== undefined) {
    body.oflags = params.oflags;
  }

  if (params.deadline !== undefined) {
    body.deadline = params.deadline;
  }

  if (params.cancel_response !== undefined) {
    body.cancel_response = params.cancel_response ? 'true' : 'false';
  }

  if (params.validate !== undefined) {
    body.validate = params.validate ? 'true' : 'false';
  }

  return base.privatePost<KrakenEditOrderResult>('/0/private/EditOrder', body);
}
