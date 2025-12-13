import type { KrakenRestBase } from '../../../base/restBase';
import type { KrakenRebaseMultiplier } from './getAccountBalance';

export type KrakenOrderAmendType = 'original' | 'user' | 'restated';

/**
 * Single amend entry in the audit trail.
 *
 * The first entry contains the original order parameters
 * and has amend_type of "original".
 */
export interface KrakenOrderAmendEntry {
  /** Kraken amend identifier */
  amend_id: string;

  /**
   * The type of amend transaction:
   * - "original": original order values on order entry
   * - "user":     user requested amendment
   * - "restated": engine order maintenance amendment
   */
  amend_type: KrakenOrderAmendType;

  /** Order quantity in terms of the base asset */
  order_qty: string;

  /** Quantity shown in the book for iceberg orders */
  display_qty: string;

  /** Remaining un-traded quantity on the order */
  remaining_qty: string;

  /** Limit price restriction on the order */
  limit_price: string;

  /** Trigger price on trigger order types */
  trigger_price: string;

  /** Description of the reason for this amend */
  reason: string;

  /** Indicates if the transaction was restricted from taking liquidity */
  post_only: boolean;

  /** UNIX timestamp for the amend transaction */
  timestamp: number;
}

/**
 * Full amend history result for an order.
 */
export interface KrakenOrderAmendsResult {
  /**
   * Total count of new and amend transactions
   * (includes the original order entry).
   */
  count: number;

  /**
   * List of amend transactions ordered by ascending amend timestamp.
   */
  amends: KrakenOrderAmendEntry[];
}

export interface KrakenGetOrderAmendsParams {
  /**
   * The Kraken order identifier for the amended order.
   */
  order_id: string;

  /**
   * Optional parameter for viewing xstocks data.
   *
   * - "rebased": Display in terms of underlying equity.
   * - "base":    Display in terms of SPV tokens.
   *
   * Default on Kraken is "rebased" if omitted.
   */
  rebase_multiplier?: KrakenRebaseMultiplier;
}

/**
 * POST /0/private/OrderAmends
 *
 * Retrieves an audit trail of amend transactions on the specified order.
 * The list is ordered by ascending amend timestamp.
 *
 * Note:
 * - `nonce` is handled automatically by the client.
 * - Requires the appropriate "Orders and trades" query permission,
 *   depending on the status of the order.
 */
export function getOrderAmends(
  base: KrakenRestBase,
  params: KrakenGetOrderAmendsParams,
): Promise<KrakenOrderAmendsResult> {
  const body: Record<string, string> = {
    order_id: params.order_id,
  };

  if (params.rebase_multiplier) {
    body.rebase_multiplier = params.rebase_multiplier;
  }

  return base.privatePost<KrakenOrderAmendsResult>(
    '/0/private/OrderAmends',
    body,
  );
}
