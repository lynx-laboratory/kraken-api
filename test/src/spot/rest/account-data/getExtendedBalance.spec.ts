import { describe, it, expect } from 'vitest';
import { getExtendedBalance } from '../../../../../src/spot/rest/account-data/getExtendedBalance';
import {
  mockRestBase,
  expectPrivatePostOnce,
} from '../../../../utils/restBaseMock';

describe('getExtendedBalance', () => {
  it('calls base.privatePost with empty body when params omitted', async () => {
    const { base, privatePost } = mockRestBase();
    privatePost.mockResolvedValue({
      ZUSD: { balance: '10', credit: '0', credit_used: '0', hold_trade: '1' },
    });

    const res = await getExtendedBalance(base);

    expectPrivatePostOnce(privatePost, '/0/private/BalanceEx', {});
    expect(res).toEqual({
      ZUSD: { balance: '10', credit: '0', credit_used: '0', hold_trade: '1' },
    });
  });

  it('passes rebase_multiplier when provided', async () => {
    const { base, privatePost } = mockRestBase();
    privatePost.mockResolvedValue({});

    const res = await getExtendedBalance(base, { rebase_multiplier: 'base' });

    expectPrivatePostOnce(privatePost, '/0/private/BalanceEx', {
      rebase_multiplier: 'base',
    });
    expect(res).toEqual({});
  });
});
