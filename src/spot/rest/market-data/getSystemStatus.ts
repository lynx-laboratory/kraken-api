// kraken/spot/rest/market-data/getSystemStatus.ts
import type { KrakenRestBase } from '../../../base/restBase';

export type KrakenSystemStatus =
  | 'online'
  | 'maintenance'
  | 'cancel_only'
  | 'post_only';

export interface KrakenSystemStatusResult {
  status: KrakenSystemStatus;
  /**
   * Current timestamp in RFC3339 format
   * e.g. "2025-12-10T04:18:32Z"
   */
  timestamp: string;
}

/**
 * GET /0/public/SystemStatus
 * Get the current system status or trading mode.
 */
export function getSystemStatus(
  base: KrakenRestBase,
): Promise<KrakenSystemStatusResult> {
  return base.publicGet<KrakenSystemStatusResult>('/0/public/SystemStatus');
}
