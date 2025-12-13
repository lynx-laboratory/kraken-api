import type { KrakenRestBase } from '../../../base/restBase';
import type { KrakenRebaseMultiplier } from './getAccountBalance';

/**
 * Ledger type filter for LedgersInfo.
 */
export type KrakenLedgerTypeFilter =
  | 'all'
  | 'trade'
  | 'deposit'
  | 'withdrawal'
  | 'transfer'
  | 'margin'
  | 'adjustment'
  | 'rollover'
  | 'credit'
  | 'settled'
  | 'staking'
  | 'dividend'
  | 'sale'
  | 'nft_rebate';

/**
 * Actual ledger entry type as returned by the API.
 * (This can be larger than the filter set.)
 */
export type KrakenLedgerEntryType =
  | 'none'
  | 'trade'
  | 'deposit'
  | 'withdrawal'
  | 'transfer'
  | 'margin'
  | 'adjustment'
  | 'rollover'
  | 'spend'
  | 'receive'
  | 'settled'
  | 'credit'
  | 'staking'
  | 'reward'
  | 'dividend'
  | 'sale'
  | 'conversion'
  | 'nfttrade'
  | 'nftcreatorfee'
  | 'nftrebate'
  | 'custodytransfer';

/**
 * Single ledger entry.
 */
export interface KrakenLedgerEntry {
  /** Reference ID of the parent transaction (trade, deposit, withdrawal, etc.) */
  refid: string;

  /** Unix timestamp of ledger entry */
  time: number;

  /** Type of ledger entry */
  type: KrakenLedgerEntryType;

  /** Additional info relating to the ledger entry type, where applicable */
  subtype: string;

  /** Asset class */
  aclass: string;

  /** Asset code (e.g. "ZUSD", "XXBT", "USDT.F") */
  asset: string;

  /** Transaction amount */
  amount: string;

  /** Transaction fee */
  fee: string;

  /** Resulting balance */
  balance: string;
}

/** Map of ledger ID -> ledger entry */
export type KrakenLedgerMap = Record<string, KrakenLedgerEntry>;

export interface KrakenLedgersInfoResult {
  /** Ledger entries keyed by ledger ID */
  ledger: KrakenLedgerMap;

  /**
   * Amount of available ledger info matching criteria.
   * May be omitted if `without_count=true`.
   */
  count?: number;
}

export interface KrakenGetLedgersInfoParams {
  /**
   * Filter output by asset or list of assets.
   * e.g. "ZUSD" or ["ZUSD", "XXBT", "USDT.F"].
   * Default on Kraken is "all".
   */
  asset?: string | string[];

  /**
   * Filter output by asset class.
   * Default on Kraken is "currency".
   */
  aclass?: string;

  /**
   * Type of ledger entries to retrieve.
   * Default on Kraken is "all".
   */
  type?: KrakenLedgerTypeFilter;

  /**
   * Starting unix timestamp or ledger ID of results (exclusive).
   */
  start?: number | string;

  /**
   * Ending unix timestamp or ledger ID of results (inclusive).
   */
  end?: number | string;

  /**
   * Result offset for pagination.
   * 50 results are returned per page by default.
   */
  ofs?: number;

  /**
   * If true, does not retrieve count of ledger entries.
   * Can be noticeably faster for users with many entries.
   */
  without_count?: boolean;

  /**
   * Optional parameter for viewing xstocks data.
   *
   * - "rebased": Display in terms of underlying equity.
   * - "base":    Display in terms of SPV tokens.
   *
   * Default on Kraken is "rebased" if omitted.
   */
  rebase_multiplier?: KrakenRebaseMultiplier;
}

/**
 * POST /0/private/Ledgers
 *
 * Retrieve information about ledger entries.
 * 50 results are returned at a time, most recent by default.
 *
 * Note:
 * - `nonce` is handled automatically by the client.
 * - Requires "Data – Query ledger entries" permission.
 */
export function getLedgersInfo(
  base: KrakenRestBase,
  params?: KrakenGetLedgersInfoParams,
): Promise<KrakenLedgersInfoResult> {
  const body: Record<string, string> = {};

  if (params?.asset !== undefined) {
    body.asset = Array.isArray(params.asset)
      ? params.asset.join(',')
      : params.asset;
  }

  if (params?.aclass) {
    body.aclass = params.aclass;
  }

  if (params?.type) {
    body.type = params.type;
  }

  if (params?.start !== undefined) {
    body.start = String(params.start);
  }

  if (params?.end !== undefined) {
    body.end = String(params.end);
  }

  if (params?.ofs !== undefined) {
    body.ofs = String(params.ofs);
  }

  if (params?.without_count !== undefined) {
    body.without_count = params.without_count ? 'true' : 'false';
  }

  if (params?.rebase_multiplier) {
    body.rebase_multiplier = params.rebase_multiplier;
  }

  return base.privatePost<KrakenLedgersInfoResult>('/0/private/Ledgers', body);
}
