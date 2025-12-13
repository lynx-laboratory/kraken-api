import type { KrakenRestBase } from '../../../base/restBase';

/**
 * Single trade entry:
 * [<price>, <volume>, <time>, <buy/sell>, <market/limit>, <miscellaneous>, <trade_id>]
 *
 * - price  -> string
 * - volume -> string
 * - time   -> number (Unix timestamp)
 * - side   -> string ("buy"/"sell" or shorthand)
 * - orderType -> string ("market"/"limit" or shorthand)
 * - misc   -> string (flags)
 * - tradeId -> string
 */
export type KrakenTradeEntry = [
  price: string,
  volume: string,
  time: number,
  side: string,
  orderType: string,
  miscellaneous: string,
  tradeId: string,
];

export type KrakenTradesMap = Record<string, KrakenTradeEntry[]>;

/**
 * Normalized trades response:
 *
 * - `last` is the ID to be used as `since` when polling.
 * - `trades` is a map of pair -> trade entries.
 */
export interface KrakenRecentTradesResponse {
  last: string;
  trades: KrakenTradesMap;
}

export interface KrakenGetRecentTradesParams {
  /**
   * Asset pair to get data for (required).
   * e.g. "XBTUSD"
   */
  pair: string;

  /**
   * Return trade data since given timestamp/id.
   * Kraken expects a string; we accept number or string.
   */
  since?: string | number;

  /**
   * Maximum number of trades to return (1–1000, default 1000).
   */
  count?: number;

  /**
   * Required for non-crypto pairs (xstocks).
   * Docs: asset_class="tokenized_asset"
   */
  asset_class?: 'tokenized_asset';
}

/**
 * Raw shape from Kraken:
 *
 * {
 *   "last": "1616663618",
 *   "XBTUSD": [
 *     [price, volume, time, side, orderType, misc, tradeId],
 *     ...
 *   ]
 * }
 */
interface KrakenTradesRawResult {
  last: string;
  [pair: string]: KrakenTradeEntry[] | string;
}

/**
 * GET /0/public/Trades
 * Returns the last 1000 trades by default.
 */
export async function getRecentTrades(
  base: KrakenRestBase,
  params: KrakenGetRecentTradesParams,
): Promise<KrakenRecentTradesResponse> {
  const query: Record<string, string> = {
    pair: params.pair,
  };

  if (params.since !== undefined) {
    query.since = String(params.since);
  }

  if (params.count !== undefined) {
    query.count = String(params.count);
  }

  if (params.asset_class) {
    query.asset_class = params.asset_class;
  }

  const raw = await base.publicGet<KrakenTradesRawResult>(
    '/0/public/Trades',
    query,
  );

  const { last, ...rest } = raw;

  const trades: KrakenTradesMap = {};
  for (const [pair, data] of Object.entries(rest)) {
    trades[pair] = data as KrakenTradeEntry[];
  }

  return {
    last,
    trades,
  };
}
