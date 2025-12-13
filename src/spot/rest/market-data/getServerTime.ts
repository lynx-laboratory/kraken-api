// kraken/spot/rest/market-data/getServerTime.ts
import type { KrakenRestBase } from '../../../base/restBase';

export interface KrakenServerTime {
  unixtime: number; // Unix timestamp
  rfc1123: string; // RFC 1123 time format
}

/**
 * GET /0/public/Time
 * Get the server's time.
 */
export function getServerTime(base: KrakenRestBase): Promise<KrakenServerTime> {
  // publicGet<T> will:
  // - call GET https://api.kraken.com/0/public/Time
  // - parse JSON as { error: string[]; result: T }
  // - throw KrakenApiError if error[].length > 0
  // - return result (i.e. KrakenServerTime)
  return base.publicGet<KrakenServerTime>('/0/public/Time');
}
