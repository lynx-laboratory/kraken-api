import type { KrakenRestBase } from '../../../base/restBase';

export type KrakenRebaseMultiplier = 'rebased' | 'base';

export interface KrakenGetDepositStatusParams {
  asset?: string;
  aclass?: 'currency' | 'tokenized_asset';
  method?: string;
  start?: number | string;
  end?: number | string;

  /**
   * Cursor token returned from a previous response.
   * (Kraken uses this for pagination.)
   */
  cursor?: string;

  limit?: number;
  rebase_multiplier?: KrakenRebaseMultiplier;
}

export interface KrakenDepositStatusEntry {
  method: string;
  aclass: string;
  asset: string;
  refid: string;
  txid: string;
  info: string;
  amount: string;
  fee: string;
  time: number;
  status: string;
  'status-prop'?: 'return' | 'onhold';
  originators?: string[];
}

/**
 * POST /0/private/DepositStatus
 *
 * Retrieve information about recent deposits.
 */
export function getDepositStatus(
  base: KrakenRestBase,
  params: KrakenGetDepositStatusParams = {},
): Promise<KrakenDepositStatusEntry[]> {
  const body: Record<string, string> = {};

  if (params.asset) body.asset = params.asset;
  if (params.aclass) body.aclass = params.aclass;
  if (params.method) body.method = params.method;

  if (params.start !== undefined) body.start = String(params.start);
  if (params.end !== undefined) body.end = String(params.end);

  if (params.cursor) body.cursor = params.cursor;

  if (params.limit !== undefined) body.limit = String(params.limit);

  if (params.rebase_multiplier) {
    body.rebase_multiplier = params.rebase_multiplier;
  }

  return base.privatePost<KrakenDepositStatusEntry[]>(
    '/0/private/DepositStatus',
    body,
  );
}
