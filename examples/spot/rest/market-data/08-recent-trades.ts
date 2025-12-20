import { KrakenSpotRestClient } from '@lynx-crypto/kraken-api';

async function main() {
  const kraken = new KrakenSpotRestClient({
    userAgent: 'lynx-crypto/examples (recent-trades)',
  });

  const first = await kraken.marketData.getRecentTrades({
    pair: 'XBTUSD',
    count: 20,
  });

  const keys1 = Object.keys(first.trades);
  const key = first.trades['XXBTZUSD'] ? 'XXBTZUSD' : keys1[0];

  const trades1 = key ? (first.trades[key] ?? []) : [];
  console.log('Returned keys:', keys1);
  console.log('pair used:', key);
  console.log('first batch trades:', trades1.length);
  console.log('first last:', first.last);

  const next = await kraken.marketData.getRecentTrades({
    pair: 'XBTUSD',
    since: first.last,
    count: 20,
  });

  const keys2 = Object.keys(next.trades);
  const trades2 = key ? (next.trades[key] ?? []) : [];
  console.log('next returned keys:', keys2);
  console.log('next batch trades:', trades2.length);
  console.log('next last:', next.last);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
