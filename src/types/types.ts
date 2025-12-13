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
}

// Optional logger that callers can adapt (e.g. to Winston)
export interface KrakenLogger {
  debug?(msg: string, meta?: unknown): void;
  info?(msg: string, meta?: unknown): void;
  warn?(msg: string, meta?: unknown): void;
  error?(msg: string, meta?: unknown): void;
}
