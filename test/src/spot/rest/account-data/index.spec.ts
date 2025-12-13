import { describe, it, expect, beforeEach } from 'vitest';

import { KrakenRestBase } from '../../../../../src/base/restBase';
import { KrakenSpotAccountDataApi } from '../../../../../src/spot/rest/account-data';

class MockRestBase extends KrakenRestBase {
  public calls: Array<{
    method: 'privatePost' | 'privatePostBinary';
    path: string;
    body?: Record<string, any>;
  }> = [];

  private nextReturn: unknown = undefined;
  private nextBinary: ArrayBuffer = new ArrayBuffer(0);

  setNextReturn(value: unknown) {
    this.nextReturn = value;
  }

  setNextBinary(value: ArrayBuffer) {
    this.nextBinary = value;
  }

  override async publicGet<T>(): Promise<T> {
    throw new Error(
      'MockRestBase.publicGet should not be called in these tests',
    );
  }

  override async privatePost<T>(
    path: string,
    params?: Record<string, any>,
  ): Promise<T> {
    this.calls.push({ method: 'privatePost', path, body: params ?? {} });
    return this.nextReturn as T;
  }

  async privatePostBinary(
    path: string,
    body?: Record<string, string>,
  ): Promise<ArrayBuffer> {
    this.calls.push({ method: 'privatePostBinary', path, body: body ?? {} });
    return this.nextBinary;
  }
}

describe('KrakenSpotAccountDataApi (index.ts)', () => {
  let base: MockRestBase;
  let api: KrakenSpotAccountDataApi;

  beforeEach(() => {
    base = new MockRestBase();
    api = new KrakenSpotAccountDataApi(base);
  });

  it('getAccountBalance() calls /0/private/Balance with empty body when no params', async () => {
    base.setNextReturn({ ZUSD: '1.23' });

    const res = await api.getAccountBalance();

    expect(res).toEqual({ ZUSD: '1.23' });
    expect(base.calls).toEqual([
      { method: 'privatePost', path: '/0/private/Balance', body: {} },
    ]);
  });

  it('getAccountBalance() passes rebase_multiplier when provided', async () => {
    base.setNextReturn({});

    await api.getAccountBalance({ rebase_multiplier: 'base' });

    expect(base.calls[0]).toEqual({
      method: 'privatePost',
      path: '/0/private/Balance',
      body: { rebase_multiplier: 'base' },
    });
  });

  it('getExtendedBalance() calls /0/private/BalanceEx', async () => {
    base.setNextReturn({});

    await api.getExtendedBalance();

    expect(base.calls[0]).toEqual({
      method: 'privatePost',
      path: '/0/private/BalanceEx',
      body: {},
    });
  });

  it('getCreditLines() calls /0/private/CreditLines', async () => {
    base.setNextReturn(null);

    const res = await api.getCreditLines();

    expect(res).toBeNull();
    expect(base.calls[0]).toEqual({
      method: 'privatePost',
      path: '/0/private/CreditLines',
      body: {},
    });
  });

  it('getTradeBalance() calls /0/private/TradeBalance', async () => {
    base.setNextReturn({});

    await api.getTradeBalance();

    expect(base.calls[0]).toEqual({
      method: 'privatePost',
      path: '/0/private/TradeBalance',
      body: {},
    });
  });

  it('getOpenOrders() calls /0/private/OpenOrders', async () => {
    base.setNextReturn({ open: {} });

    await api.getOpenOrders({ trades: true } as any);

    expect(base.calls[0]?.path).toBe('/0/private/OpenOrders');
    expect(String(base.calls[0]?.body?.trades)).toBe('true');
  });

  it('getClosedOrders() calls /0/private/ClosedOrders', async () => {
    base.setNextReturn({ closed: {}, count: 0 });

    await api.getClosedOrders();

    expect(base.calls[0]).toEqual({
      method: 'privatePost',
      path: '/0/private/ClosedOrders',
      body: {},
    });
  });

  it('getOrderAmends() calls /0/private/GetOrderAmends', async () => {
    base.setNextReturn({ amends: [] });

    await api.getOrderAmends({ order_id: 'O1' } as any);

    expect(base.calls[0]).toEqual({
      method: 'privatePost',
      path: '/0/private/OrderAmends',
      body: { order_id: 'O1' },
    });
  });

  it('getTradesHistory() calls /0/private/TradesHistory', async () => {
    base.setNextReturn({ trades: {}, count: 0 });

    await api.getTradesHistory();

    expect(base.calls[0]).toEqual({
      method: 'privatePost',
      path: '/0/private/TradesHistory',
      body: {},
    });
  });

  it('queryTradesInfo() serializes txid array', async () => {
    base.setNextReturn({});

    await api.queryTradesInfo({ txid: ['T1', 'T2'] } as any);

    expect(base.calls[0]?.path).toBe('/0/private/QueryTrades');
    expect(String(base.calls[0]?.body?.txid)).toBe('T1,T2');
  });

  it('getLedgersInfo() serializes asset array and booleans', async () => {
    base.setNextReturn({ ledger: {}, count: 0 });

    await api.getLedgersInfo({
      asset: ['ZUSD', 'XXBT'],
      type: 'all',
      ofs: 50,
      without_count: true,
      rebase_multiplier: 'rebased',
    });

    expect(base.calls[0]).toEqual({
      method: 'privatePost',
      path: '/0/private/Ledgers',
      body: {
        asset: 'ZUSD,XXBT',
        type: 'all',
        ofs: '50',
        without_count: 'true',
        rebase_multiplier: 'rebased',
      },
    });
  });

  it('queryLedgers() serializes id array', async () => {
    base.setNextReturn({});

    await api.queryLedgers({ id: ['L1', 'L2'] } as any);

    expect(base.calls[0]?.path).toBe('/0/private/QueryLedgers');
    expect(String(base.calls[0]?.body?.id)).toBe('L1,L2');
  });

  it('queryOrdersInfo() serializes txid array and booleans', async () => {
    base.setNextReturn({});

    await api.queryOrdersInfo({
      txid: ['O1', 'O2'],
      trades: false,
      consolidate_taker: true,
    });

    expect(base.calls[0]).toEqual({
      method: 'privatePost',
      path: '/0/private/QueryOrders',
      body: {
        trades: 'false',
        txid: 'O1,O2',
        consolidate_taker: 'true',
      },
    });
  });

  it('getOpenPositions() serializes txid array and booleans', async () => {
    base.setNextReturn({});

    await api.getOpenPositions({
      txid: ['P1', 'P2'],
      docalcs: true,
      consolidation: 'market',
    });

    expect(base.calls[0]).toEqual({
      method: 'privatePost',
      path: '/0/private/OpenPositions',
      body: {
        txid: 'P1,P2',
        docalcs: 'true',
        consolidation: 'market',
      },
    });
  });

  it('getTradeVolume() calls /0/private/TradeVolume', async () => {
    base.setNextReturn({ currency: 'USD', volume: '0.0' });

    await api.getTradeVolume({ pair: ['XBTUSD'] } as any);

    expect(base.calls[0]?.path).toBe('/0/private/TradeVolume');
    // tolerate string or array, but ensure it becomes "XBTUSD" when stringified
    expect(String(base.calls[0]?.body?.pair)).toBe('XBTUSD');
  });

  it('requestExportReport() serializes numeric timestamps', async () => {
    base.setNextReturn({ id: 'EXPORT123' });

    const res = await api.requestExportReport({
      report: 'trades',
      description: 'My export',
      starttm: 1700000000,
      endtm: 1700001111,
    });

    expect(res).toEqual({ id: 'EXPORT123' });
    expect(base.calls[0]).toEqual({
      method: 'privatePost',
      path: '/0/private/AddExport',
      body: {
        report: 'trades',
        description: 'My export',
        starttm: '1700000000',
        endtm: '1700001111',
      },
    });
  });

  it('getExportReportStatus() calls /0/private/ExportStatus with required report', async () => {
    base.setNextReturn([]);

    const res = await api.getExportReportStatus({ report: 'ledgers' });

    expect(res).toEqual([]);
    expect(base.calls[0]).toEqual({
      method: 'privatePost',
      path: '/0/private/ExportStatus',
      body: { report: 'ledgers' },
    });
  });

  it('deleteExportReport() calls /0/private/RemoveExport with id + type', async () => {
    base.setNextReturn({ delete: false, cancel: true });

    const res = await api.deleteExportReport({ id: 'R1', type: 'cancel' });

    expect(res).toEqual({ delete: false, cancel: true });
    expect(base.calls[0]).toEqual({
      method: 'privatePost',
      path: '/0/private/RemoveExport',
      body: { id: 'R1', type: 'cancel' },
    });
  });

  it('retrieveExportReport() uses privatePostBinary and returns raw ArrayBuffer', async () => {
    const buf = new ArrayBuffer(4);
    base.setNextBinary(buf);

    const res = await api.retrieveExportReport({ id: 'EXPORT123' });

    expect(res).toBe(buf);
    expect(base.calls[0]).toEqual({
      method: 'privatePostBinary',
      path: '/0/private/RetrieveExport',
      body: { id: 'EXPORT123' },
    });
  });
});
