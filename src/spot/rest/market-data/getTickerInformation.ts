import type { KrakenRestBase } from '../../../base/restBase';

/**
 * Asset class for ticker requests.
 * - "forex"           = standard spot / FX pairs
 * - "tokenized_asset" = tokenized assets (xstocks)
 */
export type KrakenTickerAssetClass = 'tokenized_asset' | 'forex';

/**
 * Asset Ticker Info
 *
 * Keys match Kraken's schema:
 * - a: Ask [<price>, <whole lot volume>, <lot volume>]
 * - b: Bid [<price>, <whole lot volume>, <lot volume>]
 * - c: Last trade closed [<price>, <lot volume>]
 * - v: Volume [<today>, <last 24 hours>]
 * - p: VWAP [<today>, <last 24 hours>]
 * - t: Number of trades [<today>, <last 24 hours>]
 * - l: Low [<today>, <last 24 hours>]
 * - h: High [<today>, <last 24 hours>]
 * - o: Today's opening price
 */
export interface KrakenAssetTickerInfo {
  a: [string, string, string];
  b: [string, string, string];
  c: [string, string];
  v: [string, string];
  p: [string, string];
  t: [number, number];
  l: [string, string];
  h: [string, string];
  o: string;
}

/**
 * Map of pair name -> ticker info
 * e.g. { "XBTUSD": { ... }, "ETHUSD": { ... } }
 */
export type KrakenTickerInfoMap = Record<string, KrakenAssetTickerInfo>;

export interface KrakenGetTickerInformationParams {
  /**
   * Asset pairs to get data for.
   *
   * Kraken docs say "Asset pair" (singular), but API supports
   * a comma-delimited list, so we accept string[] and join.
   * If omitted, all tradeable exchange pairs are returned.
   */
  pair?: string[];

  /**
   * Asset class for tokenized pairs / forex.
   *
   * Required when requesting tokenized pairs (xstocks).
   * If provided without `pair`, all pairs for that class are returned.
   */
  asset_class?: KrakenTickerAssetClass;
}

/**
 * GET /0/public/Ticker
 * Get ticker information for all or requested markets.
 */
export function getTickerInformation(
  base: KrakenRestBase,
  params?: KrakenGetTickerInformationParams,
): Promise<KrakenTickerInfoMap> {
  const query: Record<string, string> = {};

  if (params?.pair?.length) {
    query.pair = params.pair.join(',');
  }

  if (params?.asset_class) {
    query.asset_class = params.asset_class;
  }

  return base.publicGet<KrakenTickerInfoMap>('/0/public/Ticker', query);
}
