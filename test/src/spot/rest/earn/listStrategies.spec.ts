import { describe, it, expect, vi } from 'vitest';
import type { KrakenRestBase } from '../../../../../src/base/restBase';
import {
  listEarnStrategies,
  type KrakenEarnListStrategiesResultObject,
} from '../../../../../src/spot/rest/earn/listStrategies';

describe('listEarnStrategies', () => {
  it('calls /0/private/Earn/Strategies with empty body by default', async () => {
    const base = {
      privatePost: vi.fn().mockResolvedValue(null),
    } as unknown as KrakenRestBase;

    const res = await listEarnStrategies(base);

    expect(res).toBeNull();
    expect((base as any).privatePost).toHaveBeenCalledTimes(1);
    expect((base as any).privatePost).toHaveBeenCalledWith(
      '/0/private/Earn/Strategies',
      {},
    );
  });

  it('includes all non-null params (including false and 0)', async () => {
    const mockResult: KrakenEarnListStrategiesResultObject = {
      items: [],
      next_cursor: null,
    };

    const base = {
      privatePost: vi.fn().mockResolvedValue(mockResult),
    } as unknown as KrakenRestBase;

    const res = await listEarnStrategies(base, {
      ascending: false, // keep false
      asset: 'USDT',
      cursor: 'CUR123',
      limit: 0, // keep 0
    });

    expect(res).toEqual(mockResult);
    expect((base as any).privatePost).toHaveBeenCalledWith(
      '/0/private/Earn/Strategies',
      {
        ascending: false,
        asset: 'USDT',
        cursor: 'CUR123',
        limit: 0,
      },
    );
  });

  it('encodes lock_type as JSON string when non-empty array', async () => {
    const base = {
      privatePost: vi.fn().mockResolvedValue(null),
    } as unknown as KrakenRestBase;

    await listEarnStrategies(base, {
      lock_type: ['flex', 'bonded'],
    });

    expect((base as any).privatePost).toHaveBeenCalledWith(
      '/0/private/Earn/Strategies',
      {
        lock_type: JSON.stringify(['flex', 'bonded']),
      },
    );
  });

  it('omits lock_type when empty array', async () => {
    const base = {
      privatePost: vi.fn().mockResolvedValue(null),
    } as unknown as KrakenRestBase;

    await listEarnStrategies(base, {
      lock_type: [],
    });

    expect((base as any).privatePost).toHaveBeenCalledWith(
      '/0/private/Earn/Strategies',
      {},
    );
  });

  it('omits params that are null', async () => {
    const base = {
      privatePost: vi.fn().mockResolvedValue(null),
    } as unknown as KrakenRestBase;

    await listEarnStrategies(base, {
      ascending: null,
      asset: null,
      cursor: null,
      limit: null,
      lock_type: null,
    });

    expect((base as any).privatePost).toHaveBeenCalledWith(
      '/0/private/Earn/Strategies',
      {},
    );
  });

  it('omits params that are undefined', async () => {
    const base = {
      privatePost: vi.fn().mockResolvedValue(null),
    } as unknown as KrakenRestBase;

    await listEarnStrategies(base, {
      ascending: undefined,
      asset: undefined,
      cursor: undefined,
      limit: undefined,
      lock_type: undefined,
    });

    expect((base as any).privatePost).toHaveBeenCalledWith(
      '/0/private/Earn/Strategies',
      {},
    );
  });
});
