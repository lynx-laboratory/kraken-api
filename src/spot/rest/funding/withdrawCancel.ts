import type { KrakenRestBase } from '../../../base/restBase';

export interface KrakenWithdrawCancelParams {
  asset: string;
  refid: string;
}

export type KrakenWithdrawCancelResult = boolean;

/**
 * POST /0/private/WithdrawCancel
 */
export function withdrawCancel(
  base: KrakenRestBase,
  params: KrakenWithdrawCancelParams,
): Promise<KrakenWithdrawCancelResult> {
  const { asset, refid } = params;

  const body: Record<string, string> = {
    asset,
    refid,
  };

  return base.privatePost<KrakenWithdrawCancelResult>(
    '/0/private/WithdrawCancel',
    body,
  );
}
