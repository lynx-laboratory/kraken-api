import type { KrakenRestBase } from '../../../base/restBase';
import * as CreateSubaccount from './createSubaccount';
import * as AccountTransfer from './accountTransfer';

/**
 * Kraken Spot Subaccounts API.
 *
 * Covers creation and management of trading subaccounts.
 */
export class KrakenSpotSubaccountsApi {
  constructor(private readonly base: KrakenRestBase) {}

  /**
   * Create a trading subaccount.
   *
   * Note: must be called using an API key from the master account.
   *
   * @example
   * ```ts
   * const sub = await kraken.subaccounts.createSubaccount({
   *   username: "my-sub-user",
   *   email: "subuser@example.com",
   * });
   *
   * console.log("subaccount created:", sub);
   * ```
   */
  createSubaccount(params: CreateSubaccount.KrakenCreateSubaccountParams) {
    return CreateSubaccount.createSubaccount(this.base, params);
  }

  /**
   * Transfer funds between master and subaccounts.
   *
   * Note: must be called using an API key from the master account.
   *
   * @example
   * ```ts
   * const res = await kraken.subaccounts.accountTransfer({
   *   asset: "USDT",
   *   amount: "50",
   *   from: "IIBAN-MASTER",
   *   to: "IIBAN-SUB-1",
   * });
   *
   * console.log(res.transfer_id, res.status);
   * ```
   */
  accountTransfer(params: AccountTransfer.KrakenAccountTransferParams) {
    return AccountTransfer.accountTransfer(this.base, params);
  }
}

// Re-export types for consumers
export type KrakenCreateSubaccountParams =
  CreateSubaccount.KrakenCreateSubaccountParams;
export type KrakenCreateSubaccountResult =
  CreateSubaccount.KrakenCreateSubaccountResult;

export type KrakenAccountTransferParams =
  AccountTransfer.KrakenAccountTransferParams;
export type KrakenAccountTransferResult =
  AccountTransfer.KrakenAccountTransferResult;
