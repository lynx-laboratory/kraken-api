import { KrakenRateLimitOptions, Limiter } from '../base/rateLimit';

// How the REST API wraps results
export interface KrakenApiResponse<T> {
  error: string[];
  result: T;
}

// Common client options
export interface KrakenClientOptions {
  baseUrl?: string; // default: https://api.kraken.com
  timeoutMs?: number; // default: e.g. 10_000
  userAgent?: string;

  // Used for private endpoints
  apiKey?: string;
  apiSecret?: string;

  logger?: KrakenLogger;

  /**
   * Rate limiting configuration.
   * Default: { mode: "auto", tier: "starter", retryOnRateLimit: true }
   */
  rateLimit?: KrakenRateLimitOptions;

  /**
   * Optional custom limiter(s) if you want to centralize throttling.
   * If provided, takes precedence over rateLimit.mode="auto".
   */
  limiter?: {
    rest?: Limiter;
    trading?: Limiter;
  };
}

// Optional logger that callers can adapt (e.g. to Winston)
export interface KrakenLogger {
  debug?(msg: string, meta?: unknown): void;
  info?(msg: string, meta?: unknown): void;
  warn?(msg: string, meta?: unknown): void;
  error?(msg: string, meta?: unknown): void;
}

export type KrakenWsTriggerReference = 'index' | 'last';
export type KrakenWsPriceType = 'static' | 'pct' | 'quote';

// ===== Bulk (Downloadable CSV/ZIP data) =====

export type KrakenBulkDataset = 'trades' | 'ohlcvt';

export type KrakenBulkQuarter = `${number}Q${1 | 2 | 3 | 4}`;

export type KrakenBulkSource =
  | { type: 'complete' }
  | { type: 'quarterly'; quarter: KrakenBulkQuarter };

export interface KrakenBulkClientOptions {
  /**
   * Storage root for bulk data.
   * Default: ~/.lynx-crypto/bulk
   *
   * If relative, resolved against process.cwd().
   */
  storageDir?: string;

  userAgent?: string;
  logger?: KrakenLogger;

  /**
   * Optional Google Drive API key.
   * If omitted, bulk ZIP downloads require manual placement (no Drive downloading, no scraping).
   */
  googleDriveApiKey?: string;
}

export interface KrakenBulkDownloadResult {
  dataset: KrakenBulkDataset;
  source: KrakenBulkSource;
  zipPath: string;
  bytes: number;
  downloaded: boolean;
  directUrl?: string;
}

export interface KrakenBulkExtractResult {
  dataset: KrakenBulkDataset;
  source: KrakenBulkSource;
  extractedDir: string;
  filesExtracted: number;
  extracted: boolean;
}

export type KrakenBulkDeleteScope = 'zips' | 'extracted' | 'all';

export interface KrakenBulkDeleteParams {
  scope: KrakenBulkDeleteScope;
  source?: KrakenBulkSource;
}

export interface KrakenBulkHasResult {
  zip: boolean;
  extracted: boolean;
}

export interface KrakenBulkTradeRow {
  ts: number; // unix seconds
  price: string;
  volume: string;
}

export type KrakenBulkOhlcInterval = 1 | 5 | 15 | 30 | 60 | 240 | 720 | 1440;

export interface KrakenBulkOhlcvtRow {
  ts: number; // unix seconds
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  trades: number;
}

export interface KrakenBulkTradesQuery {
  pair: string;
  startTs?: number; // inclusive
  endTs?: number; // exclusive
  source?: KrakenBulkSource;
}

export interface KrakenBulkOhlcvtQuery {
  pair: string;
  interval: KrakenBulkOhlcInterval;
  startTs?: number;
  endTs?: number;
  source?: KrakenBulkSource;
}

export interface KrakenBulkQueryOptions {
  limit?: number;
}

export type KrakenBulkDownloadProgress = {
  downloadedBytes: number;
  totalBytes?: number;
};

export type KrakenBulkDownloadProgressCallback = (p: {
  downloadedBytes: number;
  totalBytes?: number;
}) => void;

export interface KrakenBulkDownloadOptions {
  onProgress?: KrakenBulkDownloadProgressCallback;

  /**
   * If true, re-download even if the ZIP already exists locally.
   * Requires googleDriveApiKey (or env KRAKEN_API_GOOGLE_DRIVE_API_KEY).
   */
  forceRefresh?: boolean;
}

export type KrakenBulkExtractProgressCallback = (p: {
  extractedFiles: number;
  totalFiles?: number;
  currentFile?: string;
}) => void;

export type KrakenBulkExtractOptions = {
  onProgress?: KrakenBulkExtractProgressCallback;
  concurrency?: number;
};
