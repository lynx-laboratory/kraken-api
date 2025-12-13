import type { KrakenRestBase } from '../../../base/restBase';

export type KrakenAccountTransferAssetClass = 'currency' | 'tokenized_asset';

export interface KrakenAccountTransferParams {
  /**
   * Asset being transferred (e.g. "USDT", "XBT").
   */
  asset: string;

  /**
   * Specify the asset class of the asset being transferred.
   * Defaults to "currency" on Kraken if omitted.
   */
  asset_class?: KrakenAccountTransferAssetClass;

  /**
   * Amount of asset to transfer.
   * Will be sent to Kraken as a string.
   */
  amount: string | number;

  /**
   * IIBAN of the source account.
   */
  from: string;

  /**
   * IIBAN of the destination account.
   */
  to: string;
}

export interface KrakenAccountTransferResult {
  /**
   * Transfer ID.
   */
  transfer_id: string;

  /**
   * Transfer status: "pending" or "complete".
   */
  status: 'pending' | 'complete';
}

/**
 * Transfer funds to and from master and subaccounts.
 *
 * Note: AccountTransfer must be called using an API key from
 * the master account.
 *
 * Kraken docs: POST /0/private/AccountTransfer
 */
export async function accountTransfer(
  base: KrakenRestBase,
  params: KrakenAccountTransferParams,
): Promise<KrakenAccountTransferResult> {
  const { asset, asset_class, amount, from, to } = params;

  const body: Record<string, string | number | boolean> = {
    asset,
    amount: String(amount),
    from,
    to,
  };

  if (asset_class) {
    body.asset_class = asset_class;
  }

  return base.privatePost<KrakenAccountTransferResult>(
    '/0/private/AccountTransfer',
    body as any, // remove this if privatePost already accepts the union type
  );
}
