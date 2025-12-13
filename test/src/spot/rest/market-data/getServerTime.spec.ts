import { describe, it, expect, vi } from 'vitest';
import type { KrakenRestBase } from '../../../../../src/base/restBase';
import { getServerTime } from '../../../../../src/spot/rest/market-data/getServerTime';

describe('market-data/getServerTime', () => {
  it('calls publicGet with /0/public/Time and returns result', async () => {
    const mockResult = {
      unixtime: 1234567890,
      rfc1123: 'Mon, 01 Jan 2001 00:00:00 GMT',
    };

    const publicGet = vi.fn().mockResolvedValueOnce(mockResult);
    const base = { publicGet } as unknown as KrakenRestBase;

    const res = await getServerTime(base);

    expect(publicGet).toHaveBeenCalledTimes(1);
    expect(publicGet).toHaveBeenCalledWith('/0/public/Time');
    expect(res).toEqual(mockResult);
  });
});
