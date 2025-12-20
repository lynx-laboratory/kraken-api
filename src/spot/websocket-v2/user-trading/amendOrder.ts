import {
  KrakenWebsocketBase,
  KrakenWsMethodResponseEnvelope,
} from '../../../base/websocketBase';
import { KrakenWsPriceType } from '../../../types/types';

/**
 * Parameters for WS v2 amend_order.
 *
 * Either `order_id` or `cl_ord_id` must be provided (but not both).
 *
 * NOTE:
 * - `token` is optional because KrakenWebsocketBase can inject it from
 *   the connection options.
 * - `req_id` is handled by KrakenWebsocketBase.request; do not include it here.
 */
export interface KrakenWsAmendOrderParams {
  /**
   * Kraken order identifier to amend.
   * Either `order_id` or `cl_ord_id` is required.
   */
  order_id?: string;

  /**
   * Client order identifier to amend.
   * Either `order_id` or `cl_ord_id` is required.
   */
  cl_ord_id?: string;

  /**
   * New order quantity in terms of the base asset.
   */
  order_qty: number;

  /**
   * For iceberg orders only:
   * The new quantity to show in the book while the rest remains hidden.
   * Minimum value is 1/15 of remaining order quantity.
   */
  display_qty?: number;

  /**
   * New limit price restriction on the order (for order types that support it).
   */
  limit_price?: number;

  /**
   * Units for `limit_price`. Currently only available on trailing-stop-limit.
   */
  limit_price_type?: KrakenWsPriceType;

  /**
   * Optional parameter for limit price amends.
   * If true, the limit price change will be rejected if the order
   * cannot be posted passively in the book.
   */
  post_only?: boolean;

  /**
   * For triggered order types only:
   * New trigger price to activate the order.
   */
  trigger_price?: number;

  /**
   * Units for `trigger_price` (for triggered order types only).
   */
  trigger_price_type?: KrakenWsPriceType;

  /**
   * Deadline for this amend, in RFC3339 format with millisecond precision.
   * Range of valid offsets from "now" is 500 ms to 60 s.
   */
  deadline?: string;

  /**
   * Symbol is required on amends for non-crypto pairs (e.g. xstocks).
   */
  symbol?: string;

  /**
   * Session token. Optional: if omitted, KrakenWebsocketBase will inject
   * the connection's authToken (when present).
   */
  token?: string;
}

/**
 * Options for amendOrder wrapper – maps directly to KrakenWebsocketBase.request.
 */
export interface KrakenWsAmendOrderOptions {
  reqId?: number;
  timeoutMs?: number;
  attachAuthToken?: boolean;
}

/**
 * Result payload inside the WS envelope for amend_order.
 */
export interface KrakenWsAmendOrderResult {
  /**
   * Unique Kraken identifier generated for this amend transaction.
   */
  amend_id: string;

  /**
   * The Kraken identifier, if populated in the request.
   */
  order_id?: string;

  /**
   * The client identifier, if populated in the request.
   */
  cl_ord_id?: string;

  /**
   * Advisory messages about deprecated fields or upcoming changes.
   */
  warnings?: string[];
}

/**
 * Full WS envelope returned from amend_order.
 */
export type KrakenWsAmendOrderResponse =
  KrakenWsMethodResponseEnvelope<KrakenWsAmendOrderResult>;

/**
 * Amend an existing order in-place via WS v2.
 *
 * - Order identifiers (Kraken + client) stay the same.
 * - Queue priority is preserved where possible.
 * - If the new quantity is less than the filled quantity, the rest is canceled.
 *
 * Kraken docs: method = "amend_order" (authenticated)
 */
export async function amendOrder(
  ws: KrakenWebsocketBase,
  params: KrakenWsAmendOrderParams,
  options: KrakenWsAmendOrderOptions = {},
): Promise<KrakenWsAmendOrderResponse> {
  // Light runtime guard to match docs: exactly one of order_id / cl_ord_id.
  const hasOrderId = !!params.order_id;
  const hasClOrdId = !!params.cl_ord_id;

  if ((hasOrderId && hasClOrdId) || (!hasOrderId && !hasClOrdId)) {
    throw new Error(
      'Kraken WS amend_order: exactly one of `order_id` or `cl_ord_id` must be provided',
    );
  }

  return ws.request<KrakenWsAmendOrderParams, KrakenWsAmendOrderResult>(
    'amend_order',
    params,
    {
      reqId: options.reqId,
      timeoutMs: options.timeoutMs,
      attachAuthToken: options.attachAuthToken,
    },
  );
}
