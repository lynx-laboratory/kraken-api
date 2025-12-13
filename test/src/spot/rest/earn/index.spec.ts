import { describe, it, expect, vi } from 'vitest';
import type { KrakenRestBase } from '../../../../../src/base/restBase';
import { KrakenSpotEarnApi } from '../../../../../src/spot/rest/earn';
import type { KrakenEarnLockType } from '../../../../../src/spot/rest/earn/listStrategies';

import * as AllocateEarnFunds from '../../../../../src/spot/rest/earn/allocateEarnFunds';
import * as DeallocateEarnFunds from '../../../../../src/spot/rest/earn/deallocateEarnFunds';
import * as GetAllocationStatus from '../../../../../src/spot/rest/earn/getAllocationStatus';
import * as GetDeallocationStatus from '../../../../../src/spot/rest/earn/getDeallocationStatus';
import * as ListStrategies from '../../../../../src/spot/rest/earn/listStrategies';
import * as ListAllocations from '../../../../../src/spot/rest/earn/listAllocations';

describe('KrakenSpotEarnApi', () => {
  it('allocateFunds() delegates to allocateEarnFunds(base, params)', async () => {
    const base = {} as unknown as KrakenRestBase;

    const spy = vi
      .spyOn(AllocateEarnFunds, 'allocateEarnFunds')
      .mockResolvedValue(true);

    const api = new KrakenSpotEarnApi(base);

    const params = { amount: '100', strategy_id: 'STRAT-123' } as const;
    const res = await api.allocateFunds(params);

    expect(res).toBe(true);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(base, params);
  });

  it('deallocateFunds() delegates to deallocateEarnFunds(base, params)', async () => {
    const base = {} as unknown as KrakenRestBase;

    const spy = vi
      .spyOn(DeallocateEarnFunds, 'deallocateEarnFunds')
      .mockResolvedValue(null);

    const api = new KrakenSpotEarnApi(base);

    const params = { amount: 50, strategy_id: 'STRAT-123' } as const;
    const res = await api.deallocateFunds(params);

    expect(res).toBeNull();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(base, params);
  });

  it('getAllocationStatus() delegates to getAllocationStatus(base, params)', async () => {
    const base = {} as unknown as KrakenRestBase;

    const spy = vi
      .spyOn(GetAllocationStatus, 'getAllocationStatus')
      .mockResolvedValue({ pending: false });

    const api = new KrakenSpotEarnApi(base);

    const params = { strategy_id: 'STRAT-1' } as const;
    const res = await api.getAllocationStatus(params);

    expect(res).toEqual({ pending: false });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(base, params);
  });

  it('getDeallocationStatus() delegates to getDeallocationStatus(base, params)', async () => {
    const base = {} as unknown as KrakenRestBase;

    const spy = vi
      .spyOn(GetDeallocationStatus, 'getDeallocationStatus')
      .mockResolvedValue({ pending: true });

    const api = new KrakenSpotEarnApi(base);

    const params = { strategy_id: 'STRAT-2' } as const;
    const res = await api.getDeallocationStatus(params);

    expect(res).toEqual({ pending: true });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(base, params);
  });

  it('listStrategies() delegates to listEarnStrategies(base, params) and defaults to {}', async () => {
    const base = {} as unknown as KrakenRestBase;

    const spy = vi
      .spyOn(ListStrategies, 'listEarnStrategies')
      .mockResolvedValue(null);

    const api = new KrakenSpotEarnApi(base);

    const res1 = await api.listStrategies();
    expect(res1).toBeNull();
    expect(spy).toHaveBeenCalledWith(base, {});

    spy.mockClear();

    const params = {
      asset: 'USDT',
      lock_type: ['flex', 'bonded'] as KrakenEarnLockType[],
    } as const;
    const res2 = await api.listStrategies(params);

    expect(res2).toBeNull();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(base, params);
  });

  it('listAllocations() delegates to listEarnAllocations(base, params) and defaults to {}', async () => {
    const base = {} as unknown as KrakenRestBase;

    const spy = vi
      .spyOn(ListAllocations, 'listEarnAllocations')
      .mockResolvedValue(null);

    const api = new KrakenSpotEarnApi(base);

    const res1 = await api.listAllocations();
    expect(res1).toBeNull();
    expect(spy).toHaveBeenCalledWith(base, {});

    spy.mockClear();

    const params = {
      converted_asset: 'USD',
      hide_zero_allocations: true,
    } as const;
    const res2 = await api.listAllocations(params);

    expect(res2).toBeNull();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(base, params);
  });
});
