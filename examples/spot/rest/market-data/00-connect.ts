import { KrakenSpotRestClient } from '@lynx-crypto/kraken-api';

async function main() {
  const kraken = new KrakenSpotRestClient({
    userAgent: 'lynx-crypto/examples (spot-rest)',
  });

  const time = await kraken.marketData.getServerTime();
  console.log('Server time:', time.rfc1123, `(unix ${time.unixtime})`);

  const status = await kraken.marketData.getSystemStatus();
  console.log('System status:', status.status, status.timestamp);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
