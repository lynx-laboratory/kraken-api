import 'dotenv/config';
import { KrakenSpotRestClient } from '@lynx-crypto/kraken-api';

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

async function main() {
  const kraken = new KrakenSpotRestClient({
    userAgent: 'lynx-crypto/examples (open-orders)',
    apiKey: requireEnv('KRAKEN_API_KEY'),
    apiSecret: requireEnv('KRAKEN_API_SECRET'),
  });

  const { open } = await kraken.accountData.getOpenOrders({ trades: false });

  const ids = Object.keys(open);
  console.log('open orders:', ids.length);

  for (const id of ids.slice(0, 10)) {
    const o = open[id];
    console.log(
      id,
      o.status,
      o.descr?.pair,
      o.descr?.type,
      o.descr?.ordertype,
      'vol:',
      o.vol,
      'exec:',
      o.vol_exec,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
