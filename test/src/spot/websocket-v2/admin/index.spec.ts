import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { KrakenWebsocketBase } from '../../../../../src/base/websocketBase';

// Mock sibling modules that admin/index.ts imports.
vi.mock('../../../../../src/spot/websocket-v2/admin/ping', () => ({
  ping: vi.fn(),
}));

vi.mock('../../../../../src/spot/websocket-v2/admin/status', () => ({
  onStatus: vi.fn(),
}));

vi.mock('../../../../../src/spot/websocket-v2/admin/heartbeat', () => ({
  onHeartbeat: vi.fn(),
}));

describe('spot/websocket-v2/admin/index', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ping() delegates to Ping.ping(ws, params, options)', async () => {
    const ws = {} as KrakenWebsocketBase;

    const Ping =
      await import('../../../../../src/spot/websocket-v2/admin/ping');
    const { KrakenSpotWsAdminApi } =
      await import('../../../../../src/spot/websocket-v2/admin');

    const mocked = { method: 'ping', success: true, result: {} };
    (Ping.ping as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      mocked,
    );

    const api = new KrakenSpotWsAdminApi(ws);

    const params = {};
    const options = { reqId: 123, timeoutMs: 5000, attachAuthToken: false };

    const res = await api.ping(params, options);

    expect(Ping.ping).toHaveBeenCalledTimes(1);
    expect(Ping.ping).toHaveBeenCalledWith(ws, params, options);
    expect(res).toBe(mocked);
  });

  it('onStatus() delegates to Status.onStatus(ws, handler)', async () => {
    const ws = {} as KrakenWebsocketBase;

    const Status =
      await import('../../../../../src/spot/websocket-v2/admin/status');
    const { KrakenSpotWsAdminApi } =
      await import('../../../../../src/spot/websocket-v2/admin');

    const unsubscribe = vi.fn();
    (Status.onStatus as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      unsubscribe,
    );

    const api = new KrakenSpotWsAdminApi(ws);

    const handler = vi.fn();
    const res = api.onStatus(handler as any);

    expect(Status.onStatus).toHaveBeenCalledTimes(1);
    expect(Status.onStatus).toHaveBeenCalledWith(ws, handler);
    expect(res).toBe(unsubscribe);
  });

  it('onHeartbeat() delegates to Heartbeat.onHeartbeat(ws, handler)', async () => {
    const ws = {} as KrakenWebsocketBase;

    const Heartbeat =
      await import('../../../../../src/spot/websocket-v2/admin/heartbeat');
    const { KrakenSpotWsAdminApi } =
      await import('../../../../../src/spot/websocket-v2/admin');

    const unsubscribe = vi.fn();
    (
      Heartbeat.onHeartbeat as unknown as ReturnType<typeof vi.fn>
    ).mockReturnValue(unsubscribe);

    const api = new KrakenSpotWsAdminApi(ws);

    const handler = vi.fn();
    const res = api.onHeartbeat(handler as any);

    expect(Heartbeat.onHeartbeat).toHaveBeenCalledTimes(1);
    expect(Heartbeat.onHeartbeat).toHaveBeenCalledWith(ws, handler);
    expect(res).toBe(unsubscribe);
  });
});
