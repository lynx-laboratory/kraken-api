import { describe, it, expect, vi } from 'vitest';
import type { KrakenRestBase } from '../../../../../src/base/restBase';
import { getRecentSpreads } from '../../../../../src/spot/rest/market-data/getRecentSpreads';

describe('market-data/getRecentSpreads', () => {
  it('calls publicGet with required pair only and normalizes response', async () => {
    const raw = {
      last: 123,
      XBTUSD: [
        [1, '100.0', '101.0'],
        [2, '99.5', '100.5'],
      ],
    };

    const publicGet = vi.fn().mockResolvedValueOnce(raw);
    const base = { publicGet } as unknown as KrakenRestBase;

    const res = await getRecentSpreads(base, { pair: 'XBTUSD' });

    expect(publicGet).toHaveBeenCalledTimes(1);
    expect(publicGet).toHaveBeenCalledWith('/0/public/Spread', {
      pair: 'XBTUSD',
    });

    expect(res).toEqual({
      last: 123,
      spreads: {
        XBTUSD: raw.XBTUSD,
      },
    });
  });

  it('includes since when provided', async () => {
    const raw = { last: 999, XBTUSD: [] as any[] };

    const publicGet = vi.fn().mockResolvedValueOnce(raw);
    const base = { publicGet } as unknown as KrakenRestBase;

    await getRecentSpreads(base, { pair: 'XBTUSD', since: 456 });

    expect(publicGet).toHaveBeenCalledWith('/0/public/Spread', {
      pair: 'XBTUSD',
      since: '456',
    });
  });

  it('includes asset_class when provided', async () => {
    const raw = { last: 1, 'AAPL/USD': [] as any[] };

    const publicGet = vi.fn().mockResolvedValueOnce(raw);
    const base = { publicGet } as unknown as KrakenRestBase;

    await getRecentSpreads(base, {
      pair: 'AAPL/USD',
      asset_class: 'tokenized_asset',
    });

    expect(publicGet).toHaveBeenCalledWith('/0/public/Spread', {
      pair: 'AAPL/USD',
      asset_class: 'tokenized_asset',
    });
  });

  it('normalizes multiple pairs if Kraken ever returns more than one', async () => {
    const raw = {
      last: 42,
      XBTUSD: [[1, '1', '2']],
      ETHUSD: [[1, '3', '4']],
    };

    const publicGet = vi.fn().mockResolvedValueOnce(raw);
    const base = { publicGet } as unknown as KrakenRestBase;

    const res = await getRecentSpreads(base, { pair: 'XBTUSD' });

    expect(res).toEqual({
      last: 42,
      spreads: {
        XBTUSD: raw.XBTUSD,
        ETHUSD: raw.ETHUSD,
      },
    });
  });
});
