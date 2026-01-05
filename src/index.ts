export * from './types/types';

export * from './spot/rest/spotRestClient';
export * from './spot/websocket-v2/spotWebsocketV2Client';

// Rest Export types for consumers
export * from './spot/rest/market-data';
export * from './spot/rest/account-data';
export * from './spot/rest/account-data';
export * from './spot/rest/funding';
export * from './spot/rest/subaccounts';
export * from './spot/rest/earn';
export * from './spot/rest/transparency';
export * from './spot/rest/trading';

// Advanced WS integration surface (optional but useful)
export { KrakenWebsocketBase } from './base/websocketBase';
export type {
  KrakenWebSocketLike,
  KrakenWebSocketLikeCtor,
  KrakenWebsocketLogger,
  KrakenWebsocketConnectionOptions,
  KrakenWsMethodResponseEnvelope,
  KrakenWsMessageHandler,
} from './base/websocketBase';

// WS v2 channel types (so examples can import from package root)
export type * from './spot/websocket-v2/admin';
export type * from './spot/websocket-v2/market-data';
export type * from './spot/websocket-v2/user-data';
export type * from './spot/websocket-v2/user-trading';

export * from './bulk/bulkClient';
