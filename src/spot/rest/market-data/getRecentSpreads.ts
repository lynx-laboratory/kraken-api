import type { KrakenRestBase } from '../../../base/restBase';

/**
 * Single spread entry:
 * [int <time>, string <bid>, string <ask>]
 */
export type KrakenSpreadEntry = [time: number, bid: string, ask: string];

export type KrakenSpreadsMap = Record<string, KrakenSpreadEntry[]>;

/**
 * Normalized spreads response:
 *
 * - `last` is the ID to be used as `since` when polling.
 * - `spreads` is a map of pair -> spread entries.
 */
export interface KrakenRecentSpreadsResponse {
  last: number;
  spreads: KrakenSpreadsMap;
}

export interface KrakenGetRecentSpreadsParams {
  /**
   * Asset pair to get data for (required).
   * e.g. "XBTUSD"
   */
  pair: string;

  /**
   * Returns spread data since given timestamp.
   * Intended for incremental updates within available dataset.
   */
  since?: number;

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
 *   "last": 1678219570,
 *   "XBTUSD": [
 *     [time, bid, ask],
 *     ...
 *   ]
 * }
 */
interface KrakenSpreadsRawResult {
  last: number;
  [pair: string]: KrakenSpreadEntry[] | number;
}

/**
 * GET /0/public/Spread
 * Returns the last ~200 top-of-book spreads for a given pair.
 */
export async function getRecentSpreads(
  base: KrakenRestBase,
  params: KrakenGetRecentSpreadsParams,
): Promise<KrakenRecentSpreadsResponse> {
  const query: Record<string, string> = {
    pair: params.pair,
  };

  if (params.since !== undefined) {
    query.since = String(params.since);
  }

  if (params.asset_class) {
    query.asset_class = params.asset_class;
  }

  const raw = await base.publicGet<KrakenSpreadsRawResult>(
    '/0/public/Spread',
    query,
  );

  const { last, ...rest } = raw;

  const spreads: KrakenSpreadsMap = {};
  for (const [pair, data] of Object.entries(rest)) {
    spreads[pair] = data as KrakenSpreadEntry[];
  }

  return {
    last,
    spreads,
  };
}
