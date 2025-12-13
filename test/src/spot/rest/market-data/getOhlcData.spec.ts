import { describe, it, expect, vi } from 'vitest';
import type { KrakenRestBase } from '../../../../../src/base/restBase';
import {
  getOhlcData,
  type KrakenOhlcEntry,
} from '../../../../../src/spot/rest/market-data/getOhlcData';

describe('market-data/getOhlcData', () => {
  it('calls publicGet with only required pair', async () => {
    const raw = {
      last: 1688671200,
      XBTUSD: [
        [1688670000, '1', '2', '0.5', '1.5', '1.3', '10', 7] as KrakenOhlcEntry,
      ],
    };

    const publicGet = vi.fn().mockResolvedValueOnce(raw);
    const base = { publicGet } as unknown as KrakenRestBase;

    const res = await getOhlcData(base, { pair: 'XBTUSD' });

    expect(publicGet).toHaveBeenCalledTimes(1);
    expect(publicGet).toHaveBeenCalledWith('/0/public/OHLC', {
      pair: 'XBTUSD',
    });

    expect(res).toEqual({
      last: 1688671200,
      ohlc: {
        XBTUSD: raw.XBTUSD,
      },
    });
  });

  it('includes interval, since, and asset_class in query when provided', async () => {
    const raw = {
      last: 1688671200,
      XBTUSD: [
        [1688670000, '1', '2', '0.5', '1.5', '1.3', '10', 7] as KrakenOhlcEntry,
      ],
    };

    const publicGet = vi.fn().mockResolvedValueOnce(raw);
    const base = { publicGet } as unknown as KrakenRestBase;

    await getOhlcData(base, {
      pair: 'XBTUSD',
      interval: 15,
      since: 123456,
      asset_class: 'tokenized_asset',
    });

    expect(publicGet).toHaveBeenCalledWith('/0/public/OHLC', {
      pair: 'XBTUSD',
      interval: '15',
      since: '123456',
      asset_class: 'tokenized_asset',
    });
  });

  it('reshapes multi-pair raw results into ohlc map (and ignores only `last`)', async () => {
    const raw = {
      last: 999,
      XBTUSD: [[1, '1', '1', '1', '1', '1', '1', 1] as KrakenOhlcEntry],
      ETHUSD: [[2, '2', '2', '2', '2', '2', '2', 2] as KrakenOhlcEntry],
    };

    const publicGet = vi.fn().mockResolvedValueOnce(raw);
    const base = { publicGet } as unknown as KrakenRestBase;

    const res = await getOhlcData(base, { pair: 'XBTUSD,ETHUSD' });

    expect(res.last).toBe(999);
    expect(res.ohlc).toEqual({
      XBTUSD: raw.XBTUSD,
      ETHUSD: raw.ETHUSD,
    });
  });
});
