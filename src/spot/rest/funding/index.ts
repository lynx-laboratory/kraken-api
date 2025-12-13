import type { KrakenRestBase } from '../../../base/restBase';
import * as GetDepositMethods from './getDepositMethods';
import * as GetDepositAddresses from './getDepositAddresses';
import * as GetDepositStatus from './getDepositStatus';
import * as GetWithdrawMethods from './getWithdrawMethods';
import * as GetWithdrawAddresses from './getWithdrawAddresses';
import * as GetWithdrawInfo from './getWithdrawInfo';
import * as WithdrawFunds from './withdrawFunds';
import * as GetWithdrawStatus from './getWithdrawStatus';
import * as WithdrawCancel from './withdrawCancel';
import * as WalletTransfer from './walletTransfer';

/**
 * Kraken Spot Funding API.
 *
 * Covers deposit / withdrawal–related endpoints (methods,
 * addresses, status, etc.).
 */
export class KrakenSpotFundingApi {
  constructor(private readonly base: KrakenRestBase) {}

  /**
   * Retrieve deposit methods available for a particular asset.
   *
   * @example
   * ```ts
   * const methods = await kraken.funding.getDepositMethods({
   *   asset: "USDT",
   * });
   *
   * for (const m of methods.result) {
   *   console.log(
   *     m.method,
   *     "min:", m.minimum,
   *     "limit:", m.limit,
   *     "fee:", m.fee,
   *   );
   * }
   * ```
   */
  getDepositMethods(params: GetDepositMethods.KrakenGetDepositMethodsParams) {
    return GetDepositMethods.getDepositMethods(this.base, params);
  }

  /**
   * Retrieve (or generate) deposit addresses for a particular
   * asset and deposit method.
   *
   * @example
   * ```ts
   * const res = await kraken.funding.getDepositAddresses({
   *   asset: "USDT",
   *   method: "USDT (Tether ERC20)",
   *   new: false,
   * });
   *
   * for (const addr of res.result) {
   *   console.log(addr.address, "expires:", addr.expiretm, "new:", addr.new);
   * }
   * ```
   */
  getDepositAddresses(
    params: GetDepositAddresses.KrakenGetDepositAddressesParams,
  ) {
    return GetDepositAddresses.getDepositAddresses(this.base, params);
  }

  /**
   * Retrieve information about recent deposits.
   * Results are sorted by recency. Use `cursor`, `start`, `end` and `limit`
   * to iterate through the history.
   * @example
   * ```ts
   * const deposits = await kraken.funding.getDepositStatus({
   *   asset: "USDT",
   *   limit: 25,
   * });
   *
   * for (const d of deposits) {
   *   console.log(d.asset, d.amount, d.status);
   * }
   * ```
   */
  getDepositStatus(params: GetDepositStatus.KrakenGetDepositStatusParams = {}) {
    return GetDepositStatus.getDepositStatus(this.base, params);
  }

  /**
   * Retrieve withdrawal methods available for a particular asset
   * (and optionally network).
   *
   * @example
   * ```ts
   * const methods = await kraken.funding.getWithdrawMethods({
   *   asset: "USDT",
   *   network: "ERC20",
   * });
   *
   * for (const m of methods) {
   *   console.log(m.asset, m.method, m.network, "min:", m.minimum);
   * }
   * ```
   */
  getWithdrawMethods(
    params: GetWithdrawMethods.KrakenGetWithdrawMethodsParams,
  ) {
    return GetWithdrawMethods.getWithdrawMethods(this.base, params);
  }

  /**
   * Retrieve withdrawal addresses available for the user.
   *
   * @example
   * ```ts
   * const addresses = await kraken.funding.getWithdrawAddresses({
   *   asset: "USDT",
   *   method: "USDT (Tether ERC20)",
   * });
   *
   * for (const a of addresses) {
   *   console.log(a.address, a.asset, a.method, a.key, a.verified);
   * }
   * ```
   */
  getWithdrawAddresses(
    params: GetWithdrawAddresses.KrakenGetWithdrawAddressesParams,
  ) {
    return GetWithdrawAddresses.getWithdrawAddresses(this.base, params);
  }

  /**
   * Retrieve fee information about a potential withdrawal for a given
   * asset, withdrawal key, and amount.
   *
   * @example
   * ```ts
   * const info = await kraken.funding.getWithdrawInfo({
   *   asset: "USDT",
   *   key: "my-usdt-key",
   *   amount: "100",
   * });
   *
   * console.log(
   *   "method:", info.method,
   *   "limit:", info.limit,
   *   "net amount:", info.amount,
   *   "fee:", info.fee,
   * );
   * ```
   */
  getWithdrawInfo(params: GetWithdrawInfo.KrakenGetWithdrawInfoParams) {
    return GetWithdrawInfo.getWithdrawInfo(this.base, params);
  }

  /**
   * Make a withdrawal request.
   *
   * @example
   * ```ts
   * const res = await kraken.funding.withdrawFunds({
   *   asset: "USDT",
   *   key: "my-usdt-key",
   *   amount: "100",
   * });
   *
   * console.log("withdrawal refid:", res.refid);
   * ```
   */
  withdrawFunds(params: WithdrawFunds.KrakenWithdrawFundsParams) {
    return WithdrawFunds.withdrawFunds(this.base, params);
  }

  /**
   * Retrieve information about recent withdrawals.
   * Results are sorted by recency. Use `cursor`, `start`, `end` and `limit`
   * to iterate through the history.
   *
   * @example
   * ```ts
   * const withdrawals = await kraken.funding.getWithdrawStatus({
   *   asset: "USDT",
   *   limit: 100,
   * });
   *
   * for (const w of withdrawals) {
   *   console.log(w.asset, w.amount, w.status, w.key);
   * }
   * ```
   */
  getWithdrawStatus(
    params: GetWithdrawStatus.KrakenGetWithdrawStatusParams = {},
  ) {
    return GetWithdrawStatus.getWithdrawStatus(this.base, params);
  }

  /**
   * Request cancellation of a recently requested withdrawal, if it has
   * not already been successfully processed.
   *
   * @example
   * ```ts
   * const ok = await kraken.funding.withdrawCancel({
   *   asset: "USDT",
   *   refid: "ABC123-REFID",
   * });
   *
   * console.log("cancellation success:", ok);
   * ```
   */
  withdrawCancel(params: WithdrawCancel.KrakenWithdrawCancelParams) {
    return WithdrawCancel.withdrawCancel(this.base, params);
  }

  /**
   * Request a transfer from a Kraken spot wallet to a Kraken Futures wallet.
   *
   * @example
   * ```ts
   * const res = await kraken.funding.walletTransfer({
   *   asset: "USDT",
   *   from: "Spot Wallet",
   *   to: "Futures Wallet",
   *   amount: "50",
   * });
   *
   * console.log("wallet transfer refid:", res.refid);
   * ```
   */
  walletTransfer(params: WalletTransfer.KrakenWalletTransferParams) {
    return WalletTransfer.walletTransfer(this.base, params);
  }
}

// Re-export types for consumers
export type KrakenGetDepositMethodsParams =
  GetDepositMethods.KrakenGetDepositMethodsParams;
export type KrakenGetDepositMethodsResult =
  GetDepositMethods.KrakenGetDepositMethodsResult;
export type KrakenDepositMethod = GetDepositMethods.KrakenDepositMethod;

export type KrakenGetDepositAddressesParams =
  GetDepositAddresses.KrakenGetDepositAddressesParams;
export type KrakenGetDepositAddressesResult =
  GetDepositAddresses.KrakenGetDepositAddressesResult;
export type KrakenDepositAddress = GetDepositAddresses.KrakenDepositAddress;

export type KrakenGetDepositStatusParams =
  GetDepositStatus.KrakenGetDepositStatusParams;
export type KrakenDepositStatusEntry =
  GetDepositStatus.KrakenDepositStatusEntry;

export type KrakenGetWithdrawMethodsParams =
  GetWithdrawMethods.KrakenGetWithdrawMethodsParams;
export type KrakenGetWithdrawMethodsResult =
  GetWithdrawMethods.KrakenGetWithdrawMethodsResult;
export type KrakenWithdrawMethod = GetWithdrawMethods.KrakenWithdrawMethod;

export type KrakenGetWithdrawAddressesParams =
  GetWithdrawAddresses.KrakenGetWithdrawAddressesParams;
export type KrakenGetWithdrawAddressesResult =
  GetWithdrawAddresses.KrakenGetWithdrawAddressesResult;
export type KrakenWithdrawAddress = GetWithdrawAddresses.KrakenWithdrawAddress;

export type KrakenGetWithdrawInfoParams =
  GetWithdrawInfo.KrakenGetWithdrawInfoParams;
export type KrakenGetWithdrawInfoResult =
  GetWithdrawInfo.KrakenGetWithdrawInfoResult;
export type KrakenWithdrawInfo = GetWithdrawInfo.KrakenWithdrawInfo;

export type KrakenWithdrawFundsParams = WithdrawFunds.KrakenWithdrawFundsParams;
export type KrakenWithdrawFundsResult =
  WithdrawFunds.KrakenWithdrawFundsResponse;

export type KrakenGetWithdrawStatusParams =
  GetWithdrawStatus.KrakenGetWithdrawStatusParams;
export type KrakenGetWithdrawStatusResult =
  GetWithdrawStatus.KrakenGetWithdrawStatusResult;
export type KrakenWithdrawStatusEntry =
  GetWithdrawStatus.KrakenWithdrawStatusEntry;

export type KrakenWithdrawCancelParams =
  WithdrawCancel.KrakenWithdrawCancelParams;
export type KrakenWithdrawCancelResult =
  WithdrawCancel.KrakenWithdrawCancelResult;

export type KrakenWalletTransferParams =
  WalletTransfer.KrakenWalletTransferParams;
export type KrakenWalletTransferResult =
  WalletTransfer.KrakenWalletTransferResult;
