import { KrakenSpotRestClient } from '@lynx-crypto/kraken-api';

async function main() {
  const kraken = new KrakenSpotRestClient({
    userAgent: 'lynx-crypto/examples (ticker)',
  });

  const tickers = await kraken.marketData.getTickerInformation({
    pair: ['XBTUSD', 'ETHUSD'],
  });

  const keys = Object.keys(tickers);
  console.log('Returned keys:', keys);

  // Kraken commonly returns these internal pair codes:
  // - XXBTZUSD for XBT/USD
  // - XETHZUSD  for ETH/USD
  const xbt =
    tickers['XXBTZUSD'] ??
    tickers['XBTUSD'] ??
    tickers[keys.find((k) => k.includes('XBT') && k.includes('USD'))!];

  const eth =
    tickers['XETHZUSD'] ??
    tickers['ETHUSD'] ??
    tickers[keys.find((k) => k.includes('ETH') && k.includes('USD'))!];

  console.log(
    'XBTUSD last:',
    xbt?.c?.[0],
    'bid:',
    xbt?.b?.[0],
    'ask:',
    xbt?.a?.[0],
  );
  console.log(
    'ETHUSD last:',
    eth?.c?.[0],
    'bid:',
    eth?.b?.[0],
    'ask:',
    eth?.a?.[0],
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
