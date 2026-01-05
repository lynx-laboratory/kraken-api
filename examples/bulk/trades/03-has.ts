/**
 * Bulk TRADES example: 03-has
 *
 * What it does:
 * - Checks whether the ZIP and extracted directory exist for a given source
 * - By default checks the COMPLETE dataset
 * - If QUARTER is provided, checks that quarter
 *
 * Storage:
 * - storageDir is set to ".bulk-data"
 * - Add ".bulk-data/" to .gitignore
 *
 * Run:
 *   yarn examples:bulk:trades:has
 *
 * Env vars:
 *   QUARTER=2024Q3   Check quarterly source instead of complete (format: YYYYQ[1-4])
 */
import { KrakenBulkClient } from '@lynx-crypto/kraken-api';

async function main() {
  const quarter = process.env.QUARTER; // optional
  const source = quarter
    ? ({ type: 'quarterly', quarter } as any)
    : ({ type: 'complete' } as const);

  const bulk = new KrakenBulkClient({
    userAgent: 'lynx-crypto/examples (bulk-trades)',
    storageDir: '.bulk-data',
  });

  const res = await bulk.trades.has(source);

  console.log('Has:', { source, ...res });
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
