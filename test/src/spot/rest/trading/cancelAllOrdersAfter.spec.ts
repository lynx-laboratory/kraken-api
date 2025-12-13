import { describe, it, expect, vi } from 'vitest';
import type { KrakenRestBase } from '../../../../../src/base/restBase';
import { cancelAllOrdersAfter } from '../../../../../src/spot/rest/trading/cancelAllOrdersAfter';

describe('spot/rest/trading/cancelAllOrdersAfter', () => {
  it('posts to /0/private/CancelAllOrdersAfter with timeout as string', async () => {
    const privatePost = vi.fn().mockResolvedValueOnce({
      currentTime: '2025-12-12T00:00:00Z',
      triggerTime: '2025-12-12T00:00:10Z',
    });

    const base = { privatePost } as unknown as KrakenRestBase;

    const res = await cancelAllOrdersAfter(base, { timeout: 10 });

    expect(res).toEqual({
      currentTime: '2025-12-12T00:00:00Z',
      triggerTime: '2025-12-12T00:00:10Z',
    });

    expect(privatePost).toHaveBeenCalledTimes(1);
    expect(privatePost).toHaveBeenCalledWith(
      '/0/private/CancelAllOrdersAfter',
      {
        timeout: '10',
      },
    );
  });

  it('supports timeout=0 (disable timer)', async () => {
    const privatePost = vi.fn().mockResolvedValueOnce({
      currentTime: '2025-12-12T00:00:00Z',
      triggerTime: '2025-12-12T00:00:00Z',
    });

    const base = { privatePost } as unknown as KrakenRestBase;

    const res = await cancelAllOrdersAfter(base, { timeout: 0 });

    expect(res).toEqual({
      currentTime: '2025-12-12T00:00:00Z',
      triggerTime: '2025-12-12T00:00:00Z',
    });

    expect(privatePost).toHaveBeenCalledWith(
      '/0/private/CancelAllOrdersAfter',
      {
        timeout: '0',
      },
    );
  });
});
