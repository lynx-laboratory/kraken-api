import type { KrakenRestBase } from '../../../base/restBase';

export type KrakenOhlcInterval =
  | 1
  | 5
  | 15
  | 30
  | 60
  | 240
  | 1440
  | 10080
  | 21600;

export type KrakenOhlcEntry = [
  time: number,
  open: string,
  high: string,
  low: string,
  close: string,
  vwap: string,
  volume: string,
  count: number,
];

export type KrakenOhlcMap = Record<string, KrakenOhlcEntry[]>;

export interface KrakenOhlcResponse {
  last: number;
  ohlc: KrakenOhlcMap;
}

export interface KrakenGetOhlcDataParams {
  pair: string;
  interval?: KrakenOhlcInterval;
  since?: number;
  asset_class?: 'tokenized_asset';
}

/**
 * Raw shape from Kraken:
 *
 * {
 *   last: 1688671200,
 *   "XBTUSD": [ [time, open, high, low, close, vwap, volume, count], ... ],
 *   "ETHUSD": [ ... ],
 *   ...
 * }
 */
interface KrakenOhlcRawResult {
  last: number;
  [pair: string]: KrakenOhlcEntry[] | number;
}

export async function getOhlcData(
  base: KrakenRestBase,
  params: KrakenGetOhlcDataParams,
): Promise<KrakenOhlcResponse> {
  const query: Record<string, string> = {
    pair: params.pair,
  };

  if (params.interval !== undefined) {
    query.interval = String(params.interval);
  }

  if (params.since !== undefined) {
    query.since = String(params.since);
  }

  if (params.asset_class) {
    query.asset_class = params.asset_class;
  }

  const raw = await base.publicGet<KrakenOhlcRawResult>(
    '/0/public/OHLC',
    query,
  );

  const { last, ...rest } = raw;

  const ohlc: KrakenOhlcMap = {};
  for (const [pair, data] of Object.entries(rest)) {
    ohlc[pair] = data as KrakenOhlcEntry[];
  }

  return {
    last,
    ohlc,
  };
}
