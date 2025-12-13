import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { KrakenRestBase } from '../../../../../src/base/restBase';

import { KrakenSpotTransparencyApi } from '../../../../../src/spot/rest/transparency';

import * as GetPreTradeData from '../../../../../src/spot/rest/transparency/getPreTradeData';
import * as GetPostTradeData from '../../../../../src/spot/rest/transparency/getPostTradeData';

describe('spot/rest/transparency/index', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getPreTradeData forwards to getPreTradeData()', async () => {
    const base = {} as KrakenRestBase;
    const api = new KrakenSpotTransparencyApi(base);

    const mocked = { anything: true };
    const spy = vi
      .spyOn(GetPreTradeData, 'getPreTradeData')
      .mockResolvedValue(mocked);

    const params = { symbol: ['BTC/USD', 'ETH/USD'] } as const;
    const res = await api.getPreTradeData(params);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(base, params);
    expect(res).toBe(mocked);
  });

  it('getPostTradeData forwards to getPostTradeData() with provided params', async () => {
    const base = {} as KrakenRestBase;
    const api = new KrakenSpotTransparencyApi(base);

    const mocked = { last_ts: 'X', count: 0, trades: [] };
    const spy = vi
      .spyOn(GetPostTradeData, 'getPostTradeData')
      .mockResolvedValue(mocked);

    const params = { symbol: 'BTC/USD', count: 100 };
    const res = await api.getPostTradeData(params);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(base, params);
    expect(res).toBe(mocked);
  });

  it('getPostTradeData uses default params when omitted', async () => {
    const base = {} as KrakenRestBase;
    const api = new KrakenSpotTransparencyApi(base);

    const mocked = { last_ts: 'X', count: 0, trades: [] };
    const spy = vi
      .spyOn(GetPostTradeData, 'getPostTradeData')
      .mockResolvedValue(mocked);

    const res = await api.getPostTradeData();

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(base, {});
    expect(res).toBe(mocked);
  });
});
