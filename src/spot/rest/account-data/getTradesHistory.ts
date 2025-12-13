import type { KrakenRestBase } from '../../../base/restBase';
import type { KrakenRebaseMultiplier } from './getAccountBalance';
import type { KrakenOrderSide, KrakenOrderType } from './getOpenOrders';

/**
 * Trade type filter for TradesHistory.
 *
 * - "all"              : all trades
 * - "any position"     : any position
 * - "closed position"  : closed positions
 * - "closing position" : closing trades
 * - "no position"      : trades not opening/closing positions
 */
export type KrakenTradeHistoryTypeFilter =
  | 'all'
  | 'any position'
  | 'closed position'
  | 'closing position'
  | 'no position';

/**
 * Trade info as returned by TradesHistory.
 */
export interface KrakenTradeHistoryEntry {
  /** Order responsible for execution of trade */
  ordertxid: string;

  /** Position responsible for execution of trade */
  postxid: string;

  /** Asset pair */
  pair: string;

  /** Unix timestamp of trade */
  time: number;

  /** Type of order (buy/sell) */
  type: KrakenOrderSide;

  /** Order type (market, limit, etc.) */
  ordertype: KrakenOrderType;

  /** Average price order was executed at (quote currency) */
  price: string;

  /** Total cost of order (quote currency) */
  cost: string;

  /** Total fee (quote currency) */
  fee: string;

  /** Volume (base currency) */
  vol: string;

  /** Initial margin (quote currency) */
  margin: string;

  /** Amount of leverage used in trade */
  leverage: string;

  /**
   * Comma-delimited list of miscellaneous info.
   * e.g. "closing" if trade closes all or part of a position.
   */
  misc: string;

  /**
   * List of ledger ids for entries associated with trade.
   * Only present if `ledgers=true`.
   */
  ledgers?: string[];

  /** Unique identifier of trade executed */
  trade_id: number;

  /** true if trade was executed with user as maker, false if taker */
  maker: boolean;

  /**
   * Position status (open/closed).
   * Only present if trade opened a position.
   */
  posstatus?: string;

  /**
   * Average price of closed portion of position (quote currency).
   * Only present if trade opened a position.
   */
  cprice?: number;

  /**
   * Total cost of closed portion of position (quote currency).
   * Only present if trade opened a position.
   */
  ccost?: number;

  /**
   * Total fee of closed portion of position (quote currency).
   * Only present if trade opened a position.
   */
  cfee?: number;

  /**
   * Total volume of closed portion of position (base currency).
   * (Docs text is a bit inconsistent, but this is the closed volume.)
   * Only present if trade opened a position.
   */
  cvol?: number;

  /**
   * Total margin freed in closed portion of position (quote currency).
   * Only present if trade opened a position.
   */
  cmargin?: number;

  /**
   * Net profit/loss of closed portion of position
   * (quote currency, quote currency scale).
   * Only present if trade opened a position.
   */
  net?: number;

  /**
   * List of closing trades for position (if available).
   * Only present if trade opened a position.
   */
  trades?: string[];
}

/** Map of trade ID (string key) -> trade entry */
export type KrakenTradeHistoryMap = Record<string, KrakenTradeHistoryEntry>;

export interface KrakenTradesHistoryResult {
  /**
   * Amount of available trades matching criteria.
   * Used with `ofs` for pagination.
   */
  count: number;

  /** Trades keyed by internal trade ID */
  trades: KrakenTradeHistoryMap;
}

export interface KrakenGetTradesHistoryParams {
  /**
   * Type of trade filter.
   * Default on Kraken is "all".
   */
  type?: KrakenTradeHistoryTypeFilter;

  /**
   * Whether or not to include trades related to position in output.
   * Default on Kraken is false.
   */
  trades?: boolean;

  /**
   * Starting unix timestamp or trade tx ID of results (exclusive).
   */
  start?: number | string;

  /**
   * Ending unix timestamp or trade tx ID of results (inclusive).
   */
  end?: number | string;

  /**
   * Result offset for pagination.
   * 50 results are returned per page by default.
   */
  ofs?: number;

  /**
   * Whether or not to consolidate trades by individual taker trades.
   * Default on Kraken is true.
   */
  consolidate_taker?: boolean;

  /**
   * Whether or not to include related ledger ids for given trade.
   * Note that setting this to true will slow request performance.
   * Default on Kraken is false.
   */
  ledgers?: boolean;

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
 * POST /0/private/TradesHistory
 *
 * Retrieve information about trades/fills.
 * 50 results are returned at a time, most recent by default.
 *
 * Note:
 * - `nonce` is handled automatically by the client.
 * - Requires "Orders and trades – Query closed orders & trades".
 */
export function getTradesHistory(
  base: KrakenRestBase,
  params?: KrakenGetTradesHistoryParams,
): Promise<KrakenTradesHistoryResult> {
  const body: Record<string, string> = {};

  if (params?.type) {
    body.type = params.type;
  }

  if (params?.trades !== undefined) {
    body.trades = params.trades ? 'true' : 'false';
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

  if (params?.consolidate_taker !== undefined) {
    body.consolidate_taker = params.consolidate_taker ? 'true' : 'false';
  }

  if (params?.ledgers !== undefined) {
    body.ledgers = params.ledgers ? 'true' : 'false';
  }

  if (params?.rebase_multiplier) {
    body.rebase_multiplier = params.rebase_multiplier;
  }

  return base.privatePost<KrakenTradesHistoryResult>(
    '/0/private/TradesHistory',
    body,
  );
}
