/**
 * Bulk TRADES example: 02-extract
 *
 * What it does:
 * - Extracts TRADES ZIPs into the new extracted structure:
 *     .bulk-data/trades/extracted/complete/
 *     .bulk-data/trades/extracted/quarterly/<YYYYQn>/
 *
 * Run:
 *   yarn examples:bulk:trades:extract
 *
 * Modes (env vars):
 *   MODE=complete | quarter | all-quarters
 *     - complete: extract the complete ZIP
 *     - quarter:  extract one quarter (defaults to QUARTER=2024Q4)
 *     - all-quarters: extract every quarter ZIP found locally in:
 *         .bulk-data/trades/zips/quarterly/
 *
 *   QUARTER=2024Q4
 *     Quarter to extract when MODE=quarter (format: YYYYQ[1-4])
 *
 *   CONCURRENCY=4
 *     How many files to extract concurrently (defaults to 4)
 *
 * Notes:
 * - Extraction never needs a Drive API key (only downloads do).
 * - If already extracted, extraction is skipped (extracted:false).
 * - Shows an extract progress bar (files extracted / total CSV files in ZIP).
 */
import path from 'node:path';
import { readdir } from 'node:fs/promises';

import {
  KrakenBulkClient,
  type KrakenBulkExtractProgressCallback,
} from '@lynx-crypto/kraken-api';

function truthyInt(v: string | undefined, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

function createCliProgressBar(
  label: string,
): KrakenBulkExtractProgressCallback | undefined {
  const isTTY = !!process.stderr.isTTY;
  if (!isTTY) return undefined;

  const startAt = Date.now();

  return (p) => {
    const now = Date.now();
    const cols = process.stderr.columns ?? 80;

    const elapsedStr = `${Math.floor((now - startAt) / 1000)}s`;
    const done = p.extractedFiles ?? 0;
    const total = p.totalFiles;

    const fileStr = p.currentFile ? ` ${p.currentFile}` : '';

    if (total && total > 0) {
      const pct = Math.min(1, done / total);
      const barWidth = Math.max(10, Math.min(30, cols - 55));
      const filled = Math.round(barWidth * pct);
      const bar =
        '[' +
        '='.repeat(Math.max(0, filled - 1)) +
        (filled > 0 ? '>' : '') +
        '.'.repeat(Math.max(0, barWidth - filled)) +
        ']';

      const line =
        `${label} ${Math.round(pct * 100)
          .toString()
          .padStart(3, ' ')}% ` +
        `${bar} ` +
        `${done.toString().padStart(5, ' ')}/${total
          .toString()
          .padEnd(5, ' ')} ` +
        `${elapsedStr}${fileStr}`;

      process.stderr.write(
        '\r' + line.slice(0, cols - 1).padEnd(cols - 1, ' '),
      );
    } else {
      const line = `${label} ${done} files ${elapsedStr}${fileStr}`;
      process.stderr.write(
        '\r' + line.slice(0, cols - 1).padEnd(cols - 1, ' '),
      );
    }
  };
}

type Mode = 'complete' | 'quarter' | 'all-quarters';

function isQuarterZipFile(name: string): boolean {
  return /^\d{4}Q[1-4]\.zip$/i.test(name);
}

async function main() {
  const mode = (process.env.MODE ?? 'complete') as Mode;
  const quarter = process.env.QUARTER ?? '2024Q4';
  const concurrency = truthyInt(process.env.CONCURRENCY, 4);

  const storageDir = '.bulk-data';

  const bulk = new KrakenBulkClient({
    userAgent: 'lynx-crypto/examples (bulk-trades)',
    storageDir,
  } as any);

  const extractOne = async (src: any, label: string) => {
    const onProgress = createCliProgressBar(label);

    const res = await bulk.trades.extract(src, {
      onProgress,
      concurrency,
    });

    process.stderr.write('\n');

    console.log('Extract result:', res);
  };

  if (mode === 'complete') {
    await extractOne({ type: 'complete' }, 'Extracting TRADES complete');
    console.log('Next: yarn examples:bulk:trades:list-pairs');
    return;
  }

  if (mode === 'quarter') {
    await extractOne(
      { type: 'quarterly', quarter } as any,
      `Extracting TRADES ${quarter}`,
    );
    console.log('Next: yarn examples:bulk:trades:list-pairs');
    return;
  }

  // mode === 'all-quarters' (local zips only)
  const quarterlyZipDir = path.resolve(
    process.cwd(),
    storageDir,
    'trades',
    'zips',
    'quarterly',
  );

  let files: string[] = [];
  try {
    files = await readdir(quarterlyZipDir);
  } catch {
    files = [];
  }

  const quarters = files
    .filter(isQuarterZipFile)
    .map((f) => f.slice(0, -4).toUpperCase()) // strip .zip -> YYYYQn
    .sort((a, b) => {
      // sort by year then quarter
      const ay = Number(a.slice(0, 4));
      const by = Number(b.slice(0, 4));
      if (ay !== by) return ay - by;
      return Number(a.slice(5)) - Number(b.slice(5));
    });

  if (quarters.length === 0) {
    console.log(
      `No quarterly ZIPs found in ${quarterlyZipDir}\n` +
        `Run downloads first (MODE=all-quarters or MODE=quarter).`,
    );
    return;
  }

  console.log(
    `Found ${quarters.length} local quarterly ZIPs. Starting extracts...`,
  );

  for (const q of quarters) {
    await extractOne(
      { type: 'quarterly', quarter: q } as any,
      `Extracting TRADES ${q}`,
    );
  }

  console.log('All quarter extracts done.');
  console.log('Next: yarn examples:bulk:trades:list-pairs');
}

main().catch((err) => {
  process.stderr.write('\n');
  console.error(err);
  process.exitCode = 1;
});
