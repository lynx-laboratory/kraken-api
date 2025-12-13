import type { KrakenRestBase } from '../../../base/restBase';

export interface KrakenEarnAllocateFundsParams {
  /**
   * The amount to allocate.
   * Will be sent to Kraken as a string.
   */
  amount: string | number;

  /**
   * A unique identifier of the chosen earn strategy,
   * as returned from /0/private/Earn/Strategies.
   */
  strategy_id: string;
}

/**
 * Will return `true` when the operation is successful,
 * `null` when an error occurred.
 *
 * NOTE: This endpoint is asynchronous. You must poll
 * /0/private/Earn/AllocateStatus for the final status.
 */
export type KrakenEarnAllocateFundsResult = boolean | null;

/**
 * Allocate funds to an Earn strategy.
 *
 * Requires the Earn Funds API key permission.
 *
 * This method is asynchronous — only preflight checks are done
 * synchronously. For the full result, poll /0/private/Earn/AllocateStatus.
 *
 * Kraken docs: POST /0/private/Earn/Allocate
 */
export async function allocateEarnFunds(
  base: KrakenRestBase,
  params: KrakenEarnAllocateFundsParams,
): Promise<KrakenEarnAllocateFundsResult> {
  const { amount, strategy_id } = params;

  const body: Record<string, string> = {
    amount: String(amount),
    strategy_id,
  };

  // KrakenRestBase.privatePost unwraps { error, result } and returns just result.
  return base.privatePost<KrakenEarnAllocateFundsResult>(
    '/0/private/Earn/Allocate',
    body,
  );
}
