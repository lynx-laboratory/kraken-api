import { describe, it, expect, vi } from 'vitest';
import type { KrakenRestBase } from '../../../../../src/base/restBase';
import { getSystemStatus } from '../../../../../src/spot/rest/market-data/getSystemStatus';

describe('market-data/getSystemStatus', () => {
  it('calls publicGet with /0/public/SystemStatus and returns result', async () => {
    const mockResult = {
      status: 'online',
      timestamp: '2025-12-10T04:18:32Z',
    } as const;

    const publicGet = vi.fn().mockResolvedValueOnce(mockResult);
    const base = { publicGet } as unknown as KrakenRestBase;

    const res = await getSystemStatus(base);

    expect(publicGet).toHaveBeenCalledTimes(1);
    expect(publicGet).toHaveBeenCalledWith('/0/public/SystemStatus');
    expect(res).toEqual(mockResult);
  });
});
