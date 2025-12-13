import {
  KrakenWebsocketBase,
  KrakenWsMethodResponseEnvelope,
} from '../../../base/websocketBase';

/**
 * Parameters for WS v2 cancel_order.
 *
 * At least one of `order_id`, `cl_ord_id`, or `order_userref` must be
 * provided, and each (when present) must contain at least one element.
 *
 * NOTE:
 * - `token` is optional because KrakenWebsocketBase can inject it from
 *   the connection options.
 * - `req_id` is handled by KrakenWebsocketBase.request; do not include it here.
 */
export interface KrakenWsCancelOrderParams {
  /**
   * A list of Kraken order_id identifiers.
   */
  order_id?: string[];

  /**
   * A list of client cl_ord_id identifiers.
   */
  cl_ord_id?: string[];

  /**
   * A list of client order_userref identifiers.
   */
  order_userref?: number[];

  /**
   * Session token. Optional: if omitted, KrakenWebsocketBase will inject
   * the connection's authToken (when present).
   */
  token?: string;
}

/**
 * Options for cancelOrder wrapper – maps directly to KrakenWebsocketBase.request.
 */
export interface KrakenWsCancelOrderOptions {
  reqId?: number;
  timeoutMs?: number;
  attachAuthToken?: boolean;
}

/**
 * Result payload inside the WS envelope for cancel_order.
 *
 * Note: when cancelling multiple orders, Kraken will send multiple
 * individual responses (one per order). This type represents a single
 * cancel response.
 */
export interface KrakenWsCancelOrderResult {
  /**
   * Kraken identifier of the cancelled order.
   */
  order_id: string;

  /**
   * Optional client identifier of the cancelled order.
   */
  cl_ord_id?: string;

  /**
   * Advisory messages about deprecated fields or upcoming changes.
   */
  warnings?: string[];
}

/**
 * Full WS envelope returned from cancel_order.
 */
export type KrakenWsCancelOrderResponse =
  KrakenWsMethodResponseEnvelope<KrakenWsCancelOrderResult>;

/**
 * Cancel one or more open orders via WS v2.
 *
 * When cancelling multiple orders, Kraken will stream a separate
 * `cancel_order` response per order. This helper resolves on the first
 * response; additional responses can be observed via message handlers
 * on the underlying WebSocket connection.
 *
 * Kraken docs: method = "cancel_order" (authenticated)
 */
export async function cancelOrder(
  ws: KrakenWebsocketBase,
  params: KrakenWsCancelOrderParams,
  options: KrakenWsCancelOrderOptions = {},
): Promise<KrakenWsCancelOrderResponse> {
  const hasOrderIds =
    Array.isArray(params.order_id) && params.order_id.length > 0;
  const hasClOrdIds =
    Array.isArray(params.cl_ord_id) && params.cl_ord_id.length > 0;
  const hasUserrefs =
    Array.isArray(params.order_userref) && params.order_userref.length > 0;

  if (!hasOrderIds && !hasClOrdIds && !hasUserrefs) {
    throw new Error(
      'Kraken WS cancel_order: at least one of `order_id`, `cl_ord_id`, or `order_userref` must contain at least one entry',
    );
  }

  return ws.request<KrakenWsCancelOrderParams, KrakenWsCancelOrderResult>(
    'cancel_order',
    params,
    {
      reqId: options.reqId,
      timeoutMs: options.timeoutMs,
      attachAuthToken: options.attachAuthToken,
    },
  );
}
