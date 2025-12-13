import type { KrakenRestBase } from '../../../base/restBase';
import type { KrakenRebaseMultiplier } from './getAccountBalance';
import type { KrakenTradeHistoryEntry } from './getTradesHistory';

/** Map of txid -> trade entry (same shape as TradesHistory) */
export type KrakenQueriedTradesMap = Record<string, KrakenTradeHistoryEntry>;

export interface KrakenGetTradesInfoParams {
  /**
   * Comma-delimited list of transaction IDs to query info about,
   * or an array of IDs (will be joined).
   * Maximum 20 IDs.
   */
  txid: string | string[];

  /**
   * Whether or not to include trades related to position in output.
   * Default on Kraken is false.
   */
  trades?: boolean;

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
 * POST /0/private/QueryTrades
 *
 * Retrieve information about specific trades/fills.
 *
 * Note:
 * - `nonce` is handled automatically by the client.
 * - Requires "Orders and trades – Query closed orders & trades".
 */
export function queryTradesInfo(
  base: KrakenRestBase,
  params: KrakenGetTradesInfoParams,
): Promise<KrakenQueriedTradesMap> {
  const body: Record<string, string> = {};

  // txid required, support string or string[]
  if (Array.isArray(params.txid)) {
    body.txid = params.txid.join(',');
  } else {
    body.txid = params.txid;
  }

  if (params.trades !== undefined) {
    body.trades = params.trades ? 'true' : 'false';
  }

  if (params.rebase_multiplier) {
    body.rebase_multiplier = params.rebase_multiplier;
  }

  return base.privatePost<KrakenQueriedTradesMap>(
    '/0/private/QueryTrades',
    body,
  );
}
