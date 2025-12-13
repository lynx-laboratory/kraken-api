import type { KrakenRestBase } from '../../../base/restBase';
import * as GetAccountBalance from './getAccountBalance';
import * as GetExtendedBalance from './getExtendedBalance';
import * as GetCreditLines from './getCreditLines';
import * as GetTradeBalance from './getTradeBalance';
import * as GetOpenOrders from './getOpenOrders';
import * as GetClosedOrders from './getClosedOrders';
import * as QueryOrdersInfo from './queryOrdersInfo';
import * as GetOrderAmends from './getOrderAmends';
import * as GetTradesHistory from './getTradesHistory';
import * as QueryTradesInfo from './queryTradesInfo';
import * as GetOpenPositions from './getOpenPositions';
import * as GetLedgersInfo from './getLedgersInfo';
import * as QueryLedgers from './queryLedgers';
import * as GetTradeVolume from './getTradeVolume';
import * as RequestExportReport from './requestExportReport';
import * as GetExportReportStatus from './getExportReportStatus';
import * as RetrieveExportReport from './retrieveExportReport';
import * as DeleteExportReport from './deleteExportReport';

type KrakenRestBaseWithBinary = KrakenRestBase & {
  privatePostBinary(
    path: string,
    body?: Record<string, string>,
  ): Promise<ArrayBuffer>;
};

export class KrakenSpotAccountDataApi {
  constructor(private readonly base: KrakenRestBase) {}

  /**
   * Retrieve all cash balances, net of pending withdrawals.
   *
   * @example
   * const balances = await kraken.accountData.getAccountBalance();
   *
   * console.log("USD balance:", balances["ZUSD"]);
   * console.log("BTC balance:", balances["XXBT"]);
   */
  getAccountBalance(params?: GetAccountBalance.KrakenGetAccountBalanceParams) {
    return GetAccountBalance.getAccountBalance(this.base, params);
  }

  /**
   * Retrieve extended balances for all assets, including credit and held amounts.
   *
   * Balance available for trading is calculated as:
   *   available = balance + credit - credit_used - hold_trade
   *
   * @example
   * const extended = await kraken.accountData.getExtendedBalance();
   *
   * const usd = extended["ZUSD"];
   * const availableUsd =
   *   Number(usd.balance) +
   *   Number(usd.credit) -
   *   Number(usd.credit_used) -
   *   Number(usd.hold_trade);
   */
  getExtendedBalance(
    params?: GetExtendedBalance.KrakenGetExtendedBalanceParams,
  ) {
    return GetExtendedBalance.getExtendedBalance(this.base, params);
  }

  /**
   * Retrieve all credit line details for the account (if any).
   *
   * Returns `null` if there are no credit lines configured.
   *
   * @example
   * const credit = await kraken.accountData.getCreditLines();
   *
   * if (!credit) {
   *   console.log("No credit lines configured");
   * } else {
   *   const usdLine = credit.asset_details["ZUSD"];
   *   console.log("USD credit limit:", usdLine.credit_limit);
   *   console.log("USD available credit:", usdLine.available_credit);
   *
   *   const monitor = credit.limits_monitor;
   *   console.log("Total credit (USD):", monitor.total_credit_usd);
   * }
   */
  getCreditLines(params?: GetCreditLines.KrakenGetCreditLinesParams) {
    return GetCreditLines.getCreditLines(this.base, params);
  }

  /**
   * Retrieve a summary of collateral balances, margin position valuations,
   * equity and margin level.
   *
   * @example
   * const tb = await kraken.accountData.getTradeBalance();
   *
   * console.log("Equity (e):", tb.e);
   * console.log("Free margin (mf):", tb.mf);
   * console.log("Margin level (ml):", tb.ml);
   */
  getTradeBalance(params?: GetTradeBalance.KrakenGetTradeBalanceParams) {
    return GetTradeBalance.getTradeBalance(this.base, params);
  }

  /**
   * Retrieve information about currently open orders.
   *
   * @example
   * const { open } = await kraken.accountData.getOpenOrders({
   *   trades: true,
   * });
   *
   * for (const [orderId, order] of Object.entries(open)) {
   *   console.log(orderId, order.status, order.descr.order, order.vol, order.vol_exec);
   * }
   */
  getOpenOrders(params?: GetOpenOrders.KrakenGetOpenOrdersParams) {
    return GetOpenOrders.getOpenOrders(this.base, params);
  }

  /**
   * Retrieve information about orders that have been closed
   * (filled or cancelled). 50 results are returned at a time,
   * most recent by default.
   *
   * @example
   * const { closed, count } = await kraken.accountData.getClosedOrders({
   *   trades: true,
   *   closetime: "close",
   *   ofs: 0,
   * });
   *
   * for (const [txid, order] of Object.entries(closed)) {
   *   console.log(
   *     txid,
   *     order.status,
   *     order.descr.order,
   *     order.vol_exec,
   *     order.price,
   *   );
   * }
   */
  getClosedOrders(params?: GetClosedOrders.KrakenGetClosedOrdersParams) {
    return GetClosedOrders.getClosedOrders(this.base, params);
  }

  /**
   * Retrieve information about specific orders by txid.
   *
   * @example
   * const orders = await kraken.accountData.queryOrdersInfo({
   *   txid: ["OABCDEFGHIJKLMN", "O1234567890ABCDE"],
   *   trades: true,
   * });
   *
   * for (const [txid, order] of Object.entries(orders)) {
   *   console.log(
   *     txid,
   *     order.status,
   *     order.descr.order,
   *     order.vol_exec,
   *     order.price,
   *   );
   * }
   */
  queryOrdersInfo(params: QueryOrdersInfo.KrakenGetOrdersInfoParams) {
    return QueryOrdersInfo.queryOrdersInfo(this.base, params);
  }

  /**
   * Retrieve the amend history (audit trail) for a specific order.
   *
   * The first entry contains the original order parameters and has
   * amend_type of "original".
   *
   * @example
   * const history = await kraken.accountData.getOrderAmends({
   *   order_id: "OABCDEFGHIJKLMN",
   * });
   *
   * for (const amend of history.amends) {
   *   console.log(
   *     amend.timestamp,
   *     amend.amend_type,
   *     amend.order_qty,
   *     amend.limit_price,
   *     amend.reason,
   *   );
   * }
   */
  getOrderAmends(params: GetOrderAmends.KrakenGetOrderAmendsParams) {
    return GetOrderAmends.getOrderAmends(this.base, params);
  }

  /**
   * Retrieve information about trades / fills.
   * 50 results are returned at a time, most recent by default.
   *
   * @example
   * const history = await kraken.accountData.getTradesHistory({
   *   type: "all",
   *   ofs: 0,
   *   ledgers: false,
   * });
   *
   * console.log("Total trades:", history.count);
   * for (const [id, trade] of Object.entries(history.trades)) {
   *   console.log(
   *     id,
   *     trade.time,
   *     trade.pair,
   *     trade.type,
   *     trade.vol,
   *     trade.price,
   *   );
   * }
   */
  getTradesHistory(params?: GetTradesHistory.KrakenGetTradesHistoryParams) {
    return GetTradesHistory.getTradesHistory(this.base, params);
  }

  /**
   * Retrieve information about specific trades/fills by txid.
   *
   * @example
   * const trades = await kraken.accountData.queryTradesInfo({
   *   txid: ["TABCDEFG1234567", "T7654321GFEDCBA"],
   *   trades: false,
   * });
   *
   * for (const [id, t] of Object.entries(trades)) {
   *   console.log(
   *     id,
   *     t.time,
   *     t.pair,
   *     t.type,
   *     t.vol,
   *     t.price,
   *   );
   * }
   */
  queryTradesInfo(params: QueryTradesInfo.KrakenGetTradesInfoParams) {
    return QueryTradesInfo.queryTradesInfo(this.base, params);
  }

  /**
   * Get information about open margin positions.
   *
   * @example
   * const positions = await kraken.accountData.getOpenPositions({
   *   docalcs: true,
   * });
   *
   * for (const [txid, pos] of Object.entries(positions)) {
   *   console.log(
   *     txid,
   *     pos.pair,
   *     pos.type,
   *     pos.vol,
   *     pos.cost,
   *     pos.value,
   *     pos.net,
   *   );
   * }
   */
  getOpenPositions(params?: GetOpenPositions.KrakenGetOpenPositionsParams) {
    return GetOpenPositions.getOpenPositions(this.base, params);
  }

  /**
   * Retrieve information about ledger entries.
   * 50 results are returned at a time, most recent by default.
   *
   * @example
   * const result = await kraken.accountData.getLedgersInfo({
   *   asset: ["ZUSD", "XXBT"],
   *   type: "all",
   *   ofs: 0,
   * });
   *
   * console.log("Total ledger entries (if provided):", result.count);
   * for (const [id, entry] of Object.entries(result.ledger)) {
   *   console.log(
   *     id,
   *     entry.time,
   *     entry.type,
   *     entry.asset,
   *     entry.amount,
   *     entry.balance,
   *   );
   * }
   */
  getLedgersInfo(params?: GetLedgersInfo.KrakenGetLedgersInfoParams) {
    return GetLedgersInfo.getLedgersInfo(this.base, params);
  }

  /**
   * Retrieve information about specific ledger entries by ID.
   *
   * @example
   * const ledgers = await kraken.accountData.queryLedgers({
   *   id: ["L12345ABCDE", "L67890FGHIJ"],
   * });
   *
   * for (const [id, entry] of Object.entries(ledgers)) {
   *   console.log(
   *     id,
   *     entry.time,
   *     entry.type,
   *     entry.asset,
   *     entry.amount,
   *     entry.balance,
   *   );
   * }
   */
  queryLedgers(params: QueryLedgers.KrakenGetLedgersQueryParams) {
    return QueryLedgers.queryLedgers(this.base, params);
  }

  /**
   * Get 30-day USD trading volume and resulting fee schedule.
   *
   * Fees will not be included if `pair` is not specified.
   *
   * @example
   * const tv = await kraken.accountData.getTradeVolume({
   *   pair: ["XBTUSD", "ETHUSD"],
   * });
   *
   * console.log("Volume currency:", tv.currency); // "USD"
   * console.log("30d volume (USD):", tv.volume);
   *
   * const xbtFees = tv.fees?.["XBTUSD"];
   * if (xbtFees) {
   *   console.log("XBTUSD taker fee:", xbtFees.fee);
   * }
   */
  getTradeVolume(params?: GetTradeVolume.KrakenGetTradeVolumeParams) {
    return GetTradeVolume.getTradeVolume(this.base, params);
  }

  /**
   * Request an export report for trades or ledgers.
   *
   * Use the returned report ID with the export status/download
   * endpoints (not yet implemented here) to track and retrieve
   * the generated file.
   *
   * @example
   * const { id } = await kraken.accountData.requestExportReport({
   *   report: "trades",
   *   format: "CSV",
   *   description: "My trades export",
   *   // optional filters:
   *   // starttm: Math.floor(Date.now() / 1000) - 30 * 86400,
   *   // endtm:   Math.floor(Date.now() / 1000),
   * });
   *
   * console.log("Export report ID:", id);
   */
  requestExportReport(
    params: RequestExportReport.KrakenRequestExportReportParams,
  ) {
    return RequestExportReport.requestExportReport(this.base, params);
  }

  /**
   * Get status of requested export reports (trades or ledgers).
   *
   * @example
   * const statuses = await kraken.accountData.getExportReportStatus({
   *   report: "trades",
   * });
   *
   * for (const s of statuses) {
   *   console.log(
   *     s.id,
   *     s.status,
   *     s.descr,
   *     s.createdtm,
   *     s.completedtm,
   *   );
   * }
   */
  getExportReportStatus(
    params: GetExportReportStatus.KrakenGetExportReportStatusParams,
  ) {
    return GetExportReportStatus.getExportReportStatus(this.base, params);
  }

  /**
   * Retrieve a processed data export as a ZIP archive (binary).
   *
   * @example
   * const zipBytes = await kraken.accountData.RetrieveExportReport({
   *   id: "EXPORT_REPORT_ID",
   * });
   *
   * // In Node, for example:
   * // await fs.promises.writeFile("export.zip", Buffer.from(zipBytes));
   */
  retrieveExportReport(
    params: RetrieveExportReport.KrakenRetrieveExportParams,
  ) {
    // Cast here to satisfy the extended interface with privatePostBinary
    return RetrieveExportReport.retrieveExportReport(
      this.base as KrakenRestBaseWithBinary,
      params,
    );
  }

  /**
   * Delete or cancel an export report.
   *
   * - Use `type: "cancel"` for queued/processing reports.
   * - Use `type: "delete"` for processed reports.
   *
   * @example
   * const result = await kraken.accountData.deleteExportReport({
   *   id: "EXPORT_REPORT_ID",
   *   type: "cancel",
   * });
   *
   * console.log("cancel success:", result.cancel);
   */
  deleteExportReport(
    params: DeleteExportReport.KrakenDeleteExportReportParams,
  ) {
    return DeleteExportReport.deleteExportReport(this.base, params);
  }
}

// Re-export types for consumers
export type KrakenRebaseMultiplier = GetAccountBalance.KrakenRebaseMultiplier;
export type KrakenAccountBalanceMap = GetAccountBalance.KrakenAccountBalanceMap;
export type KrakenGetAccountBalanceParams =
  GetAccountBalance.KrakenGetAccountBalanceParams;

export type KrakenExtendedBalanceEntry =
  GetExtendedBalance.KrakenExtendedBalanceEntry;
export type KrakenExtendedBalanceMap =
  GetExtendedBalance.KrakenExtendedBalanceMap;
export type KrakenGetExtendedBalanceParams =
  GetExtendedBalance.KrakenGetExtendedBalanceParams;

export type KrakenCreditLinesAssetEntry =
  GetCreditLines.KrakenCreditLinesAssetEntry;
export type KrakenCreditLinesAssetMap =
  GetCreditLines.KrakenCreditLinesAssetMap;
export type KrakenCreditLinesLimitsMonitor =
  GetCreditLines.KrakenCreditLinesLimitsMonitor;
export type KrakenCreditLinesResult = GetCreditLines.KrakenCreditLinesResult;
export type KrakenCreditLinesResponse =
  GetCreditLines.KrakenCreditLinesResponse;
export type KrakenGetCreditLinesParams =
  GetCreditLines.KrakenGetCreditLinesParams;

export type KrakenTradeBalanceResult = GetTradeBalance.KrakenTradeBalanceResult;
export type KrakenGetTradeBalanceParams =
  GetTradeBalance.KrakenGetTradeBalanceParams;

export type KrakenOrderStatus = GetOpenOrders.KrakenOrderStatus;
export type KrakenOrderSide = GetOpenOrders.KrakenOrderSide;
export type KrakenOrderType = GetOpenOrders.KrakenOrderType;
export type KrakenOrderTrigger = GetOpenOrders.KrakenOrderTrigger;
export type KrakenOpenOrderDescription =
  GetOpenOrders.KrakenOpenOrderDescription;
export type KrakenOpenOrder = GetOpenOrders.KrakenOpenOrder;
export type KrakenOpenOrdersMap = GetOpenOrders.KrakenOpenOrdersMap;
export type KrakenOpenOrdersResult = GetOpenOrders.KrakenOpenOrdersResult;
export type KrakenGetOpenOrdersParams = GetOpenOrders.KrakenGetOpenOrdersParams;

export type KrakenClosedOrder = GetClosedOrders.KrakenClosedOrder;
export type KrakenClosedOrdersMap = GetClosedOrders.KrakenClosedOrdersMap;
export type KrakenClosedOrdersResult = GetClosedOrders.KrakenClosedOrdersResult;
export type KrakenClosedOrdersCloseTime =
  GetClosedOrders.KrakenClosedOrdersCloseTime;
export type KrakenGetClosedOrdersParams =
  GetClosedOrders.KrakenGetClosedOrdersParams;

export type KrakenQueriedOrder = QueryOrdersInfo.KrakenQueriedOrder;
export type KrakenQueriedOrdersMap = QueryOrdersInfo.KrakenQueriedOrdersMap;
export type KrakenGetOrdersInfoParams =
  QueryOrdersInfo.KrakenGetOrdersInfoParams;

export type KrakenOrderAmendType = GetOrderAmends.KrakenOrderAmendType;
export type KrakenOrderAmendEntry = GetOrderAmends.KrakenOrderAmendEntry;
export type KrakenOrderAmendsResult = GetOrderAmends.KrakenOrderAmendsResult;
export type KrakenGetOrderAmendsParams =
  GetOrderAmends.KrakenGetOrderAmendsParams;

export type KrakenTradeHistoryTypeFilter =
  GetTradesHistory.KrakenTradeHistoryTypeFilter;
export type KrakenTradeHistoryEntry = GetTradesHistory.KrakenTradeHistoryEntry;
export type KrakenTradeHistoryMap = GetTradesHistory.KrakenTradeHistoryMap;
export type KrakenTradesHistoryResult =
  GetTradesHistory.KrakenTradesHistoryResult;
export type KrakenGetTradesHistoryParams =
  GetTradesHistory.KrakenGetTradesHistoryParams;

export type KrakenQueriedTradesMap = QueryTradesInfo.KrakenQueriedTradesMap;
export type KrakenGetTradesInfoParams =
  QueryTradesInfo.KrakenGetTradesInfoParams;

export type KrakenPositionStatus = GetOpenPositions.KrakenPositionStatus;
export type KrakenOpenPosition = GetOpenPositions.KrakenOpenPosition;
export type KrakenOpenPositionsMap = GetOpenPositions.KrakenOpenPositionsMap;
export type KrakenOpenPositionsConsolidationMode =
  GetOpenPositions.KrakenOpenPositionsConsolidationMode;
export type KrakenGetOpenPositionsParams =
  GetOpenPositions.KrakenGetOpenPositionsParams;

export type KrakenLedgerTypeFilter = GetLedgersInfo.KrakenLedgerTypeFilter;
export type KrakenLedgerEntryType = GetLedgersInfo.KrakenLedgerEntryType;
export type KrakenLedgerEntry = GetLedgersInfo.KrakenLedgerEntry;
export type KrakenLedgerMap = GetLedgersInfo.KrakenLedgerMap;
export type KrakenLedgersInfoResult = GetLedgersInfo.KrakenLedgersInfoResult;
export type KrakenGetLedgersInfoParams =
  GetLedgersInfo.KrakenGetLedgersInfoParams;

export type KrakenQueriedLedgersMap = QueryLedgers.KrakenQueriedLedgersMap;
export type KrakenGetLedgersQueryParams =
  QueryLedgers.KrakenGetLedgersQueryParams;

export type KrakenFeeTierInfo = GetTradeVolume.KrakenFeeTierInfo;
export type KrakenTradeVolumeFeesMap = GetTradeVolume.KrakenTradeVolumeFeesMap;
export type KrakenTradeVolumeResult = GetTradeVolume.KrakenTradeVolumeResult;
export type KrakenGetTradeVolumeParams =
  GetTradeVolume.KrakenGetTradeVolumeParams;

export type KrakenExportReportType = RequestExportReport.KrakenExportReportType;
export type KrakenExportReportFormat =
  RequestExportReport.KrakenExportReportFormat;
export type KrakenRequestExportReportParams =
  RequestExportReport.KrakenRequestExportReportParams;
export type KrakenRequestExportReportResult =
  RequestExportReport.KrakenRequestExportReportResult;

export type KrakenExportReportStatusState =
  GetExportReportStatus.KrakenExportReportStatusState;
export type KrakenExportReportStatus =
  GetExportReportStatus.KrakenExportReportStatus;
export type KrakenGetExportReportStatusParams =
  GetExportReportStatus.KrakenGetExportReportStatusParams;

export type KrakenRetrieveExportParams =
  RetrieveExportReport.KrakenRetrieveExportParams;
export type KrakenRetrieveExportResult =
  RetrieveExportReport.KrakenRetrieveExportResult;

export type KrakenDeleteExportReportType =
  DeleteExportReport.KrakenDeleteExportReportType;
export type KrakenDeleteExportReportParams =
  DeleteExportReport.KrakenDeleteExportReportParams;
export type KrakenDeleteExportReportResult =
  DeleteExportReport.KrakenDeleteExportReportResult;
