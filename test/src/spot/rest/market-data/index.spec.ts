import { describe, it, expect, vi, beforeEach } from 'vitest';

import type { KrakenRestBase } from '../../../../../src/base/restBase';
import { KrakenSpotMarketDataApi } from '../../../../../src/spot/rest/market-data';

import * as GetServerTime from '../../../../../src/spot/rest/market-data/getServerTime';
import * as GetSystemStatus from '../../../../../src/spot/rest/market-data/getSystemStatus';
import * as GetAssetInfo from '../../../../../src/spot/rest/market-data/getAssetInfo';
import * as GetTradableAssetPairs from '../../../../../src/spot/rest/market-data/getTradableAssetPairs';
import * as GetTickerInformation from '../../../../../src/spot/rest/market-data/getTickerInformation';
import * as GetOhlcData from '../../../../../src/spot/rest/market-data/getOhlcData';
import * as GetOrderBook from '../../../../../src/spot/rest/market-data/getOrderBook';
import * as GetRecentTrades from '../../../../../src/spot/rest/market-data/getRecentTrades';
import * as GetRecentSpreads from '../../../../../src/spot/rest/market-data/getRecentSpreads';

describe('spot/rest/market-data/index', () => {
  const base = {} as unknown as KrakenRestBase;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('constructs KrakenSpotMarketDataApi', () => {
    const api = new KrakenSpotMarketDataApi(base);
    expect(api).toBeTruthy();
  });

  it('getServerTime delegates to getServerTime(base)', async () => {
    const api = new KrakenSpotMarketDataApi(base);

    const expected = {
      unixtime: 123,
      rfc1123: 'Wed, 01 Jan 2025 00:00:00 GMT',
    };
    const spy = vi
      .spyOn(GetServerTime, 'getServerTime')
      .mockResolvedValueOnce(expected);

    const res = await api.getServerTime();

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(base);
    expect(res).toBe(expected);
  });

  it('getSystemStatus delegates to getSystemStatus(base)', async () => {
    const api = new KrakenSpotMarketDataApi(base);

    const expected = {
      status: 'online' as const,
      timestamp: '2025-12-10T04:18:32Z',
    };
    const spy = vi
      .spyOn(GetSystemStatus, 'getSystemStatus')
      .mockResolvedValueOnce(expected);

    const res = await api.getSystemStatus();

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(base);
    expect(res).toBe(expected);
  });

  it('getAssetInfo delegates to getAssetInfo(base, params)', async () => {
    const api = new KrakenSpotMarketDataApi(base);

    const params: GetAssetInfo.KrakenGetAssetInfoParams = {
      asset: ['XXBT', 'XETH'],
      aclass: 'currency',
    };

    const expected = {
      XXBT: {
        aclass: 'currency',
        altname: 'XBT',
        decimals: 8,
        display_decimals: 5,
      },
    } as any;
    const spy = vi
      .spyOn(GetAssetInfo, 'getAssetInfo')
      .mockResolvedValueOnce(expected);

    const res = await api.getAssetInfo(params);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(base, params);
    expect(res).toBe(expected);
  });

  it('getTradableAssetPairs delegates to getTradableAssetPairs(base, params)', async () => {
    const api = new KrakenSpotMarketDataApi(base);

    const params: GetTradableAssetPairs.KrakenGetTradableAssetPairsParams = {
      pair: ['XBTUSD', 'ETHUSD'],
      country_code: 'CA',
      info: 'info',
    };

    const expected = { XBTUSD: { altname: 'XBTUSD' } } as any;
    const spy = vi
      .spyOn(GetTradableAssetPairs, 'getTradableAssetPairs')
      .mockResolvedValueOnce(expected);

    const res = await api.getTradableAssetPairs(params);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(base, params);
    expect(res).toBe(expected);
  });

  it('getTickerInformation delegates to getTickerInformation(base, params)', async () => {
    const api = new KrakenSpotMarketDataApi(base);

    const params: GetTickerInformation.KrakenGetTickerInformationParams = {
      pair: ['XBTUSD'],
    };

    const expected = { XBTUSD: { o: '1' } } as any;
    const spy = vi
      .spyOn(GetTickerInformation, 'getTickerInformation')
      .mockResolvedValueOnce(expected);

    const res = await api.getTickerInformation(params);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(base, params);
    expect(res).toBe(expected);
  });

  it('getOhlcData delegates to getOhlcData(base, params)', async () => {
    const api = new KrakenSpotMarketDataApi(base);

    const params: GetOhlcData.KrakenGetOhlcDataParams = {
      pair: 'XBTUSD',
      interval: 1,
      since: 123,
    };

    const expected: GetOhlcData.KrakenOhlcResponse = {
      last: 456,
      ohlc: { XBTUSD: [] },
    };

    const spy = vi
      .spyOn(GetOhlcData, 'getOhlcData')
      .mockResolvedValueOnce(expected);

    const res = await api.getOhlcData(params);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(base, params);
    expect(res).toBe(expected);
  });

  it('getOrderBook delegates to getOrderBook(base, params)', async () => {
    const api = new KrakenSpotMarketDataApi(base);

    const params: GetOrderBook.KrakenGetOrderBookParams = {
      pair: 'XBTUSD',
      count: 50,
    };

    const expected = { XBTUSD: { asks: [], bids: [] } };
    const spy = vi
      .spyOn(GetOrderBook, 'getOrderBook')
      .mockResolvedValueOnce(expected);

    const res = await api.getOrderBook(params);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(base, params);
    expect(res).toBe(expected);
  });

  it('getRecentTrades delegates to getRecentTrades(base, params)', async () => {
    const api = new KrakenSpotMarketDataApi(base);

    const params: GetRecentTrades.KrakenGetRecentTradesParams = {
      pair: 'XBTUSD',
      count: 100,
      since: '1',
    };

    const expected: GetRecentTrades.KrakenRecentTradesResponse = {
      last: '2',
      trades: { XBTUSD: [] },
    };

    const spy = vi
      .spyOn(GetRecentTrades, 'getRecentTrades')
      .mockResolvedValueOnce(expected);

    const res = await api.getRecentTrades(params);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(base, params);
    expect(res).toBe(expected);
  });

  it('getRecentSpreads delegates to getRecentSpreads(base, params)', async () => {
    const api = new KrakenSpotMarketDataApi(base);

    const params: GetRecentSpreads.KrakenGetRecentSpreadsParams = {
      pair: 'XBTUSD',
      since: 123,
    };

    const expected: GetRecentSpreads.KrakenRecentSpreadsResponse = {
      last: 456,
      spreads: { XBTUSD: [] },
    };

    const spy = vi
      .spyOn(GetRecentSpreads, 'getRecentSpreads')
      .mockResolvedValueOnce(expected);

    const res = await api.getRecentSpreads(params);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(base, params);
    expect(res).toBe(expected);
  });

  it('exports KrakenSpotMarketDataApi from package entry', async () => {
    // Just verifies the re-export exists (runtime). Types are compile-time.
    expect(KrakenSpotMarketDataApi).toBeTypeOf('function');
  });
});
