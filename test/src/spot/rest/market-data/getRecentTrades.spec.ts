import { describe, it, expect, vi } from 'vitest';
import type { KrakenRestBase } from '../../../../../src/base/restBase';
import { getRecentTrades } from '../../../../../src/spot/rest/market-data/getRecentTrades';

describe('market-data/getRecentTrades', () => {
  it('calls publicGet with required pair only and normalizes response', async () => {
    const raw = {
      last: '1616663618',
      XBTUSD: [
        ['100.0', '0.01', 1, 'b', 'l', '', '1'],
        ['101.0', '0.02', 2, 's', 'm', '', '2'],
      ],
    };

    const publicGet = vi.fn().mockResolvedValueOnce(raw);
    const base = { publicGet } as unknown as KrakenRestBase;

    const res = await getRecentTrades(base, { pair: 'XBTUSD' });

    expect(publicGet).toHaveBeenCalledTimes(1);
    expect(publicGet).toHaveBeenCalledWith('/0/public/Trades', {
      pair: 'XBTUSD',
    });

    expect(res).toEqual({
      last: '1616663618',
      trades: {
        XBTUSD: raw.XBTUSD,
      },
    });
  });

  it('stringifies since and count when provided', async () => {
    const raw = { last: '9', XBTUSD: [] as any[] };

    const publicGet = vi.fn().mockResolvedValueOnce(raw);
    const base = { publicGet } as unknown as KrakenRestBase;

    await getRecentTrades(base, { pair: 'XBTUSD', since: 123, count: 50 });

    expect(publicGet).toHaveBeenCalledWith('/0/public/Trades', {
      pair: 'XBTUSD',
      since: '123',
      count: '50',
    });
  });

  it('includes asset_class when provided', async () => {
    const raw = { last: '1', 'AAPL/USD': [] as any[] };

    const publicGet = vi.fn().mockResolvedValueOnce(raw);
    const base = { publicGet } as unknown as KrakenRestBase;

    await getRecentTrades(base, {
      pair: 'AAPL/USD',
      asset_class: 'tokenized_asset',
    });

    expect(publicGet).toHaveBeenCalledWith('/0/public/Trades', {
      pair: 'AAPL/USD',
      asset_class: 'tokenized_asset',
    });
  });

  it('normalizes multiple pairs if Kraken ever returns more than one', async () => {
    const raw = {
      last: '42',
      XBTUSD: [['1', '1', 1, 'b', 'l', '', '1']],
      ETHUSD: [['2', '2', 2, 's', 'm', '', '2']],
    };

    const publicGet = vi.fn().mockResolvedValueOnce(raw);
    const base = { publicGet } as unknown as KrakenRestBase;

    const res = await getRecentTrades(base, { pair: 'XBTUSD' });

    expect(res).toEqual({
      last: '42',
      trades: {
        XBTUSD: raw.XBTUSD,
        ETHUSD: raw.ETHUSD,
      },
    });
  });
});
