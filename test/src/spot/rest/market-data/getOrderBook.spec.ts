import { describe, it, expect, vi } from 'vitest';
import type { KrakenRestBase } from '../../../../../src/base/restBase';
import { getOrderBook } from '../../../../../src/spot/rest/market-data/getOrderBook';

describe('market-data/getOrderBook', () => {
  it('calls publicGet with required pair only', async () => {
    const mockResult = {
      XBTUSD: { asks: [['1', '2', 3]], bids: [['0.9', '1', 3]] },
    };

    const publicGet = vi.fn().mockResolvedValueOnce(mockResult);
    const base = { publicGet } as unknown as KrakenRestBase;

    const res = await getOrderBook(base, { pair: 'XBTUSD' });

    expect(publicGet).toHaveBeenCalledTimes(1);
    expect(publicGet).toHaveBeenCalledWith('/0/public/Depth', {
      pair: 'XBTUSD',
    });
    expect(res).toBe(mockResult);
  });

  it('includes count when provided', async () => {
    const publicGet = vi.fn().mockResolvedValueOnce({});
    const base = { publicGet } as unknown as KrakenRestBase;

    await getOrderBook(base, { pair: 'XBTUSD', count: 25 });

    expect(publicGet).toHaveBeenCalledWith('/0/public/Depth', {
      pair: 'XBTUSD',
      count: '25',
    });
  });

  it('includes asset_class when provided', async () => {
    const publicGet = vi.fn().mockResolvedValueOnce({});
    const base = { publicGet } as unknown as KrakenRestBase;

    await getOrderBook(base, {
      pair: 'AAPL/USD',
      asset_class: 'tokenized_asset',
    });

    expect(publicGet).toHaveBeenCalledWith('/0/public/Depth', {
      pair: 'AAPL/USD',
      asset_class: 'tokenized_asset',
    });
  });

  it('includes both count and asset_class when provided', async () => {
    const publicGet = vi.fn().mockResolvedValueOnce({});
    const base = { publicGet } as unknown as KrakenRestBase;

    await getOrderBook(base, {
      pair: 'AAPL/USD',
      count: 500,
      asset_class: 'tokenized_asset',
    });

    expect(publicGet).toHaveBeenCalledWith('/0/public/Depth', {
      pair: 'AAPL/USD',
      count: '500',
      asset_class: 'tokenized_asset',
    });
  });
});
