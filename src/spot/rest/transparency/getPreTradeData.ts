import type { KrakenRestBase } from '../../../base/restBase';

export interface KrakenGetPreTradeDataParams {
  /**
   * A list of symbols for the currency pairs.
   *
   * Kraken docs:
   * - "symbol" is a string, 3–32 chars.
   * - Can represent a list of symbols; we support both string and string[].
   *
   * Example: "BTC/USD" or ["BTC/USD", "ETH/USD"]
   */
  symbol: string | ReadonlyArray<string>;
}

/**
 * Raw result from /0/public/PreTrade.
 *
 * As of the current Kraken docs, the schema is only documented as "object",
 * without field-level detail. We keep this generic to avoid incorrect typing.
 */
export type KrakenPreTradeDataResult = Record<string, unknown>;

/**
 * Returns the price levels in the order book with aggregated order
 * quantities at each price level. The top 10 levels are returned for
 * each trading pair.
 *
 * Kraken docs: GET /0/public/PreTrade
 */
export async function getPreTradeData(
  base: KrakenRestBase,
  params: KrakenGetPreTradeDataParams,
): Promise<KrakenPreTradeDataResult> {
  const { symbol } = params;

  const symbolParam = typeof symbol === 'string' ? symbol : symbol.join(',');

  const query: Record<string, string> = {
    symbol: symbolParam,
  };

  return base.publicGet<KrakenPreTradeDataResult>('/0/public/PreTrade', query);
}
