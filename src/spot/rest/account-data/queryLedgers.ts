import type { KrakenRestBase } from '../../../base/restBase';
import type { KrakenRebaseMultiplier } from './getAccountBalance';
import type { KrakenLedgerMap } from './getLedgersInfo';

/** Map of ledger ID -> ledger entry (same shape as LedgersInfo) */
export type KrakenQueriedLedgersMap = KrakenLedgerMap;

export interface KrakenGetLedgersQueryParams {
  /**
   * Comma-delimited list of ledger IDs to query info about (20 maximum),
   * or an array of IDs (will be joined).
   */
  id: string | string[];

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
 * POST /0/private/QueryLedgers
 *
 * Retrieve information about specific ledger entries.
 *
 * Note:
 * - `nonce` is handled automatically by the client.
 * - Requires "Data – Query ledger entries" permission.
 */
export function queryLedgers(
  base: KrakenRestBase,
  params: KrakenGetLedgersQueryParams,
): Promise<KrakenQueriedLedgersMap> {
  const body: Record<string, string> = {};

  // id is required; support string or string[]
  if (Array.isArray(params.id)) {
    body.id = params.id.join(',');
  } else {
    body.id = params.id;
  }

  if (params.trades !== undefined) {
    body.trades = params.trades ? 'true' : 'false';
  }

  if (params.rebase_multiplier) {
    body.rebase_multiplier = params.rebase_multiplier;
  }

  return base.privatePost<KrakenQueriedLedgersMap>(
    '/0/private/QueryLedgers',
    body,
  );
}
