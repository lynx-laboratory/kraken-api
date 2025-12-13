import { KrakenRestBase } from '../../base/restBase';
import type { KrakenClientOptions } from '../../types/types';
import { KrakenSpotMarketDataApi } from './market-data';
import { KrakenSpotAccountDataApi } from './account-data';
import { KrakenSpotTradingApi } from './trading';
import { KrakenSpotFundingApi } from './funding';
import { KrakenSpotSubaccountsApi } from './subaccounts';
import { KrakenSpotEarnApi } from './earn';
import { KrakenSpotTransparencyApi } from './transparency';

/**
 * Kraken Spot REST client.
 *
 * This is the main entry point for accessing Kraken's spot REST API.
 * It exposes sub-APIs such as:
 * - `marketData`  for public market endpoints
 * - `accountData` for private account endpoints (requires API key)
 *
 * @example
 * ```ts
 * import { KrakenSpotRestClient } from "@lynx/kraken-spot-rest";
 *
 * const kraken = new KrakenSpotRestClient({
 *   userAgent: "my-app/1.0.0",
 * });
 *
 * const time = await kraken.marketData.getServerTime();
 * console.log("Kraken time:", time.rfc1123);
 * ```
 *
 * @example
 * ```ts
 * import { KrakenSpotRestClient } from "@lynx/kraken-spot-rest";
 *
 * const kraken = new KrakenSpotRestClient({
 *   apiKey: process.env.KRAKEN_API_KEY!,
 *   apiSecret: process.env.KRAKEN_API_SECRET!,
 *   userAgent: "my-app/1.0.0",
 * });
 *
 * const balances = await kraken.accountData.getAccountBalance();
 * console.log("USD balance:", balances["ZUSD"]);
 * ```
 */
export class KrakenSpotRestClient extends KrakenRestBase {
  /**
   * Public market data API (time, status, assets, pairs, ticker,
   * OHLC, depth, trades, spreads, etc.).
   */
  readonly marketData: KrakenSpotMarketDataApi;

  /**
   * Private account data API (balances, etc.).
   * Requires API key/secret with the appropriate permissions.
   */
  readonly accountData: KrakenSpotAccountDataApi;

  /**
   * Private trading API (place / cancel / amend orders, etc.).
   * Requires API key/secret with the appropriate permissions.
   */
  readonly trading: KrakenSpotTradingApi;

  /**
   * Funding API (deposit / withdrawal–related endpoints).
   * Requires appropriate "Funds" permissions on your API key.
   */
  readonly funding: KrakenSpotFundingApi;

  /**
   * Subaccounts API (create and manage trading subaccounts).
   * Requires API key/secret from the master account.
   */
  readonly subaccounts: KrakenSpotSubaccountsApi;

  /**
   * Earn API (allocate / deallocate funds to Earn strategies).
   * Requires appropriate "Earn Funds" permissions on your API key.
   */
  readonly earn: KrakenSpotEarnApi;

  /**
   * Transparency API (pre-/post-trade data, etc.).
   */
  readonly transparency: KrakenSpotTransparencyApi;

  constructor(options: KrakenClientOptions = {}) {
    super(options);
    this.marketData = new KrakenSpotMarketDataApi(this);
    this.accountData = new KrakenSpotAccountDataApi(this);
    this.trading = new KrakenSpotTradingApi(this);
    this.funding = new KrakenSpotFundingApi(this);
    this.subaccounts = new KrakenSpotSubaccountsApi(this);
    this.earn = new KrakenSpotEarnApi(this);
    this.transparency = new KrakenSpotTransparencyApi(this);
  }
}
