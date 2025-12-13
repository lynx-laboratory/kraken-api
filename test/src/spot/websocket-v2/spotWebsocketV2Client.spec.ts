import { describe, it, expect, vi, beforeEach } from 'vitest';

// -----------------------------------------------------------------------------
// Mocks (hoisted)
// -----------------------------------------------------------------------------

vi.mock('../../../../src/base/websocketBase', () => {
  // IMPORTANT: must be constructable (`new`), so use `function`, not arrow.
  const KrakenWebsocketBase = vi.fn(function (this: any, opts: any) {
    // return an object so `new KrakenWebsocketBase()` yields something inspectable
    return { __opts: opts };
  });

  return {
    KrakenWebsocketBase,
    // these are imported as runtime values in spotWebsocketV2Client.ts
    KrakenWebsocketConnectionOptions: {},
    KrakenWebsocketLogger: {},
  };
});

vi.mock('../../../../src/spot/websocket-v2/admin', () => ({
  // Must be constructable because production code does `new KrakenSpotWsAdminApi(...)`
  KrakenSpotWsAdminApi: vi.fn(function (this: any, ws: any) {
    this.__ws = ws;
  }),
}));

vi.mock('../../../../src/spot/websocket-v2/market-data', () => ({
  KrakenSpotWsMarketDataApi: vi.fn(function (this: any, ws: any) {
    this.__ws = ws;
  }),
}));

vi.mock('../../../../src/spot/websocket-v2/user-data', () => ({
  KrakenSpotWsUserDataApi: vi.fn(function (this: any, ws: any) {
    this.__ws = ws;
  }),
}));

vi.mock('../../../../src/spot/websocket-v2/user-trading', () => ({
  KrakenSpotWsUserTradingApi: vi.fn(function (this: any, ws: any) {
    this.__ws = ws;
  }),
}));

// -----------------------------------------------------------------------------
// Imports under test (after mocks)
// -----------------------------------------------------------------------------

import { KrakenSpotWebsocketV2Client } from '../../../../src/spot/websocket-v2/spotWebsocketV2Client';

import { KrakenWebsocketBase } from '../../../../src/base/websocketBase';
import { KrakenSpotWsAdminApi } from '../../../../src/spot/websocket-v2/admin';
import { KrakenSpotWsMarketDataApi } from '../../../../src/spot/websocket-v2/market-data';
import { KrakenSpotWsUserDataApi } from '../../../../src/spot/websocket-v2/user-data';
import { KrakenSpotWsUserTradingApi } from '../../../../src/spot/websocket-v2/user-trading';

describe('spot/websocket-v2/spotWebsocketV2Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('constructs public/private connections with defaults and wires sub-APIs', () => {
    const client = new KrakenSpotWebsocketV2Client();

    const WsBase = KrakenWebsocketBase as unknown as ReturnType<typeof vi.fn>;
    expect(WsBase).toHaveBeenCalledTimes(2);

    const publicArgs = WsBase.mock.calls[0]?.[0];
    const privateArgs = WsBase.mock.calls[1]?.[0];

    expect(publicArgs).toMatchObject({
      url: 'wss://ws.kraken.com/v2',
      authToken: undefined,
    });

    expect(privateArgs).toMatchObject({
      url: 'wss://ws-auth.kraken.com/v2',
      authToken: undefined,
    });

    const AdminApi = KrakenSpotWsAdminApi as unknown as ReturnType<
      typeof vi.fn
    >;
    const MarketApi = KrakenSpotWsMarketDataApi as unknown as ReturnType<
      typeof vi.fn
    >;
    const UserDataApi = KrakenSpotWsUserDataApi as unknown as ReturnType<
      typeof vi.fn
    >;
    const UserTradingApi = KrakenSpotWsUserTradingApi as unknown as ReturnType<
      typeof vi.fn
    >;

    expect(AdminApi).toHaveBeenCalledTimes(1);
    expect(MarketApi).toHaveBeenCalledTimes(1);
    expect(UserDataApi).toHaveBeenCalledTimes(1);
    expect(UserTradingApi).toHaveBeenCalledTimes(1);

    expect(AdminApi).toHaveBeenCalledWith(client.publicConnection);
    expect(MarketApi).toHaveBeenCalledWith(client.publicConnection);
    expect(UserDataApi).toHaveBeenCalledWith(client.privateConnection);
    expect(UserTradingApi).toHaveBeenCalledWith(client.privateConnection);

    expect(client.publicConnection).not.toBe(client.privateConnection);
  });

  it('passes through urls/options and only applies authToken to the private connection', () => {
    const WebSocketImpl = class FakeWs {} as any;
    const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() } as any;

    const client = new KrakenSpotWebsocketV2Client({
      publicUrl: 'wss://example.com/public',
      privateUrl: 'wss://example.com/private',
      authToken: 'AUTH_TOKEN',
      WebSocketImpl,
      autoReconnect: true,
      reconnectDelayMs: 123,
      requestTimeoutMs: 456,
      logger,
    });

    const WsBase = KrakenWebsocketBase as unknown as ReturnType<typeof vi.fn>;
    expect(WsBase).toHaveBeenCalledTimes(2);

    const publicArgs = WsBase.mock.calls[0]?.[0];
    const privateArgs = WsBase.mock.calls[1]?.[0];

    expect(publicArgs).toMatchObject({
      url: 'wss://example.com/public',
      authToken: undefined,
      WebSocketImpl,
      autoReconnect: true,
      reconnectDelayMs: 123,
      requestTimeoutMs: 456,
      logger,
    });

    expect(privateArgs).toMatchObject({
      url: 'wss://example.com/private',
      authToken: 'AUTH_TOKEN',
      WebSocketImpl,
      autoReconnect: true,
      reconnectDelayMs: 123,
      requestTimeoutMs: 456,
      logger,
    });

    const AdminApi = KrakenSpotWsAdminApi as unknown as ReturnType<
      typeof vi.fn
    >;
    const UserTradingApi = KrakenSpotWsUserTradingApi as unknown as ReturnType<
      typeof vi.fn
    >;

    expect(AdminApi).toHaveBeenCalledWith(client.publicConnection);
    expect(UserTradingApi).toHaveBeenCalledWith(client.privateConnection);
  });
});
