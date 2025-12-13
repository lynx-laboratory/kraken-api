import type { KrakenRestBase } from '../../../base/restBase';
import type { KrakenRebaseMultiplier } from './getAccountBalance';

/**
 * Fee tier info for a single pair (taker or maker side).
 */
export interface KrakenFeeTierInfo {
  /** Current fee (in percent) */
  fee: string;

  /** Minimum fee for pair (if not fixed fee) */
  min_fee: string;

  /** Maximum fee for pair (if not fixed fee) */
  max_fee: string;

  /**
   * Next tier's fee for pair (if not fixed fee,
   * null if at lowest fee tier)
   */
  next_fee: string | null;

  /**
   * Volume level of current tier (if not fixed fee,
   * null if at lowest fee tier)
   */
  tier_volume: string | null;

  /**
   * Volume level of next tier (if not fixed fee,
   * null if at lowest fee tier)
   */
  next_volume: string | null;
}

/** Map of asset pair -> fee tier info */
export type KrakenTradeVolumeFeesMap = Record<string, KrakenFeeTierInfo>;

/**
 * Trade volume + fee schedule result.
 */
export interface KrakenTradeVolumeResult {
  /**
   * Fee volume currency (will always be USD according to docs).
   */
  currency: string;

  /**
   * Current fee discount volume (in USD, breakdown by subaccount
   * if applicable and logged in to master account).
   */
  volume: string;

  /**
   * Taker fees applied for each pair included in the request.
   * Default is missing / empty if no pairs were requested.
   */
  fees?: KrakenTradeVolumeFeesMap;

  /**
   * Maker fees applied for each pair included in the request
   * (only for maker/taker pairs).
   * Default is missing / empty if no pairs were requested.
   */
  fees_maker?: KrakenTradeVolumeFeesMap;
}

export interface KrakenGetTradeVolumeParams {
  /**
   * Comma-delimited list of asset pairs to get fee info on,
   * or an array of pairs.
   *
   * Optional, but required if any fee info is desired.
   */
  pair?: string | string[];

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
 * POST /0/private/TradeVolume
 *
 * Returns 30 day USD trading volume and resulting fee schedule
 * for any asset pairs provided.
 *
 * Notes:
 * - Fees will not be included if `pair` is not specified.
 * - If a pair is on a maker/taker fee schedule, taker side is in `fees`
 *   and maker side in `fees_maker`.
 * - `nonce` is handled automatically by the client.
 * - Requires "Funds – Query" permission.
 */
export function getTradeVolume(
  base: KrakenRestBase,
  params?: KrakenGetTradeVolumeParams,
): Promise<KrakenTradeVolumeResult> {
  const body: Record<string, string> = {};

  if (params?.pair !== undefined) {
    body.pair = Array.isArray(params.pair)
      ? params.pair.join(',')
      : params.pair;
  }

  if (params?.rebase_multiplier) {
    body.rebase_multiplier = params.rebase_multiplier;
  }

  return base.privatePost<KrakenTradeVolumeResult>(
    '/0/private/TradeVolume',
    body,
  );
}
