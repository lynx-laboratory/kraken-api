import {
  KrakenWebsocketBase,
  KrakenWsMethodResponseEnvelope,
} from '../../../base/websocketBase';

/**
 * Parameters for WS v2 cancel_all_orders_after.
 *
 * NOTE:
 * - `token` is optional because KrakenWebsocketBase can inject it from
 *   the connection options.
 * - `req_id` is handled by KrakenWebsocketBase.request; do not include it here.
 */
export interface KrakenWsCancelAllOrdersAfterParams {
  /**
   * Duration (in seconds) to set/extend the timer.
   *
   * - Must be >= 0 and < 86400.
   * - 0 disables the mechanism.
   */
  timeout: number;

  /**
   * Session token. Optional: if omitted, KrakenWebsocketBase will inject
   * the connection's authToken (when present).
   */
  token?: string;
}

/**
 * Options for cancelAllOrdersAfter wrapper – maps directly to KrakenWebsocketBase.request.
 */
export interface KrakenWsCancelAllOrdersAfterOptions {
  reqId?: number;
  timeoutMs?: number;
  attachAuthToken?: boolean;
}

/**
 * Result payload inside the WS envelope for cancel_all_orders_after.
 */
export interface KrakenWsCancelAllOrdersAfterResult {
  /**
   * Current engine time.
   */
  currentTime: string;

  /**
   * Time when all orders will be expired in the engine.
   */
  triggerTime: string;

  /**
   * Advisory messages about deprecated fields or upcoming changes.
   */
  warnings?: string[];
}

/**
 * Full WS envelope returned from cancel_all_orders_after.
 */
export type KrakenWsCancelAllOrdersAfterResponse =
  KrakenWsMethodResponseEnvelope<KrakenWsCancelAllOrdersAfterResult>;

/**
 * Configure the "Dead Man's Switch" timer that cancels all orders
 * after a given number of seconds of no refresh.
 *
 * - Send `timeout > 0` to enable/extend the timer.
 * - Send `timeout = 0` to disable the mechanism.
 *
 * Kraken docs: method = "cancel_all_orders_after" (authenticated)
 */
export async function cancelAllOrdersAfter(
  ws: KrakenWebsocketBase,
  params: KrakenWsCancelAllOrdersAfterParams,
  options: KrakenWsCancelAllOrdersAfterOptions = {},
): Promise<KrakenWsCancelAllOrdersAfterResponse> {
  if (!Number.isFinite(params.timeout)) {
    throw new Error(
      'Kraken WS cancel_all_orders_after: `timeout` must be a finite number (seconds)',
    );
  }
  if (params.timeout < 0 || params.timeout >= 86400) {
    throw new Error(
      'Kraken WS cancel_all_orders_after: `timeout` must be >= 0 and < 86400 seconds',
    );
  }

  return ws.request<
    KrakenWsCancelAllOrdersAfterParams,
    KrakenWsCancelAllOrdersAfterResult
  >('cancel_all_orders_after', params, {
    reqId: options.reqId,
    timeoutMs: options.timeoutMs,
    attachAuthToken: options.attachAuthToken,
  });
}
