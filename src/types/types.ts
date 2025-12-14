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
