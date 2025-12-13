import type { KrakenRestBase } from '../../../base/restBase';

/**
 * Parameters for GetDepositAddresses.
 */
export interface KrakenGetDepositAddressesParams {
  asset: string;
  aclass?: 'currency' | 'tokenized_asset';
  method: string;
  new?: boolean;
  amount?: string | number;
}

/**
 * Single deposit address entry.
 */
export interface KrakenDepositAddress {
  address: string;
  expiretm: string;
  new: boolean;
  tag?: string;
}

/**
 * Result payload for GetDepositAddresses.
 *
 * KrakenRestBase.privatePost unwraps { error, result } and returns `result`,
 * so this endpoint returns the array directly.
 */
export type KrakenGetDepositAddressesResult = KrakenDepositAddress[];

/**
 * POST /0/private/DepositAddresses
 *
 * Retrieve (or generate) deposit addresses for a given asset
 * and deposit method.
 */
export function getDepositAddresses(
  base: KrakenRestBase,
  params: KrakenGetDepositAddressesParams,
): Promise<KrakenGetDepositAddressesResult> {
  const body: Record<string, string> = {
    asset: params.asset,
    method: params.method,
  };

  if (params.aclass !== undefined) {
    body.aclass = params.aclass;
  }

  if (params.new !== undefined) {
    body.new = params.new ? 'true' : 'false';
  }

  if (params.amount !== undefined) {
    body.amount = String(params.amount);
  }

  return base.privatePost<KrakenGetDepositAddressesResult>(
    '/0/private/DepositAddresses',
    body,
  );
}
