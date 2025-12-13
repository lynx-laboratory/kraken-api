import type { KrakenRestBase } from '../../../base/restBase';
import * as AddOrder from './addOrder';
import * as AmendOrder from './amendOrder';
import * as CancelOrder from './cancelOrder';
import * as CancelAllOrders from './cancelAllOrders';
import * as CancelAllOrdersAfter from './cancelAllOrdersAfter';
import * as GetWebSocketsToken from './getWebSocketsToken';
import * as AddOrderBatch from './addOrderBatch';
import * as CancelOrderBatch from './cancelOrderBatch';
import * as EditOrder from './editOrder';

export class KrakenSpotTradingApi {
  constructor(private readonly base: KrakenRestBase) {}

  /**
   * Place a new order.
   *
   * @example
   * const result = await kraken.trading.addOrder({
   *   pair: "XBTUSD",
   *   type: "buy",
   *   ordertype: "limit",
   *   volume: "0.01",
   *   price: "40000",
   *   timeinforce: "GTC",
   * });
   *
   * console.log(result.descr.order, result.txid);
   */
  addOrder(params: AddOrder.KrakenAddOrderParams) {
    return AddOrder.addOrder(this.base, params);
  }

  /**
   * Amend an existing order in-place.
   *
   * @example
   * // Reduce quantity + move limit price:
   * const result = await kraken.trading.amendOrder({
   *   txid: "OABCDEFGHIJKL",
   *   order_qty: "0.005",
   *   limit_price: "39500",
   * });
   *
   * console.log("Amend ID:", result.amend_id);
   */
  amendOrder(params: AmendOrder.KrakenAmendOrderParams) {
    return AmendOrder.amendOrder(this.base, params);
  }

  /**
   * Cancel open orders by txid, userref, or cl_ord_id.
   *
   * @example
   * // By single txid
   * const res1 = await kraken.trading.cancelOrder({
   *   txid: "OABCDEFGHIJKL",
   * });
   *
   * // By multiple txids
   * const res2 = await kraken.trading.cancelOrder({
   *   txid: ["OAAAA...", "OBBBB..."],
   * });
   *
   * // By userref
   * const res3 = await kraken.trading.cancelOrder({
   *   userref: 123456,
   * });
   *
   * // By client order id
   * const res4 = await kraken.trading.cancelOrder({
   *   cl_ord_id: "arb-20240509-00010",
   * });
   */
  cancelOrder(params: CancelOrder.KrakenCancelOrderParams) {
    return CancelOrder.cancelOrder(this.base, params);
  }

  /**
   * Cancel all open orders for this account.
   *
   * @example
   * const res = await kraken.trading.cancelAllOrders();
   * console.log("Cancelled count:", res.count, "pending:", res.pending);
   */
  cancelAllOrders() {
    return CancelAllOrders.cancelAllOrders(this.base);
  }

  /**
   * Set or extend the "Dead Man's Switch" timer that will
   * cancel all open orders after `timeout` seconds.
   *
   * Pass `timeout = 0` to disable the timer.
   *
   * @example
   * // Typical pattern: call every 15–30s with timeout=60
   * const result = await kraken.trading.cancelAllOrdersAfter({
   *   timeout: 60,
   * });
   *
   * console.log("Current:", result.currentTime);
   * console.log("Trigger:", result.triggerTime);
   */
  cancelAllOrdersAfter(
    params: CancelAllOrdersAfter.KrakenCancelAllOrdersAfterParams,
  ) {
    return CancelAllOrdersAfter.cancelAllOrdersAfter(this.base, params);
  }

  /**
   * Get a WebSockets authentication token for private WS API.
   *
   * Typical flow:
   * 1. Call this REST endpoint to get { token, expires }.
   * 2. Use `token` when authenticating your WebSocket connection.
   * 3. Ensure "WebSocket interface" is enabled on your API key.
   *
   * @example
   * const { token, expires } = await kraken.accountData.getWebSocketsToken();
   * console.log("WS token:", token, "expires in:", expires, "seconds");
   */
  getWebSocketsToken() {
    return GetWebSocketsToken.getWebSocketsToken(this.base);
  }

  /**
   * Place a batch of orders (2–15) for a single pair.
   *
   * @example
   * const result = await kraken.trading.addOrderBatch({
   *   pair: "XBTUSD",
   *   orders: [
   *     {
   *       type: "buy",
   *       ordertype: "limit",
   *       volume: "0.01",
   *       price: "40000",
   *     },
   *     {
   *       type: "sell",
   *       ordertype: "limit",
   *       volume: "0.01",
   *       price: "45000",
   *     },
   *   ],
   * });
   *
   * for (const o of result.orders) {
   *   console.log(o.descr.order, o.txid, o.error);
   * }
   */
  addOrderBatch(params: AddOrderBatch.KrakenAddOrderBatchParams) {
    return AddOrderBatch.addOrderBatch(this.base, params);
  }

  /**
   * Cancel multiple open orders by txid/userref or cl_ord_id.
   *
   * @example
   * const res = await kraken.trading.cancelOrderBatch({
   *   orders: [
   *     { txid: "OABCDEF..." }, // by Kraken order id
   *     { txid: 12345 },        // by userref
   *   ],
   *   clOrdIds: ["arb-20240509-00010"],
   * });
   *
   * console.log("Cancelled:", res.count, "pending:", res.pending);
   */
  cancelOrderBatch(params: CancelOrderBatch.KrakenCancelOrderBatchParams) {
    return CancelOrderBatch.cancelOrderBatch(this.base, params);
  }

  /**
   * Edit an existing live order.
   *
   * Under the hood this:
   * - cancels the original order
   * - creates a new order with adjusted parameters
   * - returns the new txid and original txid
   *
   * Caveats (per Kraken):
   * - does NOT preserve queue position
   * - does NOT support orders with conditional closes
   * - does NOT support triggered stop-loss / take-profit orders
   *
   * Prefer {@link amendOrder} where possible.
   *
   * @example
   * const res = await kraken.trading.editOrder({
   *   txid: "OABCDEFGHIJKL",
   *   pair: "XBTUSD",
   *   price: "40100",
   *   volume: "0.01",
   * });
   *
   * console.log("New txid:", res.txid, "original:", res.originaltxid);
   */
  editOrder(params: EditOrder.KrakenEditOrderParams) {
    return EditOrder.editOrder(this.base, params);
  }
}

// Re-export types for consumers
export type KrakenAddOrderParams = AddOrder.KrakenAddOrderParams;
export type KrakenAddOrderResult = AddOrder.KrakenAddOrderResult;
export type KrakenAddOrderDescription = AddOrder.KrakenAddOrderDescription;
export type KrakenAddOrderTimeInForce = AddOrder.KrakenAddOrderTimeInForce;
export type KrakenAddOrderStpType = AddOrder.KrakenAddOrderStpType;

export type KrakenAmendOrderParams = AmendOrder.KrakenAmendOrderParams;
export type KrakenAmendOrderResult = AmendOrder.KrakenAmendOrderResult;

export type KrakenCancelOrderParams = CancelOrder.KrakenCancelOrderParams;
export type KrakenCancelOrderResult = CancelOrder.KrakenCancelOrderResult;

export type KrakenCancelAllOrdersResult =
  CancelAllOrders.KrakenCancelAllOrdersResult;

export type KrakenCancelAllOrdersAfterParams =
  CancelAllOrdersAfter.KrakenCancelAllOrdersAfterParams;
export type KrakenCancelAllOrdersAfterResult =
  CancelAllOrdersAfter.KrakenCancelAllOrdersAfterResult;

export type KrakenGetWebSocketsTokenResult =
  GetWebSocketsToken.KrakenGetWebSocketsTokenResult;

export type KrakenAddOrderBatchOrderParams =
  AddOrderBatch.KrakenAddOrderBatchOrderParams;
export type KrakenAddOrderBatchParams = AddOrderBatch.KrakenAddOrderBatchParams;
export type KrakenAddOrderBatchOrderDescription =
  AddOrderBatch.KrakenAddOrderBatchOrderDescription;
export type KrakenAddOrderBatchOrderResult =
  AddOrderBatch.KrakenAddOrderBatchOrderResult;
export type KrakenAddOrderBatchResult = AddOrderBatch.KrakenAddOrderBatchResult;

export type KrakenCancelOrderBatchOrderRef =
  CancelOrderBatch.KrakenCancelOrderBatchOrderRef;
export type KrakenCancelOrderBatchParams =
  CancelOrderBatch.KrakenCancelOrderBatchParams;
export type KrakenCancelOrderBatchResult =
  CancelOrderBatch.KrakenCancelOrderBatchResult;

export type KrakenEditOrderParams = EditOrder.KrakenEditOrderParams;
export type KrakenEditOrderResult = EditOrder.KrakenEditOrderResult;
export type KrakenEditOrderDescription = EditOrder.KrakenEditOrderDescription;
