import {
  KrakenWebsocketBase,
  KrakenWsMethodResponseEnvelope,
} from '../../../base/websocketBase';

/**
 * Wallet type for balances channel.
 */
export type KrakenWsBalanceWalletType = 'spot' | 'earn';

/**
 * Wallet identifier in snapshot.
 */
export type KrakenWsBalanceWalletId =
  | 'main'
  | 'flex'
  | 'bonded'
  | 'flexible'
  | 'liquid'
  | 'locked'
  | 'closed';

/**
 * Wallet identifier in update events.
 */
export type KrakenWsBalanceUpdateWalletId =
  | 'main'
  | 'bonded'
  | 'flexible'
  | 'liquid'
  | 'locked';

/**
 * Balance event type in updates.
 */
export type KrakenWsBalanceEventType =
  | 'deposit'
  | 'withdrawal'
  | 'trade'
  | 'margin'
  | 'adjustment'
  | 'rollover'
  | 'credit'
  | 'transfer'
  | 'settled'
  | 'staking'
  | 'sale'
  | 'reserve'
  | 'conversion'
  | 'dividend'
  | 'reward'
  | 'creator_fee';

/**
 * Balance event subtype in updates.
 */
export type KrakenWsBalanceEventSubtype =
  | 'spotfromfutures'
  | 'spottofutures'
  | 'stakingfromspot'
  | 'spotfromstaking'
  | 'stakingtospot'
  | 'spottostaking';

/**
 * Balance event category in updates.
 */
export type KrakenWsBalanceEventCategory =
  | 'deposit'
  | 'withdrawal'
  | 'trade'
  | 'margin-trade'
  | 'margin-settle'
  | 'margin-conversion'
  | 'conversion'
  | 'credit'
  | 'marginrollover'
  | 'staking-rewards'
  | 'instant'
  | 'equity-trade'
  | 'airdrop'
  | 'equity-dividend'
  | 'reward-bonus'
  | 'nft'
  | 'block-trade';

/**
 * Wallet entry for each asset in the snapshot.
 */
export interface KrakenWsBalanceWalletEntry {
  /**
   * Balance of asset in this wallet.
   */
  balance: number;

  /**
   * Wallet type: spot / earn.
   */
  type: KrakenWsBalanceWalletType;

  /**
   * Wallet identifier.
   */
  id: KrakenWsBalanceWalletId;
}

/**
 * Snapshot entry for each asset in the balances snapshot.
 */
export interface KrakenWsBalancesSnapshotAsset {
  /**
   * The asset symbol code (e.g. "BTC", "USD").
   */
  asset: string;

  /**
   * Asset class (currently "currency", placeholder for future expansion).
   */
  asset_class: string;

  /**
   * Total amount of asset held across all wallet types.
   */
  balance: number;

  /**
   * List of wallets holding this asset.
   */
  wallets: KrakenWsBalanceWalletEntry[];
}

/**
 * Snapshot message payload for the `balances` channel.
 */
export interface KrakenWsBalancesSnapshotMessage {
  channel: 'balances';
  type: 'snapshot';
  data: KrakenWsBalancesSnapshotAsset[];
  /**
   * Subscription message sequence number.
   */
  sequence: number;
}

/**
 * Ledger transaction entry in balances update messages.
 */
export interface KrakenWsBalanceLedgerTransaction {
  /**
   * The asset symbol code.
   */
  asset: string;

  /**
   * Asset class (currently "currency").
   */
  asset_class: string;

  /**
   * The amount of asset change in this event.
   */
  amount: number;

  /**
   * The total amount of this asset held in account after the event.
   */
  balance: number;

  /**
   * The fee paid on the transaction.
   */
  fee: number;

  /**
   * Identifier for this account ledger entry.
   */
  ledger_id: string;

  /**
   * Reference identifier for the balance event (e.g. trade_id for trades).
   */
  ref_id: string;

  /**
   * Time of the balance change (RFC3339).
   */
  timestamp: string;

  /**
   * Broad type of the balance event.
   */
  type: KrakenWsBalanceEventType;

  /**
   * Specific subtype of the balance event.
   */
  subtype?: KrakenWsBalanceEventSubtype;

  /**
   * Categorization of the balance event.
   */
  category?: KrakenWsBalanceEventCategory;

  /**
   * Wallet type (spot / earn).
   */
  wallet_type: KrakenWsBalanceWalletType;

  /**
   * Wallet identifier, depending on wallet type.
   */
  wallet_id: KrakenWsBalanceUpdateWalletId;

  /**
   * Published when subscription uses `users=all` (master + subaccounts).
   */
  user?: string;
}

/**
 * Update message payload for the `balances` channel.
 */
export interface KrakenWsBalancesUpdateMessage {
  channel: 'balances';
  type: 'update';
  data: KrakenWsBalanceLedgerTransaction[];
  /**
   * Subscription message sequence number.
   */
  sequence: number;
}

/**
 * Union of possible balances channel messages.
 */
export type KrakenWsBalancesMessage =
  | KrakenWsBalancesSnapshotMessage
  | KrakenWsBalancesUpdateMessage;

/**
 * Parameters for subscribing to the `balances` channel.
 *
 * NOTE:
 * - `channel` is automatically set to "balances" by the helper.
 * - `token` is optional here; KrakenWebsocketBase can inject it from
 *   the connection options when `attachAuthToken` is true.
 */
export interface KrakenWsBalancesSubscribeParams {
  /**
   * Request a snapshot after subscribing.
   * Default: true.
   */
  snapshot?: boolean;

  /**
   * For xstocks: if true, display in terms of underlying equity;
   * otherwise in terms of SPV tokens.
   * Default: true.
   */
  rebased?: boolean;

  /**
   * Master accounts only:
   * - "all" → events for master and subaccounts are streamed.
   *   (No snapshot is provided.)
   */
  users?: 'all';

  /**
   * Session token. Optional: base may inject it automatically.
   */
  token?: string;

  /**
   * Index signature to satisfy Record<string, unknown>.
   */
  [key: string]: unknown;
}

/**
 * Options for subscribeBalances wrapper – mapped to KrakenWebsocketBase.request.
 */
export interface KrakenWsBalancesSubscribeOptions {
  reqId?: number;
  timeoutMs?: number;
  attachAuthToken?: boolean;
}

/**
 * Result payload inside the subscribe ack envelope for balances.
 */
export interface KrakenWsBalancesSubscribeResult {
  channel: 'balances';
  [key: string]: unknown;
}

/**
 * Full WS envelope returned from subscribe (ack) for balances.
 */
export type KrakenWsBalancesSubscribeResponse =
  KrakenWsMethodResponseEnvelope<KrakenWsBalancesSubscribeResult>;

/**
 * Subscribe to the `balances` channel.
 *
 * Streams:
 * - a **snapshot** of all assets and wallets (unless `snapshot: false` or `users: "all"`),
 * - then **update** messages for each completed ledger transaction.
 *
 * @example
 * ```ts
 * // 1) Send subscribe request
 * const ack = await wsClient.userData.balances.subscribe({
 *   snapshot: true,
 * });
 *
 * if (!ack.success) {
 *   console.error("balances subscribe error:", ack.error);
 * }
 *
 * // 2) In your WS router:
 * ws.onMessage((raw) => {
 *   const msg = JSON.parse(raw);
 *
 *   if (msg.channel === "balances" && msg.type === "snapshot") {
 *     const snap = msg as KrakenWsBalancesSnapshotMessage;
 *     for (const asset of snap.data) {
 *       console.log(
 *         "[balances snapshot]",
 *         asset.asset,
 *         "total:",
 *         asset.balance,
 *       );
 *       for (const w of asset.wallets) {
 *         console.log("  wallet", w.type, w.id, "=", w.balance);
 *       }
 *     }
 *   }
 *
 *   if (msg.channel === "balances" && msg.type === "update") {
 *     const upd = msg as KrakenWsBalancesUpdateMessage;
 *     for (const tx of upd.data) {
 *       console.log(
 *         "[balances update]",
 *         tx.asset,
 *         tx.type,
 *         "delta:",
 *         tx.amount,
 *         "new balance:",
 *         tx.balance,
 *       );
 *     }
 *   }
 * });
 * ```
 */
export async function subscribeBalances(
  ws: KrakenWebsocketBase,
  params: KrakenWsBalancesSubscribeParams = {},
  options: KrakenWsBalancesSubscribeOptions = {},
): Promise<KrakenWsBalancesSubscribeResponse> {
  const body = {
    channel: 'balances' as const,
    ...params,
  };

  return ws.request<typeof body, KrakenWsBalancesSubscribeResult>(
    'subscribe',
    body,
    {
      reqId: options.reqId,
      timeoutMs: options.timeoutMs,
      attachAuthToken: options.attachAuthToken ?? true,
    },
  );
}

/**
 * Parameters for unsubscribing from the `balances` channel.
 *
 * NOTE:
 * - `channel` is set to "balances" by the helper.
 * - `token` is optional here; base may inject it automatically.
 */
export interface KrakenWsBalancesUnsubscribeParams {
  token?: string;
  [key: string]: unknown;
}

/**
 * Options for unsubscribeBalances wrapper.
 */
export interface KrakenWsBalancesUnsubscribeOptions {
  reqId?: number;
  timeoutMs?: number;
  attachAuthToken?: boolean;
}

/**
 * Result payload inside the unsubscribe ack envelope for balances.
 */
export interface KrakenWsBalancesUnsubscribeResult {
  channel: 'balances';
  [key: string]: unknown;
}

/**
 * Full WS envelope returned from unsubscribe (ack) for balances.
 */
export type KrakenWsBalancesUnsubscribeResponse =
  KrakenWsMethodResponseEnvelope<KrakenWsBalancesUnsubscribeResult>;

/**
 * Unsubscribe from the `balances` channel.
 *
 * This sends a WS v2 `unsubscribe` request with `channel: "balances"`.
 *
 * @example
 * ```ts
 * const ack = await wsClient.userData.balances.unsubscribe();
 *
 * if (!ack.success) {
 *   console.error("balances unsubscribe error:", ack.error);
 * }
 * ```
 */
export async function unsubscribeBalances(
  ws: KrakenWebsocketBase,
  params: KrakenWsBalancesUnsubscribeParams = {},
  options: KrakenWsBalancesUnsubscribeOptions = {},
): Promise<KrakenWsBalancesUnsubscribeResponse> {
  const body = {
    channel: 'balances' as const,
    ...params,
  };

  return ws.request<typeof body, KrakenWsBalancesUnsubscribeResult>(
    'unsubscribe',
    body,
    {
      reqId: options.reqId,
      timeoutMs: options.timeoutMs,
      attachAuthToken: options.attachAuthToken ?? true,
    },
  );
}
