import type { KrakenRestBase } from '../../../base/restBase';

export interface KrakenGetWithdrawInfoParams {
  asset: string;
  key: string;
  amount: string | number;
}

export interface KrakenWithdrawInfo {
  method: string;
  limit: string;
  amount: string;
  fee: string;
}

export type KrakenGetWithdrawInfoResult = KrakenWithdrawInfo;

/**
 * POST /0/private/WithdrawInfo
 */
export function getWithdrawInfo(
  base: KrakenRestBase,
  params: KrakenGetWithdrawInfoParams,
): Promise<KrakenGetWithdrawInfoResult> {
  const body: Record<string, string> = {
    asset: params.asset,
    key: params.key,
    amount: String(params.amount),
  };

  return base.privatePost<KrakenGetWithdrawInfoResult>(
    '/0/private/WithdrawInfo',
    body,
  );
}
