import { describe, it, expect, vi } from 'vitest';
import type { KrakenRestBase } from '../../../../../src/base/restBase';
import { addOrder } from '../../../../../src/spot/rest/trading/addOrder';

describe('spot/rest/trading/addOrder', () => {
  it('calls AddOrder with required fields only', async () => {
    const privatePost = vi.fn().mockResolvedValueOnce({
      descr: { order: 'buy 1 XBTUSD @ market' },
      txid: ['OABC'],
    });

    const base = { privatePost } as unknown as KrakenRestBase;

    const res = await addOrder(base, {
      ordertype: 'market',
      type: 'buy',
      volume: '1',
      pair: 'XBTUSD',
    });

    expect(privatePost).toHaveBeenCalledTimes(1);
    expect(privatePost).toHaveBeenCalledWith('/0/private/AddOrder', {
      ordertype: 'market',
      type: 'buy',
      volume: '1',
      pair: 'XBTUSD',
    });
    expect(res).toEqual({
      descr: { order: 'buy 1 XBTUSD @ market' },
      txid: ['OABC'],
    });
  });

  it('serializes booleans and includes optional fields', async () => {
    const privatePost = vi.fn().mockResolvedValueOnce({
      descr: { order: 'sell 2 XBTUSD @ limit 50000' },
      txid: ['O123'],
    });

    const base = { privatePost } as unknown as KrakenRestBase;

    await addOrder(base, {
      userref: 123,
      ordertype: 'limit',
      type: 'sell',
      volume: '2',
      pair: 'XBTUSD',
      price: '50000',
      price2: '49900',
      trigger: 'last',
      leverage: '5',
      reduce_only: true,
      stptype: 'cancel-oldest',
      oflags: 'post',
      timeinforce: 'GTC',
      starttm: '0',
      expiretm: '0',
      deadline: '2025-12-10T04:18:45Z',
      validate: false,
      asset_class: 'tokenized_asset',
      displayvol: '0.1',
    });

    expect(privatePost).toHaveBeenCalledTimes(1);
    expect(privatePost).toHaveBeenCalledWith('/0/private/AddOrder', {
      ordertype: 'limit',
      type: 'sell',
      volume: '2',
      pair: 'XBTUSD',

      userref: '123',
      displayvol: '0.1',
      asset_class: 'tokenized_asset',
      price: '50000',
      price2: '49900',
      trigger: 'last',
      leverage: '5',
      reduce_only: 'true',
      stptype: 'cancel-oldest',
      oflags: 'post',
      timeinforce: 'GTC',
      starttm: '0',
      expiretm: '0',
      deadline: '2025-12-10T04:18:45Z',
      validate: 'false',
    });
  });

  it('maps close params to close[ordertype]/close[price]/close[price2]', async () => {
    const privatePost = vi.fn().mockResolvedValueOnce({
      descr: {
        order: 'buy 1 XBTUSD @ limit 50000',
        close: 'sell 1 @ stop 49000',
      },
      txid: ['O999'],
    });

    const base = { privatePost } as unknown as KrakenRestBase;

    await addOrder(base, {
      ordertype: 'limit',
      type: 'buy',
      volume: '1',
      pair: 'XBTUSD',
      price: '50000',
      close: {
        ordertype: 'stop-loss',
        price: '49000',
        price2: '0',
      },
    });

    expect(privatePost).toHaveBeenCalledTimes(1);
    expect(privatePost).toHaveBeenCalledWith('/0/private/AddOrder', {
      ordertype: 'limit',
      type: 'buy',
      volume: '1',
      pair: 'XBTUSD',
      price: '50000',

      'close[ordertype]': 'stop-loss',
      'close[price]': '49000',
      'close[price2]': '0',
    });
  });

  it('throws if userref and cl_ord_id are both provided', async () => {
    const privatePost = vi.fn();
    const base = { privatePost } as unknown as KrakenRestBase;

    expect(() =>
      addOrder(base, {
        userref: 1,
        cl_ord_id: 'CLIENT-1',
        ordertype: 'market',
        type: 'buy',
        volume: '1',
        pair: 'XBTUSD',
      }),
    ).toThrow(/mutually exclusive/i);

    expect(privatePost).not.toHaveBeenCalled();
  });

  it('includes cl_ord_id when provided (and no userref)', async () => {
    const privatePost = vi.fn().mockResolvedValueOnce({
      descr: { order: 'buy 1 XBTUSD @ market' },
      txid: ['OCL1'],
    });

    const base = { privatePost } as unknown as KrakenRestBase;

    await addOrder(base, {
      cl_ord_id: 'CLIENT-ORDER-01',
      ordertype: 'market',
      type: 'buy',
      volume: '1',
      pair: 'XBTUSD',
    });

    expect(privatePost).toHaveBeenCalledWith('/0/private/AddOrder', {
      ordertype: 'market',
      type: 'buy',
      volume: '1',
      pair: 'XBTUSD',
      cl_ord_id: 'CLIENT-ORDER-01',
    });
  });

  it('serializes reduce_only=false and validate=true (boolean ternary branches)', async () => {
    const privatePost = vi.fn().mockResolvedValueOnce({
      descr: { order: 'sell 1 XBTUSD @ market' },
      txid: ['OBOOL'],
    });

    const base = { privatePost } as unknown as KrakenRestBase;

    await addOrder(base, {
      ordertype: 'market',
      type: 'sell',
      volume: '1',
      pair: 'XBTUSD',
      reduce_only: false, // <- false branch
      validate: true, // <- true branch
    });

    expect(privatePost).toHaveBeenCalledTimes(1);
    expect(privatePost).toHaveBeenCalledWith('/0/private/AddOrder', {
      ordertype: 'market',
      type: 'sell',
      volume: '1',
      pair: 'XBTUSD',
      reduce_only: 'false',
      validate: 'true',
    });
  });

  it('close: includes close[ordertype] but omits close[price]/close[price2] when undefined (false branches)', async () => {
    const privatePost = vi.fn().mockResolvedValueOnce({
      descr: { order: 'buy 1 XBTUSD @ limit 50000', close: '...' },
      txid: ['OCLOSE'],
    });

    const base = { privatePost } as unknown as KrakenRestBase;

    await addOrder(base, {
      ordertype: 'limit',
      type: 'buy',
      volume: '1',
      pair: 'XBTUSD',
      price: '50000',
      close: {
        ordertype: 'stop-loss',
        // price undefined
        // price2 undefined
      },
    });

    expect(privatePost).toHaveBeenCalledTimes(1);
    expect(privatePost).toHaveBeenCalledWith('/0/private/AddOrder', {
      ordertype: 'limit',
      type: 'buy',
      volume: '1',
      pair: 'XBTUSD',
      price: '50000',
      'close[ordertype]': 'stop-loss',
      // intentionally no close[price], close[price2]
    });
  });
});
