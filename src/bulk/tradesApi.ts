import path from 'node:path';
import { readdir } from 'node:fs/promises';

import type {
  KrakenBulkDownloadResult,
  KrakenBulkExtractResult,
  KrakenBulkHasResult,
  KrakenBulkQueryOptions,
  KrakenBulkSource,
  KrakenBulkTradesQuery,
  KrakenBulkTradeRow,
  KrakenBulkDownloadOptions,
  KrakenBulkExtractOptions,
} from '../types/types';
import { fileExists } from '../utils/fs';
import { streamCsvRows } from '../utils/csv';
import { KrakenBulkBase } from '../base/bulkBase';
import { KrakenBulkError } from '../base/errors';

// --- Google Drive constants ---
const TRADES_COMPLETE_FILE_ID = '1nB0_Bv6oFQfqYxhhYkPSWXMWQRxmhRUZ';
const TRADES_COMPLETE_URL =
  'https://drive.google.com/file/d/1nB0_Bv6oFQfqYxhhYkPSWXMWQRxmhRUZ/view?usp=sharing';

const TRADES_QUARTERLY_FOLDER_ID = '188O9xQjZTythjyLNes_5zfMEFaMbTT22';
const TRADES_QUARTERLY_FOLDER_URL =
  'https://drive.google.com/drive/folders/188O9xQjZTythjyLNes_5zfMEFaMbTT22?usp=sharing';
// ---------------------------------------------

/**
 * Kraken Bulk Trades API
 * Provides methods to download, extract, check, delete, and query trades bulk data.
 *
 * Supports complete and quarterly datasets.
 * Requires Google Drive API key for downloading quarterly datasets.
 */
export class KrakenBulkTradesApi {
  constructor(private readonly base: KrakenBulkBase) {}

  /**
   * Download Trades bulk data ZIP.
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
        'trades',
        source,
        TRADES_COMPLETE_FILE_ID,
        TRADES_COMPLETE_URL,
        opts,
      );
    }
    return this.downloadQuarter(source.quarter, opts);
  }

  /**
   * Extract Trades bulk data ZIP.
   *
   * @param source
   * @param opts
   * @returns { Promise<KrakenBulkExtractResult> }
   */
  extract(
    source: KrakenBulkSource,
    opts?: KrakenBulkExtractOptions,
  ): Promise<KrakenBulkExtractResult> {
    return this.base.extract('trades', source, opts);
  }

  /**
   * Check if Trades bulk data ZIP and extracted directory exist.
   *
   * @param source
   * @returns { Promise<KrakenBulkHasResult> }
   */
  has(source: KrakenBulkSource): Promise<KrakenBulkHasResult> {
    return this.base.has('trades', source);
  }

  /**
   * Delete Trades bulk data ZIP and/or extracted directory.
   *
   * @param params
   * @returns { Promise<void> }
   */
  delete(params: {
    scope: 'zips' | 'extracted' | 'all';
    source?: KrakenBulkSource;
  }): Promise<void> {
    return this.base.delete('trades', params);
  }

  /**
   * Query Trades data for a specific pair.
   *
   * @param q
   * @param opts
   * @returns { AsyncIterable<KrakenBulkTradeRow> }
   */
  query(
    q: KrakenBulkTradesQuery,
    opts?: KrakenBulkQueryOptions,
  ): AsyncIterable<KrakenBulkTradeRow> {
    const source = q.source ?? { type: 'complete' as const };
    return this.queryFromExtracted(source, q, opts);
  }

  /**
   * List available trading pairs in the extracted Trades data.
   *
   * @param source
   * @returns { Promise<string[]> }
   */
  async listPairs(
    source: KrakenBulkSource = { type: 'complete' },
  ): Promise<string[]> {
    const extractedDir = this.base.extractedDir('trades', source);
    if (!(await fileExists(extractedDir))) return [];

    const files = await readdir(extractedDir);
    return files
      .filter((f) => f.toLowerCase().endsWith('.csv'))
      .map((f) => f.slice(0, -4))
      .sort();
  }

  /**
   * List available quarters for Trades quarterly datasets.
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

    const files = await this.base.listDriveFolder(TRADES_QUARTERLY_FOLDER_ID);

    // Seen naming patterns:
    // - Kraken_Trades_Q3_2024.zip
    // - Kraken_Trading_History_Q3_2024.zip
    const re = /^Kraken_(?:Trades|Trading_History)_Q([1-4])_(\d{4})\.zip$/i;

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
   * Supports both common CSV layouts:
   * - [ts, price, volume, ...]
   * - [price, volume, ts, ...] (Kraken REST-style)
   */
  private async *queryFromExtracted(
    source: KrakenBulkSource,
    q: KrakenBulkTradesQuery,
    opts?: KrakenBulkQueryOptions,
  ): AsyncIterable<KrakenBulkTradeRow> {
    const extractedDir = this.base.extractedDir('trades', source);

    if (!(await fileExists(extractedDir))) {
      this.base.logger?.warn?.(
        'Bulk trades query requested but data not extracted',
        { source, extractedDir, pair: q.pair },
      );
      return;
    }

    const csvPath = path.join(extractedDir, `${q.pair}.csv`);

    if (!(await fileExists(csvPath))) {
      this.base.logger?.warn?.('Bulk trades CSV not found for pair', {
        source,
        extractedDir,
        pair: q.pair,
        csvPath,
      });
      return;
    }

    const startTs = q.startTs;
    const endTs = q.endTs;
    const limit = opts?.limit;

    let yielded = 0;

    for await (const row of streamCsvRows(csvPath)) {
      if (row.length < 3) continue;

      // Heuristic: if row[2] looks like an epoch timestamp, treat layout as [price, volume, ts, ...]
      const n0 = Number(row[0]);
      const n2 = Number(row[2]);

      const tsIdx = Number.isFinite(n2) && n2 > 1_000_000_000 ? 2 : 0;
      const priceIdx = tsIdx === 2 ? 0 : 1;
      const volumeIdx = tsIdx === 2 ? 1 : 2;

      const ts = Number(row[tsIdx]);
      if (!Number.isFinite(ts)) continue;

      if (startTs !== undefined && ts < startTs) continue;
      if (endTs !== undefined && ts >= endTs) continue;

      const price = row[priceIdx];
      const volume = row[volumeIdx];

      yield { ts, price, volume };

      yielded += 1;
      if (limit !== undefined && yielded >= limit) return;
    }
  }

  /**
   * Download quarterly Trades ZIP.
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

    await this.base.ensureDatasetDirs('trades');

    const zipPath = this.base.zipPath('trades', source);
    const forceRefresh = !!opts?.forceRefresh;

    // Rule #1: if exists, return unless forceRefresh
    if (!forceRefresh && (await fileExists(zipPath))) {
      const bytes = await this.base.safeStatSize(zipPath);
      return { dataset: 'trades', source, zipPath, bytes, downloaded: false };
    }

    // Candidate names observed in the Drive folder
    const folderQuarter = toFolderQuarter(quarter); // "2024Q3" -> "3_2024"
    const wantedCandidates = [
      `Kraken_Trades_Q${folderQuarter}.zip`,
      `Kraken_Trading_History_Q${folderQuarter}.zip`,
    ];

    // Rule #2: if missing (or forceRefresh) and no key -> key-required error
    if (!this.base.hasGoogleDriveApiKey()) {
      throw new KrakenBulkError(
        'BULK_DRIVE_API_KEY_REQUIRED',
        `Google Drive API key not provided; cannot download trades quarterly ZIP for ${quarter}.`,
        {
          dataset: 'trades',
          quarter,
          wantedCandidates,
          expectedPath: zipPath,
          folderId: TRADES_QUARTERLY_FOLDER_ID,
          folderUrl: TRADES_QUARTERLY_FOLDER_URL,
          forceRefresh,
          envVar: this.base.driveApiKeyEnvVar(),
          option: 'googleDriveApiKey',
          manualHint:
            'You can manually download the ZIP and place it at expectedPath to proceed without an API key.',
        },
      );
    }

    // Seamless mode: list via Drive API and download by fileId
    const files = await this.base.listDriveFolder(TRADES_QUARTERLY_FOLDER_ID);

    const match =
      files.find((f) => wantedCandidates.includes(f.name)) ??
      files.find((f) =>
        wantedCandidates.some(
          (w) => f.name.trim().toLowerCase() === w.trim().toLowerCase(),
        ),
      );

    if (!match) {
      const sample = files.slice(0, 15).map((f) => f.name);

      this.base.logger?.warn?.(
        'Trades quarterly ZIP not found in Drive folder',
        {
          quarter,
          folder: TRADES_QUARTERLY_FOLDER_URL,
          wantedCandidates,
          availableCount: files.length,
          availableSample: sample,
        },
      );

      throw new KrakenBulkError(
        'BULK_DRIVE_QUARTER_NOT_FOUND',
        `Trades quarterly ZIP not found for ${quarter}`,
        {
          dataset: 'trades',
          quarter,
          wantedCandidates,
          folderId: TRADES_QUARTERLY_FOLDER_ID,
          folderUrl: TRADES_QUARTERLY_FOLDER_URL,
          availableCount: files.length,
          availableSample: sample,
        },
      );
    }

    const fileViewUrl = `https://drive.google.com/file/d/${match.id}/view?usp=sharing`;

    return this.base.downloadByFileId(
      'trades',
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
