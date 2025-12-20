import 'dotenv/config';
import { KrakenSpotRestClient } from '@lynx-crypto/kraken-api';

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

async function main() {
  const kraken = new KrakenSpotRestClient({
    userAgent: 'lynx-crypto/examples (trade-balance)',
    apiKey: requireEnv('KRAKEN_API_KEY'),
    apiSecret: requireEnv('KRAKEN_API_SECRET'),
  });

  const tb = await kraken.accountData.getTradeBalance();

  // Safe fields based on your account-data index.ts docs
  console.log('equity (e):', tb.e);
  console.log('free margin (mf):', tb.mf);
  console.log('margin level (ml):', tb.ml);

  // Everything else (depends on Kraken + your typing)
  console.log('raw:', tb);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
