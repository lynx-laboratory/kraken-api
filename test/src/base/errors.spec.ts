import { describe, it, expect } from 'vitest';

// adjust path as needed
import { KrakenApiError, KrakenBulkError } from '../../../src/base/errors';

describe('KrakenApiError', () => {
  it('sets name, message, and details fields', () => {
    const err = new KrakenApiError('boom', {
      endpoint: '/0/public/Time',
      httpStatus: 429,
      httpStatusText: 'Too Many Requests',
      krakenErrorCodes: ['EGeneral:Rate limit exceeded'],
      rawBody: { error: ['EGeneral:Rate limit exceeded'], result: null },
    });

    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('KrakenApiError');
    expect(err.message).toBe('boom');

    expect(err.endpoint).toBe('/0/public/Time');
    expect(err.httpStatus).toBe(429);
    expect(err.httpStatusText).toBe('Too Many Requests');
    expect(err.krakenErrorCodes).toEqual(['EGeneral:Rate limit exceeded']);
    expect(err.rawBody).toEqual({
      error: ['EGeneral:Rate limit exceeded'],
      result: null,
    });
  });

  it('works with no details', () => {
    const err = new KrakenApiError('no details');
    expect(err.name).toBe('KrakenApiError');
    expect(err.message).toBe('no details');
    expect(err.endpoint).toBeUndefined();
    expect(err.httpStatus).toBeUndefined();
    expect(err.httpStatusText).toBeUndefined();
    expect(err.krakenErrorCodes).toBeUndefined();
    expect(err.rawBody).toBeUndefined();
  });

  it('sets prototype correctly (Object.setPrototypeOf branch)', () => {
    const err = new KrakenApiError('proto');
    // this is the real reason for Object.setPrototypeOf(...) in TS/ES5
    expect(err).toBeInstanceOf(KrakenApiError);
  });
});

describe('KrakenBulkError', () => {
  it('sets name, code, message, and meta', () => {
    const meta = { dataset: 'ohlcvt', quarter: '2024Q3', wanted: 'x.zip' };

    const err = new KrakenBulkError(
      'BULK_DRIVE_QUARTER_NOT_FOUND',
      'no zip',
      meta,
    );

    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(KrakenBulkError);

    expect(err.name).toBe('KrakenBulkError');
    expect(err.message).toBe('no zip');

    expect(err.code).toBe('BULK_DRIVE_QUARTER_NOT_FOUND');
    expect(err.meta).toEqual(meta);
  });

  it('works with no meta', () => {
    const err = new KrakenBulkError(
      'BULK_DRIVE_DOWNLOAD_FAILED',
      'download failed',
    );

    expect(err.name).toBe('KrakenBulkError');
    expect(err.message).toBe('download failed');
    expect(err.code).toBe('BULK_DRIVE_DOWNLOAD_FAILED');
    expect(err.meta).toBeUndefined();
  });
});
