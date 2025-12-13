import type { KrakenRestBase } from '../../../base/restBase';

export interface KrakenCreateSubaccountParams {
  /**
   * Username for the subaccount.
   */
  username: string;

  /**
   * Email address for the subaccount.
   */
  email: string;
}

/**
 * Whether subaccount creation was successful or not.
 */
export type KrakenCreateSubaccountResult = boolean;

/**
 * Create a trading subaccount.
 *
 * Note: CreateSubaccount must be called using an API key from the
 * master account.
 *
 * Kraken docs: POST /0/private/CreateSubaccount
 */
export async function createSubaccount(
  base: KrakenRestBase,
  params: KrakenCreateSubaccountParams,
): Promise<KrakenCreateSubaccountResult> {
  const { username, email } = params;

  const body: Record<string, string> = {
    username,
    email,
  };

  // KrakenRestBase.privatePost unwraps { error, result } and returns just result.
  return base.privatePost<KrakenCreateSubaccountResult>(
    '/0/private/CreateSubaccount',
    body,
  );
}
