import type { KrakenRestBase } from '../../../base/restBase';
import * as GetPreTradeData from './getPreTradeData';
import * as GetPostTradeData from './getPostTradeData';

/**
 * Kraken Spot Transparency API.
 *
 * Covers transparency-related public data such as pre-/post-trade data.
 */
export class KrakenSpotTransparencyApi {
  constructor(private readonly base: KrakenRestBase) {}

  /**
   * Get pre-trade aggregated order book data.
   *
   * Returns the price levels in the order book with aggregated order
   * quantities at each price level. The top 10 levels are returned
   * for each trading pair.
   *
   * @example
   * ```ts
   * const preTrade = await kraken.transparency.getPreTradeData({
   *   symbol: ["BTC/USD", "ETH/USD"],
   * });
   *
   * // Result schema is not fully documented by Kraken yet,
   * // so treat it as an opaque object and inspect the shape:
   * console.log(JSON.stringify(preTrade, null, 2));
   * ```
   */
  getPreTradeData(params: GetPreTradeData.KrakenGetPreTradeDataParams) {
    return GetPreTradeData.getPreTradeData(this.base, params);
  }

  /**
   * Get post-trade data (executed trades) on the spot exchange.
   *
   * Returns a list of trades in ascending timestamp order.
   * If no filter parameters are specified, the last 1000 trades
   * for all pairs are returned.
   *
   * @example
   * ```ts
   * const res = await kraken.transparency.getPostTradeData({
   *   symbol: "BTC/USD",
   *   count: 100,
   * });
   *
   * console.log("last_ts:", res.last_ts, "count:", res.count);
   *
   * for (const t of res.trades) {
   *   console.log(
   *     t.trade_id,
   *     t.symbol,
   *     "price:", t.price,
   *     "qty:", t.quantity,
   *     "trade_ts:", t.trade_ts,
   *   );
   * }
   * ```
   */
  getPostTradeData(params: GetPostTradeData.KrakenGetPostTradeDataParams = {}) {
    return GetPostTradeData.getPostTradeData(this.base, params);
  }
}

// Re-export types for consumers
export type KrakenGetPreTradeDataParams =
  GetPreTradeData.KrakenGetPreTradeDataParams;
export type KrakenPreTradeDataResult = GetPreTradeData.KrakenPreTradeDataResult;

export type KrakenGetPostTradeDataParams =
  GetPostTradeData.KrakenGetPostTradeDataParams;
export type KrakenGetPostTradeDataResult =
  GetPostTradeData.KrakenGetPostTradeDataResult;
export type KrakenPostTradeEntry = GetPostTradeData.KrakenPostTradeEntry;
