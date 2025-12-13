import { describe, it, expect, vi } from 'vitest';
import type { KrakenRestBase } from '../../../../../src/base/restBase';
import { addOrderBatch } from '../../../../../src/spot/rest/trading/addOrderBatch';

describe('spot/rest/trading/addOrderBatch', () => {
  it('throws if orders length is < 2', () => {
    const base = { privatePost: vi.fn() } as unknown as KrakenRestBase;

    expect(() =>
      addOrderBatch(base, {
        pair: 'XBTUSD',
        orders: [
          {
            ordertype: 'market',
            type: 'buy',
            volume: '1',
          },
        ],
      }),
    ).toThrow(/between 2 and 15/i);
  });

  it('throws if orders length is > 15', () => {
    const base = { privatePost: vi.fn() } as unknown as KrakenRestBase;

    const orders = Array.from({ length: 16 }, () => ({
      ordertype: 'market' as const,
      type: 'buy' as const,
      volume: '1',
    }));

    expect(() =>
      addOrderBatch(base, {
        pair: 'XBTUSD',
        orders,
      }),
    ).toThrow(/between 2 and 15/i);
  });

  it('throws if any order has both userref and cl_ord_id', () => {
    const base = { privatePost: vi.fn() } as unknown as KrakenRestBase;

    expect(() =>
      addOrderBatch(base, {
        pair: 'XBTUSD',
        orders: [
          {
            ordertype: 'market',
            type: 'buy',
            volume: '1',
            userref: 1,
            cl_ord_id: 'CLIENT-1',
          },
          {
            ordertype: 'market',
            type: 'buy',
            volume: '1',
          },
        ],
      }),
    ).toThrow(/order\[0\].*both userref and cl_ord_id/i);
  });

  it('calls AddOrderBatch with required fields only and JSON-encodes orders', async () => {
    const privatePost = vi.fn().mockResolvedValueOnce({
      orders: [
        { descr: { order: 'buy 1 XBTUSD @ market' }, txid: 'O1' },
        { descr: { order: 'sell 1 XBTUSD @ market' }, txid: 'O2' },
      ],
    });

    const base = { privatePost } as unknown as KrakenRestBase;

    const res = await addOrderBatch(base, {
      pair: 'XBTUSD',
      orders: [
        { ordertype: 'market', type: 'buy', volume: '1' },
        { ordertype: 'market', type: 'sell', volume: '1' },
      ],
    });

    expect(privatePost).toHaveBeenCalledTimes(1);

    const [path, body] = privatePost.mock.calls[0] as [
      string,
      Record<string, string>,
    ];

    expect(path).toBe('/0/private/AddOrderBatch');
    expect(body.pair).toBe('XBTUSD');
    expect(typeof body.orders).toBe('string');

    const decoded = JSON.parse(body.orders) as Array<Record<string, string>>;
    expect(decoded).toEqual([
      { ordertype: 'market', type: 'buy', volume: '1' },
      { ordertype: 'market', type: 'sell', volume: '1' },
    ]);

    expect(res.orders).toHaveLength(2);
  });

  it('includes top-level optional fields and serializes validate boolean', async () => {
    const privatePost = vi.fn().mockResolvedValueOnce({ orders: [] });
    const base = { privatePost } as unknown as KrakenRestBase;

    await addOrderBatch(base, {
      pair: 'XBTUSD',
      asset_class: 'tokenized_asset',
      deadline: '2025-12-10T04:18:45Z',
      validate: true,
      orders: [
        { ordertype: 'market', type: 'buy', volume: '1' },
        { ordertype: 'market', type: 'sell', volume: '1' },
      ],
    });

    expect(privatePost).toHaveBeenCalledTimes(1);
    expect(privatePost).toHaveBeenCalledWith(
      '/0/private/AddOrderBatch',
      expect.objectContaining({
        pair: 'XBTUSD',
        asset_class: 'tokenized_asset',
        deadline: '2025-12-10T04:18:45Z',
        validate: 'true',
      }),
    );
  });

  it('serializes per-order fields (userref, reduce_only, etc.) into the orders JSON', async () => {
    const privatePost = vi.fn().mockResolvedValueOnce({ orders: [] });
    const base = { privatePost } as unknown as KrakenRestBase;

    await addOrderBatch(base, {
      pair: 'XBTUSD',
      orders: [
        {
          ordertype: 'limit',
          type: 'buy',
          volume: '2',
          userref: 123,
          price: '50000',
          reduce_only: true,
          timeinforce: 'GTC',
          stptype: 'cancel-oldest',
          oflags: 'post',
        },
        {
          ordertype: 'limit',
          type: 'sell',
          volume: '2',
          cl_ord_id: 'CLIENT-ORDER-01',
          price: '51000',
          reduce_only: false,
          leverage: '5',
          trigger: 'last',
          starttm: '0',
          expiretm: '0',
          displayvol: '0.1',
          price2: '0',
        },
      ],
    });

    const [, body] = privatePost.mock.calls[0] as [
      string,
      Record<string, string>,
    ];

    const decoded = JSON.parse(body.orders) as Array<Record<string, string>>;
    expect(decoded[0]).toEqual(
      expect.objectContaining({
        ordertype: 'limit',
        type: 'buy',
        volume: '2',
        userref: '123',
        price: '50000',
        reduce_only: 'true',
        timeinforce: 'GTC',
        stptype: 'cancel-oldest',
        oflags: 'post',
      }),
    );

    expect(decoded[1]).toEqual(
      expect.objectContaining({
        ordertype: 'limit',
        type: 'sell',
        volume: '2',
        cl_ord_id: 'CLIENT-ORDER-01',
        price: '51000',
        reduce_only: 'false',
        leverage: '5',
        trigger: 'last',
        starttm: '0',
        expiretm: '0',
        displayvol: '0.1',
        price2: '0',
      }),
    );
  });
});
