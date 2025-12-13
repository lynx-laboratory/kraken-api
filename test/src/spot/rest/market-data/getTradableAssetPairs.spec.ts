import { describe, it, expect, vi } from 'vitest';
import type { KrakenRestBase } from '../../../../../src/base/restBase';
import { getTradableAssetPairs } from '../../../../../src/spot/rest/market-data/getTradableAssetPairs';

describe('market-data/getTradableAssetPairs', () => {
  it('calls publicGet with empty query when params omitted', async () => {
    const mockResult = {
      XBTUSD: {
        altname: 'XBTUSD',
        aclass_base: 'currency',
        base: 'XXBT',
        aclass_quote: 'currency',
        quote: 'ZUSD',
        lot: 'unit',
        pair_decimals: 1,
        cost_decimals: 5,
        lot_decimals: 8,
        lot_multiplier: 1,
        leverage_buy: [2, 3],
        leverage_sell: [2, 3],
        fees: [
          [0, 0.26],
          [50000, 0.24],
        ],
        fee_volume_currency: 'USD',
        margin_call: 80,
        margin_stop: 40,
      },
    };

    const publicGet = vi.fn().mockResolvedValueOnce(mockResult);
    const base = { publicGet } as unknown as KrakenRestBase;

    const res = await getTradableAssetPairs(base);

    expect(publicGet).toHaveBeenCalledTimes(1);
    expect(publicGet).toHaveBeenCalledWith('/0/public/AssetPairs', {});
    expect(res).toBe(mockResult);
  });

  it('joins pair[] with commas', async () => {
    const publicGet = vi.fn().mockResolvedValueOnce({});
    const base = { publicGet } as unknown as KrakenRestBase;

    await getTradableAssetPairs(base, { pair: ['XBTUSD', 'ETHUSD'] });

    expect(publicGet).toHaveBeenCalledWith('/0/public/AssetPairs', {
      pair: 'XBTUSD,ETHUSD',
    });
  });

  it('passes aclass_base when provided', async () => {
    const publicGet = vi.fn().mockResolvedValueOnce({});
    const base = { publicGet } as unknown as KrakenRestBase;

    await getTradableAssetPairs(base, { aclass_base: 'tokenized_asset' });

    expect(publicGet).toHaveBeenCalledWith('/0/public/AssetPairs', {
      aclass_base: 'tokenized_asset',
    });
  });

  it('passes info when provided', async () => {
    const publicGet = vi.fn().mockResolvedValueOnce({});
    const base = { publicGet } as unknown as KrakenRestBase;

    await getTradableAssetPairs(base, { info: 'fees' });

    expect(publicGet).toHaveBeenCalledWith('/0/public/AssetPairs', {
      info: 'fees',
    });
  });

  it('passes country_code when provided', async () => {
    const publicGet = vi.fn().mockResolvedValueOnce({});
    const base = { publicGet } as unknown as KrakenRestBase;

    await getTradableAssetPairs(base, { country_code: 'CA' });

    expect(publicGet).toHaveBeenCalledWith('/0/public/AssetPairs', {
      country_code: 'CA',
    });
  });

  it('includes all query params when all provided', async () => {
    const publicGet = vi.fn().mockResolvedValueOnce({});
    const base = { publicGet } as unknown as KrakenRestBase;

    await getTradableAssetPairs(base, {
      pair: ['AAPLUSD', 'TSLAUSD'],
      aclass_base: 'tokenized_asset',
      info: 'info',
      country_code: 'CA',
    });

    expect(publicGet).toHaveBeenCalledWith('/0/public/AssetPairs', {
      pair: 'AAPLUSD,TSLAUSD',
      aclass_base: 'tokenized_asset',
      info: 'info',
      country_code: 'CA',
    });
  });
});
