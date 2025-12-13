import { describe, it, expect } from 'vitest';

import { KrakenRestBase } from '../../../../src/base/restBase';
import { KrakenSpotRestClient } from '../../../../src/spot/rest/spotRestClient';

import { KrakenSpotMarketDataApi } from '../../../../src/spot/rest/market-data';
import { KrakenSpotAccountDataApi } from '../../../../src/spot/rest/account-data';
import { KrakenSpotTradingApi } from '../../../../src/spot/rest/trading';
import { KrakenSpotFundingApi } from '../../../../src/spot/rest/funding';
import { KrakenSpotSubaccountsApi } from '../../../../src/spot/rest/subaccounts';
import { KrakenSpotEarnApi } from '../../../../src/spot/rest/earn';
import { KrakenSpotTransparencyApi } from '../../../../src/spot/rest/transparency';

describe('spot/rest/index', () => {
  it('constructs and wires sub-APIs', () => {
    const client = new KrakenSpotRestClient();

    // Inheritance
    expect(client).toBeInstanceOf(KrakenRestBase);

    // Sub-APIs are present and of the right type
    expect(client.marketData).toBeInstanceOf(KrakenSpotMarketDataApi);
    expect(client.accountData).toBeInstanceOf(KrakenSpotAccountDataApi);
    expect(client.trading).toBeInstanceOf(KrakenSpotTradingApi);
    expect(client.funding).toBeInstanceOf(KrakenSpotFundingApi);
    expect(client.subaccounts).toBeInstanceOf(KrakenSpotSubaccountsApi);
    expect(client.earn).toBeInstanceOf(KrakenSpotEarnApi);
    expect(client.transparency).toBeInstanceOf(KrakenSpotTransparencyApi);

    // All sub-APIs should be bound to the same base instance (the client)
    expect((client.marketData as any).base).toBe(client);
    expect((client.accountData as any).base).toBe(client);
    expect((client.trading as any).base).toBe(client);
    expect((client.funding as any).base).toBe(client);
    expect((client.subaccounts as any).base).toBe(client);
    expect((client.earn as any).base).toBe(client);
    expect((client.transparency as any).base).toBe(client);
  });

  it('accepts client options in constructor', () => {
    // Just ensure we can pass options without throwing.
    // (We avoid asserting internal RestBase fields here, since they’re implementation details.)
    const client = new KrakenSpotRestClient({
      userAgent: 'vitest/1.0.0',
      apiKey: 'key',
      apiSecret: 'secret',
    });

    expect(client.marketData).toBeInstanceOf(KrakenSpotMarketDataApi);
    expect((client.marketData as any).base).toBe(client);
  });
});
