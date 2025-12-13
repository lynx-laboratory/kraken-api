import type { KrakenRestBase } from '../../../base/restBase';

export interface KrakenEarnDeallocateFundsParams {
  /**
   * The amount to deallocate.
   * Will be sent to Kraken as a string.
   */
  amount: string | number;

  /**
   * A unique identifier of the chosen earn strategy.
   */
  strategy_id: string;
}

/**
 * Will return `true` when the operation is successful,
 * `null` when an error occurred.
 *
 * NOTE: This endpoint is asynchronous. You must poll
 * /0/private/Earn/DeallocateStatus (and/or use Allocations)
 * for the final status.
 */
export type KrakenEarnDeallocateFundsResult = boolean | null;

/**
 * Deallocate funds from an Earn strategy.
 *
 * Requires the Earn Funds API key permission.
 *
 * This method is asynchronous — only preflight checks are done
 * synchronously. For the full result, poll /0/private/Earn/DeallocateStatus.
 *
 * Kraken docs: POST /0/private/Earn/Deallocate
 */
export async function deallocateEarnFunds(
  base: KrakenRestBase,
  params: KrakenEarnDeallocateFundsParams,
): Promise<KrakenEarnDeallocateFundsResult> {
  const { amount, strategy_id } = params;

  const body: Record<string, string> = {
    amount: String(amount),
    strategy_id,
  };

  // KrakenRestBase.privatePost unwraps { error, result } and returns just result.
  return base.privatePost<KrakenEarnDeallocateFundsResult>(
    '/0/private/Earn/Deallocate',
    body,
  );
}
