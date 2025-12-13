import { describe, it, expect, vi } from 'vitest';
import type { KrakenRestBase } from '../../../../../src/base/restBase';
import {
  editOrder,
  type KrakenEditOrderParams,
} from '../../../../../src/spot/rest/trading/editOrder';

describe('spot/rest/trading/editOrder', () => {
  it('calls /0/private/EditOrder with required fields (stringifies txid)', async () => {
    const privatePost = vi.fn().mockResolvedValueOnce({
      descr: { order: 'buy 1 XBTUSD @ limit 50000' },
      orders_cancelled: 1,
      originaltxid: 'OORIG',
      status: 'Ok',
      txid: 'ONEW',
    });

    const base = { privatePost } as unknown as KrakenRestBase;

    const res = await editOrder(base, {
      txid: 12345,
      pair: 'XBTUSD',
    });

    expect(res.status).toBe('Ok');

    expect(privatePost).toHaveBeenCalledTimes(1);
    const [path, body] = privatePost.mock.calls[0];

    expect(path).toBe('/0/private/EditOrder');
    expect(body).toEqual({
      txid: '12345',
      pair: 'XBTUSD',
    });
  });

  it('includes all optional fields when provided', async () => {
    const privatePost = vi.fn().mockResolvedValueOnce({
      descr: { order: 'sell 0.1 XBTUSD @ limit 60000 post' },
      orders_cancelled: 1,
      originaltxid: 'OORIG',
      status: 'Ok',
      txid: 'ONEW',
      newuserref: '999',
      olduserref: '111',
      volume: '0.1',
      price: '60000',
      price2: '0',
    });

    const base = { privatePost } as unknown as KrakenRestBase;

    const params: KrakenEditOrderParams = {
      txid: 'OABC',
      pair: 'XBTUSD',
      userref: 999,
      volume: '0.1',
      displayvol: '0.01',
      asset_class: 'tokenized_asset',
      price: '60000',
      price2: '59000',
      oflags: 'post',
      deadline: '2025-12-12T00:00:05Z',
      cancel_response: true,
      validate: false,
    };

    await editOrder(base, params);

    expect(privatePost).toHaveBeenCalledTimes(1);
    const [path, body] = privatePost.mock.calls[0];

    expect(path).toBe('/0/private/EditOrder');
    expect(body).toEqual({
      txid: 'OABC',
      pair: 'XBTUSD',
      userref: '999',
      volume: '0.1',
      displayvol: '0.01',
      asset_class: 'tokenized_asset',
      price: '60000',
      price2: '59000',
      oflags: 'post',
      deadline: '2025-12-12T00:00:05Z',
      cancel_response: 'true',
      validate: 'false',
    });
  });

  it('properly stringifies boolean flags', async () => {
    const privatePost = vi.fn().mockResolvedValueOnce({
      descr: { order: 'edit validate' },
      orders_cancelled: 0,
      originaltxid: 'OORIG',
      status: 'Ok',
    });

    const base = { privatePost } as unknown as KrakenRestBase;

    await editOrder(base, {
      txid: 'OABC',
      pair: 'XBTUSD',
      cancel_response: false,
      validate: true,
    });

    const [, body] = privatePost.mock.calls[0];

    expect(body).toEqual({
      txid: 'OABC',
      pair: 'XBTUSD',
      cancel_response: 'false',
      validate: 'true',
    });
  });
});
