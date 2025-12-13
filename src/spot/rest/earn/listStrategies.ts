import type { KrakenRestBase } from '../../../base/restBase';

export type KrakenEarnLockType = 'flex' | 'bonded' | 'timed' | 'instant';

export interface KrakenEarnListStrategiesParams {
  ascending?: boolean | null;
  asset?: string | null;
  cursor?: string | null;
  limit?: number | null;
  lock_type?: ReadonlyArray<KrakenEarnLockType> | null;
}

export interface KrakenEarnAprEstimate {
  low: string;
  high: string;
}

export interface KrakenEarnFeeInfo {
  fee: string;
}

export interface KrakenEarnAutoCompoundInfo {
  type: string;
}

export interface KrakenEarnLockTypeInfo {
  type: KrakenEarnLockType | string;
}

export interface KrakenEarnYieldSourceInfo {
  type: string;
}

export interface KrakenEarnStrategy {
  allocation_fee: KrakenEarnFeeInfo | string | number;
  allocation_restriction_info?: string[];
  apr_estimate?: KrakenEarnAprEstimate | null;
  asset: string;
  auto_compound: KrakenEarnAutoCompoundInfo;
  can_allocate: boolean;
  can_deallocate: boolean;
  deallocation_fee: KrakenEarnFeeInfo | string | number;
  id: string;
  lock_type: KrakenEarnLockTypeInfo;
  user_cap?: string | null;
  user_min_allocation?: string | null;
  yield_source: KrakenEarnYieldSourceInfo;
}

export interface KrakenEarnListStrategiesResultObject {
  items: KrakenEarnStrategy[];
  next_cursor: string | null;
}

export type KrakenEarnListStrategiesResult =
  KrakenEarnListStrategiesResultObject | null;

/**
 * List earn strategies available to the user along with their parameters.
 *
 * Requires a valid API key but no specific permission.
 * Only strategies available to the user (e.g. based on geographic region)
 * are returned.
 *
 * Kraken docs: POST /0/private/Earn/Strategies
 */
export async function listEarnStrategies(
  base: KrakenRestBase,
  params: KrakenEarnListStrategiesParams = {},
): Promise<KrakenEarnListStrategiesResult> {
  const { ascending, asset, cursor, limit, lock_type } = params;

  // IMPORTANT: keep this in sync with KrakenRestBase.privatePost signature:
  // Record<string, string | number | boolean>
  const body: Record<string, string | number | boolean> = {};

  if (ascending !== undefined && ascending !== null) {
    body.ascending = ascending;
  }
  if (asset !== undefined && asset !== null) {
    body.asset = asset;
  }
  if (cursor !== undefined && cursor !== null) {
    body.cursor = cursor;
  }
  if (limit !== undefined && limit !== null) {
    body.limit = limit;
  }
  if (lock_type && lock_type.length > 0) {
    // Encode array as JSON string, same pattern as batch endpoints.
    body.lock_type = JSON.stringify(lock_type);
  }

  return base.privatePost<KrakenEarnListStrategiesResult>(
    '/0/private/Earn/Strategies',
    body,
  );
}
