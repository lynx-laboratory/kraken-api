import type { KrakenRestBase } from '../../../base/restBase';
import * as AllocateEarnFunds from './allocateEarnFunds';
import * as DeallocateEarnFunds from './deallocateEarnFunds';
import * as GetAllocationStatus from './getAllocationStatus';
import * as GetDeallocationStatus from './getDeallocationStatus';
import * as ListStrategies from './listStrategies';
import * as ListAllocations from './listAllocations';

/**
 * Kraken Spot Earn API.
 *
 * Covers allocation and deallocation of funds to Earn strategies,
 * plus related status / strategy discovery endpoints.
 */
export class KrakenSpotEarnApi {
  constructor(private readonly base: KrakenRestBase) {}

  /**
   * Allocate funds to an Earn strategy.
   *
   * Note:
   * - Requires the Earn Funds API key permission.
   * - Operation is asynchronous; poll AllocateStatus for completion.
   *
   * @example
   * ```ts
   * const res = await kraken.earn.allocateFunds({
   *   amount: "100",
   *   strategy_id: "STRAT-123",
   * });
   *
   * if (res === true) {
   *   console.log("preflight checks passed, allocation dispatched");
   * } else {
   *   console.log("preflight failed or returned null");
   * }
   * ```
   */
  allocateFunds(params: AllocateEarnFunds.KrakenEarnAllocateFundsParams) {
    return AllocateEarnFunds.allocateEarnFunds(this.base, params);
  }

  /**
   * Deallocate funds from an Earn strategy.
   *
   * Note:
   * - Requires the Earn Funds API key permission.
   * - Operation is asynchronous; poll DeallocateStatus for completion.
   *
   * @example
   * ```ts
   * const res = await kraken.earn.deallocateFunds({
   *   amount: "50",
   *   strategy_id: "STRAT-123",
   * });
   *
   * if (res === true) {
   *   console.log("preflight checks passed, deallocation dispatched");
   * } else {
   *   console.log("preflight failed or returned null");
   * }
   * ```
   */
  deallocateFunds(params: DeallocateEarnFunds.KrakenEarnDeallocateFundsParams) {
    return DeallocateEarnFunds.deallocateEarnFunds(this.base, params);
  }

  /**
   * Get the status of the last allocation/deallocation request for
   * a given strategy (allocate-side status).
   *
   * Requires either Earn Funds or Query Funds API key permission.
   *
   * @example
   * ```ts
   * const status = await kraken.earn.getAllocationStatus({
   *   strategy_id: "STRAT-123",
   * });
   *
   * if (!status) {
   *   console.log("no allocation status available");
   * } else if (status.pending) {
   *   console.log("allocation still in progress");
   * } else {
   *   console.log("allocation completed");
   * }
   * ```
   */
  getAllocationStatus(
    params: GetAllocationStatus.KrakenEarnGetAllocationStatusParams,
  ) {
    return GetAllocationStatus.getAllocationStatus(this.base, params);
  }

  /**
   * Get the status of the last deallocation request for
   * a given strategy (deallocate-side status).
   *
   * Requires either Earn Funds or Query Funds API key permission.
   *
   * @example
   * ```ts
   * const status = await kraken.earn.getDeallocationStatus({
   *   strategy_id: "STRAT-123",
   * });
   *
   * if (!status) {
   *   console.log("no deallocation status available");
   * } else if (status.pending) {
   *   console.log("deallocation still in progress");
   * } else {
   *   console.log("deallocation completed");
   * }
   * ```
   */
  getDeallocationStatus(
    params: GetDeallocationStatus.KrakenEarnGetDeallocationStatusParams,
  ) {
    return GetDeallocationStatus.getDeallocationStatus(this.base, params);
  }

  /**
   * List earn strategies available to the user along with their parameters.
   *
   * Requires a valid API key but no specific permission.
   * Only strategies available to the user (e.g. based on geographic region)
   * are returned.
   *
   * @example
   * ```ts
   * const res = await kraken.earn.listStrategies({
   *   asset: "USDT",
   *   lock_type: ["flex", "bonded"],
   * });
   *
   * if (!res) {
   *   console.log("no strategies available");
   * } else {
   *   for (const s of res.items) {
   *     console.log(
   *       s.id,
   *       s.asset,
   *       s.lock_type.type,
   *       "can_allocate:", s.can_allocate,
   *       "APR:", s.apr_estimate?.low, "-", s.apr_estimate?.high,
   *     );
   *   }
   * }
   * ```
   */
  listStrategies(params: ListStrategies.KrakenEarnListStrategiesParams = {}) {
    return ListStrategies.listEarnStrategies(this.base, params);
  }

  /**
   * List all Earn allocations for the user.
   *
   * Requires the Query Funds API key permission.
   *
   * By default, all allocations are returned, even for strategies
   * that currently have zero balance. Use `hide_zero_allocations`
   * to omit those entries.
   *
   * @example
   * ```ts
   * const res = await kraken.earn.listAllocations({
   *   converted_asset: "USD",
   *   hide_zero_allocations: true,
   * });
   *
   * if (!res) {
   *   console.log("no allocations found");
   * } else {
   *   console.log("total allocated (USD):", res.total_allocated);
   *   console.log("total rewarded (USD):", res.total_rewarded);
   *
   *   for (const a of res.items) {
   *     console.log(
   *       "strategy:", a.strategy_id,
   *       "native asset:", a.native_asset,
   *       "allocated (native):", a.amount_allocated.native,
   *       "allocated (converted):", a.amount_allocated.converted,
   *     );
   *   }
   * }
   * ```
   */
  listAllocations(
    params: ListAllocations.KrakenEarnListAllocationsParams = {},
  ) {
    return ListAllocations.listEarnAllocations(this.base, params);
  }
}

// Re-export types for consumers
export type KrakenEarnAllocateFundsParams =
  AllocateEarnFunds.KrakenEarnAllocateFundsParams;
export type KrakenEarnAllocateFundsResult =
  AllocateEarnFunds.KrakenEarnAllocateFundsResult;

export type KrakenEarnDeallocateFundsParams =
  DeallocateEarnFunds.KrakenEarnDeallocateFundsParams;
export type KrakenEarnDeallocateFundsResult =
  DeallocateEarnFunds.KrakenEarnDeallocateFundsResult;

export type KrakenEarnGetAllocationStatusParams =
  GetAllocationStatus.KrakenEarnGetAllocationStatusParams;
export type KrakenEarnGetAllocationStatusResult =
  GetAllocationStatus.KrakenEarnGetAllocationStatusResult;
export type KrakenEarnAllocationStatus =
  GetAllocationStatus.KrakenEarnAllocationStatus;

export type KrakenEarnGetDeallocationStatusParams =
  GetDeallocationStatus.KrakenEarnGetDeallocationStatusParams;
export type KrakenEarnGetDeallocationStatusResult =
  GetDeallocationStatus.KrakenEarnGetDeallocationStatusResult;
export type KrakenEarnDeallocationStatus =
  GetDeallocationStatus.KrakenEarnDeallocationStatus;

export type KrakenEarnListStrategiesParams =
  ListStrategies.KrakenEarnListStrategiesParams;
export type KrakenEarnListStrategiesResult =
  ListStrategies.KrakenEarnListStrategiesResult;
export type KrakenEarnStrategy = ListStrategies.KrakenEarnStrategy;
export type KrakenEarnLockType = ListStrategies.KrakenEarnLockType;
export type KrakenEarnListStrategiesResultObject =
  ListStrategies.KrakenEarnListStrategiesResultObject;

export type KrakenEarnListAllocationsParams =
  ListAllocations.KrakenEarnListAllocationsParams;
export type KrakenEarnListAllocationsResult =
  ListAllocations.KrakenEarnListAllocationsResult;
export type KrakenEarnAllocationItem = ListAllocations.KrakenEarnAllocationItem;
export type KrakenEarnAmountBreakdown =
  ListAllocations.KrakenEarnAmountBreakdown;
export type KrakenEarnListAllocationsResultObject =
  ListAllocations.KrakenEarnListAllocationsResultObject;
