import { describe, it, expect, vi } from 'vitest';
import type { KrakenRestBase } from '../../../../../src/base/restBase';
import { getAssetInfo } from '../../../../../src/spot/rest/market-data/getAssetInfo';

describe('market-data/getAssetInfo', () => {
  it('calls publicGet with empty query when params omitted', async () => {
    const publicGet = vi.fn().mockResolvedValueOnce({});

    const base = { publicGet } as unknown as KrakenRestBase;

    await getAssetInfo(base);

    expect(publicGet).toHaveBeenCalledTimes(1);
    expect(publicGet).toHaveBeenCalledWith('/0/public/Assets', {});
  });

  it('joins asset[] into comma-delimited query param', async () => {
    const publicGet = vi.fn().mockResolvedValueOnce({});

    const base = { publicGet } as unknown as KrakenRestBase;

    await getAssetInfo(base, { asset: ['XXBT', 'XETH'] });

    expect(publicGet).toHaveBeenCalledWith('/0/public/Assets', {
      asset: 'XXBT,XETH',
    });
  });

  it('omits asset when asset[] is empty', async () => {
    const publicGet = vi.fn().mockResolvedValueOnce({});

    const base = { publicGet } as unknown as KrakenRestBase;

    await getAssetInfo(base, { asset: [] });

    expect(publicGet).toHaveBeenCalledWith('/0/public/Assets', {});
  });

  it('includes aclass when provided', async () => {
    const publicGet = vi.fn().mockResolvedValueOnce({});

    const base = { publicGet } as unknown as KrakenRestBase;

    await getAssetInfo(base, { aclass: 'tokenized_asset' });

    expect(publicGet).toHaveBeenCalledWith('/0/public/Assets', {
      aclass: 'tokenized_asset',
    });
  });

  it('includes both asset and aclass when provided', async () => {
    const publicGet = vi.fn().mockResolvedValueOnce({});

    const base = { publicGet } as unknown as KrakenRestBase;

    await getAssetInfo(base, {
      asset: ['XXBT', 'XETH'],
      aclass: 'currency',
    });

    expect(publicGet).toHaveBeenCalledWith('/0/public/Assets', {
      asset: 'XXBT,XETH',
      aclass: 'currency',
    });
  });
});
