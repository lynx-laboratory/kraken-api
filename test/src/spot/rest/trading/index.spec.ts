import { describe, it, expect, vi } from 'vitest';
import type { KrakenRestBase } from '../../../../../src/base/restBase';

// Mock underlying endpoint modules BEFORE importing the index (class under test)
vi.mock('../../../../../src/spot/rest/trading/addOrder', () => ({
  addOrder: vi.fn(),
}));
vi.mock('../../../../../src/spot/rest/trading/amendOrder', () => ({
  amendOrder: vi.fn(),
}));
vi.mock('../../../../../src/spot/rest/trading/cancelOrder', () => ({
  cancelOrder: vi.fn(),
}));
vi.mock('../../../../../src/spot/rest/trading/cancelAllOrders', () => ({
  cancelAllOrders: vi.fn(),
}));
vi.mock('../../../../../src/spot/rest/trading/cancelAllOrdersAfter', () => ({
  cancelAllOrdersAfter: vi.fn(),
}));
vi.mock('../../../../../src/spot/rest/trading/getWebSocketsToken', () => ({
  getWebSocketsToken: vi.fn(),
}));
vi.mock('../../../../../src/spot/rest/trading/addOrderBatch', () => ({
  addOrderBatch: vi.fn(),
}));
vi.mock('../../../../../src/spot/rest/trading/cancelOrderBatch', () => ({
  cancelOrderBatch: vi.fn(),
}));
vi.mock('../../../../../src/spot/rest/trading/editOrder', () => ({
  editOrder: vi.fn(),
}));

import { KrakenSpotTradingApi } from '../../../../../src/spot/rest/trading';

import { addOrder } from '../../../../../src/spot/rest/trading/addOrder';
import { amendOrder } from '../../../../../src/spot/rest/trading/amendOrder';
import { cancelOrder } from '../../../../../src/spot/rest/trading/cancelOrder';
import { cancelAllOrders } from '../../../../../src/spot/rest/trading/cancelAllOrders';
import { cancelAllOrdersAfter } from '../../../../../src/spot/rest/trading/cancelAllOrdersAfter';
import { getWebSocketsToken } from '../../../../../src/spot/rest/trading/getWebSocketsToken';
import { addOrderBatch } from '../../../../../src/spot/rest/trading/addOrderBatch';
import { cancelOrderBatch } from '../../../../../src/spot/rest/trading/cancelOrderBatch';
import { editOrder } from '../../../../../src/spot/rest/trading/editOrder';

describe('spot/rest/trading/index', () => {
  it('wires addOrder()', async () => {
    const base = {} as unknown as KrakenRestBase;
    const api = new KrakenSpotTradingApi(base);

    const mocked = vi.mocked(addOrder);
    mocked.mockResolvedValueOnce({
      descr: { order: 'buy 0.01 XBTUSD @ limit 40000' },
      txid: ['O123'],
    });

    const params = {
      pair: 'XBTUSD',
      type: 'buy',
      ordertype: 'limit',
      volume: '0.01',
      price: '40000',
      timeinforce: 'GTC',
    } as any;

    const res = await api.addOrder(params);

    expect(res).toEqual({
      descr: { order: 'buy 0.01 XBTUSD @ limit 40000' },
      txid: ['O123'],
    });
    expect(mocked).toHaveBeenCalledTimes(1);
    expect(mocked).toHaveBeenCalledWith(base, params);
  });

  it('wires amendOrder()', async () => {
    const base = {} as unknown as KrakenRestBase;
    const api = new KrakenSpotTradingApi(base);

    const mocked = vi.mocked(amendOrder);
    mocked.mockResolvedValueOnce({ amend_id: 'AMEND123' });

    const params = { txid: 'OABC', order_qty: '0.005', limit_price: '39500' };
    const res = await api.amendOrder(params);

    expect(res).toEqual({ amend_id: 'AMEND123' });
    expect(mocked).toHaveBeenCalledTimes(1);
    expect(mocked).toHaveBeenCalledWith(base, params);
  });

  it('wires cancelOrder()', async () => {
    const base = {} as unknown as KrakenRestBase;
    const api = new KrakenSpotTradingApi(base);

    const mocked = vi.mocked(cancelOrder);
    mocked.mockResolvedValueOnce({ count: 2, pending: true });

    const params = { txid: ['O1', 'O2'] };
    const res = await api.cancelOrder(params);

    expect(res).toEqual({ count: 2, pending: true });
    expect(mocked).toHaveBeenCalledTimes(1);
    expect(mocked).toHaveBeenCalledWith(base, params);
  });

  it('wires cancelAllOrders()', async () => {
    const base = {} as unknown as KrakenRestBase;
    const api = new KrakenSpotTradingApi(base);

    const mocked = vi.mocked(cancelAllOrders);
    mocked.mockResolvedValueOnce({ count: 9 });

    const res = await api.cancelAllOrders();

    expect(res).toEqual({ count: 9 });
    expect(mocked).toHaveBeenCalledTimes(1);
    expect(mocked).toHaveBeenCalledWith(base);
  });

  it('wires cancelAllOrdersAfter()', async () => {
    const base = {} as unknown as KrakenRestBase;
    const api = new KrakenSpotTradingApi(base);

    const mocked = vi.mocked(cancelAllOrdersAfter);
    mocked.mockResolvedValueOnce({
      currentTime: '2025-12-12T00:00:00Z',
      triggerTime: '2025-12-12T00:01:00Z',
    });

    const params = { timeout: 60 };
    const res = await api.cancelAllOrdersAfter(params);

    expect(res).toEqual({
      currentTime: '2025-12-12T00:00:00Z',
      triggerTime: '2025-12-12T00:01:00Z',
    });
    expect(mocked).toHaveBeenCalledTimes(1);
    expect(mocked).toHaveBeenCalledWith(base, params);
  });

  it('wires getWebSocketsToken()', async () => {
    const base = {} as unknown as KrakenRestBase;
    const api = new KrakenSpotTradingApi(base);

    const mocked = vi.mocked(getWebSocketsToken);
    mocked.mockResolvedValueOnce({ token: 'tok_123', expires: 900 });

    const res = await api.getWebSocketsToken();

    expect(res).toEqual({ token: 'tok_123', expires: 900 });
    expect(mocked).toHaveBeenCalledTimes(1);
    expect(mocked).toHaveBeenCalledWith(base);
  });

  it('wires addOrderBatch()', async () => {
    const base = {} as unknown as KrakenRestBase;
    const api = new KrakenSpotTradingApi(base);

    const mocked = vi.mocked(addOrderBatch);
    mocked.mockResolvedValueOnce({
      orders: [
        { descr: { order: 'buy 0.01 XBTUSD @ limit 40000' }, txid: 'O1' },
        { descr: { order: 'sell 0.01 XBTUSD @ limit 45000' }, txid: 'O2' },
      ],
    });

    const params = {
      pair: 'XBTUSD',
      orders: [
        { type: 'buy', ordertype: 'limit', volume: '0.01', price: '40000' },
        { type: 'sell', ordertype: 'limit', volume: '0.01', price: '45000' },
      ],
    } as any;

    const res = await api.addOrderBatch(params);

    expect(res).toEqual({
      orders: [
        { descr: { order: 'buy 0.01 XBTUSD @ limit 40000' }, txid: 'O1' },
        { descr: { order: 'sell 0.01 XBTUSD @ limit 45000' }, txid: 'O2' },
      ],
    });
    expect(mocked).toHaveBeenCalledTimes(1);
    expect(mocked).toHaveBeenCalledWith(base, params);
  });

  it('wires cancelOrderBatch()', async () => {
    const base = {} as unknown as KrakenRestBase;
    const api = new KrakenSpotTradingApi(base);

    const mocked = vi.mocked(cancelOrderBatch);
    mocked.mockResolvedValueOnce({ count: 3 });

    const params = {
      orders: [{ txid: 'OABC' }, { txid: 12345 }],
      clOrdIds: ['client-1'],
    };

    const res = await api.cancelOrderBatch(params);

    expect(res).toEqual({ count: 3 });
    expect(mocked).toHaveBeenCalledTimes(1);
    expect(mocked).toHaveBeenCalledWith(base, params);
  });

  it('wires editOrder()', async () => {
    const base = {} as unknown as KrakenRestBase;
    const api = new KrakenSpotTradingApi(base);

    const mocked = vi.mocked(editOrder);
    mocked.mockResolvedValueOnce({
      descr: { order: 'buy 0.01 XBTUSD @ limit 40100' },
      txid: 'ONEW',
      originaltxid: 'OOLD',
      orders_cancelled: 1,
      status: 'Ok',
    });

    const params = {
      txid: 'OOLD',
      pair: 'XBTUSD',
      price: '40100',
      volume: '0.01',
    };

    const res = await api.editOrder(params);

    expect(res).toEqual({
      descr: { order: 'buy 0.01 XBTUSD @ limit 40100' },
      txid: 'ONEW',
      originaltxid: 'OOLD',
      orders_cancelled: 1,
      status: 'Ok',
    });
    expect(mocked).toHaveBeenCalledTimes(1);
    expect(mocked).toHaveBeenCalledWith(base, params);
  });
});
