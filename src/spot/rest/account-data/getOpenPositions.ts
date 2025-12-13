import type { KrakenRestBase } from '../../../base/restBase';
import type { KrakenRebaseMultiplier } from './getAccountBalance';
import type { KrakenOrderSide, KrakenOrderType } from './getOpenOrders';

/**
 * Currently the only documented posstatus is "open",
 * but keeping it as a string union in case Kraken extends it.
 */
export type KrakenPositionStatus = 'open';

/**
 * Single open margin position.
 *
 * If `docalcs=true`, `value` and `net` will be populated.
 */
export interface KrakenOpenPosition {
  /** Order ID responsible for the position */
  ordertxid: string;

  /** Position status (currently only "open") */
  posstatus: KrakenPositionStatus;

  /** Asset pair */
  pair: string;

  /** Unix timestamp of trade that opened the position */
  time: number;

  /** Direction (buy/sell) of position */
  type: KrakenOrderSide;

  /** Order type used to open position */
  ordertype: KrakenOrderType;

  /** Opening cost of position (quote currency) */
  cost: string;

  /** Opening fee of position (quote currency) */
  fee: string;

  /** Position opening size (base currency) */
  vol: string;

  /** Quantity closed (base currency) */
  vol_closed: string;

  /** Initial margin consumed (quote currency) */
  margin: string;

  /**
   * Current value of remaining position (if `docalcs` requested).
   * Quote currency.
   */
  value?: string;

  /**
   * Unrealised P&L of remaining position (if `docalcs` requested).
   * Quote currency.
   */
  net?: string;

  /** Funding cost and term of position */
  terms: string;

  /** Timestamp of next margin rollover fee (string as per docs) */
  rollovertm: string;

  /** Comma-delimited list of additional info */
  misc: string;

  /** Comma-delimited list of opening order flags */
  oflags: string;
}

/** Map of position txid -> open position details */
export type KrakenOpenPositionsMap = Record<string, KrakenOpenPosition>;

/**
 * Consolidation mode.
 * Currently only "market" is documented.
 */
export type KrakenOpenPositionsConsolidationMode = 'market';

export interface KrakenGetOpenPositionsParams {
  /**
   * Comma-delimited list of txids to limit output to,
   * or an array of txids. Optional: if omitted, returns all.
   */
  txid?: string | string[];

  /**
   * Whether to include P&L calculations (`value` and `net`).
   * Default on Kraken is false.
   */
  docalcs?: boolean;

  /**
   * Consolidate positions by market/pair.
   * Currently only "market" is supported.
   */
  consolidation?: KrakenOpenPositionsConsolidationMode;

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
 * POST /0/private/OpenPositions
 *
 * Get information about open margin positions.
 *
 * Note:
 * - `nonce` is handled automatically by the client.
 * - Requires "Orders and trades – Query open orders & trades".
 */
export function getOpenPositions(
  base: KrakenRestBase,
  params?: KrakenGetOpenPositionsParams,
): Promise<KrakenOpenPositionsMap> {
  const body: Record<string, string> = {};

  if (params?.txid !== undefined) {
    body.txid = Array.isArray(params.txid)
      ? params.txid.join(',')
      : params.txid;
  }

  if (params?.docalcs !== undefined) {
    body.docalcs = params.docalcs ? 'true' : 'false';
  }

  if (params?.consolidation) {
    body.consolidation = params.consolidation;
  }

  if (params?.rebase_multiplier) {
    body.rebase_multiplier = params.rebase_multiplier;
  }

  return base.privatePost<KrakenOpenPositionsMap>(
    '/0/private/OpenPositions',
    body,
  );
}
