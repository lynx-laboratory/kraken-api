/**
 * Bulk TRADES example: 06-query
 *
 * What it does:
 * - Streams trade rows from an extracted CSV for a given pair
 * - Supports optional start/end filtering and an output limit
 * - By default uses the COMPLETE extracted dataset
 * - If QUARTER is provided, uses that quarter's extracted dataset
 *
 * Storage:
 * - storageDir is set to ".bulk-data"
 * - Add ".bulk-data/" to .gitignore
 *
 * Run:
 *   yarn examples:bulk:trades:query
 *
 * Env vars:
 *   PAIR=XBTUSD        Pair symbol (CSV filename without .csv)
 *   LIMIT=10           Max number of rows to print
 *   START_TS=...       Filter: include rows with ts >= START_TS (same unit as the CSV)
 *   END_TS=...         Filter: include rows with ts < END_TS (same unit as the CSV)
 *   QUARTER=2024Q3     Use quarterly extracted dataset instead of complete (format: YYYYQ[1-4])
 *
 * Notes:
 * - Requires extraction to have been completed first (see 02-extract).
 * - Timestamp units (seconds vs ms) depend on the Kraken file contents; START_TS/END_TS must match that unit.
 */
import { KrakenBulkClient } from '@lynx-crypto/kraken-api';

async function main() {
  const pair = process.env.PAIR ?? 'XBTUSD';
  const limit = Number(process.env.LIMIT ?? '10');

  const quarter = process.env.QUARTER; // optional
  const source = quarter
    ? ({ type: 'quarterly', quarter } as any)
    : ({ type: 'complete' } as const);

  const startTs = process.env.START_TS
    ? Number(process.env.START_TS)
    : undefined;
  const endTs = process.env.END_TS ? Number(process.env.END_TS) : undefined;

  console.log('Querying trades:', {
    pair,
    source,
    startTs,
    endTs,
    limit,
  });

  const bulk = new KrakenBulkClient({
    userAgent: 'lynx-crypto/examples (bulk-trades)',
    storageDir: '.bulk-data',
  });

  let n = 0;
  for await (const row of bulk.trades.query(
    { pair, source, startTs, endTs } as any,
    { limit },
  )) {
    console.log(row);
    n += 1;
  }

  console.log(`Done. rows=${n}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
