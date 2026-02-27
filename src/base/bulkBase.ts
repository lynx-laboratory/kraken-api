import os from 'node:os';
import path from 'node:path';
import { readdir, stat, writeFile } from 'node:fs/promises';

import type {
  KrakenBulkClientOptions,
  KrakenBulkDataset,
  KrakenBulkDeleteParams,
  KrakenBulkDownloadOptions,
  KrakenBulkDownloadResult,
  KrakenBulkExtractOptions,
  KrakenBulkExtractResult,
  KrakenBulkHasResult,
  KrakenBulkSource,
  KrakenLogger,
} from '../types/types';

import { ensureDir, fileExists, rmPath } from '../utils/fs';
import {
  downloadDriveFileByIdApiKey,
  listDriveFolderFilesApiKey,
} from '../utils/googleDriveApi';
import { extractZipFile } from '../utils/zip';
import { KrakenBulkError } from './errors';

// Keep this aligned with your docblocks
const ENV_GOOGLE_DRIVE_API_KEY = 'KRAKEN_API_GOOGLE_DRIVE_API_KEY';

type ZipBucket = 'complete' | 'quarterly';
type ExtractBucket = 'complete' | 'quarterly';

const MARKER_OK = '.extracted.ok';
const MARKER_IN_PROGRESS = '.extracting';

export class KrakenBulkBase {
  readonly logger?: KrakenLogger;
  readonly userAgent?: string;

  private readonly storageDir: string;
  private readonly googleDriveApiKey?: string;

  private driveFolderCache = new Map<
    string,
    Promise<Array<{ id: string; name: string }>>
  >();

  constructor(options: KrakenBulkClientOptions = {}) {
    this.logger = options.logger;
    this.userAgent = options.userAgent;

    this.googleDriveApiKey =
      options.googleDriveApiKey ?? process.env[ENV_GOOGLE_DRIVE_API_KEY];

    const base =
      options.storageDir ?? path.join(os.homedir(), '.lynx-crypto', 'bulk');

    this.storageDir = path.isAbsolute(base)
      ? base
      : path.resolve(process.cwd(), base);
  }

  // ---------- config helpers ----------

  public driveApiKeyEnvVar(): string {
    return ENV_GOOGLE_DRIVE_API_KEY;
  }

  public hasGoogleDriveApiKey(): boolean {
    return !!this.googleDriveApiKey;
  }

  public getStorageDir(): string {
    return this.storageDir;
  }

  public sourceKey(source: KrakenBulkSource): string {
    return source.type === 'complete' ? 'complete' : source.quarter;
  }

  // ---------- directory layout ----------

  public datasetDir(dataset: KrakenBulkDataset): string {
    return path.join(this.storageDir, dataset);
  }

  public zipsDir(dataset: KrakenBulkDataset): string {
    return path.join(this.datasetDir(dataset), 'zips');
  }

  public extractedRootDir(dataset: KrakenBulkDataset): string {
    return path.join(this.datasetDir(dataset), 'extracted');
  }

  private zipBucket(source: KrakenBulkSource): ZipBucket {
    return source.type === 'complete' ? 'complete' : 'quarterly';
  }

  private extractBucket(source: KrakenBulkSource): ExtractBucket {
    return source.type === 'complete' ? 'complete' : 'quarterly';
  }

  private zipsBucketDir(
    dataset: KrakenBulkDataset,
    source: KrakenBulkSource,
  ): string {
    return path.join(this.zipsDir(dataset), this.zipBucket(source));
  }

  private extractedBucketDir(
    dataset: KrakenBulkDataset,
    source: KrakenBulkSource,
  ): string {
    if (source.type === 'complete') {
      return path.join(this.extractedRootDir(dataset), 'complete');
    }
    return path.join(
      this.extractedRootDir(dataset),
      'quarterly',
      source.quarter,
    );
  }

  /**
   * New location ONLY:
   *  - .../zips/complete/complete.zip
   *  - .../zips/quarterly/<YYYYQn>.zip
   */
  public zipPath(dataset: KrakenBulkDataset, source: KrakenBulkSource): string {
    return path.join(
      this.zipsBucketDir(dataset, source),
      `${this.sourceKey(source)}.zip`,
    );
  }

  /**
   * New extracted location ONLY:
   *  - .../extracted/complete/
   *  - .../extracted/quarterly/<YYYYQn>/
   */
  public extractedDir(
    dataset: KrakenBulkDataset,
    source: KrakenBulkSource,
  ): string {
    return this.extractedBucketDir(dataset, source);
  }

  public async ensureDatasetDirs(dataset: KrakenBulkDataset): Promise<void> {
    await ensureDir(this.datasetDir(dataset));

    // zips buckets
    await ensureDir(this.zipsDir(dataset));
    await ensureDir(path.join(this.zipsDir(dataset), 'complete'));
    await ensureDir(path.join(this.zipsDir(dataset), 'quarterly'));

    // extracted buckets
    await ensureDir(this.extractedRootDir(dataset));
    await ensureDir(path.join(this.extractedRootDir(dataset), 'complete'));
    await ensureDir(path.join(this.extractedRootDir(dataset), 'quarterly'));
  }

  // ---------- has ----------

  public async has(
    dataset: KrakenBulkDataset,
    source: KrakenBulkSource,
  ): Promise<KrakenBulkHasResult> {
    await this.ensureDatasetDirs(dataset);

    const zipPath = this.zipPath(dataset, source);
    const extractedDir = this.extractedDir(dataset, source);

    return {
      zip: await fileExists(zipPath),
      extracted: await this.isExtractedReady(extractedDir),
    };
  }

  // ---------- downloads ----------

  public async downloadByFileId(
    dataset: KrakenBulkDataset,
    source: KrakenBulkSource,
    fileId: string,
    originalUrl: string,
    opts?: KrakenBulkDownloadOptions,
  ): Promise<KrakenBulkDownloadResult> {
    await this.ensureDatasetDirs(dataset);

    const zipPath = this.zipPath(dataset, source);
    const forceRefresh = !!opts?.forceRefresh;

    // Rule #1: if exists, return unless forceRefresh
    if (!forceRefresh && (await fileExists(zipPath))) {
      const bytes = await this.safeStatSize(zipPath);
      this.logger?.info?.('Bulk ZIP already exists; skipping download', {
        dataset,
        source,
        zipPath,
        bytes,
        originalUrl,
      });
      return { dataset, source, zipPath, bytes, downloaded: false };
    }

    // Rule #2: if missing (or forceRefresh) and no key -> key-required error
    if (!this.googleDriveApiKey) {
      this.logger?.warn?.('Bulk ZIP download requested but API key missing', {
        dataset,
        source,
        zipPath,
        originalUrl,
        forceRefresh,
      });

      throw new KrakenBulkError(
        'BULK_DRIVE_API_KEY_REQUIRED',
        `Google Drive API key not provided; cannot download ${dataset}/${this.sourceKey(
          source,
        )}.`,
        {
          dataset,
          source,
          expectedPath: zipPath,
          zipPath,
          originalUrl,
          fileId,
          forceRefresh,
          envVar: ENV_GOOGLE_DRIVE_API_KEY,
          option: 'googleDriveApiKey',
          manualHint:
            'You can manually download the ZIP and place it at expectedPath to proceed without an API key.',
        },
      );
    }

    this.logger?.info?.('Bulk ZIP download starting (Drive API)', {
      dataset,
      source,
      zipPath,
      fileId,
      originalUrl,
      forceRefresh,
    });

    try {
      const result = await downloadDriveFileByIdApiKey({
        fileId,
        apiKey: this.googleDriveApiKey,
        destinationPath: zipPath,
        userAgent: this.userAgent,
        logger: this.logger,
        onProgress: opts?.onProgress,
      });

      return {
        dataset,
        source,
        zipPath,
        bytes: result.bytes,
        downloaded: true,
        directUrl: originalUrl,
      };
    } catch (err) {
      this.logger?.error?.('Bulk ZIP download failed (Drive API)', {
        dataset,
        source,
        zipPath,
        fileId,
        originalUrl,
        err: err instanceof Error ? err.message : String(err),
      });

      throw new KrakenBulkError(
        'BULK_DRIVE_DOWNLOAD_FAILED',
        `Bulk download failed for ${dataset}/${this.sourceKey(source)}`,
        { dataset, source, zipPath, fileId, originalUrl, err },
      );
    }
  }

  // ---------- extract ----------

  public async extract(
    dataset: KrakenBulkDataset,
    source: KrakenBulkSource,
    opts?: KrakenBulkExtractOptions,
  ): Promise<KrakenBulkExtractResult> {
    await this.ensureDatasetDirs(dataset);

    const zipPath = this.zipPath(dataset, source);
    const extractedDir = this.extractedDir(dataset, source);

    if (!(await fileExists(zipPath))) {
      this.logger?.warn?.('Bulk extract requested but ZIP missing', {
        dataset,
        source,
        zipPath,
      });
      return {
        dataset,
        source,
        extractedDir,
        filesExtracted: 0,
        extracted: false,
      };
    }

    // If dir exists, decide whether it's "ready", "in-progress", or "broken/empty"
    if (await fileExists(extractedDir)) {
      const ok = await fileExists(this.markerOkPath(extractedDir));
      const inprog = await fileExists(this.markerInProgressPath(extractedDir));

      if (ok) {
        this.logger?.info?.('Bulk already extracted; skipping extraction', {
          dataset,
          source,
          extractedDir,
        });
        return {
          dataset,
          source,
          extractedDir,
          filesExtracted: 0,
          extracted: false,
        };
      }

      // If we crashed mid-extract, or dir is empty, nuke and redo.
      // If legacy extracted (CSVs exist) but no marker, write marker and treat as extracted.
      const hasCsv = await this.dirHasCsv(extractedDir, 2);

      if (inprog || !hasCsv) {
        this.logger?.warn?.(
          'Bulk extracted dir exists but is incomplete; re-extracting',
          {
            dataset,
            source,
            extractedDir,
            inProgressMarker: inprog,
            hasCsv,
          },
        );

        await rmPath(extractedDir);
        await ensureDir(extractedDir);
      } else {
        // Legacy extraction: csvs exist but no marker -> mark it as OK
        await this.writeMarkerOk(extractedDir, {
          dataset,
          source,
          note: 'legacy-extraction-detected',
        });

        this.logger?.info?.(
          'Bulk extraction marker missing but CSVs found; marked as extracted',
          { dataset, source, extractedDir },
        );

        return {
          dataset,
          source,
          extractedDir,
          filesExtracted: 0,
          extracted: false,
        };
      }
    } else {
      await ensureDir(extractedDir);
    }

    // mark in-progress
    await this.writeMarkerInProgress(extractedDir, { dataset, source });

    this.logger?.info?.('Bulk ZIP extraction starting', {
      dataset,
      source,
      zipPath,
      extractedDir,
      concurrency: opts?.concurrency,
    });

    try {
      const filesExtracted = await extractZipFile(zipPath, extractedDir, {
        onProgress: opts?.onProgress,
        concurrency: opts?.concurrency,
      });

      await rmPath(this.markerInProgressPath(extractedDir));
      await this.writeMarkerOk(extractedDir, {
        dataset,
        source,
        filesExtracted,
        at: new Date().toISOString(),
      });

      this.logger?.info?.('Bulk ZIP extraction complete', {
        dataset,
        source,
        extractedDir,
        filesExtracted,
      });

      return {
        dataset,
        source,
        extractedDir,
        filesExtracted,
        extracted: true,
      };
    } catch (err) {
      // leave a breadcrumb that we failed mid-extract
      this.logger?.error?.('Bulk ZIP extraction failed', {
        dataset,
        source,
        zipPath,
        extractedDir,
        err: err instanceof Error ? err.message : String(err),
      });

      // keep .extracting marker (helps detect incomplete next run)
      throw err;
    }
  }

  // ---------- delete ----------

  public async delete(
    dataset: KrakenBulkDataset,
    params: KrakenBulkDeleteParams,
  ): Promise<void> {
    await this.ensureDatasetDirs(dataset);

    const source = params.source;

    const deleteOne = async (src: KrakenBulkSource) => {
      const zipPath = this.zipPath(dataset, src);
      const extractedDir = this.extractedDir(dataset, src);

      if (params.scope === 'zips' || params.scope === 'all') {
        await rmPath(zipPath);
      }
      if (params.scope === 'extracted' || params.scope === 'all') {
        await rmPath(extractedDir);
      }
    };

    if (source) {
      await deleteOne(source);
      return;
    }

    // dataset-wide delete
    if (params.scope === 'zips' || params.scope === 'all') {
      await rmPath(this.zipsDir(dataset));
      await ensureDir(this.zipsDir(dataset));
      await ensureDir(path.join(this.zipsDir(dataset), 'complete'));
      await ensureDir(path.join(this.zipsDir(dataset), 'quarterly'));
    }

    if (params.scope === 'extracted' || params.scope === 'all') {
      await rmPath(this.extractedRootDir(dataset));
      await ensureDir(this.extractedRootDir(dataset));
      await ensureDir(path.join(this.extractedRootDir(dataset), 'complete'));
      await ensureDir(path.join(this.extractedRootDir(dataset), 'quarterly'));
    }
  }

  // ---------- Drive listing ----------

  public async listDriveFolder(
    folderId: string,
  ): Promise<Array<{ id: string; name: string }>> {
    if (!this.googleDriveApiKey) {
      throw new KrakenBulkError(
        'BULK_DRIVE_API_KEY_REQUIRED',
        'Google Drive API key not provided; cannot list Drive folders.',
        {
          folderId,
          envVar: ENV_GOOGLE_DRIVE_API_KEY,
          option: 'googleDriveApiKey',
        },
      );
    }

    const cached = this.driveFolderCache.get(folderId);
    if (cached) return cached;

    const p = listDriveFolderFilesApiKey({
      folderId,
      apiKey: this.googleDriveApiKey,
      userAgent: this.userAgent,
      logger: this.logger,
    });

    this.driveFolderCache.set(folderId, p);
    return p;
  }

  // ---------- CSV path resolution ----------

  /**
   * Resolve a CSV filename within an extracted directory.
   * Checks the flat path first, then searches one level of subdirectories.
   * Returns the resolved path or null if not found.
   */
  public async resolveCsvPath(
    extractedDir: string,
    filename: string,
  ): Promise<string | null> {
    // Fast path: flat layout
    const flat = path.join(extractedDir, filename);
    if (await fileExists(flat)) return flat;

    // Search one level of subdirectories (e.g. TimeAndSales_Q3/, OHLCVT_Q3/)
    let entries: string[];
    try {
      entries = await readdir(extractedDir);
    } catch {
      return null;
    }

    for (const entry of entries) {
      if (entry.startsWith('.')) continue;
      const sub = path.join(extractedDir, entry, filename);
      if (await fileExists(sub)) return sub;
    }

    return null;
  }

  /**
   * List all CSV files within an extracted directory, including one level of
   * subdirectories. Returns filenames only (not full paths).
   */
  public async listCsvFiles(extractedDir: string): Promise<string[]> {
    if (!(await fileExists(extractedDir))) return [];

    const result: string[] = [];
    let entries: string[];
    try {
      entries = await readdir(extractedDir);
    } catch {
      return [];
    }

    for (const entry of entries) {
      if (entry.toLowerCase().endsWith('.csv')) {
        result.push(entry);
        continue;
      }
      if (entry.startsWith('.')) continue;

      // Check subdirectory
      const subDir = path.join(extractedDir, entry);
      try {
        const subEntries = await readdir(subDir);
        for (const sub of subEntries) {
          if (sub.toLowerCase().endsWith('.csv')) {
            result.push(sub);
          }
        }
      } catch {
        // Not a directory or not readable — skip
      }
    }

    return result;
  }

  // ---------- misc ----------

  public async safeStatSize(p: string): Promise<number> {
    try {
      const st = await stat(p);
      return st.size;
    } catch {
      return 0;
    }
  }

  // ---------- marker + detection ----------

  private markerOkPath(dir: string): string {
    return path.join(dir, MARKER_OK);
  }

  private markerInProgressPath(dir: string): string {
    return path.join(dir, MARKER_IN_PROGRESS);
  }

  private async writeMarkerInProgress(dir: string, meta: unknown) {
    const p = this.markerInProgressPath(dir);
    await writeFile(p, JSON.stringify({ at: new Date().toISOString(), meta }));
  }

  private async writeMarkerOk(dir: string, meta: unknown) {
    const p = this.markerOkPath(dir);
    await writeFile(p, JSON.stringify({ at: new Date().toISOString(), meta }));
  }

  private async isExtractedReady(extractedDir: string): Promise<boolean> {
    if (!(await fileExists(extractedDir))) return false;

    // strong signal
    if (await fileExists(this.markerOkPath(extractedDir))) return true;

    // if it's currently extracting, it's not ready
    if (await fileExists(this.markerInProgressPath(extractedDir))) return false;

    // legacy signal (best effort)
    return this.dirHasCsv(extractedDir, 2);
  }

  private async dirHasCsv(dir: string, depth: number): Promise<boolean> {
    let entries: string[] = [];
    try {
      entries = await readdir(dir);
    } catch {
      return false;
    }

    for (const name of entries) {
      if (name === MARKER_OK || name === MARKER_IN_PROGRESS) continue;

      const full = path.join(dir, name);

      if (name.toLowerCase().endsWith('.csv')) return true;

      if (depth > 0) {
        // cheap directory check: try reading; if it fails, ignore
        try {
          const sub = await readdir(full);
          // it is a directory if readdir works
          // quick scan: if any file is csv, return true
          for (const s of sub) {
            if (s.toLowerCase().endsWith('.csv')) return true;
          }
          // recurse one more level if needed
          if (depth - 1 > 0) {
            for (const s of sub) {
              const subFull = path.join(full, s);
              try {
                const sub2 = await readdir(subFull);
                for (const t of sub2) {
                  if (t.toLowerCase().endsWith('.csv')) return true;
                }
              } catch {
                // ignore
              }
            }
          }
        } catch {
          // ignore non-dirs
        }
      }
    }

    return false;
  }
}
