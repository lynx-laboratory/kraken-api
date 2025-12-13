import type { KrakenRestBase } from '../../../base/restBase';

export interface KrakenGetWithdrawAddressesParams {
  asset: string;
  aclass?: 'currency' | 'tokenized_asset';
  method?: string;
  key?: string;
  verified?: boolean;
}

export interface KrakenWithdrawAddress {
  address: string;
  asset: string;
  method: string;
  key: string;
  tag?: string;
  verified: boolean;
}

export type KrakenGetWithdrawAddressesResult = KrakenWithdrawAddress[];

/**
 * POST /0/private/WithdrawAddresses
 */
export function getWithdrawAddresses(
  base: KrakenRestBase,
  params: KrakenGetWithdrawAddressesParams,
): Promise<KrakenGetWithdrawAddressesResult> {
  const body: Record<string, string> = {
    asset: params.asset,
  };

  if (params.aclass) body.aclass = params.aclass;
  if (params.method) body.method = params.method;
  if (params.key) body.key = params.key;
  if (params.verified !== undefined) {
    body.verified = params.verified ? 'true' : 'false';
  }

  return base.privatePost<KrakenGetWithdrawAddressesResult>(
    '/0/private/WithdrawAddresses',
    body,
  );
}
