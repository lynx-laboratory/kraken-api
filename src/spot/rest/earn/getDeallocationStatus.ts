import type { KrakenRestBase } from '../../../base/restBase';

export interface KrakenEarnGetDeallocationStatusParams {
  /**
   * ID of the earn strategy.
   * Call /0/private/Earn/Strategies to list available strategies.
   */
  strategy_id: string;
}

/**
 * Status of async earn (de)allocation operation.
 *
 * Same shape as AllocateStatus.
 */
export interface KrakenEarnDeallocationStatus {
  /**
   * true if an operation is still in progress on the same strategy,
   * false if it has successfully completed.
   */
  pending: boolean;
}

export type KrakenEarnGetDeallocationStatusResult =
  KrakenEarnDeallocationStatus | null;

/**
 * Get the status of the last deallocation request for a strategy.
 *
 * Requires either the Earn Funds or Query Funds API key permission.
 *
 * Kraken docs: POST /0/private/Earn/DeallocateStatus
 */
export async function getDeallocationStatus(
  base: KrakenRestBase,
  params: KrakenEarnGetDeallocationStatusParams,
): Promise<KrakenEarnGetDeallocationStatusResult> {
  const { strategy_id } = params;

  const body: Record<string, string> = {
    strategy_id,
  };

  // KrakenRestBase.privatePost unwraps { error, result } and returns just result.
  return base.privatePost<KrakenEarnGetDeallocationStatusResult>(
    '/0/private/Earn/DeallocateStatus',
    body,
  );
}
