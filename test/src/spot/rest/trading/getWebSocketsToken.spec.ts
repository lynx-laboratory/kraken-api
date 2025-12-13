import { describe, it, expect, vi } from 'vitest';
import type { KrakenRestBase } from '../../../../../src/base/restBase';
import { getWebSocketsToken } from '../../../../../src/spot/rest/trading/getWebSocketsToken';

describe('spot/rest/trading/getWebSocketsToken', () => {
  it('calls /0/private/GetWebSocketsToken with empty body', async () => {
    const privatePost = vi.fn().mockResolvedValueOnce({
      token: 'tok_123',
      expires: 900,
    });

    const base = { privatePost } as unknown as KrakenRestBase;

    const res = await getWebSocketsToken(base);

    expect(res).toEqual({ token: 'tok_123', expires: 900 });

    expect(privatePost).toHaveBeenCalledTimes(1);
    expect(privatePost).toHaveBeenCalledWith(
      '/0/private/GetWebSocketsToken',
      {},
    );
  });
});
