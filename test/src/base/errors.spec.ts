import { describe, it, expect } from 'vitest';

// adjust path as needed
import { KrakenApiError } from '../../../src/base/errors';

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
    expect(err.krakenErrorCodes).toBeUndefined();
    expect(err.rawBody).toBeUndefined();
  });
});
