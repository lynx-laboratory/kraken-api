/**
 * Bulk TRADES example: 01-download
 *
 * What it does:
 * - Downloads TRADES ZIPs into the new zip structure:
 *     .bulk-data/trades/zips/complete/complete.zip
 *     .bulk-data/trades/zips/quarterly/<YYYYQn>.zip
 *
 * Run:
 *   yarn examples:bulk:trades:download
 *
 * Modes (env vars):
 *   MODE=complete | quarter | all-quarters
 *     - complete: download the complete ZIP
 *     - quarter:  download one quarter (defaults to QUARTER=2024Q4)
 *     - all-quarters: download every quarter visible in the Drive folder
 *
 *   QUARTER=2024Q4
 *     Quarter to download when MODE=quarter (format: YYYYQ[1-4])
 *
 *   FORCE_REFRESH=1
 *     If set, re-download even if the ZIP already exists
 *
 *   KRAKEN_API_GOOGLE_DRIVE_API_KEY=...
 *     Required for seamless downloads (Drive API).
 *     If missing:
 *       - if ZIP exists locally: returns downloaded:false
 *       - if ZIP missing: throws BULK_DRIVE_API_KEY_REQUIRED
 *
 * Notes:
 * - all-quarters requires bulk.trades.listAvailableQuarters() to exist.
 * - Add ".bulk-data/" to .gitignore
 */
import {
  KrakenBulkClient,
  type KrakenBulkDownloadProgressCallback,
} from '@lynx-crypto/kraken-api';

function formatBytes(n: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let v = n;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v.toFixed(i === 0 ? 0 : 1)}${units[i]}`;
}

function truthyEnv(v: string | undefined): boolean {
  if (!v) return false;
  return ['1', 'true', 'yes', 'y', 'on'].includes(v.trim().toLowerCase());
}

function createCliProgressBar(
  label: string,
): KrakenBulkDownloadProgressCallback | undefined {
  const isTTY = !!process.stderr.isTTY;
  if (!isTTY) return undefined;

  const startAt = Date.now();
  let lastAt = startAt;
  let lastBytes = 0;
  let emaBps = 0;

  return (p) => {
    const now = Date.now();
    const dt = Math.max(1, now - lastAt) / 1000;
    const dBytes = p.downloadedBytes - lastBytes;

    const instBps = dBytes / dt;
    emaBps = emaBps === 0 ? instBps : emaBps * 0.85 + instBps * 0.15;

    lastAt = now;
    lastBytes = p.downloadedBytes;

    const cols = process.stderr.columns ?? 80;
    const total = p.totalBytes;
    const done = p.downloadedBytes;

    const speedStr = emaBps > 0 ? `${formatBytes(emaBps)}/s` : '';
    const elapsedStr = `${Math.floor((now - startAt) / 1000)}s`;

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

      const eta =
        emaBps > 0
          ? Math.max(0, Math.round((total - done) / emaBps))
          : undefined;
      const etaStr = eta !== undefined ? `${eta}s ETA` : '';

      const line =
        `${label} ${Math.round(pct * 100)
          .toString()
          .padStart(3, ' ')}% ` +
        `${bar} ` +
        `${formatBytes(done)}/${formatBytes(total)} ` +
        `${speedStr} ${etaStr} ${elapsedStr}`;

      process.stderr.write(
        '\r' + line.slice(0, cols - 1).padEnd(cols - 1, ' '),
      );
    } else {
      const line = `${label} ${formatBytes(done)} ${speedStr} ${elapsedStr}`;
      process.stderr.write(
        '\r' + line.slice(0, cols - 1).padEnd(cols - 1, ' '),
      );
    }
  };
}

type Mode = 'complete' | 'quarter' | 'all-quarters';

async function main() {
  const mode = (process.env.MODE ?? 'complete') as Mode;
  const quarter = process.env.QUARTER ?? '2024Q4';
  const forceRefresh = truthyEnv(process.env.FORCE_REFRESH);

  const bulk = new KrakenBulkClient({
    userAgent: 'lynx-crypto/examples (bulk-trades)',
    storageDir: '.bulk-data',
  } as any);

  const downloadOne = async (src: any, label: string) => {
    const onProgress = createCliProgressBar(label);

    const res = await bulk.trades.download(
      src,
      onProgress ? { onProgress, forceRefresh } : { forceRefresh },
    );

    process.stderr.write('\n');

    console.log('Download result:', {
      source: res.source,
      zipPath: res.zipPath,
      bytes: res.bytes,
      downloaded: res.downloaded,
      directUrl: res.directUrl,
    });
  };

  if (mode === 'complete') {
    await downloadOne({ type: 'complete' }, 'Downloading TRADES complete');
    return;
  }

  if (mode === 'quarter') {
    await downloadOne(
      { type: 'quarterly', quarter } as any,
      `Downloading TRADES ${quarter}`,
    );
    return;
  }

  // mode === 'all-quarters'
  const quarters = await (bulk.trades as any).listAvailableQuarters?.();
  if (!Array.isArray(quarters) || quarters.length === 0) {
    throw new Error(
      'bulk.trades.listAvailableQuarters() is missing or returned no quarters. ' +
        'Add the public method to the Trades API to enable MODE=all-quarters.',
    );
  }

  console.log(`Found ${quarters.length} quarters. Starting downloads...`);

  for (const q of quarters) {
    await downloadOne(
      { type: 'quarterly', quarter: q } as any,
      `Downloading TRADES ${q}`,
    );
  }

  console.log('All quarter downloads done.');
}

main().catch((err) => {
  process.stderr.write('\n');
  console.error(err);
  process.exitCode = 1;
});
