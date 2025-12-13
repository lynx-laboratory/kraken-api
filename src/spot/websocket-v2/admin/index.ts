import type { KrakenWebsocketBase } from '../../../base/websocketBase';
import * as Status from './status';
import * as Ping from './ping';
import * as Heartbeat from './heartbeat';

/**
 * Kraken Spot WebSocket v2 – Admin / service utilities.
 *
 * Covers:
 * - status: engine / API status stream
 * - ping: application-level ping/pong
 * - heartbeat: low-level liveness ticks
 */
export class KrakenSpotWsAdminApi {
  constructor(private readonly ws: KrakenWebsocketBase) {}

  /**
   * Application-level ping → pong.
   *
   * @example
   * ```ts
   * const res = await client.admin.ping({}, { reqId: 123 });
   * console.log('pong?', res.success, res.time_out);
   * ```
   */
  ping(
    params: Ping.KrakenWsPingParams = {},
    options: Ping.KrakenWsPingOptions = {},
  ) {
    return Ping.ping(this.ws, params, options);
  }

  /**
   * Subscribe to engine status updates.
   *
   * Returns an unsubscribe function.
   *
   * @example
   * ```ts
   * const unsubscribe = client.admin.onStatus((msg) => {
   *   console.log('Engine status:', msg.data[0].system);
   * });
   * ```
   */
  onStatus(handler: Status.KrakenWsStatusHandler) {
    return Status.onStatus(this.ws, handler);
  }

  /**
   * Subscribe to heartbeat messages.
   *
   * Returns an unsubscribe function.
   *
   * @example
   * ```ts
   * client.admin.onHeartbeat(() => {
   *   console.log('Got heartbeat');
   * });
   * ```
   */
  onHeartbeat(handler: Heartbeat.KrakenWsHeartbeatHandler) {
    return Heartbeat.onHeartbeat(this.ws, handler);
  }
}

// Re-export types for consumers
export type KrakenWsPingParams = Ping.KrakenWsPingParams;
export type KrakenWsPingResult = Ping.KrakenWsPingResult;
export type KrakenWsPingResponse = Ping.KrakenWsPingResponse;

export type KrakenWsStatusUpdateMessage = Status.KrakenWsStatusUpdateMessage;
export type KrakenWsStatusData = Status.KrakenWsStatusData;

export type KrakenWsHeartbeatMessage = Heartbeat.KrakenWsHeartbeatMessage;
export type KrakenWsHeartbeatHandler = Heartbeat.KrakenWsHeartbeatHandler;
