import type { KrakenWebsocketBase } from '../../../base/websocketBase';

/**
 * Kraken Spot WebSocket v2 – Status channel (admin).
 *
 * This channel is special:
 * - You do NOT subscribe to it (no subscribe/unsubscribe flow).
 * - Kraken automatically sends a status message on successful connection
 *   and whenever the trading engine status changes.
 *
 * We model:
 * - The message types
 * - A small helper (`onStatus`) that listens for `channel === "status"`.
 */

/**
 * Overall trading engine state.
 *
 * - "online"       – markets operating normally, all order types allowed.
 * - "maintenance"  – markets offline for maintenance, no new orders/cancels.
 * - "cancel_only"  – only cancellations allowed, no new orders, no matching.
 * - "post_only"    – only post-only limit orders + cancels, no matching.
 */
export type KrakenWsStatusSystemState =
  | 'online'
  | 'cancel_only'
  | 'maintenance'
  | 'post_only';

/**
 * Payload element of the status channel.
 *
 * Kraken guarantees there is exactly one element in the `data` array.
 */
export interface KrakenWsStatusData {
  /**
   * Trading engine state.
   */
  system: KrakenWsStatusSystemState;

  /**
   * WebSocket API version, always "v2" for this client.
   */
  api_version: 'v2';

  /**
   * Unique connection identifier (useful for debugging).
   */
  connection_id: number;

  /**
   * Version string of the WebSocket service.
   */
  version: string;
}

/**
 * Single message on the `status` channel.
 *
 * Example shape:
 * ```json
 * {
 *   "channel": "status",
 *   "type": "update",
 *   "data": [
 *     {
 *       "system": "online",
 *       "api_version": "v2",
 *       "connection_id": 123456,
 *       "version": "2.0.0"
 *     }
 *   ]
 * }
 * ```
 */
export interface KrakenWsStatusUpdateMessage {
  channel: 'status';
  type: 'update';
  data: KrakenWsStatusData[];
}

/**
 * Handler for status updates.
 */
export type KrakenWsStatusHandler = (msg: KrakenWsStatusUpdateMessage) => void;

/**
 * Attach a handler for status updates.
 *
 * This uses the low-level `addMessageHandler` on KrakenWebsocketBase
 * and filters for `channel === "status"` and `type === "update"`.
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
export function onStatus(
  ws: KrakenWebsocketBase,
  handler: KrakenWsStatusHandler,
): () => void {
  return ws.addMessageHandler((raw) => {
    if (!raw || typeof raw !== 'object') return;

    const msg = raw as Partial<KrakenWsStatusUpdateMessage>;

    if (
      msg.channel === 'status' &&
      msg.type === 'update' &&
      Array.isArray(msg.data)
    ) {
      handler(msg as KrakenWsStatusUpdateMessage);
    }
  });
}
