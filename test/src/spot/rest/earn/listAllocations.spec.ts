import { describe, it, expect, vi } from 'vitest';
import type { KrakenRestBase } from '../../../../../src/base/restBase';
import {
  listEarnAllocations,
  type KrakenEarnListAllocationsResultObject,
} from '../../../../../src/spot/rest/earn/listAllocations';

describe('listEarnAllocations', () => {
  it('calls /0/private/Earn/Allocations with empty body by default', async () => {
    const base = {
      privatePost: vi.fn().mockResolvedValue(null),
    } as unknown as KrakenRestBase;

    const res = await listEarnAllocations(base);

    expect(res).toBeNull();
    expect((base as any).privatePost).toHaveBeenCalledTimes(1);
    expect((base as any).privatePost).toHaveBeenCalledWith(
      '/0/private/Earn/Allocations',
      {},
    );
  });

  it('includes all non-null params (including false)', async () => {
    const mockResult: KrakenEarnListAllocationsResultObject = {
      converted_asset: 'USD',
      items: [],
      total_allocated: '0',
      total_rewarded: '0',
    };

    const base = {
      privatePost: vi.fn().mockResolvedValue(mockResult),
    } as unknown as KrakenRestBase;

    const res = await listEarnAllocations(base, {
      ascending: false, // must be preserved
      converted_asset: 'CAD',
      hide_zero_allocations: true,
    });

    expect(res).toEqual(mockResult);
    expect((base as any).privatePost).toHaveBeenCalledWith(
      '/0/private/Earn/Allocations',
      {
        ascending: false,
        converted_asset: 'CAD',
        hide_zero_allocations: true,
      },
    );
  });

  it('omits params that are null', async () => {
    const base = {
      privatePost: vi.fn().mockResolvedValue(null),
    } as unknown as KrakenRestBase;

    await listEarnAllocations(base, {
      ascending: null,
      converted_asset: null,
      hide_zero_allocations: null,
    });

    expect((base as any).privatePost).toHaveBeenCalledWith(
      '/0/private/Earn/Allocations',
      {},
    );
  });

  it('omits params that are undefined', async () => {
    const base = {
      privatePost: vi.fn().mockResolvedValue(null),
    } as unknown as KrakenRestBase;

    await listEarnAllocations(base, {
      ascending: undefined,
      converted_asset: undefined,
      hide_zero_allocations: undefined,
    });

    expect((base as any).privatePost).toHaveBeenCalledWith(
      '/0/private/Earn/Allocations',
      {},
    );
  });

  it('can include only one param at a time', async () => {
    const base = {
      privatePost: vi.fn().mockResolvedValue(null),
    } as unknown as KrakenRestBase;

    await listEarnAllocations(base, { hide_zero_allocations: false });

    // false should be included (not dropped)
    expect((base as any).privatePost).toHaveBeenCalledWith(
      '/0/private/Earn/Allocations',
      { hide_zero_allocations: false },
    );
  });
});
