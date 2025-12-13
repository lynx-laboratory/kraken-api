import { describe, it, expect } from 'vitest';
import { getAccountBalance } from '../../../../../src/spot/rest/account-data/getAccountBalance';
import {
  mockRestBase,
  expectPrivatePostOnce,
} from '../../../../utils/restBaseMock';

describe('getAccountBalance', () => {
  it('calls base.privatePost with empty body when params omitted', async () => {
    const { base, privatePost } = mockRestBase();
    privatePost.mockResolvedValue({ ZUSD: '1.23' });

    const res = await getAccountBalance(base);

    expectPrivatePostOnce(privatePost, '/0/private/Balance', {});
    expect(res).toEqual({ ZUSD: '1.23' });
  });

  it('passes rebase_multiplier when provided', async () => {
    const { base, privatePost } = mockRestBase();
    privatePost.mockResolvedValue({ ZUSD: '0.00', 'USDT.F': '50.0' });

    const res = await getAccountBalance(base, { rebase_multiplier: 'base' });

    expectPrivatePostOnce(privatePost, '/0/private/Balance', {
      rebase_multiplier: 'base',
    });

    expect(res).toEqual({ ZUSD: '0.00', 'USDT.F': '50.0' });
  });
});
