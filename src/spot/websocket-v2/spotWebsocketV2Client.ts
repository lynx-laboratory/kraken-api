import {
  KrakenWebsocketBase,
  KrakenWebsocketConnectionOptions,
  KrakenWebsocketLogger,
} from '../../base/websocketBase';
import { KrakenSpotWsAdminApi } from './admin';
import { KrakenSpotWsMarketDataApi } from './market-data';
import { KrakenSpotWsUserDataApi } from './user-data';
import { KrakenSpotWsUserTradingApi } from './user-trading';

export interface KrakenSpotWebsocketClientOptions {
  publicUrl?: string;
  privateUrl?: string;
  authToken?: string;

  WebSocketImpl?: KrakenWebsocketConnectionOptions['WebSocketImpl'];
  autoReconnect?: boolean;
  reconnectDelayMs?: number;
  requestTimeoutMs?: number;

  logger?: KrakenWebsocketLogger;
}

/**
 * Top-level Spot Websocket v2 client.
 */
export class KrakenSpotWebsocketV2Client {
  readonly publicConnection: KrakenWebsocketBase;
  readonly privateConnection: KrakenWebsocketBase;

  readonly admin: KrakenSpotWsAdminApi;
  readonly marketData: KrakenSpotWsMarketDataApi;
  readonly userData: KrakenSpotWsUserDataApi;
  readonly userTrading: KrakenSpotWsUserTradingApi;

  constructor(options: KrakenSpotWebsocketClientOptions = {}) {
    const {
      publicUrl = 'wss://ws.kraken.com/v2',
      privateUrl = 'wss://ws-auth.kraken.com/v2',
      authToken,
      WebSocketImpl,
      autoReconnect,
      reconnectDelayMs,
      requestTimeoutMs,
      logger,
    } = options;

    const baseOpts: Omit<KrakenWebsocketConnectionOptions, 'url'> = {
      authToken: undefined,
      WebSocketImpl,
      autoReconnect,
      reconnectDelayMs,
      requestTimeoutMs,
      logger,
    };

    this.publicConnection = new KrakenWebsocketBase({
      ...baseOpts,
      url: publicUrl,
    });

    this.privateConnection = new KrakenWebsocketBase({
      ...baseOpts,
      url: privateUrl,
      authToken,
    });

    this.admin = new KrakenSpotWsAdminApi(this.publicConnection);
    this.marketData = new KrakenSpotWsMarketDataApi(this.publicConnection);
    this.userData = new KrakenSpotWsUserDataApi(this.privateConnection);
    this.userTrading = new KrakenSpotWsUserTradingApi(this.privateConnection);
  }
}
