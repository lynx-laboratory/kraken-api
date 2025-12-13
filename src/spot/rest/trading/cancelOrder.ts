import type { KrakenRestBase } from '../../../base/restBase';

/**
 * Cancel a particular open order (or set of open orders) by:
 * - Kraken order identifier(s) (txid),
 * - user reference (userref), or
 * - client order identifier(s) (cl_ord_id).
 *
 * Exactly one of these fields must be provided.
 */
export interface KrakenCancelOrderParams {
  /**
   * Kraken order identifier(s).
   * Can be a single txid or an array which will be joined with commas.
   */
  txid?: string | string[];

  /**
   * User reference to cancel against.
   * When provided, Kraken expects it in the `txid` field as an integer.
   */
  userref?: number;

  /**
   * Client order identifier(s).
   * Can be a single ID or an array, joined with commas.
   */
  cl_ord_id?: string | string[];
}

/**
 * Result payload for CancelOrder and CancelAll.
 */
export interface KrakenCancelOrderResult {
  /** Number of orders cancelled */
  count: number;

  /** If true, orders are pending cancellation */
  pending?: boolean;
}

/**
 * POST /0/private/CancelOrder
 *
 * Cancel one or more open orders by txid, userref, or cl_ord_id.
 *
 * Notes:
 * - `nonce` is handled automatically by KrakenRestBase.
 * - Requires "Create & modify orders" or "Cancel & close orders".
 */
export function cancelOrder(
  base: KrakenRestBase,
  params: KrakenCancelOrderParams,
): Promise<KrakenCancelOrderResult> {
  const { txid, userref, cl_ord_id } = params;

  const provided =
    (txid !== undefined ? 1 : 0) +
    (userref !== undefined ? 1 : 0) +
    (cl_ord_id !== undefined ? 1 : 0);

  if (provided === 0) {
    throw new Error(
      'KrakenCancelOrderParams: one of txid, userref, or cl_ord_id must be provided',
    );
  }

  if (provided > 1) {
    throw new Error(
      'KrakenCancelOrderParams: txid, userref, and cl_ord_id are mutually exclusive; provide exactly one',
    );
  }

  const body: Record<string, string> = {};

  if (userref !== undefined) {
    // Cancel by userref: Kraken expects it in `txid` field as an integer
    body.txid = String(userref);
  } else if (cl_ord_id !== undefined) {
    // Cancel by client order id(s)
    body.cl_ord_id = Array.isArray(cl_ord_id) ? cl_ord_id.join(',') : cl_ord_id;
  } else if (txid !== undefined) {
    // Cancel by txid(s)
    body.txid = Array.isArray(txid) ? txid.join(',') : txid;
  }

  return base.privatePost<KrakenCancelOrderResult>(
    '/0/private/CancelOrder',
    body,
  );
}
