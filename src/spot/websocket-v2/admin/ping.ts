import {
  KrakenWebsocketBase,
  KrakenWsMethodResponseEnvelope,
} from '../../../base/websocketBase';

/**
 * Parameters for WS v2 `ping`.
 *
 * NOTE:
 * - Kraken's spec only defines `req_id` at the top level of the message.
 * - `req_id` is handled via KrakenWebsocketBase.request options,
 *   so this params object is intentionally empty.
 */
export interface KrakenWsPingParams {
  // Intentionally empty for now.
  // If Kraken ever adds fields to ping, they can be added here.
}

/**
 * Result payload inside the WS envelope for `ping` → `pong`.
 *
 * Kraken's docs only define optional `warnings` in `result`.
 * Most metadata (success, error, time_in, time_out, etc.) is on the outer
 * {@link KrakenWsPingResponse} envelope.
 */
export interface KrakenWsPingResult {
  /**
   * Advisory messages, e.g. deprecation or behaviour notices.
   */
  warnings?: string[];
}

/**
 * Full WS envelope returned from `ping` (the `pong` message).
 */
export type KrakenWsPingResponse =
  KrakenWsMethodResponseEnvelope<KrakenWsPingResult>;

/**
 * Options for the `ping` wrapper – maps directly to KrakenWebsocketBase.request.
 */
export interface KrakenWsPingOptions {
  /**
   * Optional client-originated request identifier.
   * Will be sent as `req_id` and echoed back in the `pong`.
   */
  reqId?: number;

  /**
   * Optional timeout for this request in milliseconds.
   */
  timeoutMs?: number;

  /**
   * Whether to attach an auth token (if available) to this request.
   *
   * `ping` is defined on the public WS endpoint, so this is typically
   * left as `false` (the default), but the flag is exposed for symmetry.
   */
  attachAuthToken?: boolean;
}

/**
 * Send an application-level ping and await the corresponding `pong`.
 *
 * This is separate from the WebSocket protocol-level ping/pong frames,
 * and is useful as an application-level liveness check (and to measure
 * end-to-end latency).
 *
 * @example
 * ```ts
 * // Simple liveness check
 * const res = await ws.admin.ping();
 * console.log("pong success:", res.success);
 * ```
 *
 * @example
 * ```ts
 * // With reqId and latency measurement
 * const res = await ws.admin.ping();
 * console.log("pong success:", res.success);
 *
 * // With reqId and latency measurement
 * const res2 = await ws.admin.ping({}, { reqId: 42 });
 *
 * if (res2.success && res2.time_in && res2.time_out) {
 * const latencyMs =
 * new Date(res2.time_out).getTime() - new Date(res2.time_in).getTime();
 * console.log("app-level ping latency (ms):", latencyMs);
 * }
 * ```
 */
export async function ping(
  ws: KrakenWebsocketBase,
  params: KrakenWsPingParams = {},
  options: KrakenWsPingOptions = {},
): Promise<KrakenWsPingResponse> {
  return ws.request<KrakenWsPingParams, KrakenWsPingResult>('ping', params, {
    reqId: options.reqId,
    timeoutMs: options.timeoutMs,
    attachAuthToken: options.attachAuthToken,
  });
}
