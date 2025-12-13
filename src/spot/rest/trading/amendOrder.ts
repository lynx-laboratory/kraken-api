import type { KrakenRestBase } from '../../../base/restBase';

/**
 * Parameters to amend an existing order.
 *
 * Either `txid` or `cl_ord_id` is required.
 */
export interface KrakenAmendOrderParams {
  /**
   * The Kraken identifier for the order to be amended.
   * Either `txid` or `cl_ord_id` is required.
   */
  txid?: string;

  /**
   * The client identifier for the order to be amended.
   * Either `txid` or `cl_ord_id` is required.
   */
  cl_ord_id?: string;

  /**
   * New order quantity in terms of the base asset.
   *
   * If provided and reduced below already-filled quantity,
   * the remaining quantity will be cancelled.
   */
  order_qty?: string;

  /**
   * For iceberg orders only, defines the new quantity to show
   * in the book while the rest remains hidden.
   * Minimum value = 1/15 of remaining order quantity.
   */
  display_qty?: string;

  /**
   * New limit price restriction on the order (for order types
   * that support limit price only).
   *
   * Relative pricing supported via + / - prefixes and % suffix.
   */
  limit_price?: string;

  /**
   * New trigger price to activate the order (for triggered
   * order types only).
   *
   * Relative pricing supported via + / - prefixes and % suffix.
   */
  trigger_price?: string;

  /**
   * Required on amends for non-crypto pairs (xstocks).
   * Provide the pair symbol.
   */
  pair?: string;

  /**
   * Optional flag for limit_price amends. If true, the limit
   * price change will be rejected if the order cannot be
   * posted passively in the book.
   */
  post_only?: boolean;

  /**
   * RFC3339 timestamp after which the matching engine should
   * reject the amend request in presence of latency/queuing.
   * Example: "2021-04-01T00:18:45Z"
   *
   * min = now() + 2s, max = now() + 60s.
   */
  deadline?: string;
}

/**
 * Result payload for a successful amend.
 */
export interface KrakenAmendOrderResult {
  /**
   * The unique Kraken identifier generated for this amend
   * transaction.
   */
  amend_id: string;
}

/**
 * POST /0/private/AmendOrder
 *
 * Modify order parameters in-place without cancel+new.
 *
 * Notes:
 * - Either `txid` or `cl_ord_id` is required.
 * - Nonce, signing, etc. are handled by KrakenRestBase.
 * - Requires "Create & modify orders" or "Cancel & close orders".
 */
export function amendOrder(
  base: KrakenRestBase,
  params: KrakenAmendOrderParams,
): Promise<KrakenAmendOrderResult> {
  if (!params.txid && !params.cl_ord_id) {
    throw new Error(
      'KrakenAmendOrderParams: either txid or cl_ord_id must be provided',
    );
  }

  const body: Record<string, string> = {};

  if (params.txid) {
    body.txid = params.txid;
  }
  if (params.cl_ord_id) {
    body.cl_ord_id = params.cl_ord_id;
  }

  if (params.order_qty !== undefined) {
    body.order_qty = params.order_qty;
  }

  if (params.display_qty !== undefined) {
    body.display_qty = params.display_qty;
  }

  if (params.limit_price !== undefined) {
    body.limit_price = params.limit_price;
  }

  if (params.trigger_price !== undefined) {
    body.trigger_price = params.trigger_price;
  }

  if (params.pair !== undefined) {
    body.pair = params.pair;
  }

  if (params.post_only !== undefined) {
    body.post_only = params.post_only ? 'true' : 'false';
  }

  if (params.deadline !== undefined) {
    body.deadline = params.deadline;
  }

  return base.privatePost<KrakenAmendOrderResult>(
    '/0/private/AmendOrder',
    body,
  );
}
