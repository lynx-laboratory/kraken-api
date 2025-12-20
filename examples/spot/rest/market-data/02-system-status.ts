import { KrakenSpotRestClient } from '@lynx-crypto/kraken-api';

async function main() {
  const kraken = new KrakenSpotRestClient({
    userAgent: 'lynx-crypto/examples (system-status)',
  });

  const status = await kraken.marketData.getSystemStatus();
  console.log('status   :', status.status);
  console.log('timestamp:', status.timestamp);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
