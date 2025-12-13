import type { KrakenRestBase } from '../../../base/restBase';
import type { KrakenCancelOrderResult } from './cancelOrder';

/**
 * Result of CancelAll. Shape is identical to CancelOrder.
 */
export type KrakenCancelAllOrdersResult = KrakenCancelOrderResult;

/**
 * POST /0/private/CancelAll
 *
 * Cancel all open orders.
 *
 * Notes:
 * - `nonce` is handled automatically by KrakenRestBase.
 * - Requires "Create & modify orders" or "Cancel & close orders".
 */
export function cancelAllOrders(
  base: KrakenRestBase,
): Promise<KrakenCancelAllOrdersResult> {
  // Body is just nonce, which RestBase adds automatically.
  return base.privatePost<KrakenCancelAllOrdersResult>(
    '/0/private/CancelAll',
    {},
  );
}
