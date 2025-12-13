import type { KrakenRestBase } from '../../../base/restBase';

/**
 * Result of GetWebSocketsToken.
 */
export interface KrakenGetWebSocketsTokenResult {
  /**
   * WebSockets token to authenticate private WS subscriptions.
   *
   * Must be used within ~15 minutes of creation, but does not
   * expire as long as a WS connection using it is established
   * and maintained.
   */
  token: string;

  /**
   * Time (in seconds) after which the token expires
   * (if not used to establish a WS connection).
   */
  expires: number;
}

/**
 * POST /0/private/GetWebSocketsToken
 *
 * Request an authentication token for Kraken's WebSockets API.
 *
 * Notes:
 * - `nonce` and signing are handled by KrakenRestBase.
 * - Requires API key permission: "WebSocket interface - On".
 */
export function getWebSocketsToken(
  base: KrakenRestBase,
): Promise<KrakenGetWebSocketsTokenResult> {
  // Body is just nonce; RestBase will inject it.
  return base.privatePost<KrakenGetWebSocketsTokenResult>(
    '/0/private/GetWebSocketsToken',
    {},
  );
}
