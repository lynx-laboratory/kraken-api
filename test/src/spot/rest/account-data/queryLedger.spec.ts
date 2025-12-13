import { describe, it, expect } from 'vitest';
import { queryLedgers } from '../../../../../src/spot/rest/account-data/queryLedgers';
import {
  mockRestBase,
  expectPrivatePostOnce,
} from '../../../../utils/restBaseMock';

describe('queryLedgers', () => {
  it('sends required id when provided as string', async () => {
    const { base, privatePost } = mockRestBase();
    privatePost.mockResolvedValue({});

    const res = await queryLedgers(base, { id: 'LID123' });

    expectPrivatePostOnce(privatePost, '/0/private/QueryLedgers', {
      id: 'LID123',
    });
    expect(res).toEqual({});
  });

  it('joins id array with commas', async () => {
    const { base, privatePost } = mockRestBase();
    privatePost.mockResolvedValue({});

    await queryLedgers(base, { id: ['L1', 'L2', 'L3'] });

    expectPrivatePostOnce(privatePost, '/0/private/QueryLedgers', {
      id: 'L1,L2,L3',
    });
  });

  it('maps trades boolean and includes false values', async () => {
    const { base, privatePost } = mockRestBase();
    privatePost.mockResolvedValue({});

    await queryLedgers(base, { id: 'LID999', trades: false });

    expectPrivatePostOnce(privatePost, '/0/private/QueryLedgers', {
      id: 'LID999',
      trades: 'false',
    });
  });

  it('passes rebase_multiplier when provided', async () => {
    const { base, privatePost } = mockRestBase();
    privatePost.mockResolvedValue({});

    await queryLedgers(base, {
      id: 'LID777',
      trades: true,
      rebase_multiplier: 'base',
    });

    expectPrivatePostOnce(privatePost, '/0/private/QueryLedgers', {
      id: 'LID777',
      trades: 'true',
      rebase_multiplier: 'base',
    });
  });
});
