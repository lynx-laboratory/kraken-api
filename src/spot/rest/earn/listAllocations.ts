import type { KrakenRestBase } from '../../../base/restBase';

export interface KrakenEarnListAllocationsParams {
  /**
   * true to sort ascending, false (the default) for descending.
   */
  ascending?: boolean | null;

  /**
   * A secondary currency to express the value of your allocations
   * (the default is USD).
   */
  converted_asset?: string | null;

  /**
   * Omit entries for strategies that were used in the past but now
   * hold no allocation (default is false).
   */
  hide_zero_allocations?: boolean | null;
}

/**
 * Simple converted/native pair used in many Earn allocation fields.
 */
export interface KrakenEarnAmountBreakdown {
  /**
   * Amount converted into the requested asset.
   */
  converted: string;

  /**
   * Amount in the native asset.
   */
  native: string;
}

/**
 * Per-allocation detail for a bonding/exit_queue/unbonding state.
 */
export interface KrakenEarnStateAllocationDetail {
  /**
   * Amount converted into the requested asset.
   */
  converted: string;

  /**
   * Amount in the native asset.
   */
  native: string;

  /**
   * Date/time when the (de)allocation request was received/processed.
   */
  created_at: string;

  /**
   * Date/time when the funds will move to the next state.
   */
  expires: string;
}

/**
 * Aggregated block for bonding/exit_queue/unbonding.
 */
export interface KrakenEarnStateAllocationBlock {
  /**
   * The total number of allocations in this state for this asset.
   */
  allocation_count: number;

  /**
   * Details about when each allocation will expire and move
   * to the next state.
   */
  allocations: KrakenEarnStateAllocationDetail[];

  /**
   * Amount converted into the requested asset.
   */
  converted: string;

  /**
   * Amount in the native asset.
   */
  native: string;
}

/**
 * Amounts allocated to this Earn strategy, broken down by state.
 */
export interface KrakenEarnAmountAllocated {
  /**
   * Amount allocated in bonding status.
   * Only present when there are bonding allocations.
   */
  bonding?: KrakenEarnStateAllocationBlock | null;

  /**
   * Amount allocated in the exit-queue status (ETH only).
   * Only present when there are exit_queue allocations.
   */
  exit_queue?: KrakenEarnStateAllocationBlock | null;

  /**
   * Pending allocation amount – can be negative if the pending
   * operation is a deallocation. Only present when there are
   * pending allocations.
   */
  pending?: KrakenEarnAmountBreakdown | null;

  /**
   * Total amount allocated to this Earn strategy.
   */
  total: KrakenEarnAmountBreakdown;

  /**
   * Amount allocated in unbonding status.
   * Only present when there are unbonding allocations.
   */
  unbonding?: KrakenEarnStateAllocationBlock | null;

  /**
   * Total amount converted into the requested asset for this strategy.
   */
  converted: string;

  /**
   * Total amount in the native asset for this strategy.
   */
  native: string;
}

/**
 * Information about the current payout period.
 */
export interface KrakenEarnPayoutInfo {
  /**
   * Reward accumulated in the payout period until now.
   */
  accumulated_reward: KrakenEarnAmountBreakdown;

  /**
   * Estimated reward from now until the payout.
   */
  estimated_reward: KrakenEarnAmountBreakdown;

  /**
   * Tentative date of the next reward payout.
   */
  period_end: string;

  /**
   * When the current payout period started.
   * Either the date of the last payout or when it was enabled.
   */
  period_start: string;
}

/**
 * Single allocation entry per strategy.
 */
export interface KrakenEarnAllocationItem {
  /**
   * Amounts allocated to this Earn strategy, broken down by state.
   */
  amount_allocated: KrakenEarnAmountAllocated;

  /**
   * The asset of the native currency of this allocation.
   */
  native_asset: string;

  /**
   * Information about the current payout period, absent when
   * there is no current payout period.
   */
  payout?: KrakenEarnPayoutInfo | null;

  /**
   * Unique ID for Earn Strategy.
   */
  strategy_id: string;

  /**
   * Amount earned using the strategy during the whole lifetime
   * of user account.
   */
  total_rewarded: KrakenEarnAmountBreakdown;
}

/**
 * Page response for /0/private/Earn/Allocations.
 */
export interface KrakenEarnListAllocationsResultObject {
  /**
   * A secondary asset to show the value of allocations
   * (e.g. "USD").
   */
  converted_asset: string;

  /**
   * Per-strategy allocation items.
   */
  items: KrakenEarnAllocationItem[];

  /**
   * The total amount allocated across all strategies,
   * denominated in the converted_asset currency.
   */
  total_allocated: string;

  /**
   * Amount earned across all strategies during the whole lifetime
   * of user account, denominated in converted_asset currency.
   */
  total_rewarded: string;
}

/**
 * `result` is documented as `object|null`.
 */
export type KrakenEarnListAllocationsResult =
  KrakenEarnListAllocationsResultObject | null;

/**
 * List all allocations for the user.
 *
 * Requires the Query Funds API key permission.
 *
 * By default, all allocations are returned, even for strategies that
 * currently have zero balance. Use `hide_zero_allocations` to omit
 * those entries.
 *
 * Kraken docs: POST /0/private/Earn/Allocations
 */
export async function listEarnAllocations(
  base: KrakenRestBase,
  params: KrakenEarnListAllocationsParams = {},
): Promise<KrakenEarnListAllocationsResult> {
  const { ascending, converted_asset, hide_zero_allocations } = params;

  // Must match KrakenRestBase.privatePost signature:
  // Record<string, string | number | boolean>
  const body: Record<string, string | number | boolean> = {};

  if (ascending !== undefined && ascending !== null) {
    body.ascending = ascending;
  }
  if (converted_asset !== undefined && converted_asset !== null) {
    body.converted_asset = converted_asset;
  }
  if (hide_zero_allocations !== undefined && hide_zero_allocations !== null) {
    body.hide_zero_allocations = hide_zero_allocations;
  }

  return base.privatePost<KrakenEarnListAllocationsResult>(
    '/0/private/Earn/Allocations',
    body,
  );
}
