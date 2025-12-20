import { KrakenSpotRestClient } from '@lynx-crypto/kraken-api';

async function main() {
  const kraken = new KrakenSpotRestClient({
    userAgent: 'lynx-crypto/examples (asset-info)',
  });

  // Subset (usually what you want in an example)
  const info = await kraken.marketData.getAssetInfo({
    asset: ['XXBT', 'XETH'],
  });

  console.log(JSON.stringify(info, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
