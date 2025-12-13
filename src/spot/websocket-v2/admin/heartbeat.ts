import type { KrakenWebsocketBase } from '../../../base/websocketBase';

/**
 * Kraken Spot WebSocket v2 – Heartbeat message.
 *
 * Heartbeats are sent automatically about once per second when there are
 * no other channel updates. There is no subscribe/unsubscribe: they’re
 * emitted globally once you’re subscribed to any channel.
 */
export interface KrakenWsHeartbeatMessage {
  /**
   * Channel name – "heartbeat" is the only reliable indicator.
   * The payload intentionally has no other fields per Kraken docs.
   */
  channel: 'heartbeat';

  // Kraken might add fields in the future; keep this open.
  [key: string]: unknown;
}

/**
 * Handler signature for heartbeat messages.
 */
export type KrakenWsHeartbeatHandler = (msg: KrakenWsHeartbeatMessage) => void;

/**
 * Register a handler for heartbeat messages.
 *
 * Internally this uses `KrakenWebsocketBase.addMessageHandler` and simply
 * filters on `channel === "heartbeat"`.
 *
 * Returns an unsubscribe function that removes this specific handler.
 *
 * @example
 * ```ts
 * // Track last-seen heartbeat
 * let lastHeartbeat = 0;
 *
 * const unsubscribe = onHeartbeat(ws, () => {
 *   lastHeartbeat = Date.now();
 * });
 *
 * setInterval(() => {
 *   if (Date.now() - lastHeartbeat > 5_000) {
 *     console.warn('No heartbeat in > 5s, connection might be stale');
 *   }
 * }, 1_000);
 * ```
 */
export function onHeartbeat(
  ws: KrakenWebsocketBase,
  handler: KrakenWsHeartbeatHandler,
): () => void {
  return ws.addMessageHandler((msg) => {
    if (!msg || typeof msg !== 'object') return;
    const anyMsg = msg as { channel?: unknown };

    if (anyMsg.channel === 'heartbeat') {
      handler(anyMsg as KrakenWsHeartbeatMessage);
    }
  });
}
