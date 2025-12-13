import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { KrakenWebsocketBase } from '../../../../../src/base/websocketBase';

import { KrakenSpotWsUserTradingApi } from '../../../../../src/spot/websocket-v2/user-trading';

import * as AddOrder from '../../../../../src/spot/websocket-v2/user-trading/addOrder';
import * as AmendOrder from '../../../../../src/spot/websocket-v2/user-trading/amendOrder';
import * as EditOrder from '../../../../../src/spot/websocket-v2/user-trading/editOrder';
import * as CancelOrder from '../../../../../src/spot/websocket-v2/user-trading/cancelOrder';
import * as CancelAll from '../../../../../src/spot/websocket-v2/user-trading/cancelAll';
import * as CancelAllOrdersAfter from '../../../../../src/spot/websocket-v2/user-trading/cancelAllOrdersAfter';
import * as BatchAdd from '../../../../../src/spot/websocket-v2/user-trading/batchAdd';
import * as BatchCancel from '../../../../../src/spot/websocket-v2/user-trading/batchCancel';

describe('spot/websocket-v2/user-trading (API wrapper)', () => {
  let ws: KrakenWebsocketBase;
  let api: KrakenSpotWsUserTradingApi;

  beforeEach(() => {
    ws = {} as unknown as KrakenWebsocketBase;
    api = new KrakenSpotWsUserTradingApi(ws);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('addOrder forwards to AddOrder.addOrder(ws, params, options)', async () => {
    const mocked = { ok: true };
    const spy = vi.spyOn(AddOrder, 'addOrder').mockResolvedValue(mocked as any);

    const params: AddOrder.KrakenWsAddOrderParams = {
      order_type: 'limit',
      side: 'buy',
      order_qty: 0.01,
      symbol: 'BTC/USD',
      limit_price: 30000,
    };

    const options: AddOrder.KrakenWsAddOrderOptions = {
      reqId: 1,
      timeoutMs: 1234,
      attachAuthToken: true,
    };

    const res = await api.addOrder(params, options);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(ws, params, options);
    expect(res).toBe(mocked);
  });

  it('amendOrder forwards to AmendOrder.amendOrder(ws, params, options)', async () => {
    const mocked = { ok: true };
    const spy = vi
      .spyOn(AmendOrder, 'amendOrder')
      .mockResolvedValue(mocked as any);

    const params: AmendOrder.KrakenWsAmendOrderParams = {
      order_id: 'ORDER_ID',
      order_qty: 0.02,
      limit_price: 29500,
    };

    const res = await api.amendOrder(params);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(ws, params, undefined);
    expect(res).toBe(mocked);
  });

  it('editOrder forwards to EditOrder.editOrder(ws, params, options)', async () => {
    const mocked = { ok: true };
    const spy = vi
      .spyOn(EditOrder, 'editOrder')
      .mockResolvedValue(mocked as any);

    const params: EditOrder.KrakenWsEditOrderParams = {
      order_id: 'ORDER_ID',
      symbol: 'BTC/USD',
      order_qty: 0.01,
      limit_price: 30050,
      validate: false,
    };

    const res = await api.editOrder(params, { reqId: 2 });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(ws, params, { reqId: 2 });
    expect(res).toBe(mocked);
  });

  it('cancelOrder forwards to CancelOrder.cancelOrder(ws, params, options)', async () => {
    const mocked = { ok: true };
    const spy = vi
      .spyOn(CancelOrder, 'cancelOrder')
      .mockResolvedValue(mocked as any);

    const params: CancelOrder.KrakenWsCancelOrderParams = {
      order_id: ['ORDER_ID_1'],
    };

    const res = await api.cancelOrder(params, { timeoutMs: 5000 });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(ws, params, { timeoutMs: 5000 });
    expect(res).toBe(mocked);
  });

  it('cancelAll forwards to CancelAll.cancelAll(ws, {}, options) when params omitted', async () => {
    const mocked = { ok: true };
    const spy = vi
      .spyOn(CancelAll, 'cancelAll')
      .mockResolvedValue(mocked as any);

    const res = await api.cancelAll();

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(ws, {}, undefined);
    expect(res).toBe(mocked);
  });

  it('cancelAll forwards provided params through', async () => {
    const mocked = { ok: true };
    const spy = vi
      .spyOn(CancelAll, 'cancelAll')
      .mockResolvedValue(mocked as any);

    const params: CancelAll.KrakenWsCancelAllParams = { token: 'TOKEN' };
    const options: CancelAll.KrakenWsCancelAllOptions = { reqId: 7 };

    const res = await api.cancelAll(params, options);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(ws, params, options);
    expect(res).toBe(mocked);
  });

  it('cancelAllOrdersAfter forwards to CancelAllOrdersAfter.cancelAllOrdersAfter(ws, params, options)', async () => {
    const mocked = { ok: true };
    const spy = vi
      .spyOn(CancelAllOrdersAfter, 'cancelAllOrdersAfter')
      .mockResolvedValue(mocked as any);

    const params: CancelAllOrdersAfter.KrakenWsCancelAllOrdersAfterParams = {
      timeout: 60,
    };

    const res = await api.cancelAllOrdersAfter(params, { reqId: 99 });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(ws, params, { reqId: 99 });
    expect(res).toBe(mocked);
  });

  it('batchAdd forwards to BatchAdd.batchAdd(ws, params, options)', async () => {
    const mocked = { ok: true };
    const spy = vi.spyOn(BatchAdd, 'batchAdd').mockResolvedValue(mocked as any);

    const params: BatchAdd.KrakenWsBatchAddParams = {
      symbol: 'BTC/USD',
      orders: [
        {
          side: 'buy',
          order_type: 'limit',
          order_qty: 0.01,
          limit_price: 30000,
        },
        {
          side: 'sell',
          order_type: 'limit',
          order_qty: 0.01,
          limit_price: 31000,
        },
      ],
    };

    const res = await api.batchAdd(params);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(ws, params, undefined);
    expect(res).toBe(mocked);
  });

  it('batchCancel forwards to BatchCancel.batchCancel(ws, params, options)', async () => {
    const mocked = { ok: true };
    const spy = vi
      .spyOn(BatchCancel, 'batchCancel')
      .mockResolvedValue(mocked as any);

    const params: BatchCancel.KrakenWsBatchCancelParams = {
      orders: ['ORDER_ID_1', 'ORDER_ID_2'],
      cl_ord_id: ['client-1', 'client-2'],
    };

    const res = await api.batchCancel(params, { attachAuthToken: true });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(ws, params, { attachAuthToken: true });
    expect(res).toBe(mocked);
  });
});
