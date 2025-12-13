import type { KrakenRestBase } from '../../../base/restBase';

/**
 * One level in the L2 order book:
 * [<price>, <volume>, <timestamp>]
 */
export type KrakenOrderBookLevel = [
  price: string,
  volume: string,
  timestamp: number,
];

export interface KrakenOrderBook {
  asks: KrakenOrderBookLevel[];
  bids: KrakenOrderBookLevel[];
}

/** Map of pair name -> order book */
export type KrakenOrderBookMap = Record<string, KrakenOrderBook>;

export interface KrakenGetOrderBookParams {
  /**
   * Asset pair to get data for (required).
   * e.g. "XBTUSD"
   */
  pair: string;

  /**
   * Maximum number of asks/bids.
   * 1–500, default 100.
   */
  count?: number;

  /**
   * Required for non-crypto pairs (xstocks).
   * Docs: asset_class="tokenized_asset"
   */
  asset_class?: 'tokenized_asset';
}

/**
 * GET /0/public/Depth
 * Returns level 2 (L2) order book, with aggregated order quantities
 * at each price level.
 */
export function getOrderBook(
  base: KrakenRestBase,
  params: KrakenGetOrderBookParams,
): Promise<KrakenOrderBookMap> {
  const query: Record<string, string> = {
    pair: params.pair,
  };

  if (params.count !== undefined) {
    query.count = String(params.count);
  }

  if (params.asset_class) {
    query.asset_class = params.asset_class;
  }

  return base.publicGet<KrakenOrderBookMap>('/0/public/Depth', query);
}
