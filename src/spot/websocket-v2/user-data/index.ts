import type { KrakenWebsocketBase } from '../../../base/websocketBase';
import * as Executions from './executions';
import * as Balances from './balances';

/**
 * Kraken Spot WebSocket v2 user-data API.
 *
 * Authenticated, account-specific streams:
 * - `executions` – order lifecycle + fills
 * - `balances`   – balances snapshot + ledger-based updates
 *
 * Typically exposed from your top-level Spot WS client as:
 *
 * ```ts
 * export class KrakenSpotWebsocketClient extends KrakenWebsocketBase {
 *   readonly userTrading: KrakenSpotWsUserTradingApi;
 *   readonly userData: KrakenSpotWsUserDataApi;
 *
 *   constructor(options: KrakenWebsocketOptions) {
 *     super(options);
 *     this.userTrading = new KrakenSpotWsUserTradingApi(this);
 *     this.userData = new KrakenSpotWsUserDataApi(this);
 *   }
 * }
 * ```
 */
export class KrakenSpotWsUserDataApi {
  constructor(private readonly ws: KrakenWebsocketBase) {}

  // ---------------------------------------------------------------------------
  // executions
  // ---------------------------------------------------------------------------

  /**
   * Subscribe to the `executions` channel.
   *
   * Streams:
   * - a **snapshot** of open orders + recent trades (configurable), then
   * - **update** events for order lifecycle + fills.
   *
   * @example
   * ```ts
   * // 1) Send subscribe request
   * const ack = await wsClient.userData.subscribeExecutions({
   *   snap_trades: true,
   *   snap_orders: true,
   *   order_status: true,
   * });
   *
   * if (!ack.success) {
   *   console.error("executions subscribe error:", ack.error);
   * }
   *
   * // 2) In your WS router:
   * ws.onMessage((raw) => {
   *   const msg = JSON.parse(raw);
   *
   *   if (msg.channel === "executions" && (msg.type === "snapshot" || msg.type === "update")) {
   *     const execMsg = msg as Executions.KrakenWsExecutionsMessage;
   *     for (const report of execMsg.data) {
   *       console.log(
   *         "[exec]",
   *         report.exec_type,
   *         report.order_id,
   *         report.order_status,
   *         "cum_qty:",
   *         report.cum_qty,
   *       );
   *     }
   *   }
   * });
   * ```
   */
  subscribeExecutions(
    params: Executions.KrakenWsExecutionsSubscribeParams,
    options?: Executions.KrakenWsExecutionsSubscribeOptions,
  ) {
    return Executions.subscribeExecutions(this.ws, params, options);
  }

  /**
   * Unsubscribe from the `executions` channel.
   *
   * @example
   * ```ts
   * const ack = await wsClient.userData.unsubscribeExecutions();
   *
   * if (!ack.success) {
   *   console.error("executions unsubscribe error:", ack.error);
   * }
   * ```
   */
  unsubscribeExecutions(
    params?: Executions.KrakenWsExecutionsUnsubscribeParams,
    options?: Executions.KrakenWsExecutionsUnsubscribeOptions,
  ) {
    return Executions.unsubscribeExecutions(this.ws, params ?? {}, options);
  }

  // ---------------------------------------------------------------------------
  // balances
  // ---------------------------------------------------------------------------

  /**
   * Subscribe to the `balances` channel.
   *
   * Streams:
   * - a **snapshot** of all assets + wallets (unless `snapshot: false`
   *   or `users: "all"`), then
   * - **update** events for every ledger-derived balance change.
   *
   * @example
   * ```ts
   * // 1) Subscribe and request a snapshot
   * const ack = await wsClient.userData.subscribeBalances({
   *   snapshot: true,
   * });
   *
   * if (!ack.success) {
   *   console.error("balances subscribe error:", ack.error);
   * }
   *
   * // 2) Handle stream messages
   * ws.onMessage((raw) => {
   *   const msg = JSON.parse(raw);
   *
   *   if (msg.channel === "balances" && msg.type === "snapshot") {
   *     const snap = msg as Balances.KrakenWsBalancesSnapshotMessage;
   *     for (const asset of snap.data) {
   *       console.log("[balances snapshot]", asset.asset, "total:", asset.balance);
   *       for (const w of asset.wallets) {
   *         console.log("  wallet", w.type, w.id, "=", w.balance);
   *       }
   *     }
   *   }
   *
   *   if (msg.channel === "balances" && msg.type === "update") {
   *     const upd = msg as Balances.KrakenWsBalancesUpdateMessage;
   *     for (const tx of upd.data) {
   *       console.log(
   *         "[balances update]",
   *         tx.asset,
   *         tx.type,
   *         "delta:",
   *         tx.amount,
   *         "new balance:",
   *         tx.balance,
   *       );
   *     }
   *   }
   * });
   * ```
   */
  subscribeBalances(
    params: Balances.KrakenWsBalancesSubscribeParams = {},
    options?: Balances.KrakenWsBalancesSubscribeOptions,
  ) {
    return Balances.subscribeBalances(this.ws, params, options);
  }

  /**
   * Unsubscribe from the `balances` channel.
   *
   * @example
   * ```ts
   * const ack = await wsClient.userData.unsubscribeBalances();
   *
   * if (!ack.success) {
   *   console.error("balances unsubscribe error:", ack.error);
   * }
   * ```
   */
  unsubscribeBalances(
    params?: Balances.KrakenWsBalancesUnsubscribeParams,
    options?: Balances.KrakenWsBalancesUnsubscribeOptions,
  ) {
    return Balances.unsubscribeBalances(this.ws, params ?? {}, options);
  }
}

// -----------------------------------------------------------------------------
// Re-export types for consumers
// -----------------------------------------------------------------------------

// Executions
export type KrakenWsExecutionType = Executions.KrakenWsExecutionType;
export type KrakenWsOrderStatus = Executions.KrakenWsOrderStatus;
export type KrakenWsLiquidityIndicator = Executions.KrakenWsLiquidityIndicator;
export type KrakenWsPositionStatus = Executions.KrakenWsPositionStatus;
export type KrakenWsTriggerStatus = Executions.KrakenWsTriggerStatus;
export type KrakenWsExecutionTimeInForce =
  Executions.KrakenWsExecutionTimeInForce;

export type KrakenWsExecutionFeeEntry = Executions.KrakenWsExecutionFeeEntry;
export type KrakenWsExecutionTriggers = Executions.KrakenWsExecutionTriggers;
export type KrakenWsExecutionContingent =
  Executions.KrakenWsExecutionContingent;
export type KrakenWsExecutionReport = Executions.KrakenWsExecutionReport;
export type KrakenWsExecutionsMessage = Executions.KrakenWsExecutionsMessage;

export type KrakenWsExecutionsSubscribeParams =
  Executions.KrakenWsExecutionsSubscribeParams;
export type KrakenWsExecutionsSubscribeOptions =
  Executions.KrakenWsExecutionsSubscribeOptions;
export type KrakenWsExecutionsSubscribeResult =
  Executions.KrakenWsExecutionsSubscribeResult;
export type KrakenWsExecutionsSubscribeResponse =
  Executions.KrakenWsExecutionsSubscribeResponse;

export type KrakenWsExecutionsUnsubscribeParams =
  Executions.KrakenWsExecutionsUnsubscribeParams;
export type KrakenWsExecutionsUnsubscribeOptions =
  Executions.KrakenWsExecutionsUnsubscribeOptions;
export type KrakenWsExecutionsUnsubscribeResult =
  Executions.KrakenWsExecutionsUnsubscribeResult;
export type KrakenWsExecutionsUnsubscribeResponse =
  Executions.KrakenWsExecutionsUnsubscribeResponse;

// Balances
export type KrakenWsBalanceWalletType = Balances.KrakenWsBalanceWalletType;
export type KrakenWsBalanceWalletId = Balances.KrakenWsBalanceWalletId;
export type KrakenWsBalanceUpdateWalletId =
  Balances.KrakenWsBalanceUpdateWalletId;
export type KrakenWsBalanceEventType = Balances.KrakenWsBalanceEventType;
export type KrakenWsBalanceEventSubtype = Balances.KrakenWsBalanceEventSubtype;
export type KrakenWsBalanceEventCategory =
  Balances.KrakenWsBalanceEventCategory;

export type KrakenWsBalanceWalletEntry = Balances.KrakenWsBalanceWalletEntry;
export type KrakenWsBalancesSnapshotAsset =
  Balances.KrakenWsBalancesSnapshotAsset;
export type KrakenWsBalancesSnapshotMessage =
  Balances.KrakenWsBalancesSnapshotMessage;
export type KrakenWsBalanceLedgerTransaction =
  Balances.KrakenWsBalanceLedgerTransaction;
export type KrakenWsBalancesUpdateMessage =
  Balances.KrakenWsBalancesUpdateMessage;
export type KrakenWsBalancesMessage = Balances.KrakenWsBalancesMessage;

export type KrakenWsBalancesSubscribeParams =
  Balances.KrakenWsBalancesSubscribeParams;
export type KrakenWsBalancesSubscribeOptions =
  Balances.KrakenWsBalancesSubscribeOptions;
export type KrakenWsBalancesSubscribeResult =
  Balances.KrakenWsBalancesSubscribeResult;
export type KrakenWsBalancesSubscribeResponse =
  Balances.KrakenWsBalancesSubscribeResponse;

export type KrakenWsBalancesUnsubscribeParams =
  Balances.KrakenWsBalancesUnsubscribeParams;
export type KrakenWsBalancesUnsubscribeOptions =
  Balances.KrakenWsBalancesUnsubscribeOptions;
export type KrakenWsBalancesUnsubscribeResult =
  Balances.KrakenWsBalancesUnsubscribeResult;
export type KrakenWsBalancesUnsubscribeResponse =
  Balances.KrakenWsBalancesUnsubscribeResponse;
