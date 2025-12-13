import {
  KrakenWebsocketBase,
  KrakenWsMethodResponseEnvelope,
} from '../../../base/websocketBase';

/**
 * Parameters for WS v2 cancel_all.
 *
 * NOTE:
 * - `token` is optional because KrakenWebsocketBase can inject it from
 *   the connection options.
 * - `req_id` is handled by KrakenWebsocketBase.request; do not include it here.
 */
export interface KrakenWsCancelAllParams {
  /**
   * Session token. Optional: if omitted, KrakenWebsocketBase will inject
   * the connection's authToken (when present).
   */
  token?: string;
}

/**
 * Options for cancelAll wrapper – maps directly to KrakenWebsocketBase.request.
 */
export interface KrakenWsCancelAllOptions {
  reqId?: number;
  timeoutMs?: number;
  attachAuthToken?: boolean;
}

/**
 * Result payload inside the WS envelope for cancel_all.
 */
export interface KrakenWsCancelAllResult {
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
 * Full WS envelope returned from cancel_all.
 */
export type KrakenWsCancelAllResponse =
  KrakenWsMethodResponseEnvelope<KrakenWsCancelAllResult>;

/**
 * Cancel all open orders via WS v2 (including untriggered orders
 * and orders resting in the book).
 *
 * Kraken docs: method = "cancel_all" (authenticated)
 */
export async function cancelAll(
  ws: KrakenWebsocketBase,
  params: KrakenWsCancelAllParams = {},
  options: KrakenWsCancelAllOptions = {},
): Promise<KrakenWsCancelAllResponse> {
  return ws.request<KrakenWsCancelAllParams, KrakenWsCancelAllResult>(
    'cancel_all',
    params,
    {
      reqId: options.reqId,
      timeoutMs: options.timeoutMs,
      attachAuthToken: options.attachAuthToken,
    },
  );
}
