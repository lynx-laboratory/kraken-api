import { describe, it, expect, vi } from 'vitest';
import type { KrakenRestBase } from '../../../../../src/base/restBase';
import { getPreTradeData } from '../../../../../src/spot/rest/transparency/getPreTradeData';

describe('spot/rest/transparency/getPreTradeData', () => {
  it('calls publicGet with symbol as string', async () => {
    const base = {
      publicGet: vi.fn(),
    } as unknown as KrakenRestBase;

    const mockedResult = {
      BTCUSD: { bids: [], asks: [] },
    } as Record<string, unknown>;

    vi.mocked(base.publicGet).mockResolvedValueOnce(mockedResult);

    const res = await getPreTradeData(base, { symbol: 'BTC/USD' });

    expect(base.publicGet).toHaveBeenCalledTimes(1);
    expect(base.publicGet).toHaveBeenCalledWith('/0/public/PreTrade', {
      symbol: 'BTC/USD',
    });
    expect(res).toEqual(mockedResult);
  });

  it('joins symbol list with commas when symbol is string[]', async () => {
    const base = {
      publicGet: vi.fn(),
    } as unknown as KrakenRestBase;

    const mockedResult = {
      BTCUSD: { bids: [], asks: [] },
      ETHUSD: { bids: [], asks: [] },
    } as Record<string, unknown>;

    vi.mocked(base.publicGet).mockResolvedValueOnce(mockedResult);

    const res = await getPreTradeData(base, { symbol: ['BTC/USD', 'ETH/USD'] });

    expect(base.publicGet).toHaveBeenCalledTimes(1);
    expect(base.publicGet).toHaveBeenCalledWith('/0/public/PreTrade', {
      symbol: 'BTC/USD,ETH/USD',
    });
    expect(res).toEqual(mockedResult);
  });
});
