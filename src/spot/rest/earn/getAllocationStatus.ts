import type { KrakenRestBase } from '../../../base/restBase';

export interface KrakenEarnGetAllocationStatusParams {
  /**
   * ID of the earn strategy.
   * Call /0/private/Earn/Strategies to list available strategies.
   */
  strategy_id: string;
}

/**
 * Status of async earn (de)allocation operation.
 */
export interface KrakenEarnAllocationStatus {
  /**
   * true if an operation is still in progress on the same strategy,
   * false if it has successfully completed.
   */
  pending: boolean;
}

/**
 * Will be:
 * - an object with `pending` when the endpoint returns normally
 * - `null` if Kraken ever extends the schema that way (docs say "object|null")
 */
export type KrakenEarnGetAllocationStatusResult =
  KrakenEarnAllocationStatus | null;

/**
 * Get the status of the last allocation/deallocation request for a strategy.
 *
 * Requires either the Earn Funds or Query Funds API key permission.
 *
 * Kraken docs: POST /0/private/Earn/AllocateStatus
 */
export async function getAllocationStatus(
  base: KrakenRestBase,
  params: KrakenEarnGetAllocationStatusParams,
): Promise<KrakenEarnGetAllocationStatusResult> {
  const { strategy_id } = params;

  const body: Record<string, string> = {
    strategy_id,
  };

  // KrakenRestBase.privatePost unwraps { error, result } and returns just result.
  return base.privatePost<KrakenEarnGetAllocationStatusResult>(
    '/0/private/Earn/AllocateStatus',
    body,
  );
}
