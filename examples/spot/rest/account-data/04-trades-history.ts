import 'dotenv/config';
import { KrakenSpotRestClient } from '@lynx-crypto/kraken-api';

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

async function main() {
  const kraken = new KrakenSpotRestClient({
    userAgent: 'lynx-crypto/examples (trades-history)',
    apiKey: requireEnv('KRAKEN_API_KEY'),
    apiSecret: requireEnv('KRAKEN_API_SECRET'),
  });

  const history = await kraken.accountData.getTradesHistory({
    type: 'all',
    ofs: 0,
    ledgers: false,
  });

  const ids = Object.keys(history.trades);

  console.log('total trades (count):', history.count);
  console.log('returned this page:', ids.length);

  for (const id of ids.slice(0, 10)) {
    const t = history.trades[id];
    console.log(id, t.time, t.pair, t.type, t.vol, t.price);
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
