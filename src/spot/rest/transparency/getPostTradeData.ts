import type { KrakenRestBase } from '../../../base/restBase';

export interface KrakenGetPostTradeDataParams {
  /**
   * Filter the results to the currency pair.
   * Example: "BTC/USD"
   */
  symbol?: string;

  /**
   * Filter the results to include trades AFTER this timestamp (exclusive).
   * ISO 8601, e.g. "2024-05-30T12:34:56.123456789Z".
   */
  from_ts?: string;

  /**
   * Filter the results to include trades BEFORE or AT this timestamp.
   * ISO 8601, e.g. "2024-05-30T12:34:56.123456789Z".
   */
  to_ts?: string;

  /**
   * The maximum number of trades to return.
   * Default on Kraken is 1000, range [1, 1000].
   */
  count?: number;
}

export interface KrakenPostTradeEntry {
  trade_id: string;
  price: string;
  quantity: string;
  symbol: string;
  description: string;
  base_asset: string;
  base_notation: string;
  quote_asset: string;
  quote_notation: string;
  trade_venue: string;
  trade_ts: string;
  publication_venue: string;
  publication_ts: string;
}

export interface KrakenGetPostTradeDataResult {
  last_ts: string;
  count: number;
  trades: KrakenPostTradeEntry[];
}

/**
 * Returns a list of trades on the spot exchange.
 *
 * If no filter parameters are specified, the last 1000 trades
 * for all pairs are returned.
 *
 * Kraken docs: GET /0/public/PostTrade
 */
export async function getPostTradeData(
  base: KrakenRestBase,
  params: KrakenGetPostTradeDataParams = {},
): Promise<KrakenGetPostTradeDataResult> {
  const { symbol, from_ts, to_ts, count } = params;

  // Match KrakenRestBase.publicGet signature: Record<string, string | number>
  const query: Record<string, string | number> = {};

  if (symbol) {
    query.symbol = symbol;
  }
  if (from_ts) {
    query.from_ts = from_ts;
  }
  if (to_ts) {
    query.to_ts = to_ts;
  }
  if (count !== undefined) {
    query.count = count;
  }

  return base.publicGet<KrakenGetPostTradeDataResult>(
    '/0/public/PostTrade',
    query,
  );
}
