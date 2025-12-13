import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { KrakenWebsocketBase } from '../../../../../src/base/websocketBase';

vi.mock('../../../../../src/spot/websocket-v2/user-data/executions', () => ({
  subscribeExecutions: vi.fn(),
  unsubscribeExecutions: vi.fn(),
}));

vi.mock('../../../../../src/spot/websocket-v2/user-data/balances', () => ({
  subscribeBalances: vi.fn(),
  unsubscribeBalances: vi.fn(),
}));

describe('spot/websocket-v2/user-data/index', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('subscribeExecutions delegates to Executions.subscribeExecutions(ws, params, options)', async () => {
    const ws = {} as KrakenWebsocketBase;

    const Executions =
      await import('../../../../../src/spot/websocket-v2/user-data/executions');
    const { KrakenSpotWsUserDataApi } =
      await import('../../../../../src/spot/websocket-v2/user-data');

    const mocked = { method: 'subscribe', success: true };
    (Executions.subscribeExecutions as any).mockResolvedValue(mocked);

    const api = new KrakenSpotWsUserDataApi(ws);

    const params = { snap_trades: true, snap_orders: true, order_status: true };
    const options = { reqId: 123 };

    const res = await api.subscribeExecutions(params as any, options as any);

    expect(Executions.subscribeExecutions).toHaveBeenCalledTimes(1);
    expect(Executions.subscribeExecutions).toHaveBeenCalledWith(
      ws,
      params,
      options,
    );
    expect(res).toBe(mocked);
  });

  it('unsubscribeExecutions delegates to Executions.unsubscribeExecutions(ws, params ?? {}, options)', async () => {
    const ws = {} as KrakenWebsocketBase;

    const Executions =
      await import('../../../../../src/spot/websocket-v2/user-data/executions');
    const { KrakenSpotWsUserDataApi } =
      await import('../../../../../src/spot/websocket-v2/user-data');

    const mocked = { method: 'unsubscribe', success: true };
    (Executions.unsubscribeExecutions as any).mockResolvedValue(mocked);

    const api = new KrakenSpotWsUserDataApi(ws);

    // When params omitted, wrapper passes {}
    const options = { reqId: 124 };

    const res = await api.unsubscribeExecutions(undefined, options as any);

    expect(Executions.unsubscribeExecutions).toHaveBeenCalledTimes(1);
    expect(Executions.unsubscribeExecutions).toHaveBeenCalledWith(
      ws,
      {},
      options,
    );
    expect(res).toBe(mocked);
  });

  it('unsubscribeExecutions forwards explicit params object', async () => {
    const ws = {} as KrakenWebsocketBase;

    const Executions =
      await import('../../../../../src/spot/websocket-v2/user-data/executions');
    const { KrakenSpotWsUserDataApi } =
      await import('../../../../../src/spot/websocket-v2/user-data');

    const mocked = { method: 'unsubscribe', success: true };
    (Executions.unsubscribeExecutions as any).mockResolvedValue(mocked);

    const api = new KrakenSpotWsUserDataApi(ws);

    const params = { token: 'token-xyz' };
    const options = { reqId: 125 };

    const res = await api.unsubscribeExecutions(params as any, options as any);

    expect(Executions.unsubscribeExecutions).toHaveBeenCalledTimes(1);
    expect(Executions.unsubscribeExecutions).toHaveBeenCalledWith(
      ws,
      params,
      options,
    );
    expect(res).toBe(mocked);
  });

  it('subscribeBalances delegates to Balances.subscribeBalances(ws, params, options)', async () => {
    const ws = {} as KrakenWebsocketBase;

    const Balances =
      await import('../../../../../src/spot/websocket-v2/user-data/balances');
    const { KrakenSpotWsUserDataApi } =
      await import('../../../../../src/spot/websocket-v2/user-data');

    const mocked = { method: 'subscribe', success: true };
    (Balances.subscribeBalances as any).mockResolvedValue(mocked);

    const api = new KrakenSpotWsUserDataApi(ws);

    const params = { snapshot: true };
    const options = { reqId: 200 };

    const res = await api.subscribeBalances(params as any, options as any);

    expect(Balances.subscribeBalances).toHaveBeenCalledTimes(1);
    expect(Balances.subscribeBalances).toHaveBeenCalledWith(
      ws,
      params,
      options,
    );
    expect(res).toBe(mocked);
  });

  it('subscribeBalances supports default params (empty object)', async () => {
    const ws = {} as KrakenWebsocketBase;

    const Balances =
      await import('../../../../../src/spot/websocket-v2/user-data/balances');
    const { KrakenSpotWsUserDataApi } =
      await import('../../../../../src/spot/websocket-v2/user-data');

    const mocked = { method: 'subscribe', success: true };
    (Balances.subscribeBalances as any).mockResolvedValue(mocked);

    const api = new KrakenSpotWsUserDataApi(ws);

    const options = { reqId: 201 };

    const res = await api.subscribeBalances(undefined as any, options as any);

    // NOTE: your method signature defaults params = {}, so passing undefined
    // still results in {} being passed to subscribeBalances
    expect(Balances.subscribeBalances).toHaveBeenCalledTimes(1);
    expect(Balances.subscribeBalances).toHaveBeenCalledWith(ws, {}, options);
    expect(res).toBe(mocked);
  });

  it('unsubscribeBalances delegates to Balances.unsubscribeBalances(ws, params ?? {}, options)', async () => {
    const ws = {} as KrakenWebsocketBase;

    const Balances =
      await import('../../../../../src/spot/websocket-v2/user-data/balances');
    const { KrakenSpotWsUserDataApi } =
      await import('../../../../../src/spot/websocket-v2/user-data');

    const mocked = { method: 'unsubscribe', success: true };
    (Balances.unsubscribeBalances as any).mockResolvedValue(mocked);

    const api = new KrakenSpotWsUserDataApi(ws);

    const options = { reqId: 202 };

    const res = await api.unsubscribeBalances(undefined, options as any);

    expect(Balances.unsubscribeBalances).toHaveBeenCalledTimes(1);
    expect(Balances.unsubscribeBalances).toHaveBeenCalledWith(ws, {}, options);
    expect(res).toBe(mocked);
  });

  it('unsubscribeBalances forwards explicit params object', async () => {
    const ws = {} as KrakenWebsocketBase;

    const Balances =
      await import('../../../../../src/spot/websocket-v2/user-data/balances');
    const { KrakenSpotWsUserDataApi } =
      await import('../../../../../src/spot/websocket-v2/user-data');

    const mocked = { method: 'unsubscribe', success: true };
    (Balances.unsubscribeBalances as any).mockResolvedValue(mocked);

    const api = new KrakenSpotWsUserDataApi(ws);

    const params = { token: 'token-abc' };
    const options = { reqId: 203 };

    const res = await api.unsubscribeBalances(params as any, options as any);

    expect(Balances.unsubscribeBalances).toHaveBeenCalledTimes(1);
    expect(Balances.unsubscribeBalances).toHaveBeenCalledWith(
      ws,
      params,
      options,
    );
    expect(res).toBe(mocked);
  });
});
