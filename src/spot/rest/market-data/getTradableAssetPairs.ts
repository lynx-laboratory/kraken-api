import type { KrakenRestBase } from '../../../base/restBase';
import type { KrakenAssetClass } from './getAssetInfo';

export type KrakenAssetPairStatus =
  | 'online'
  | 'cancel_only'
  | 'post_only'
  | 'limit_only'
  | 'reduce_only';

export type KrakenFeeScheduleEntry = [volume: number, percentFee: number];

export interface KrakenAssetPair {
  /** Alternate pair name (e.g. "XBTUSD") */
  altname: string;

  /** WebSocket pair name (if available) */
  wsname?: string;

  /** Asset class of base component */
  aclass_base: string;

  /** Asset ID of base component */
  base: string;

  /** Asset class of quote component */
  aclass_quote: string;

  /** Asset ID of quote component */
  quote: string;

  /** Volume lot size (deprecated) */
  lot: string;

  /** Number of decimal places for prices in this pair */
  pair_decimals: number;

  /** Number of decimal places for cost of trades in pair (quote asset terms) */
  cost_decimals: number;

  /** Number of decimal places for volume (base asset terms) */
  lot_decimals: number;

  /** Amount to multiply lot volume by to get currency volume */
  lot_multiplier: number;

  /** Array of leverage amounts available when buying */
  leverage_buy: number[];

  /** Array of leverage amounts available when selling */
  leverage_sell: number[];

  /** Fee schedule array in [<volume>, <percent fee>] tuples */
  fees: KrakenFeeScheduleEntry[];

  /** Maker fee schedule array (if on maker/taker) */
  fees_maker?: KrakenFeeScheduleEntry[];

  /** Volume discount currency */
  fee_volume_currency: string;

  /** Margin call level */
  margin_call: number;

  /** Stop-out/liquidation margin level */
  margin_stop: number;

  /** Minimum order size (base currency) */
  ordermin?: string;

  /** Minimum order cost (quote currency) */
  costmin?: string;

  /** Minimum increment between valid price levels */
  tick_size?: string;

  /** Status of asset pair */
  status?: KrakenAssetPairStatus;

  /** Maximum long margin position size (base currency) */
  long_position_limit?: number;

  /** Maximum short margin position size (base currency) */
  short_position_limit?: number;
}

/** Map of pair name -> asset pair info */
export type KrakenAssetPairMap = Record<string, KrakenAssetPair>;

export type KrakenAssetPairInfoType = 'info' | 'leverage' | 'fees' | 'margin';

export interface KrakenGetTradableAssetPairsParams {
  /**
   * Asset pairs to get data for (e.g. ["BTC/USD", "ETH/BTC"]).
   * If omitted, Kraken returns all pairs.
   */
  pair?: string[];

  /**
   * Filters the base asset class (default "currency").
   * - "currency" = spot currency pairs
   * - "tokenized_asset" = tokenized asset pairs (xstocks)
   */
  aclass_base?: KrakenAssetClass;

  /**
   * Info to retrieve (default "info").
   * - "info" = all info
   * - "leverage" = leverage info
   * - "fees" = fee schedule
   * - "margin" = margin info
   */
  info?: KrakenAssetPairInfoType;

  /**
   * Filter to only include pairs available in the provided country/region.
   * ISO 3166-1 alpha-2 code (e.g. "CA", "GB").
   */
  country_code?: string;
}

/**
 * GET /0/public/AssetPairs
 * Get tradable asset pairs.
 */
export function getTradableAssetPairs(
  base: KrakenRestBase,
  params?: KrakenGetTradableAssetPairsParams,
): Promise<KrakenAssetPairMap> {
  const query: Record<string, string> = {};

  if (params?.pair?.length) {
    query.pair = params.pair.join(',');
  }

  if (params?.aclass_base) {
    query.aclass_base = params.aclass_base;
  }

  if (params?.info) {
    query.info = params.info;
  }

  if (params?.country_code) {
    query.country_code = params.country_code;
  }

  return base.publicGet<KrakenAssetPairMap>('/0/public/AssetPairs', query);
}
