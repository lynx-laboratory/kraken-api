import type { KrakenRestBase } from '../../../base/restBase';
import type { KrakenRebaseMultiplier } from './getAccountBalance';

/**
 * Trade balance summary.
 *
 * Field meanings (all strings):
 * - eb : Equivalent balance (combined balance of all currencies)
 * - tb : Trade balance (combined balance of all equity currencies)
 * - m  : Margin amount of open positions
 * - n  : Unrealized net profit/loss of open positions
 * - c  : Cost basis of open positions
 * - v  : Current floating valuation of open positions
 * - e  : Equity = trade balance + unrealized PnL
 * - mf : Free margin = equity - initial margin
 * - ml : Margin level = (equity / initial margin) * 100
 * - uv : Unexecuted value of unfilled/partially filled orders
 */
export interface KrakenTradeBalanceResult {
  /** Equivalent balance (combined balance of all currencies) */
  eb: string;

  /** Trade balance (combined balance of all equity currencies) */
  tb: string;

  /** Margin amount of open positions */
  m: string;

  /** Unrealized net profit/loss of open positions */
  n: string;

  /** Cost basis of open positions */
  c: string;

  /** Current floating valuation of open positions */
  v: string;

  /** Equity: trade balance + unrealized net profit/loss */
  e: string;

  /**
   * Free margin: Equity - initial margin
   * (maximum margin available to open new positions)
   */
  mf: string;

  /** Margin level: (equity / initial margin) * 100 */
  ml: string;

  /** Unexecuted value: value of unfilled and partially filled orders */
  uv: string;
}

export interface KrakenGetTradeBalanceParams {
  /**
   * Base asset used to determine balance.
   * Default on Kraken is "ZUSD" if omitted.
   */
  asset?: string;

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
 * POST /0/private/TradeBalance
 *
 * Retrieve a summary of collateral balances, margin position valuations,
 * equity and margin level.
 *
 * Note:
 * - `nonce` is handled automatically by the client.
 * - API key must have "Orders and trades – Query open orders & trades".
 */
export function getTradeBalance(
  base: KrakenRestBase,
  params?: KrakenGetTradeBalanceParams,
): Promise<KrakenTradeBalanceResult> {
  const body: Record<string, string> = {};

  if (params?.asset) {
    body.asset = params.asset;
  }

  if (params?.rebase_multiplier) {
    body.rebase_multiplier = params.rebase_multiplier;
  }

  return base.privatePost<KrakenTradeBalanceResult>(
    '/0/private/TradeBalance',
    body,
  );
}
