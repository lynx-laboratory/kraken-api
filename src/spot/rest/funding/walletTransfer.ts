import type { KrakenRestBase } from '../../../base/restBase';

export type KrakenWalletTransferSource = 'Spot Wallet';
export type KrakenWalletTransferDestination = 'Futures Wallet';

export interface KrakenWalletTransferParams {
  asset: string;
  from: KrakenWalletTransferSource;
  to: KrakenWalletTransferDestination;
  amount: string | number;
}

export interface KrakenWalletTransferResult {
  refid: string;
}

/**
 * POST /0/private/WalletTransfer
 */
export function walletTransfer(
  base: KrakenRestBase,
  params: KrakenWalletTransferParams,
): Promise<KrakenWalletTransferResult> {
  const { asset, from, to, amount } = params;

  const body: Record<string, string> = {
    asset,
    from,
    to,
    amount: String(amount),
  };

  return base.privatePost<KrakenWalletTransferResult>(
    '/0/private/WalletTransfer',
    body,
  );
}
