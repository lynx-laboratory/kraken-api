import { KrakenSpotRestClient } from '@lynx-crypto/kraken-api';

async function main() {
  const kraken = new KrakenSpotRestClient({
    userAgent: 'lynx-crypto/examples (recent-spreads)',
  });

  const first = await kraken.marketData.getRecentSpreads({
    pair: 'XBTUSD',
  });

  const keys = Object.keys(first.spreads);
  const key = first.spreads['XXBTZUSD'] ? 'XXBTZUSD' : keys[0];

  const spreads = key ? (first.spreads[key] ?? []) : [];

  console.log('Returned keys:', keys);
  console.log('pair used:', key);
  console.log('spreads returned:', spreads.length);
  console.log('last 5 spreads:', spreads.slice(-5));
  console.log('next since:', first.last);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
