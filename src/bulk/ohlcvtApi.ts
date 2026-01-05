import path from 'node:path';
import { readdir } from 'node:fs/promises';

import type {
  KrakenBulkDownloadResult,
  KrakenBulkExtractResult,
  KrakenBulkHasResult,
  KrakenBulkOhlcInterval,
  KrakenBulkOhlcvtQuery,
  KrakenBulkOhlcvtRow,
  KrakenBulkQueryOptions,
  KrakenBulkSource,
  KrakenBulkDownloadOptions,
  KrakenBulkExtractOptions,
} from '../types/types';
import { KrakenBulkBase } from '../base/bulkBase';
import { fileExists } from '../utils/fs';
import { streamCsvRows } from '../utils/csv';
import { KrakenBulkError } from '../base/errors';

// --- Google Drive constants ---
const OHLCVT_COMPLETE_FILE_ID = '1ptNqWYidLkhb2VAKuLCxmp2OXEfGO-AP';
const OHLCVT_COMPLETE_URL =
  'https://drive.google.com/file/d/1ptNqWYidLkhb2VAKuLCxmp2OXEfGO-AP/view?usp=sharing';

const OHLCVT_QUARTERLY_FOLDER_ID = '15RSlNuW_h0kVM8or8McOGOMfHeBFvFGI';
const OHLCVT_QUARTERLY_FOLDER_URL =
  'https://drive.google.com/drive/folders/15RSlNuW_h0kVM8or8McOGOMfHeBFvFGI?usp=sharing';
// ---------------------------------------------

/**
 * Kraken Bulk OHLCVT API
 * Provides methods to download, extract, check, delete, and query OHLCVT bulk data.
 *
 * Supports complete and quarterly datasets.
 * Requires Google Drive API key for downloading quarterly datasets.
 */
export class KrakenBulkOhlcvtApi {
  constructor(private readonly base: KrakenBulkBase) {}

  /**
   * Download OHLCVT bulk data ZIP.
   *
   * @param source
   * @param opts
   * @returns { Promise<KrakenBulkDownloadResult> }
   */
  download(
    source: KrakenBulkSource,
    opts?: KrakenBulkDownloadOptions,
  ): Promise<KrakenBulkDownloadResult> {
    if (source.type === 'complete') {
      return this.base.downloadByFileId(
        'ohlcvt',
        source,
        OHLCVT_COMPLETE_FILE_ID,
        OHLCVT_COMPLETE_URL,
        opts,
      );
    }
    return this.downloadQuarter(source.quarter, opts);
  }

  /**
   * Extract OHLCVT bulk data ZIP.
   *
   * @param source
   * @param opts
   * @returns { Promise<KrakenBulkExtractResult> }
   */
  extract(
    source: KrakenBulkSource,
    opts?: KrakenBulkExtractOptions,
  ): Promise<KrakenBulkExtractResult> {
    return this.base.extract('ohlcvt', source, opts);
  }

  /**
   * Check if OHLCVT bulk data ZIP and extracted directory exist.
   *
   * @param source
   * @returns { Promise<KrakenBulkHasResult> }
   */
  has(source: KrakenBulkSource): Promise<KrakenBulkHasResult> {
    return this.base.has('ohlcvt', source);
  }

  /**
   * Delete OHLCVT bulk data ZIP and/or extracted directory.
   *
   * @param params
   * @returns { Promise<void> }
   */
  delete(params: {
    scope: 'zips' | 'extracted' | 'all';
    source?: KrakenBulkSource;
  }): Promise<void> {
    return this.base.delete('ohlcvt', params);
  }

  /**
   * Query OHLCVT data for a specific pair and interval.
   *
   * @param q
   * @param opts
   * @returns { AsyncIterable<KrakenBulkOhlcvtRow> }
   */
  query(
    q: KrakenBulkOhlcvtQuery,
    opts?: KrakenBulkQueryOptions,
  ): AsyncIterable<KrakenBulkOhlcvtRow> {
    const source = q.source ?? { type: 'complete' as const };
    return this.queryFromExtracted(source, q, opts);
  }

  /**
   * List available trading pairs in the extracted OHLCVT data.
   *
   * @param source
   * @returns { Promise<string[]> }
   */
  async listPairs(
    source: KrakenBulkSource = { type: 'complete' },
  ): Promise<string[]> {
    const extractedDir = this.base.extractedDir('ohlcvt', source);
    if (!(await fileExists(extractedDir))) return [];

    const files = await readdir(extractedDir);
    const pairs = new Set<string>();

    for (const f of files) {
      if (!f.toLowerCase().endsWith('.csv')) continue;

      const base = f.slice(0, -4);
      const idx = base.lastIndexOf('_');
      if (idx <= 0) continue;

      const intervalStr = base.slice(idx + 1);
      if (!/^\d+$/.test(intervalStr)) continue;

      pairs.add(base.slice(0, idx));
    }

    return Array.from(pairs).sort();
  }

  /**
   * List available intervals for a specific trading pair in the extracted OHLCVT data.
   *
   * @param pair
   * @param source
   * @returns { Promise<KrakenBulkOhlcInterval[]> }
   */
  async listIntervals(
    pair: string,
    source: KrakenBulkSource = { type: 'complete' },
  ): Promise<KrakenBulkOhlcInterval[]> {
    const extractedDir = this.base.extractedDir('ohlcvt', source);
    if (!(await fileExists(extractedDir))) return [];

    const files = await readdir(extractedDir);
    const intervals = new Set<number>();

    for (const f of files) {
      if (!f.toLowerCase().endsWith('.csv')) continue;
      if (!f.startsWith(`${pair}_`)) continue;

      const base = f.slice(0, -4);
      const idx = base.lastIndexOf('_');
      if (idx !== pair.length) continue;

      const n = Number(base.slice(idx + 1));
      if (Number.isFinite(n)) intervals.add(n);
    }

    return Array.from(intervals)
      .sort((a, b) => a - b)
      .filter(isValidInterval) as KrakenBulkOhlcInterval[];
  }

  /**
   * List available quarters for OHLCVT quarterly datasets.
   *
   * @returns { Promise<string[]> }
   */
  async listAvailableQuarters(): Promise<string[]> {
    // Requires Drive API (same as downloading)
    if (!this.base.hasGoogleDriveApiKey()) {
      throw new KrakenBulkError(
        'BULK_DRIVE_API_KEY_REQUIRED',
        'Google Drive API key not provided; cannot list available quarters.',
        {
          envVar: this.base.driveApiKeyEnvVar(),
          option: 'googleDriveApiKey',
        },
      );
    }

    const files = await this.base.listDriveFolder(OHLCVT_QUARTERLY_FOLDER_ID);

    // Matches: Kraken_OHLCVT_Q3_2024.zip -> 2024Q3
    const re = /^Kraken_OHLCVT_Q([1-4])_(\d{4})\.zip$/i;

    const out = new Set<string>();
    for (const f of files) {
      const m = f.name.match(re);
      if (!m) continue;
      const q = m[1];
      const year = m[2];
      out.add(`${year}Q${q}`);
    }

    return Array.from(out).sort((a, b) => {
      const ay = Number(a.slice(0, 4));
      const by = Number(b.slice(0, 4));
      if (ay !== by) return ay - by;
      return Number(a.slice(5)) - Number(b.slice(5));
    });
  }

  // ------- internals -------

  /**
   * Query from extracted data.
   *
   * @param source
   * @param q
   * @param opts
   * @returns { AsyncIterable<KrakenBulkOhlcvtRow> }
   */
  private async *queryFromExtracted(
    source: KrakenBulkSource,
    q: KrakenBulkOhlcvtQuery,
    opts?: KrakenBulkQueryOptions,
  ): AsyncIterable<KrakenBulkOhlcvtRow> {
    const extractedDir = this.base.extractedDir('ohlcvt', source);

    if (!(await fileExists(extractedDir))) {
      this.base.logger?.warn?.(
        'Bulk OHLCVT query requested but data not extracted',
        {
          source,
          extractedDir,
          pair: q.pair,
          interval: q.interval,
        },
      );
      return;
    }

    const csvPath = path.join(extractedDir, `${q.pair}_${q.interval}.csv`);

    if (!(await fileExists(csvPath))) {
      this.base.logger?.warn?.('Bulk OHLCVT CSV not found for pair/interval', {
        source,
        extractedDir,
        pair: q.pair,
        interval: q.interval,
        csvPath,
      });
      return;
    }

    const startTs = q.startTs;
    const endTs = q.endTs;
    const limit = opts?.limit;

    let yielded = 0;

    for await (const row of streamCsvRows(csvPath)) {
      if (row.length < 7) continue;

      const ts = Number(row[0]);
      if (!Number.isFinite(ts)) continue;

      if (startTs !== undefined && ts < startTs) continue;
      if (endTs !== undefined && ts >= endTs) continue;

      const open = row[1];
      const high = row[2];
      const low = row[3];
      const close = row[4];
      const volume = row[5];
      const trades = Number(row[6]);
      if (!Number.isFinite(trades)) continue;

      yield { ts, open, high, low, close, volume, trades };

      yielded += 1;
      if (limit !== undefined && yielded >= limit) return;
    }
  }

  /**
   * Download quarterly OHLCVT ZIP.
   *
   * @param quarter
   * @param opts
   * @returns { Promise<KrakenBulkDownloadResult> }
   */
  private async downloadQuarter(
    quarter: string,
    opts?: KrakenBulkDownloadOptions,
  ): Promise<KrakenBulkDownloadResult> {
    const source: KrakenBulkSource = {
      type: 'quarterly',
      quarter: quarter as any,
    };

    await this.base.ensureDatasetDirs('ohlcvt');

    const zipPath = this.base.zipPath('ohlcvt', source);
    const forceRefresh = !!opts?.forceRefresh;

    // Rule #1: if exists, return unless forceRefresh
    if (!forceRefresh && (await fileExists(zipPath))) {
      const bytes = await this.base.safeStatSize(zipPath);
      return { dataset: 'ohlcvt', source, zipPath, bytes, downloaded: false };
    }

    // Kraken_OHLCVT_Q1_2025.zip
    const wanted = `Kraken_OHLCVT_Q${toFolderQuarter(quarter)}.zip`;

    // Rule #2: if missing (or forceRefresh) and no key -> key-required error
    if (!this.base.hasGoogleDriveApiKey()) {
      throw new KrakenBulkError(
        'BULK_DRIVE_API_KEY_REQUIRED',
        `Google Drive API key not provided; cannot download OHLCVT quarterly ZIP for ${quarter}.`,
        {
          dataset: 'ohlcvt',
          quarter,
          wanted,
          expectedPath: zipPath,
          folderId: OHLCVT_QUARTERLY_FOLDER_ID,
          folderUrl: OHLCVT_QUARTERLY_FOLDER_URL,
          forceRefresh,
          envVar: this.base.driveApiKeyEnvVar(),
          option: 'googleDriveApiKey',
          manualHint:
            'You can manually download the ZIP and place it at expectedPath to proceed without an API key.',
        },
      );
    }

    // Seamless mode: list via Drive API and download by fileId
    const files = await this.base.listDriveFolder(OHLCVT_QUARTERLY_FOLDER_ID);

    const match =
      files.find((f) => f.name === wanted) ??
      files.find(
        (f) => f.name.trim().toLowerCase() === wanted.trim().toLowerCase(),
      );

    if (!match) {
      const sample = files.slice(0, 15).map((f) => f.name);

      this.base.logger?.warn?.(
        'OHLCVT quarterly ZIP not found in Drive folder',
        {
          quarter,
          folder: OHLCVT_QUARTERLY_FOLDER_URL,
          wanted,
          availableCount: files.length,
          availableSample: sample,
        },
      );

      throw new KrakenBulkError(
        'BULK_DRIVE_QUARTER_NOT_FOUND',
        `OHLCVT quarterly ZIP not found for ${quarter}`,
        {
          dataset: 'ohlcvt',
          quarter,
          wanted,
          folderId: OHLCVT_QUARTERLY_FOLDER_ID,
          folderUrl: OHLCVT_QUARTERLY_FOLDER_URL,
          availableCount: files.length,
          availableSample: sample,
        },
      );
    }

    const fileViewUrl = `https://drive.google.com/file/d/${match.id}/view?usp=sharing`;

    return this.base.downloadByFileId(
      'ohlcvt',
      source,
      match.id,
      fileViewUrl,
      opts,
    );
  }
}

/**
 * Convert quarter string to folder format.
 *
 * @param q
 * @returns { string }
 */
function toFolderQuarter(q: string): string {
  // "2024Q3" -> "3_2024"
  const m = q.match(/^(\d{4})Q([1-4])$/);
  if (!m) return q;
  return `${m[2]}_${m[1]}`;
}

/**
 * Validate if the given number is a valid OHLC interval.
 *
 * @param n
 * @returns { boolean }
 */
function isValidInterval(n: number): boolean {
  return (
    n === 1 ||
    n === 5 ||
    n === 15 ||
    n === 30 ||
    n === 60 ||
    n === 240 ||
    n === 720 ||
    n === 1440
  );
}
