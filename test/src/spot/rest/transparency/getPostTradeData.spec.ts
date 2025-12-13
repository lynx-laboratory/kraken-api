import { describe, it, expect, vi } from 'vitest';
import type { KrakenRestBase } from '../../../../../src/base/restBase';
import { getPostTradeData } from '../../../../../src/spot/rest/transparency/getPostTradeData';

describe('spot/rest/transparency/getPostTradeData', () => {
  it('calls publicGet with empty query when params omitted', async () => {
    const base = {
      publicGet: vi.fn(),
    } as unknown as KrakenRestBase;

    const mockedResult = {
      last_ts: '2024-05-30T12:34:56.123456789Z',
      count: 1,
      trades: [
        {
          trade_id: 'T1',
          price: '100.00',
          quantity: '0.5',
          symbol: 'BTC/USD',
          description: 'some trade',
          base_asset: 'BTC',
          base_notation: 'BTC',
          quote_asset: 'USD',
          quote_notation: 'USD',
          trade_venue: 'spot',
          trade_ts: '2024-05-30T12:34:56.123456789Z',
          publication_venue: 'kraken',
          publication_ts: '2024-05-30T12:34:57.123456789Z',
        },
      ],
    };

    vi.mocked(base.publicGet).mockResolvedValueOnce(mockedResult);

    const res = await getPostTradeData(base);

    expect(base.publicGet).toHaveBeenCalledTimes(1);
    expect(base.publicGet).toHaveBeenCalledWith('/0/public/PostTrade', {});
    expect(res).toEqual(mockedResult);
  });

  it('builds query with only provided params', async () => {
    const base = {
      publicGet: vi.fn(),
    } as unknown as KrakenRestBase;

    const mockedResult = {
      last_ts: '2024-05-30T12:34:56.123456789Z',
      count: 0,
      trades: [],
    };

    vi.mocked(base.publicGet).mockResolvedValueOnce(mockedResult);

    const params = {
      symbol: 'BTC/USD',
      from_ts: '2024-05-30T00:00:00Z',
      to_ts: '2024-05-31T00:00:00Z',
      count: 123,
    };

    const res = await getPostTradeData(base, params);

    expect(base.publicGet).toHaveBeenCalledTimes(1);
    expect(base.publicGet).toHaveBeenCalledWith('/0/public/PostTrade', {
      symbol: 'BTC/USD',
      from_ts: '2024-05-30T00:00:00Z',
      to_ts: '2024-05-31T00:00:00Z',
      count: 123,
    });
    expect(res).toEqual(mockedResult);
  });

  it('includes count=0 when explicitly provided', async () => {
    const base = {
      publicGet: vi.fn(),
    } as unknown as KrakenRestBase;

    const mockedResult = {
      last_ts: '2024-05-30T12:34:56.123456789Z',
      count: 0,
      trades: [],
    };

    vi.mocked(base.publicGet).mockResolvedValueOnce(mockedResult);

    const res = await getPostTradeData(base, { count: 0 });

    expect(base.publicGet).toHaveBeenCalledTimes(1);
    expect(base.publicGet).toHaveBeenCalledWith('/0/public/PostTrade', {
      count: 0,
    });
    expect(res).toEqual(mockedResult);
  });
});
