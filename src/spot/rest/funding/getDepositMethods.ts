import type { KrakenRestBase } from '../../../base/restBase';

/**
 * Parameters for GetDepositMethods.
 */
export interface KrakenGetDepositMethodsParams {
  asset: string;
  aclass?: 'currency' | 'tokenized_asset';
  rebase_multiplier?: 'rebased' | 'base';
}

/**
 * Single deposit method entry.
 *
 * Note: some keys use hyphens as in Kraken's API response
 * and must be accessed with bracket notation.
 */
export interface KrakenDepositMethod {
  method: string;
  limit: string | boolean;
  fee: string;
  'address-setup-fee': string;
  'gen-address': boolean;
  minimum: string;
}

/**
 * KrakenRestBase.privatePost unwraps { error, result } and returns `result`,
 * so this endpoint returns the array directly.
 */
export type KrakenGetDepositMethodsResult = KrakenDepositMethod[];

/**
 * POST /0/private/DepositMethods
 */
export function getDepositMethods(
  base: KrakenRestBase,
  params: KrakenGetDepositMethodsParams,
): Promise<KrakenGetDepositMethodsResult> {
  const body: Record<string, string> = {
    asset: params.asset,
  };

  if (params.aclass !== undefined) {
    body.aclass = params.aclass;
  }

  if (params.rebase_multiplier !== undefined) {
    body.rebase_multiplier = params.rebase_multiplier;
  }

  return base.privatePost<KrakenGetDepositMethodsResult>(
    '/0/private/DepositMethods',
    body,
  );
}
