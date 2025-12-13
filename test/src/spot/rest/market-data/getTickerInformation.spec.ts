import { describe, it, expect, vi } from 'vitest';
import type { KrakenRestBase } from '../../../../../src/base/restBase';
import { getTickerInformation } from '../../../../../src/spot/rest/market-data/getTickerInformation';

describe('market-data/getTickerInformation', () => {
  it('calls publicGet with no query when params omitted', async () => {
    const mockResult = {
      XBTUSD: {
        a: ['65000.0', '1', '1.0'],
        b: ['64990.0', '1', '1.0'],
        c: ['64995.0', '0.01'],
        v: ['10.0', '100.0'],
        p: ['64000.0', '64500.0'],
        t: [100, 1000],
        l: ['63000.0', '62000.0'],
        h: ['66000.0', '67000.0'],
        o: '63500.0',
      },
    };

    const publicGet = vi.fn().mockResolvedValueOnce(mockResult);
    const base = { publicGet } as unknown as KrakenRestBase;

    const res = await getTickerInformation(base);

    expect(publicGet).toHaveBeenCalledTimes(1);
    expect(publicGet).toHaveBeenCalledWith('/0/public/Ticker', {});
    expect(res).toBe(mockResult);
  });

  it('joins pair[] with commas', async () => {
    const publicGet = vi.fn().mockResolvedValueOnce({});
    const base = { publicGet } as unknown as KrakenRestBase;

    await getTickerInformation(base, { pair: ['XBTUSD', 'ETHUSD'] });

    expect(publicGet).toHaveBeenCalledWith('/0/public/Ticker', {
      pair: 'XBTUSD,ETHUSD',
    });
  });

  it('passes asset_class when provided', async () => {
    const publicGet = vi.fn().mockResolvedValueOnce({});
    const base = { publicGet } as unknown as KrakenRestBase;

    await getTickerInformation(base, { asset_class: 'tokenized_asset' });

    expect(publicGet).toHaveBeenCalledWith('/0/public/Ticker', {
      asset_class: 'tokenized_asset',
    });
  });

  it('includes both pair and asset_class when both provided', async () => {
    const publicGet = vi.fn().mockResolvedValueOnce({});
    const base = { publicGet } as unknown as KrakenRestBase;

    await getTickerInformation(base, {
      pair: ['AAPLUSD', 'TSLAUSD'],
      asset_class: 'tokenized_asset',
    });

    expect(publicGet).toHaveBeenCalledWith('/0/public/Ticker', {
      pair: 'AAPLUSD,TSLAUSD',
      asset_class: 'tokenized_asset',
    });
  });
});
