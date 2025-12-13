import { vi, expect } from 'vitest';
import type { KrakenRestBase } from '../../src/base/restBase';

/**
 * Minimal KrakenRestBase mock focused on privatePost/publicGet.
 * Add more methods as you need them.
 */
export function mockRestBase() {
  const base = {
    privatePost: vi.fn(),
    publicGet: vi.fn(),
  } as unknown as KrakenRestBase;

  return {
    base,
    privatePost: (base as any).privatePost as ReturnType<typeof vi.fn>,
    publicGet: (base as any).publicGet as ReturnType<typeof vi.fn>,
  };
}

/**
 * Assert privatePost was called exactly once, with exact path+body.
 * (Exact body is important so we catch accidental extra keys.)
 */
export function expectPrivatePostOnce(
  privatePost: ReturnType<typeof vi.fn>,
  path: string,
  body: Record<string, unknown>,
) {
  expect(privatePost).toHaveBeenCalledTimes(1);
  expect(privatePost).toHaveBeenCalledWith(path, body);
}

/**
 * Assert a request body does NOT contain any of the given keys.
 * Useful for optional params: we want omissions, not "undefined" strings.
 */
export function expectBodyOmits(body: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    expect(Object.prototype.hasOwnProperty.call(body, key)).toBe(false);
  }
}

/**
 * Helper to grab the body passed to privatePost on the first call.
 */
export function getPrivatePostBody(
  privatePost: ReturnType<typeof vi.fn>,
): Record<string, unknown> {
  const call = privatePost.mock.calls[0];
  if (!call) throw new Error('privatePost was not called');
  return call[1] as Record<string, unknown>;
}
