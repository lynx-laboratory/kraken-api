import 'dotenv/config';
import { KrakenSpotRestClient } from '@lynx-crypto/kraken-api';

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function isNonZeroAmount(v: string): boolean {
  const n = Number(v);
  return Number.isFinite(n) && n !== 0;
}

async function main() {
  const kraken = new KrakenSpotRestClient({
    userAgent: 'lynx-crypto/examples (account-balance)',
    apiKey: requireEnv('KRAKEN_API_KEY'),
    apiSecret: requireEnv('KRAKEN_API_SECRET'),
  });

  const balances = await kraken.accountData.getAccountBalance();

  const nonZero = Object.entries(balances)
    .filter(([, v]) => isNonZeroAmount(v))
    .sort(([a], [b]) => a.localeCompare(b));

  console.log('non-zero balances:', nonZero.length);
  for (const [asset, bal] of nonZero.slice(0, 50)) {
    console.log(asset.padEnd(12), bal);
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
