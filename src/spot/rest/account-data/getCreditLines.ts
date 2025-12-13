import type { KrakenRestBase } from '../../../base/restBase';
import type { KrakenRebaseMultiplier } from './getAccountBalance';

/**
 * Credit line details for a specific asset.
 */
export interface KrakenCreditLinesAssetEntry {
  /** Current balance for the asset */
  balance: string;

  /** Credit limit for the asset */
  credit_limit: string;

  /** Currently used credit for the asset */
  credit_used: string;

  /** Available credit for the asset */
  available_credit: string;
}

/** Map of asset symbol -> credit line details */
export type KrakenCreditLinesAssetMap = Record<
  string,
  KrakenCreditLinesAssetEntry
>;

/**
 * Aggregate credit monitor metrics.
 * All values are strings (or null) representing USD amounts/ratios.
 */
export interface KrakenCreditLinesLimitsMonitor {
  /** Total credit across all assets represented in USD */
  total_credit_usd?: string | null;

  /** Total credit used across all assets represented in USD */
  total_credit_used_usd?: string | null;

  /** Sum of asset balance in USD * collateral */
  total_collateral_value_usd?: string | null;

  /** Total collateral - total credit (in USD) */
  equity_usd?: string | null;

  /** Total collateral / total credit (in USD) */
  ongoing_balance?: string | null;

  /** Total credit used / equity (in USD) */
  debt_to_equity?: string | null;
}

/**
 * Full credit line details result.
 */
export interface KrakenCreditLinesResult {
  /** Balances by asset */
  asset_details: KrakenCreditLinesAssetMap;

  /** Aggregate credit monitor info */
  limits_monitor: KrakenCreditLinesLimitsMonitor;
}

/**
 * The API can return `null` if there are no credit lines configured.
 */
export type KrakenCreditLinesResponse = KrakenCreditLinesResult | null;

export interface KrakenGetCreditLinesParams {
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
 * POST /0/private/CreditLines
 *
 * Retrieve all credit line details for VIPs with this functionality.
 *
 * Note:
 * - `nonce` is handled automatically by the client.
 * - API key must have "Funds – Query" permission enabled.
 * - `result` may be `null` if no credit lines exist.
 */
export function getCreditLines(
  base: KrakenRestBase,
  params?: KrakenGetCreditLinesParams,
): Promise<KrakenCreditLinesResponse> {
  const body: Record<string, string> = {};

  if (params?.rebase_multiplier) {
    body.rebase_multiplier = params.rebase_multiplier;
  }

  return base.privatePost<KrakenCreditLinesResponse>(
    '/0/private/CreditLines',
    body,
  );
}
