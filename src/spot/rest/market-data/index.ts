import type { KrakenRestBase } from '../../../base/restBase';
import * as GetServerTime from './getServerTime';
import * as GetSystemStatus from './getSystemStatus';
import * as GetAssetInfo from './getAssetInfo';
import * as GetTradableAssetPairs from './getTradableAssetPairs';
import * as GetTickerInformation from './getTickerInformation';
import * as GetOhlcData from './getOhlcData';
import * as GetOrderBook from './getOrderBook';
import * as GetRecentTrades from './getRecentTrades';
import * as GetRecentSpreads from './getRecentSpreads';

export class KrakenSpotMarketDataApi {
  constructor(private readonly base: KrakenRestBase) {}

  /**
   * Get the server's time.
   *
   * @example
   * const time = await kraken.marketData.getServerTime();
   * console.log(time.rfc1123);
   */
  getServerTime() {
    return GetServerTime.getServerTime(this.base);
  }

  /**
   * Get the current system status or trading mode.
   *
   * @example
   * const status = await kraken.marketData.getSystemStatus();
   * console.log(status.status, status.timestamp);
   */
  getSystemStatus() {
    return GetSystemStatus.getSystemStatus(this.base);
  }

  /**
   * Get information about assets available for deposit, withdrawal,
   * trading and earn.
   *
   * @example
   * // All spot currencies
   * const allAssets = await kraken.marketData.getAssetInfo();
   *
   * // Specific assets
   * const btcAndEth = await kraken.marketData.getAssetInfo({
   *   asset: ["XXBT", "XETH"],
   * });
   */
  getAssetInfo(params?: GetAssetInfo.KrakenGetAssetInfoParams) {
    return GetAssetInfo.getAssetInfo(this.base, params);
  }

  /**
   * Get tradable asset pairs and their configuration.
   *
   * @example
   * // All pairs available in Canada
   * const pairs = await kraken.marketData.getTradableAssetPairs({
   *   country_code: "CA",
   * });
   *
   * // Specific pairs
   * const subset = await kraken.marketData.getTradableAssetPairs({
   *   pair: ["XBTUSD", "ETHUSD"],
   * });
   */
  getTradableAssetPairs(
    params?: GetTradableAssetPairs.KrakenGetTradableAssetPairsParams,
  ) {
    return GetTradableAssetPairs.getTradableAssetPairs(this.base, params);
  }

  /**
   * Get ticker information for one or more markets.
   *
   * Leaving `pair` undefined returns tickers for all tradeable pairs.
   *
   * @example
   * // Single pair
   * const tickers = await kraken.marketData.getTickerInformation({
   *   pair: ["XBTUSD"],
   * });
   * const xbtusd = tickers["XBTUSD"];
   * console.log(xbtusd.c[0]); // last traded price
   */
  getTickerInformation(
    params?: GetTickerInformation.KrakenGetTickerInformationParams,
  ) {
    return GetTickerInformation.getTickerInformation(this.base, params);
  }

  /**
   * Retrieve OHLC candles for a pair.
   *
   * The last entry for each pair is the current, not-yet-committed candle.
   *
   * @example
   * const { last, ohlc } = await kraken.marketData.getOhlcData({
   *   pair: "XBTUSD",
   *   interval: 1,
   * });
   *
   * const candles = ohlc["XBTUSD"] ?? [];
   * console.log("Next since:", last);
   */
  getOhlcData(params: GetOhlcData.KrakenGetOhlcDataParams) {
    return GetOhlcData.getOhlcData(this.base, params);
  }

  /**
   * Get level 2 (L2) order book for a pair.
   *
   * @example
   * const books = await kraken.marketData.getOrderBook({
   *   pair: "XBTUSD",
   *   count: 50,
   * });
   *
   * const book = books["XBTUSD"];
   * const bestAsk = book?.asks[0];
   * const bestBid = book?.bids[0];
   */
  getOrderBook(params: GetOrderBook.KrakenGetOrderBookParams) {
    return GetOrderBook.getOrderBook(this.base, params);
  }

  /**
   * Get recent trades for a pair (up to 1000).
   *
   * Use the returned `last` value as `since` for incremental polling.
   *
   * @example
   * const first = await kraken.marketData.getRecentTrades({
   *   pair: "XBTUSD",
   *   count: 500,
   * });
   *
   * const trades = first.trades["XBTUSD"] ?? [];
   * const nextSince = first.last;
   */
  getRecentTrades(params: GetRecentTrades.KrakenGetRecentTradesParams) {
    return GetRecentTrades.getRecentTrades(this.base, params);
  }

  /**
   * Get recent top-of-book spreads for a pair.
   *
   * Use the returned `last` value as `since` for incremental polling.
   *
   * @example
   * const first = await kraken.marketData.getRecentSpreads({
   *   pair: "XBTUSD",
   * });
   *
   * const spreads = first.spreads["XBTUSD"] ?? [];
   * const nextSince = first.last;
   */
  getRecentSpreads(params: GetRecentSpreads.KrakenGetRecentSpreadsParams) {
    return GetRecentSpreads.getRecentSpreads(this.base, params);
  }
}

// Re-export endpoint types
export type KrakenServerTime = GetServerTime.KrakenServerTime;

export type KrakenSystemStatus = GetSystemStatus.KrakenSystemStatus;
export type KrakenSystemStatusResult = GetSystemStatus.KrakenSystemStatusResult;

export type KrakenAssetClass = GetAssetInfo.KrakenAssetClass;
export type KrakenAssetStatus = GetAssetInfo.KrakenAssetStatus;
export type KrakenAssetInfo = GetAssetInfo.KrakenAssetInfo;
export type KrakenAssetInfoMap = GetAssetInfo.KrakenAssetInfoMap;
export type KrakenGetAssetInfoParams = GetAssetInfo.KrakenGetAssetInfoParams;

export type KrakenAssetPairStatus = GetTradableAssetPairs.KrakenAssetPairStatus;
export type KrakenFeeScheduleEntry =
  GetTradableAssetPairs.KrakenFeeScheduleEntry;
export type KrakenAssetPair = GetTradableAssetPairs.KrakenAssetPair;
export type KrakenAssetPairMap = GetTradableAssetPairs.KrakenAssetPairMap;
export type KrakenAssetPairInfoType =
  GetTradableAssetPairs.KrakenAssetPairInfoType;
export type KrakenGetTradableAssetPairsParams =
  GetTradableAssetPairs.KrakenGetTradableAssetPairsParams;

export type KrakenTickerAssetClass =
  GetTickerInformation.KrakenTickerAssetClass;
export type KrakenAssetTickerInfo = GetTickerInformation.KrakenAssetTickerInfo;
export type KrakenTickerInfoMap = GetTickerInformation.KrakenTickerInfoMap;
export type KrakenGetTickerInformationParams =
  GetTickerInformation.KrakenGetTickerInformationParams;

export type KrakenOhlcInterval = GetOhlcData.KrakenOhlcInterval;
export type KrakenOhlcEntry = GetOhlcData.KrakenOhlcEntry;
export type KrakenOhlcMap = GetOhlcData.KrakenOhlcMap;
export type KrakenOhlcResponse = GetOhlcData.KrakenOhlcResponse;
export type KrakenGetOhlcDataParams = GetOhlcData.KrakenGetOhlcDataParams;

export type KrakenOrderBookLevel = GetOrderBook.KrakenOrderBookLevel;
export type KrakenOrderBook = GetOrderBook.KrakenOrderBook;
export type KrakenOrderBookMap = GetOrderBook.KrakenOrderBookMap;
export type KrakenGetOrderBookParams = GetOrderBook.KrakenGetOrderBookParams;

export type KrakenTradeEntry = GetRecentTrades.KrakenTradeEntry;
export type KrakenTradesMap = GetRecentTrades.KrakenTradesMap;
export type KrakenRecentTradesResponse =
  GetRecentTrades.KrakenRecentTradesResponse;
export type KrakenGetRecentTradesParams =
  GetRecentTrades.KrakenGetRecentTradesParams;

export type KrakenSpreadEntry = GetRecentSpreads.KrakenSpreadEntry;
export type KrakenSpreadsMap = GetRecentSpreads.KrakenSpreadsMap;
export type KrakenRecentSpreadsResponse =
  GetRecentSpreads.KrakenRecentSpreadsResponse;
export type KrakenGetRecentSpreadsParams =
  GetRecentSpreads.KrakenGetRecentSpreadsParams;
