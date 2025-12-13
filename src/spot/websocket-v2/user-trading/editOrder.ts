import {
  KrakenWebsocketBase,
  KrakenWsMethodResponseEnvelope,
} from '../../../base/websocketBase';
import type {
  KrakenWsFeePreference,
  KrakenWsTriggerReference,
  KrakenWsAddOrderTriggers,
} from './addOrder';

/**
 * Parameters for WS v2 edit_order.
 *
 * NOTE:
 * - `order_id` and `symbol` are required.
 * - This is the legacy edit endpoint; for new integrations, prefer `amendOrder`
 *   where possible (better semantics, preserves queue where possible, etc.).
 *
 * Caveats from Kraken:
 * - Triggered stop-loss / take-profit orders are not supported.
 * - Orders with conditional close terms are not supported.
 * - Orders where executed volume > new volume are rejected.
 * - `cl_ord_id` is NOT supported.
 * - Queue position is not maintained.
 *
 * NOTE:
 * - `token` is optional because KrakenWebsocketBase can inject it from
 *   the connection options.
 * - `req_id` is handled by KrakenWebsocketBase.request; do not include it here.
 */
export interface KrakenWsEditOrderParams {
  /**
   * The Kraken identifier for the order to be edited.
   */
  order_id: string;

  /**
   * The original symbol identifier for the pair, e.g. "BTC/USD".
   * Note: the symbol cannot be changed.
   */
  symbol: string;

  /**
   * New order quantity in terms of the base asset.
   */
  order_qty?: number;

  /**
   * For iceberg orders only: quantity to show in the book while the rest of
   * the order quantity remains hidden.
   *
   * Minimum value is 1 / 15 of order_qty.
   */
  display_qty?: number;

  /**
   * Fee preference base or quote currency. `quote` is the default for buy
   * orders, `base` is the default for sell orders.
   */
  fee_preference?: KrakenWsFeePreference;

  /**
   * Limit price for order types that support limit price restriction.
   */
  limit_price?: number;

  /**
   * Deprecated: use `limit_price` instead.
   */
  price?: number;

  /**
   * Deprecated: disables Market Price Protection (MPP) if true (accepted but ignored).
   */
  no_mpp?: boolean;

  /**
   * User defined reference to be placed on the edited order.
   * This does NOT identify the order to be edited; use `order_id`.
   */
  order_userref?: number;

  /**
   * Cancels the order if it will take liquidity on arrival.
   * (Orders with limit price only.)
   */
  post_only?: boolean;

  /**
   * Reduces an existing margin position without opening an opposite long or
   * short position worth more than the current value of your leveraged assets.
   */
  reduce_only?: boolean;

  /**
   * Trigger parameters (for triggered order types only).
   */
  triggers?: KrakenWsAddOrderTriggers;

  /**
   * Deprecated: use `triggers.reference` instead.
   */
  trigger?: KrakenWsTriggerReference;

  /**
   * Deprecated: use `triggers.price` instead.
   */
  stop_price?: number;

  /**
   * Validate-only mode. If true, the order will be validated but not
   * sent to the matching engine.
   */
  validate?: boolean;

  /**
   * Deadline for this edit, RFC3339 with millisecond precision.
   * Range of valid offsets (from current time) is 500ms to 60s;
   * default is 5s.
   */
  deadline?: string;

  /**
   * Session token. Optional: if omitted, KrakenWebsocketBase will inject
   * the connection's authToken (when present).
   */
  token?: string;

  /**
   * Required so this satisfies Record<string, unknown> for ws.request<>.
   */
  [key: string]: unknown;
}

/**
 * Options for editOrder wrapper – maps directly to KrakenWebsocketBase.request.
 */
export interface KrakenWsEditOrderOptions {
  reqId?: number;
  timeoutMs?: number;
  attachAuthToken?: boolean;
}

/**
 * Result payload inside the WS envelope for edit_order.
 */
export interface KrakenWsEditOrderResult {
  /**
   * Unique ID of the new edited order.
   */
  order_id: string;

  /**
   * ID of the original order that was edited (and cancelled).
   */
  original_order_id: string;

  /**
   * Advisory messages about deprecated fields or upcoming changes.
   */
  warnings?: string[];
}

/**
 * Full WS envelope returned from edit_order.
 */
export type KrakenWsEditOrderResponse =
  KrakenWsMethodResponseEnvelope<KrakenWsEditOrderResult>;

/**
 * Edit (replace) an existing order via WS v2.
 *
 * This is the legacy edit endpoint:
 * - The original order is cancelled.
 * - A new order is created with adjusted parameters.
 * - A new `order_id` is returned.
 *
 * For new integrations, prefer `amendOrder` which:
 * - preserves queue position where possible,
 * - supports more order types / conditions,
 * - keeps the same order identifiers.
 *
 * Kraken docs: method = "edit_order" (authenticated)
 */
export async function editOrder(
  ws: KrakenWebsocketBase,
  params: KrakenWsEditOrderParams,
  options: KrakenWsEditOrderOptions = {},
): Promise<KrakenWsEditOrderResponse> {
  return ws.request<KrakenWsEditOrderParams, KrakenWsEditOrderResult>(
    'edit_order',
    params,
    {
      reqId: options.reqId,
      timeoutMs: options.timeoutMs,
      attachAuthToken: options.attachAuthToken,
    },
  );
}
