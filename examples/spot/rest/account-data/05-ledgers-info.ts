import 'dotenv/config';
import { KrakenSpotRestClient } from '@lynx-crypto/kraken-api';

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

async function main() {
  const kraken = new KrakenSpotRestClient({
    userAgent: 'lynx-crypto/examples (ledgers-info)',
    apiKey: requireEnv('KRAKEN_API_KEY'),
    apiSecret: requireEnv('KRAKEN_API_SECRET'),
  });

  const res = await kraken.accountData.getLedgersInfo({
    type: 'all',
    ofs: 0,
  });

  const ids = Object.keys(res.ledger);

  console.log('ledger count (if provided):', res.count ?? '(not provided)');
  console.log('returned this page:', ids.length);

  for (const id of ids.slice(0, 10)) {
    const e = res.ledger[id];
    console.log(id, e.time, e.type, e.asset, e.amount, e.balance);
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
