import { describe, it, expect, vi } from 'vitest';
import type { KrakenRestBase } from '../../../../../src/base/restBase';
import { cancelAllOrders } from '../../../../../src/spot/rest/trading/cancelAllOrders';

describe('spot/rest/trading/cancelAllOrders', () => {
  it('posts to /0/private/CancelAll with an empty body', async () => {
    const privatePost = vi.fn().mockResolvedValueOnce({
      count: 2,
      pending: true,
    });

    const base = { privatePost } as unknown as KrakenRestBase;

    const res = await cancelAllOrders(base);

    expect(res).toEqual({ count: 2, pending: true });

    expect(privatePost).toHaveBeenCalledTimes(1);
    expect(privatePost).toHaveBeenCalledWith('/0/private/CancelAll', {});
  });
});
