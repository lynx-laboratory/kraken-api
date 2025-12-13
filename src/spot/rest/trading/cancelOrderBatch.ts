import type { KrakenRestBase } from '../../../base/restBase';
import type { KrakenCancelOrderResult } from './cancelOrder';

/**
 * Single cancel entry by txid or userref.
 *
 * The API uses the same `txid` field for both Kraken order ids
 * and user references (integers).
 */
export interface KrakenCancelOrderBatchOrderRef {
  /**
   * Kraken order transaction ID (txid) OR user reference (userref).
   *
   * We accept number (for userref) or string and stringify before
   * sending to Kraken.
   */
  txid: string | number;
}

/**
 * Parameters for CancelOrderBatch.
 *
 * - `orders` is an array of objects containing txid/userref.
 * - `clOrdIds` is a flat array of client order IDs.
 *
 * Total unique IDs across both must be <= 50.
 */
export interface KrakenCancelOrderBatchParams {
  /**
   * Open order transaction IDs (txid) or user references (userref),
   * up to a maximum of 50 total unique IDs/references.
   */
  orders?: KrakenCancelOrderBatchOrderRef[];

  /**
   * Client order identifiers, up to a maximum of 50 total
   * unique IDs/references.
   */
  clOrdIds?: string[];
}

/**
 * Result payload for CancelOrderBatch.
 *
 * Kraken docs describe the same semantics as CancelOrder:
 * - `count`: number of orders cancelled
 * - `pending`: if true, cancels are still pending
 */
export type KrakenCancelOrderBatchResult = KrakenCancelOrderResult;

/**
 * POST /0/private/CancelOrderBatch
 *
 * Cancel multiple open orders by txid/userref or cl_ord_id.
 *
 * Notes:
 * - Max 50 total unique IDs/references across both arrays.
 * - `nonce` & signing handled by KrakenRestBase.
 */
export function cancelOrderBatch(
  base: KrakenRestBase,
  params: KrakenCancelOrderBatchParams,
): Promise<KrakenCancelOrderBatchResult> {
  const { orders, clOrdIds } = params;

  const countOrders = orders?.length ?? 0;
  const countClOrdIds = clOrdIds?.length ?? 0;
  const total = countOrders + countClOrdIds;

  if (total === 0) {
    throw new Error(
      'KrakenCancelOrderBatchParams: at least one txid/userref or cl_ord_id is required',
    );
  }

  if (total > 50) {
    throw new Error(
      `KrakenCancelOrderBatchParams: maximum 50 total ids/references allowed, got ${total}`,
    );
  }

  const body: Record<string, string> = {};

  if (orders && orders.length > 0) {
    // API expects: orders=[{txid:<string>}, ...] JSON-encoded
    const wireOrders = orders.map((o) => ({
      txid: String(o.txid),
    }));

    body.orders = JSON.stringify(wireOrders);
  }

  if (clOrdIds && clOrdIds.length > 0) {
    // API expects: cl_ord_ids=[{cl_ord_id:<string>}, ...] JSON-encoded
    const wireClOrdIds = clOrdIds.map((id) => ({
      cl_ord_id: id,
    }));

    body.cl_ord_ids = JSON.stringify(wireClOrdIds);
  }

  return base.privatePost<KrakenCancelOrderBatchResult>(
    '/0/private/CancelOrderBatch',
    body,
  );
}
