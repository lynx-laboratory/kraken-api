import type { KrakenRestBase } from '../../../base/restBase';
import type { KrakenRebaseMultiplier } from './getAccountBalance';

/**
 * Extended balance fields for a single asset.
 *
 * - balance      : total balance
 * - credit       : total credit amount (if credit line)
 * - credit_used  : used credit amount
 * - hold_trade   : total held amount (e.g. open orders)
 */
export interface KrakenExtendedBalanceEntry {
  /** Total balance amount for an asset */
  balance: string;

  /** Total credit amount (only applicable if account has a credit line) */
  credit: string;

  /** Used credit amount (only applicable if account has a credit line) */
  credit_used: string;

  /** Total held amount for an asset */
  hold_trade: string;
}

/** Map of asset symbol -> extended balance info */
export type KrakenExtendedBalanceMap = Record<
  string,
  KrakenExtendedBalanceEntry
>;

export interface KrakenGetExtendedBalanceParams {
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
 * POST /0/private/BalanceEx
 *
 * Retrieve all extended account balances, including credits and held amounts.
 *
 * Balance available for trading is:
 *   available = balance + credit - credit_used - hold_trade
 *
 * Note: `nonce` is handled automatically by the client.
 * API key must have "Funds – Query" permission enabled.
 */
export function getExtendedBalance(
  base: KrakenRestBase,
  params?: KrakenGetExtendedBalanceParams,
): Promise<KrakenExtendedBalanceMap> {
  const body: Record<string, string> = {};

  if (params?.rebase_multiplier) {
    body.rebase_multiplier = params.rebase_multiplier;
  }

  return base.privatePost<KrakenExtendedBalanceMap>(
    '/0/private/BalanceEx',
    body,
  );
}
