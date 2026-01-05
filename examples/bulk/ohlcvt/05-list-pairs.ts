/**
 * Bulk OHLCVT example: 05-list-pairs
 *
 * What it does:
 * - Lists unique pair symbols available from extracted OHLCVT CSV files
 * - By default uses the COMPLETE extracted dataset
 * - If QUARTER is provided, lists pairs from that quarter's extracted dataset
 *
 * Storage:
 * - storageDir is set to ".bulk-data"
 * - Add ".bulk-data/" to .gitignore
 *
 * Run:
 *   yarn examples:bulk:ohlcvt:list-pairs
 *
 * Env vars:
 *   QUARTER=2024Q3   Use quarterly extracted dataset instead of complete (format: YYYYQ[1-4])
 *
 * Notes:
 * - Requires extraction to have been completed first (see 02-extract).
 */
import { KrakenBulkClient } from '@lynx-crypto/kraken-api';

async function main() {
  const quarter = process.env.QUARTER; // optional
  const source = quarter
    ? ({ type: 'quarterly', quarter } as any)
    : ({ type: 'complete' } as const);

  const bulk = new KrakenBulkClient({
    userAgent: 'lynx-crypto/examples (bulk-ohlcvt)',
    storageDir: '.bulk-data',
  });

  const pairs = await bulk.ohlcvt.listPairs(source);

  console.log(`Pairs (${pairs.length}):`);
  console.log(pairs.slice(0, 50).join(', '));
  if (pairs.length > 50) console.log(`... and ${pairs.length - 50} more`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
