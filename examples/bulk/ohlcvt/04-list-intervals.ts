/**
 * Bulk OHLCVT example: 4-list-intervals
 *
 * What it does:
 * - Lists candle intervals available for a given PAIR from extracted OHLCVT files
 * - By default uses the COMPLETE extracted dataset
 * - If QUARTER is provided, uses that quarter's extracted dataset
 *
 * Storage:
 * - storageDir is set to ".bulk-data"
 * - Add ".bulk-data/" to .gitignore
 *
 * Run:
 *   yarn examples:bulk:ohlcvt:list-intervals
 *
 * Env vars:
 *   PAIR=XBTUSD      Pair symbol to inspect (matches CSV filename prefix)
 *   QUARTER=2024Q3   Use quarterly extracted dataset instead of complete (format: YYYYQ[1-4])
 *
 * Notes:
 * - Requires extraction to have been completed first (see 02-extract).
 */
import { KrakenBulkClient } from '@lynx-crypto/kraken-api';

async function main() {
  const pair = process.env.PAIR ?? 'XBTUSD';
  const quarter = process.env.QUARTER; // optional
  const source = quarter
    ? ({ type: 'quarterly', quarter } as any)
    : ({ type: 'complete' } as const);

  const bulk = new KrakenBulkClient({
    userAgent: 'lynx-crypto/examples (bulk-ohlcvt)',
    storageDir: '.bulk-data',
  });

  const intervals = await bulk.ohlcvt.listIntervals(pair, source);

  console.log(`Intervals for ${pair}:`, intervals);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
