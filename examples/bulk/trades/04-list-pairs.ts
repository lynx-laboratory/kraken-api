/**
 * Bulk TRADES example: 04-list-pairs
 *
 * What it does:
 * - Lists pair symbols available from extracted TRADES CSV files
 * - By default uses the COMPLETE extracted dataset
 * - If QUARTER is provided, lists pairs from that quarter's extracted dataset
 *
 * Storage:
 * - storageDir is set to ".bulk-data"
 * - Add ".bulk-data/" to .gitignore
 *
 * Run:
 *   yarn examples:bulk:trades:list-pairs
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
    userAgent: 'lynx-crypto/examples (bulk-trades)',
    storageDir: '.bulk-data',
  });

  const pairs = await bulk.trades.listPairs(source);

  console.log(`Pairs (${pairs.length})${quarter ? ` for ${quarter}` : ''}:`);
  console.log(pairs.slice(0, 50).join(', '));
  if (pairs.length > 50) console.log(`... and ${pairs.length - 50} more`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
