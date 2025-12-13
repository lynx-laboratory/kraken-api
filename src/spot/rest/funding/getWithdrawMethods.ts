import type { KrakenRestBase } from '../../../base/restBase';
import type { KrakenRebaseMultiplier } from './getDepositStatus';

export interface KrakenGetWithdrawMethodsParams {
  asset: string;
  aclass?: 'currency' | 'tokenized_asset';
  network?: string;
  rebase_multiplier?: KrakenRebaseMultiplier;
}

export interface KrakenWithdrawMethod {
  asset: string;
  method: string;
  network: string;
  minimum: string;
}

export type KrakenGetWithdrawMethodsResult = KrakenWithdrawMethod[];

/**
 * POST /0/private/WithdrawMethods
 */
export function getWithdrawMethods(
  base: KrakenRestBase,
  params: KrakenGetWithdrawMethodsParams,
): Promise<KrakenGetWithdrawMethodsResult> {
  const body: Record<string, string> = {
    asset: params.asset,
  };

  if (params.aclass) body.aclass = params.aclass;
  if (params.network) body.network = params.network;
  if (params.rebase_multiplier)
    body.rebase_multiplier = params.rebase_multiplier;

  return base.privatePost<KrakenGetWithdrawMethodsResult>(
    '/0/private/WithdrawMethods',
    body,
  );
}
