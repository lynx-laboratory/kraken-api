import type { KrakenRestBase } from '../../../base/restBase';

/**
 * Rebase multiplier options for xstocks / tokenized assets.
 *
 * - "rebased": Display in terms of underlying equity (default).
 * - "base":    Display in terms of SPV tokens.
 */
export type KrakenRebaseMultiplier = 'rebased' | 'base';

/**
 * Account balance result:
 * Map of asset symbol -> balance as string.
 *
 * Example:
 * {
 *   "ZUSD": "123.45",
 *   "XXBT": "0.0100000000",
 *   "USDT.F": "50.0"
 * }
 */
export type KrakenAccountBalanceMap = Record<string, string>;

export interface KrakenGetAccountBalanceParams {
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
 * POST /0/private/Balance
 *
 * Retrieve all cash balances, net of pending withdrawals.
 *
 * Note: `nonce` is handled automatically by the client.
 * API key must have "Funds – Query" permission enabled.
 */
export function getAccountBalance(
  base: KrakenRestBase,
  params?: KrakenGetAccountBalanceParams,
): Promise<KrakenAccountBalanceMap> {
  const body: Record<string, string> = {};

  if (params?.rebase_multiplier) {
    body.rebase_multiplier = params.rebase_multiplier;
  }

  return base.privatePost<KrakenAccountBalanceMap>('/0/private/Balance', body);
}
