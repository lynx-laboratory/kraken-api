import 'dotenv/config';
import { KrakenSpotRestClient } from '@lynx-crypto/kraken-api';

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

async function main() {
  const kraken = new KrakenSpotRestClient({
    userAgent: 'lynx-crypto/examples (ws-token)',
    apiKey: requireEnv('KRAKEN_API_KEY'),
    apiSecret: requireEnv('KRAKEN_API_SECRET'),
  });

  const { token, expires } = await kraken.trading.getWebSocketsToken();

  console.log('token:', token);
  console.log('expires (seconds):', expires);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
