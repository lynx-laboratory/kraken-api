import { describe, it, expect } from 'vitest';
import { getCreditLines } from '../../../../../src/spot/rest/account-data/getCreditLines';
import {
  mockRestBase,
  expectPrivatePostOnce,
} from '../../../../utils/restBaseMock';

describe('getCreditLines', () => {
  it('calls base.privatePost with empty body when params omitted (null result allowed)', async () => {
    const { base, privatePost } = mockRestBase();
    privatePost.mockResolvedValue(null);

    const res = await getCreditLines(base);

    expectPrivatePostOnce(privatePost, '/0/private/CreditLines', {});
    expect(res).toBeNull();
  });

  it('passes rebase_multiplier when provided', async () => {
    const { base, privatePost } = mockRestBase();
    privatePost.mockResolvedValue({
      asset_details: {
        ZUSD: {
          balance: '100.0',
          credit_limit: '1000.0',
          credit_used: '0.0',
          available_credit: '1000.0',
        },
      },
      limits_monitor: {
        total_credit_usd: '1000.0',
        total_credit_used_usd: '0.0',
      },
    });

    const res = await getCreditLines(base, { rebase_multiplier: 'base' });

    expectPrivatePostOnce(privatePost, '/0/private/CreditLines', {
      rebase_multiplier: 'base',
    });

    expect(res).toEqual({
      asset_details: {
        ZUSD: {
          balance: '100.0',
          credit_limit: '1000.0',
          credit_used: '0.0',
          available_credit: '1000.0',
        },
      },
      limits_monitor: {
        total_credit_usd: '1000.0',
        total_credit_used_usd: '0.0',
      },
    });
  });
});
