import type { KrakenRestBase } from '../../../base/restBase';
import type { KrakenRebaseMultiplier } from './getDepositStatus';

export interface KrakenWithdrawFundsParams {
  asset: string;
  aclass?: 'currency' | 'tokenized_asset';
  key: string;
  address?: string;
  amount: string | number;
  max_fee?: string | number;
  rebase_multiplier?: KrakenRebaseMultiplier;
}

export interface KrakenWithdrawFundsResult {
  refid: string;
}

export type KrakenWithdrawFundsResponse = KrakenWithdrawFundsResult;

/**
 * POST /0/private/Withdraw
 */
export function withdrawFunds(
  base: KrakenRestBase,
  params: KrakenWithdrawFundsParams,
): Promise<KrakenWithdrawFundsResponse> {
  const { asset, aclass, key, address, amount, max_fee, rebase_multiplier } =
    params;

  const body: Record<string, string> = {
    asset,
    key,
    amount: String(amount),
  };

  if (aclass) body.aclass = aclass;
  if (address) body.address = address;
  if (max_fee !== undefined) body.max_fee = String(max_fee);
  if (rebase_multiplier) body.rebase_multiplier = rebase_multiplier;

  return base.privatePost<KrakenWithdrawFundsResponse>(
    '/0/private/Withdraw',
    body,
  );
}
