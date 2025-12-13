import {
  KrakenWebsocketBase,
  KrakenWsMethodResponseEnvelope,
} from '../../../base/websocketBase';

/**
 * Parameters for WS v2 batch_cancel.
 *
 * - `orders` is required and must contain between 2 and 50 identifiers.
 * - Each entry can be either a Kraken `order_id` or a client `order_userref`
 *   (Kraken docs model both as strings here).
 * - `cl_ord_id` can optionally supply additional client identifiers.
 *
 * NOTE:
 * - `token` is optional because KrakenWebsocketBase can inject it from
 *   the connection options.
 * - `req_id` is handled by KrakenWebsocketBase.request; do not include it here.
 */
export interface KrakenWsBatchCancelParams {
  /**
   * A list containing either client order_userref or Kraken order_id
   * identifiers.
   *
   * Must contain between 2 and 50 entries (inclusive).
   */
  orders: string[];

  /**
   * A list of client cl_ord_id identifiers.
   */
  cl_ord_id?: string[];

  /**
   * Session token. Optional: if omitted, KrakenWebsocketBase will inject
   * the connection's authToken (when present).
   */
  token?: string;
}

/**
 * Options for batchCancel wrapper – maps directly to KrakenWebsocketBase.request.
 */
export interface KrakenWsBatchCancelOptions {
  reqId?: number;
  timeoutMs?: number;
  attachAuthToken?: boolean;
}

/**
 * Result payload inside the WS envelope for batch_cancel.
 */
export interface KrakenWsBatchCancelResult {
  /**
   * Number of orders cancelled.
   */
  count: number;

  /**
   * Advisory messages about deprecated fields or upcoming changes.
   */
  warnings?: string[];
}

/**
 * Full WS envelope returned from batch_cancel.
 */
export type KrakenWsBatchCancelResponse =
  KrakenWsMethodResponseEnvelope<KrakenWsBatchCancelResult>;

/**
 * Cancel multiple orders (2–50 identifiers) in a single WS v2 request.
 *
 * - `orders` may contain Kraken `order_id` or client `order_userref`
 *   identifiers (as strings).
 * - `cl_ord_id` may contain additional client identifiers.
 *
 * Kraken docs: method = "batch_cancel" (authenticated)
 */
export async function batchCancel(
  ws: KrakenWebsocketBase,
  params: KrakenWsBatchCancelParams,
  options: KrakenWsBatchCancelOptions = {},
): Promise<KrakenWsBatchCancelResponse> {
  if (!Array.isArray(params.orders) || params.orders.length < 2) {
    throw new Error(
      'Kraken WS batch_cancel: `orders` must contain at least 2 identifiers',
    );
  }
  if (params.orders.length > 50) {
    throw new Error(
      'Kraken WS batch_cancel: `orders` must not contain more than 50 identifiers',
    );
  }

  return ws.request<KrakenWsBatchCancelParams, KrakenWsBatchCancelResult>(
    'batch_cancel',
    params,
    {
      reqId: options.reqId,
      timeoutMs: options.timeoutMs,
      attachAuthToken: options.attachAuthToken,
    },
  );
}
