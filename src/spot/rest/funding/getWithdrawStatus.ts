import type { KrakenRestBase } from '../../../base/restBase';
import type { KrakenRebaseMultiplier } from './getDepositStatus';

export interface KrakenGetWithdrawStatusParams {
  /**
   * Filter for specific asset being withdrawn (e.g. "USDT", "XBT").
   */
  asset?: string;

  /**
   * Filter for specific asset class being withdrawn.
   * Defaults to "currency" on Kraken if omitted.
   */
  aclass?: 'currency' | 'tokenized_asset';

  /**
   * Filter for specific name of withdrawal method.
   */
  method?: string;

  /**
   * Start timestamp. Withdrawals created strictly before this
   * will NOT be included in the response.
   *
   * Unix timestamp (seconds) or a string accepted by Kraken.
   */
  start?: number | string;

  /**
   * End timestamp. Withdrawals created strictly after this
   * will NOT be included in the response.
   *
   * Unix timestamp (seconds) or a string accepted by Kraken.
   */
  end?: number | string;

  /**
   * Pagination control:
   * - boolean: true/false to enable/disable paginated response
   * - string: cursor for next page of results
   *
   * Default on Kraken is false (no pagination) if omitted.
   */
  cursor?: boolean | string;

  /**
   * Number of results to include per page.
   * Default on Kraken is 500 if omitted.
   */
  limit?: number;

  /**
   * Optional parameter for viewing xstocks data.
   * - "rebased": Display in terms of underlying equity.
   * - "base": Display in terms of SPV tokens.
   *
   * Defaults to "rebased" on Kraken if omitted.
   */
  rebase_multiplier?: KrakenRebaseMultiplier;
}

export interface KrakenWithdrawStatusEntry {
  /**
   * Name of withdrawal method.
   */
  method: string;

  /**
   * Network name based on the funding method used.
   */
  network: string;

  /**
   * Asset class.
   */
  aclass: string;

  /**
   * Asset.
   */
  asset: string;

  /**
   * Reference ID.
   */
  refid: string;

  /**
   * Method transaction ID.
   */
  txid: string;

  /**
   * Method transaction information.
   */
  info: string;

  /**
   * Amount withdrawn.
   */
  amount: string;

  /**
   * Fees paid.
   */
  fee: string;

  /**
   * Unix timestamp when request was made.
   */
  time: number;

  /**
   * Status of withdrawal (see IFEX financial transaction states).
   *
   * Known values: "Initial", "Pending", "Settled", "Success", "Failure".
   */
  status: string;

  /**
   * Additional status properties (if available):
   * - "cancel-pending": cancellation requested
   * - "canceled": canceled
   * - "cancel-denied": cancellation requested but was denied
   * - "return": a return transaction initiated by Kraken; cannot be canceled
   * - "onhold": withdrawal is on hold pending review
   */
  'status-prop'?:
    | 'cancel-pending'
    | 'canceled'
    | 'cancel-denied'
    | 'return'
    | 'onhold';

  /**
   * Withdrawal key name, as set up on your account.
   */
  key: string;
}

/**
 * Kraken returns an array of withdrawal-status objects as `result`.
 */
export type KrakenGetWithdrawStatusResult = KrakenWithdrawStatusEntry[];

/**
 * Retrieve information about recent withdrawals.
 *
 * Results are sorted by recency. Use `cursor`, `start`, `end` and `limit`
 * to iterate through the history.
 *
 * Kraken docs: POST /0/private/WithdrawStatus
 */
export async function getWithdrawStatus(
  base: KrakenRestBase,
  params: KrakenGetWithdrawStatusParams = {},
): Promise<KrakenGetWithdrawStatusResult> {
  const {
    asset,
    aclass,
    method,
    start,
    end,
    cursor,
    limit,
    rebase_multiplier,
  } = params;

  const body: Record<string, string | number | boolean> = {};

  if (asset) body.asset = asset;
  if (aclass) body.aclass = aclass;
  if (method) body.method = method;
  if (start !== undefined) body.start = start;
  if (end !== undefined) body.end = end;
  if (cursor !== undefined) {
    body.cursor = cursor;
  }
  if (limit !== undefined) body.limit = limit;
  if (rebase_multiplier) body.rebase_multiplier = rebase_multiplier;

  // KrakenRestBase.privatePost unwraps { error, result } and returns just result.
  return base.privatePost<KrakenGetWithdrawStatusResult>(
    '/0/private/WithdrawStatus',
    body,
  );
}
