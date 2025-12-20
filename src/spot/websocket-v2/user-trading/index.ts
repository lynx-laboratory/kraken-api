import type { KrakenWebsocketBase } from '../../../base/websocketBase';
import * as AddOrder from './addOrder';
import * as AmendOrder from './amendOrder';
import * as EditOrder from './editOrder';
import * as CancelOrder from './cancelOrder';
import * as CancelAll from './cancelAll';
import * as CancelAllOrdersAfter from './cancelAllOrdersAfter';
import * as BatchAdd from './batchAdd';
import * as BatchCancel from './batchCancel';

/**
 * User trading RPC methods over WebSocket v2 (auth WS).
 *
 * Exposes the WS v2 trading RPCs:
 * - add_order
 * - amend_order
 * - edit_order (legacy)
 * - cancel_order
 * - cancel_all
 * - cancel_all_orders_after (Dead Man's Switch)
 * - batch_add
 * - batch_cancel
 */
export class KrakenSpotWsUserTradingApi {
  constructor(private readonly ws: KrakenWebsocketBase) {}

  // ---------------------------------------------------------------------------
  // add_order
  // ---------------------------------------------------------------------------

  /**
   * Send a single new order into the exchange.
   *
   * This wraps the WS v2 `add_order` method.
   *
   * @example
   * ```ts
   * const res = await wsClient.userTrading.addOrder({
   *   order_type: "limit",
   *   side: "buy",
   *   symbol: "BTC/USD",
   *   order_qty: 0.01,
   *   limit_price: 30000,
   *   time_in_force: "gtc",
   *   cl_ord_id: "arb-20250501-0001",
   * });
   *
   * if (res.success) {
   *   console.log("order_id:", res.result?.order_id);
   *   console.log("cl_ord_id:", res.result?.cl_ord_id);
   * } else {
   *   console.error("add_order error:", res.error);
   * }
   * ```
   */
  addOrder(
    params: AddOrder.KrakenWsAddOrderParams,
    options?: AddOrder.KrakenWsAddOrderOptions,
  ) {
    return AddOrder.addOrder(this.ws, params, options);
  }

  // ---------------------------------------------------------------------------
  // amend_order
  // ---------------------------------------------------------------------------

  /**
   * Amend an existing order in-place.
   *
   * Either `order_id` or `cl_ord_id` must be provided (but not both).
   * Queue priority is preserved where possible.
   *
   * For new integrations, this is preferred over `editOrder`.
   *
   * @example
   * ```ts
   * const res = await wsClient.userTrading.amendOrder({
   *   order_id: "OFGKYQ-FHPCQ-HUQFEK",
   *   order_qty: 0.008,        // new quantity
   *   limit_price: 29500,      // new limit price
   *   deadline: "2025-05-01T12:34:56.123Z",
   * });
   *
   * if (res.success) {
   *   console.log("amend_id:", res.result?.amend_id);
   * } else {
   *   console.error("amend_order error:", res.error);
   * }
   * ```
   */
  amendOrder(
    params: AmendOrder.KrakenWsAmendOrderParams,
    options?: AmendOrder.KrakenWsAmendOrderOptions,
  ) {
    return AmendOrder.amendOrder(this.ws, params, options);
  }

  // ---------------------------------------------------------------------------
  // edit_order (legacy)
  // ---------------------------------------------------------------------------

  /**
   * Edit (replace) an existing order.
   *
   * This is the **legacy** edit endpoint:
   * - The original order is cancelled.
   * - A new order is created with adjusted parameters.
   * - A new `order_id` is returned.
   *
   * Caveats (from Kraken docs):
   * - Triggered stop-loss / take-profit orders are not supported.
   * - Orders with conditional close terms attached are not supported.
   * - Orders where executed volume > new volume are rejected.
   * - `cl_ord_id` is **not** supported.
   * - Queue position is **not** maintained.
   *
   * Prefer {@link amendOrder} for new integrations where possible.
   *
   * @example
   * ```ts
   * const res = await wsClient.userTrading.editOrder({
   *   order_id: "OFGKYQ-FHPCQ-HUQFEK",
   *   symbol: "BTC/USD",
   *   order_qty: 0.01,
   *   limit_price: 30050,
   *   validate: false,
   * });
   *
   * if (res.success) {
   *   console.log("new order_id:", res.result?.order_id);
   *   console.log("original:", res.result?.original_order_id);
   * } else {
   *   console.error("edit_order error:", res.error);
   * }
   * ```
   */
  editOrder(
    params: EditOrder.KrakenWsEditOrderParams,
    options?: EditOrder.KrakenWsEditOrderOptions,
  ) {
    return EditOrder.editOrder(this.ws, params, options);
  }

  // ---------------------------------------------------------------------------
  // cancel_order
  // ---------------------------------------------------------------------------

  /**
   * Cancel one or more open orders.
   *
   * Provide at least one of:
   * - `order_id`: list of Kraken order IDs
   * - `cl_ord_id`: list of client order IDs
   * - `order_userref`: list of client numeric references
   *
   * When cancelling multiple orders, Kraken will stream separate `cancel_order`
   * responses for each order on the WS connection. This method resolves on the
   * first response for the batch.
   *
   * @example
   * ```ts
   * const res = await wsClient.userTrading.cancelOrder({
   *   order_id: ["OFGKYQ-FHPCQ-HUQFEK"],
   * });
   *
   * if (res.success) {
   *   console.log("cancelled order:", res.result?.order_id);
   * } else {
   *   console.error("cancel_order error:", res.error);
   * }
   * ```
   */
  cancelOrder(
    params: CancelOrder.KrakenWsCancelOrderParams,
    options?: CancelOrder.KrakenWsCancelOrderOptions,
  ) {
    return CancelOrder.cancelOrder(this.ws, params, options);
  }

  // ---------------------------------------------------------------------------
  // cancel_all
  // ---------------------------------------------------------------------------

  /**
   * Cancel **all** open orders, including untriggered orders and orders
   * resting in the book.
   *
   * Details of the individual cancelled orders will also be streamed
   * on the executions channel.
   *
   * @example
   * ```ts
   * const res = await wsClient.userTrading.cancelAll();
   *
   * if (res.success) {
   *   console.log("orders cancelled:", res.result?.count);
   * } else {
   *   console.error("cancel_all error:", res.error);
   * }
   * ```
   */
  cancelAll(
    params?: CancelAll.KrakenWsCancelAllParams,
    options?: CancelAll.KrakenWsCancelAllOptions,
  ) {
    return CancelAll.cancelAll(this.ws, params ?? {}, options);
  }

  // ---------------------------------------------------------------------------
  // cancel_all_orders_after (Dead Man's Switch)
  // ---------------------------------------------------------------------------

  /**
   * Configure the "Dead Man's Switch" timer that cancels all orders
   * after a given number of seconds without refresh.
   *
   * - Send `timeout > 0` to enable/extend the timer.
   * - Send `timeout = 0` to disable the mechanism.
   *
   * Recommended pattern:
   *   - Call every 15–30 seconds with `timeout = 60`.
   *
   * @example
   * ```ts
   * // Enable with 60s timeout
   * const res = await wsClient.userTrading.cancelAllOrdersAfter({
   *   timeout: 60,
   * });
   *
   * if (res.success) {
   *   console.log("currentTime:", res.result?.currentTime);
   *   console.log("triggerTime:", res.result?.triggerTime);
   * } else {
   *   console.error("cancel_all_orders_after error:", res.error);
   * }
   * ```
   */
  cancelAllOrdersAfter(
    params: CancelAllOrdersAfter.KrakenWsCancelAllOrdersAfterParams,
    options?: CancelAllOrdersAfter.KrakenWsCancelAllOrdersAfterOptions,
  ) {
    return CancelAllOrdersAfter.cancelAllOrdersAfter(this.ws, params, options);
  }

  // ---------------------------------------------------------------------------
  // batch_add
  // ---------------------------------------------------------------------------

  /**
   * Send a batch of 2–15 orders for a single symbol.
   *
   * Behaviour:
   * - Validation is performed on the **entire batch** first; if one order fails
   *   validation, the entire batch is rejected.
   * - On engine submission, individual orders can still be rejected
   *   (e.g. for funding) while the rest of the batch proceeds.
   * - All orders in the batch share the same `symbol`.
   *
   * @example
   * ```ts
   * const res = await wsClient.userTrading.batchAdd({
   *   symbol: "BTC/USD",
   *   validate: false,
   *   orders: [
   *     {
   *       side: "buy",
   *       order_type: "limit",
   *       order_qty: 0.01,
   *       limit_price: 30000,
   *       time_in_force: "gtc",
   *       cl_ord_id: "batch-1-buy",
   *     },
   *     {
   *       side: "sell",
   *       order_type: "limit",
   *       order_qty: 0.01,
   *       limit_price: 31000,
   *       time_in_force: "gtc",
   *       cl_ord_id: "batch-1-sell",
   *     },
   *   ],
   * });
   *
   * if (res.success) {
   *   for (const entry of res.result ?? []) {
   *     console.log("order_id:", entry.order_id, "cl_ord_id:", entry.cl_ord_id);
   *   }
   * } else {
   *   console.error("batch_add error:", res.error);
   * }
   * ```
   */
  batchAdd(
    params: BatchAdd.KrakenWsBatchAddParams,
    options?: BatchAdd.KrakenWsBatchAddOptions,
  ) {
    return BatchAdd.batchAdd(this.ws, params, options);
  }

  // ---------------------------------------------------------------------------
  // batch_cancel
  // ---------------------------------------------------------------------------

  /**
   * Cancel multiple orders (2–50 identifiers) in a single WS v2 request.
   *
   * - `orders` may contain Kraken `order_id` or client `order_userref`
   *   identifiers (as strings).
   * - `cl_ord_id` may contain additional client identifiers.
   *
   * @example
   * ```ts
   * const res = await wsClient.userTrading.batchCancel({
   *   orders: ["OFGKYQ-FHPCQ-HUQFEK", "123456"], // order_id or order_userref
   *   cl_ord_id: ["batch-1-buy", "batch-1-sell"],
   * });
   *
   * if (res.success) {
   *   console.log("cancelled count:", res.result?.count);
   * } else {
   *   console.error("batch_cancel error:", res.error);
   * }
   * ```
   */
  batchCancel(
    params: BatchCancel.KrakenWsBatchCancelParams,
    options?: BatchCancel.KrakenWsBatchCancelOptions,
  ) {
    return BatchCancel.batchCancel(this.ws, params, options);
  }
}

// -----------------------------------------------------------------------------
// Re-export types for consumers
// -----------------------------------------------------------------------------

export type KrakenWsOrderSide = AddOrder.KrakenWsOrderSide;
export type KrakenWsOrderType = AddOrder.KrakenWsOrderType;
export type KrakenWsTimeInForce = AddOrder.KrakenWsTimeInForce;
export type KrakenWsFeePreference = AddOrder.KrakenWsFeePreference;
export type KrakenWsStpType = AddOrder.KrakenWsStpType;
export type KrakenWsAddOrderTriggers = AddOrder.KrakenWsAddOrderTriggers;
export type KrakenWsAddOrderConditional = AddOrder.KrakenWsAddOrderConditional;

export type KrakenWsAddOrderParams = AddOrder.KrakenWsAddOrderParams;
export type KrakenWsAddOrderOptions = AddOrder.KrakenWsAddOrderOptions;
export type KrakenWsAddOrderResult = AddOrder.KrakenWsAddOrderResult;
export type KrakenWsAddOrderResponse = AddOrder.KrakenWsAddOrderResponse;

export type KrakenWsAmendOrderParams = AmendOrder.KrakenWsAmendOrderParams;
export type KrakenWsAmendOrderOptions = AmendOrder.KrakenWsAmendOrderOptions;
export type KrakenWsAmendOrderResult = AmendOrder.KrakenWsAmendOrderResult;
export type KrakenWsAmendOrderResponse = AmendOrder.KrakenWsAmendOrderResponse;

export type KrakenWsEditOrderParams = EditOrder.KrakenWsEditOrderParams;
export type KrakenWsEditOrderOptions = EditOrder.KrakenWsEditOrderOptions;
export type KrakenWsEditOrderResult = EditOrder.KrakenWsEditOrderResult;
export type KrakenWsEditOrderResponse = EditOrder.KrakenWsEditOrderResponse;

export type KrakenWsCancelOrderParams = CancelOrder.KrakenWsCancelOrderParams;
export type KrakenWsCancelOrderOptions = CancelOrder.KrakenWsCancelOrderOptions;
export type KrakenWsCancelOrderResult = CancelOrder.KrakenWsCancelOrderResult;
export type KrakenWsCancelOrderResponse =
  CancelOrder.KrakenWsCancelOrderResponse;

export type KrakenWsCancelAllParams = CancelAll.KrakenWsCancelAllParams;
export type KrakenWsCancelAllOptions = CancelAll.KrakenWsCancelAllOptions;
export type KrakenWsCancelAllResult = CancelAll.KrakenWsCancelAllResult;
export type KrakenWsCancelAllResponse = CancelAll.KrakenWsCancelAllResponse;

export type KrakenWsCancelAllOrdersAfterParams =
  CancelAllOrdersAfter.KrakenWsCancelAllOrdersAfterParams;
export type KrakenWsCancelAllOrdersAfterOptions =
  CancelAllOrdersAfter.KrakenWsCancelAllOrdersAfterOptions;
export type KrakenWsCancelAllOrdersAfterResult =
  CancelAllOrdersAfter.KrakenWsCancelAllOrdersAfterResult;
export type KrakenWsCancelAllOrdersAfterResponse =
  CancelAllOrdersAfter.KrakenWsCancelAllOrdersAfterResponse;

export type KrakenWsBatchAddParams = BatchAdd.KrakenWsBatchAddParams;
export type KrakenWsBatchAddOptions = BatchAdd.KrakenWsBatchAddOptions;
export type KrakenWsBatchAddOrderEntry = BatchAdd.KrakenWsBatchAddOrderEntry;
export type KrakenWsBatchAddOrderResultEntry =
  BatchAdd.KrakenWsBatchAddOrderResultEntry;
export type KrakenWsBatchAddResponse = BatchAdd.KrakenWsBatchAddResponse;

export type KrakenWsBatchCancelParams = BatchCancel.KrakenWsBatchCancelParams;
export type KrakenWsBatchCancelOptions = BatchCancel.KrakenWsBatchCancelOptions;
export type KrakenWsBatchCancelResult = BatchCancel.KrakenWsBatchCancelResult;
export type KrakenWsBatchCancelResponse =
  BatchCancel.KrakenWsBatchCancelResponse;
