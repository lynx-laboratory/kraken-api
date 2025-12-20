import { KrakenSpotRestClient } from '@lynx-crypto/kraken-api';

async function main() {
  const kraken = new KrakenSpotRestClient({
    userAgent: 'lynx-crypto/examples (server-time)',
  });

  const time = await kraken.marketData.getServerTime();
  console.log('unixtime:', time.unixtime);
  console.log('rfc1123 :', time.rfc1123);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
