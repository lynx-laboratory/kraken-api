import { describe, it, expect, vi } from 'vitest';
import type { KrakenRestBase } from '../../../../../src/base/restBase';
import { createSubaccount } from '../../../../../src/spot/rest/subaccounts/createSubaccount';

describe('spot/rest/subaccounts/createSubaccount', () => {
  it('calls /0/private/CreateSubaccount with username + email', async () => {
    const privatePost = vi.fn().mockResolvedValueOnce(true);
    const base = { privatePost } as unknown as KrakenRestBase;

    const res = await createSubaccount(base, {
      username: 'my-subaccount',
      email: 'sub@example.com',
    });

    expect(privatePost).toHaveBeenCalledTimes(1);
    expect(privatePost).toHaveBeenCalledWith('/0/private/CreateSubaccount', {
      username: 'my-subaccount',
      email: 'sub@example.com',
    });

    expect(res).toBe(true);
  });

  it('passes through false results', async () => {
    const privatePost = vi.fn().mockResolvedValueOnce(false);
    const base = { privatePost } as unknown as KrakenRestBase;

    const res = await createSubaccount(base, {
      username: 'my-subaccount',
      email: 'sub@example.com',
    });

    expect(res).toBe(false);
  });
});
