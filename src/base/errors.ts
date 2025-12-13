export interface KrakenApiErrorDetails {
  endpoint?: string; // e.g. "/0/public/Time"
  httpStatus?: number; // e.g. 429, 500
  httpStatusText?: string;
  krakenErrorCodes?: string[]; // contents of result.error[]
  rawBody?: unknown; // parsed JSON if available
}

/**
 * Error thrown for any Kraken REST API issue:
 * - HTTP errors (non-2xx)
 * - Kraken-level errors (non-empty `error` array)
 * - Parse/format issues
 */
export class KrakenApiError extends Error {
  readonly name = 'KrakenApiError';

  readonly endpoint?: string;
  readonly httpStatus?: number;
  readonly httpStatusText?: string;
  readonly krakenErrorCodes?: string[];
  readonly rawBody?: unknown;

  constructor(message: string, details: KrakenApiErrorDetails = {}) {
    super(message);

    // Needed when targeting ES5
    Object.setPrototypeOf(this, new.target.prototype);

    this.endpoint = details.endpoint;
    this.httpStatus = details.httpStatus;
    this.httpStatusText = details.httpStatusText;
    this.krakenErrorCodes = details.krakenErrorCodes;
    this.rawBody = details.rawBody;
  }
}
