import type { KrakenRestBase } from '../../../base/restBase';

export type KrakenAssetClass = 'currency' | 'tokenized_asset';

export type KrakenAssetStatus =
  | 'enabled'
  | 'deposit_only'
  | 'withdrawal_only'
  | 'funding_temporarily_disabled';

export interface KrakenAssetInfo {
  /**
   * Asset class (e.g. "currency" | "tokenized_asset")
   */
  aclass: string; // Kraken docs say string; we can narrow later if desired

  /**
   * Alternate name (e.g. "XBT", "ETH")
   */
  altname: string;

  /**
   * Number of decimal places for record keeping amounts of this asset
   */
  decimals: number;

  /**
   * Number of decimal places shown for display purposes in frontends
   */
  display_decimals: number;

  /**
   * Valuation as margin collateral (if applicable)
   */
  collateral_value?: number;

  /**
   * Status of asset.
   * - "enabled"
   * - "deposit_only"
   * - "withdrawal_only"
   * - "funding_temporarily_disabled"
   */
  status?: KrakenAssetStatus;
}

/**
 * Map of asset name -> info.
 * e.g. { "XXBT": { ... }, "XETH": { ... } }
 */
export type KrakenAssetInfoMap = Record<string, KrakenAssetInfo>;

export interface KrakenGetAssetInfoParams {
  /**
   * Comma-delimited list of assets to get info on (optional).
   * We accept string[] here and join internally.
   */
  asset?: string[];

  /**
   * Filters the asset class to retrieve (optional).
   * Default: "currency"
   */
  aclass?: KrakenAssetClass;
}

/**
 * GET /0/public/Assets
 * Get information about the assets that are available for deposit,
 * withdrawal, trading and earn.
 */
export function getAssetInfo(
  base: KrakenRestBase,
  params?: KrakenGetAssetInfoParams,
): Promise<KrakenAssetInfoMap> {
  const query: Record<string, string> = {};

  if (params?.asset && params.asset.length > 0) {
    query.asset = params.asset.join(',');
  }

  if (params?.aclass) {
    query.aclass = params.aclass;
  }

  return base.publicGet<KrakenAssetInfoMap>('/0/public/Assets', query);
}
