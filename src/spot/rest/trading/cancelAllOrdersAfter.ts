import type { KrakenRestBase } from '../../../base/restBase';

/**
 * Params for CancelAllOrdersAfter.
 */
export interface KrakenCancelAllOrdersAfterParams {
  /**
   * Duration (in seconds) to set/extend the timer.
   * Must be < 86400.
   *
   * Use 0 to disable the timer.
   */
  timeout: number;
}

/**
 * Result payload for CancelAllOrdersAfter.
 */
export interface KrakenCancelAllOrdersAfterResult {
  /**
   * Timestamp (RFC3339) at which the request was received.
   */
  currentTime: string;

  /**
   * Timestamp (RFC3339) after which all orders will be cancelled,
   * unless the timer is extended or disabled.
   *
   * If the timer is disabled (timeout = 0), Kraken returns
   * `triggerTime` equal to `currentTime` or a past time.
   */
  triggerTime: string;
}

/**
 * POST /0/private/CancelAllOrdersAfter
 *
 * "Dead Man's Switch" for cancelling all orders after a timeout.
 *
 * Notes:
 * - `timeout` is in seconds, must be < 86400.
 * - `timeout = 0` disables the mechanism.
 * - `nonce` & signing handled by KrakenRestBase.
 * - Requires "Create & modify orders" or "Cancel & close orders".
 */
export function cancelAllOrdersAfter(
  base: KrakenRestBase,
  params: KrakenCancelAllOrdersAfterParams,
): Promise<KrakenCancelAllOrdersAfterResult> {
  const body: Record<string, string> = {
    timeout: String(params.timeout),
  };

  return base.privatePost<KrakenCancelAllOrdersAfterResult>(
    '/0/private/CancelAllOrdersAfter',
    body,
  );
}
