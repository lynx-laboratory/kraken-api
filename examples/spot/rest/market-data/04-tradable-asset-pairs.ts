import { KrakenSpotRestClient } from '@lynx-crypto/kraken-api';

async function main() {
  const kraken = new KrakenSpotRestClient({
    userAgent: 'lynx-crypto/examples (tradable-asset-pairs)',
  });

  const pairs = await kraken.marketData.getTradableAssetPairs({
    pair: ['XBTUSD', 'ETHUSD'],
  });

  console.log(JSON.stringify(pairs, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
