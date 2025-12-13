import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { KrakenRestBase } from '../../../src/base/restBase';
import { KrakenApiError } from '../../../src/base/errors';

function makeOkJsonResponse<T>(
  result: T,
  init?: Partial<ResponseLike>,
): ResponseLike {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    json: vi.fn(async () => ({ error: [], result })),
    text: vi.fn(async () => JSON.stringify({ error: [], result })),
    arrayBuffer: vi.fn(async () => new ArrayBuffer(0)),
    headers: {
      get: vi.fn(() => 'application/json'),
    },
    ...init,
  };
}

function makeHttpErrorResponse(init?: Partial<ResponseLike>): ResponseLike {
  return {
    ok: false,
    status: 500,
    statusText: 'Internal Server Error',
    json: vi.fn(async () => {
      throw new Error('should not call json on http error in these tests');
    }),
    text: vi.fn(async () => 'oops'),
    arrayBuffer: vi.fn(async () => new ArrayBuffer(0)),
    headers: {
      get: vi.fn(() => 'text/plain'),
    },
    ...init,
  };
}

type ResponseLike = {
  ok: boolean;
  status: number;
  statusText: string;
  json: () => Promise<any>;
  text: () => Promise<string>;
  arrayBuffer: () => Promise<ArrayBuffer>;
  headers: { get: (name: string) => string | null };
};

class TestRestBase extends KrakenRestBase {
  // expose protected methods for unit tests
  _createNonce() {
    return this.createNonce();
  }
  _signPrivateRequest(path: string, nonce: string, postData: string) {
    return this.signPrivateRequest(path, nonce, postData);
  }
  async _privatePostBinary(path: string, body?: Record<string, string>) {
    return this.privatePostBinary(path, body);
  }
}

describe('KrakenRestBase', () => {
  const apiSecret = Buffer.from('super-secret').toString('base64');

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    (globalThis as any).fetch = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('createNonce() is strictly increasing within the same millisecond', () => {
    const now = 1700000000000;
    vi.spyOn(Date, 'now').mockReturnValue(now);

    const base = new TestRestBase();
    const a = BigInt(base._createNonce());
    const b = BigInt(base._createNonce());
    const c = BigInt(base._createNonce());

    expect(b).toBe(a + 1n);
    expect(c).toBe(b + 1n);
  });

  it('createNonce() jumps base on a new millisecond', () => {
    const spy = vi.spyOn(Date, 'now');
    spy.mockReturnValueOnce(1700000000000);
    spy.mockReturnValueOnce(1700000000000); // same ms => +1
    spy.mockReturnValueOnce(1700000000001); // next ms => reset to ms*1000

    const base = new TestRestBase();
    const a = BigInt(base._createNonce());
    const b = BigInt(base._createNonce());
    const c = BigInt(base._createNonce());

    expect(b).toBe(a + 1n);
    expect(c).toBe(BigInt(1700000000001) * 1000n);
  });

  it('publicGet() builds query string, sends User-Agent header when provided, and returns result', async () => {
    const fetchMock = vi.fn(async (_url: any, _init: any) =>
      makeOkJsonResponse({ hello: 'world' }),
    );
    (globalThis as any).fetch = fetchMock;

    const base = new TestRestBase({
      baseUrl: 'https://api.kraken.com',
      userAgent: 'UA_TEST',
    });

    const res = await base.publicGet('/0/public/Test', { a: 1, b: 'x' });

    expect(res).toEqual({ hello: 'world' });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [urlArg, init] = fetchMock.mock.calls[0]!;
    expect(String(urlArg)).toContain('/0/public/Test');
    expect(String(urlArg)).toContain('a=1');
    expect(String(urlArg)).toContain('b=x');
    expect(init.method).toBe('GET');
    expect(init.headers).toEqual({ 'User-Agent': 'UA_TEST' });
  });

  it('publicGet() throws KrakenApiError on HTTP error', async () => {
    const fetchMock = vi.fn(async () =>
      makeHttpErrorResponse({ status: 418, statusText: "I'm a teapot" }),
    );
    (globalThis as any).fetch = fetchMock;

    const base = new TestRestBase();

    await expect(base.publicGet('/0/public/Test')).rejects.toBeInstanceOf(
      KrakenApiError,
    );
    await expect(base.publicGet('/0/public/Test')).rejects.toThrow(
      /HTTP error/i,
    );
  });

  it('publicGet() throws KrakenApiError on JSON parse error', async () => {
    const badResp: ResponseLike = {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: vi.fn(async () => {
        throw new Error('bad json');
      }),
      text: vi.fn(async () => 'not json'),
      arrayBuffer: vi.fn(async () => new ArrayBuffer(0)),
      headers: { get: vi.fn(() => 'application/json') },
    };

    (globalThis as any).fetch = vi.fn(async () => badResp);

    const base = new TestRestBase();

    await expect(base.publicGet('/0/public/Test')).rejects.toBeInstanceOf(
      KrakenApiError,
    );
    await expect(base.publicGet('/0/public/Test')).rejects.toThrow(/parse/i);
  });

  it('publicGet() throws KrakenApiError when Kraken returns error[]', async () => {
    const resp: ResponseLike = {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: vi.fn(async () => ({
        error: ['EGeneral:Permission denied'],
        result: {},
      })),
      text: vi.fn(async () => 'x'),
      arrayBuffer: vi.fn(async () => new ArrayBuffer(0)),
      headers: { get: vi.fn(() => 'application/json') },
    };

    (globalThis as any).fetch = vi.fn(async () => resp);

    const base = new TestRestBase();

    await expect(base.publicGet('/0/public/Test')).rejects.toBeInstanceOf(
      KrakenApiError,
    );
    await expect(base.publicGet('/0/public/Test')).rejects.toThrow(
      /Kraken API error/i,
    );
  });

  it('publicGet() aborts via timeoutMs (covers AbortController timeout path)', async () => {
    vi.useFakeTimers();

    const fetchMock = vi.fn((_: any, init: any) => {
      const signal = init?.signal as AbortSignal | undefined;

      return new Promise((_resolve, reject) => {
        const onAbort = () => reject(new Error('Aborted'));
        // node AbortSignal supports addEventListener
        (signal as any)?.addEventListener?.('abort', onAbort);
      });
    });

    (globalThis as any).fetch = fetchMock;

    const base = new TestRestBase({ timeoutMs: 5 });

    const p = base.publicGet('/0/public/Test');
    const assertion = expect(p).rejects.toThrow(/Aborted/i);

    await vi.advanceTimersByTimeAsync(6);
    await assertion;
  });

  it('privatePost() throws KrakenApiError if apiKey/apiSecret missing', async () => {
    const base = new TestRestBase();

    await expect(base.privatePost('/0/private/Balance')).rejects.toBeInstanceOf(
      KrakenApiError,
    );
    await expect(base.privatePost('/0/private/Balance')).rejects.toThrow(
      /Missing apiKey/i,
    );
  });

  it('privatePost() signs, includes nonce, stringifies params, and skips undefined', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1700000000000);

    const base = new TestRestBase({
      apiKey: 'KEY',
      apiSecret,
      userAgent: 'UA_TEST',
    });

    const fetchMock = vi.fn<(url: any, init?: any) => Promise<ResponseLike>>(
      async (_url, _init) => makeOkJsonResponse({ ok: true }),
    );
    (globalThis as any).fetch = fetchMock;

    const res = await base.privatePost('/0/private/Test', {
      a: 1,
      b: true,
      c: undefined,
    });

    expect(res).toEqual({ ok: true });

    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [urlArg, init] = fetchMock.mock.calls[0]!;
    expect(String(urlArg)).toContain('/0/private/Test');
    expect(init.method).toBe('POST');
    expect(init.headers['API-Key']).toBe('KEY');
    expect(typeof init.headers['API-Sign']).toBe('string');
    expect(init.headers['Content-Type']).toBe(
      'application/x-www-form-urlencoded',
    );
    expect(init.headers['User-Agent']).toBe('UA_TEST');

    const body = String(init.body);
    expect(body).toMatch(/nonce=\d+/);
    expect(body).toContain('a=1');
    expect(body).toContain('b=true');
    expect(body).not.toContain('c=');
  });

  it('privatePost() throws KrakenApiError on HTTP error', async () => {
    (globalThis as any).fetch = vi.fn(async () =>
      makeHttpErrorResponse({ status: 401, statusText: 'Unauthorized' }),
    );

    const base = new TestRestBase({
      apiKey: 'KEY',
      apiSecret,
    });

    await expect(base.privatePost('/0/private/Test')).rejects.toBeInstanceOf(
      KrakenApiError,
    );
    await expect(base.privatePost('/0/private/Test')).rejects.toThrow(
      /HTTP error/i,
    );
  });

  it('privatePost() throws KrakenApiError on JSON parse error', async () => {
    const resp: ResponseLike = {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: vi.fn(async () => {
        throw new Error('bad json');
      }),
      text: vi.fn(async () => 'x'),
      arrayBuffer: vi.fn(async () => new ArrayBuffer(0)),
      headers: { get: vi.fn(() => 'application/json') },
    };

    (globalThis as any).fetch = vi.fn(async () => resp);

    const base = new TestRestBase({
      apiKey: 'KEY',
      apiSecret,
    });

    await expect(base.privatePost('/0/private/Test')).rejects.toBeInstanceOf(
      KrakenApiError,
    );
    await expect(base.privatePost('/0/private/Test')).rejects.toThrow(/parse/i);
  });

  it('privatePost() throws KrakenApiError when Kraken returns error[]', async () => {
    const resp: ResponseLike = {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: vi.fn(async () => ({
        error: ['EGeneral:Bad request'],
        result: {},
      })),
      text: vi.fn(async () => 'x'),
      arrayBuffer: vi.fn(async () => new ArrayBuffer(0)),
      headers: { get: vi.fn(() => 'application/json') },
    };

    (globalThis as any).fetch = vi.fn(async () => resp);

    const base = new TestRestBase({
      apiKey: 'KEY',
      apiSecret,
    });

    await expect(base.privatePost('/0/private/Test')).rejects.toBeInstanceOf(
      KrakenApiError,
    );
    await expect(base.privatePost('/0/private/Test')).rejects.toThrow(
      /Kraken private API error/i,
    );
  });

  it('signPrivateRequest() throws if apiSecret is missing', () => {
    const base = new TestRestBase({ apiKey: 'KEY' });

    expect(() =>
      base._signPrivateRequest('/0/private/Test', '1', 'nonce=1'),
    ).toThrow(/apiSecret/i);
  });

  it('privatePostBinary() throws if apiKey/apiSecret missing', async () => {
    const base = new TestRestBase();

    await expect(
      base._privatePostBinary('/0/private/RetrieveExport'),
    ).rejects.toThrow(/apiKey and apiSecret/i);
  });

  it('privatePostBinary() throws on non-ok response and includes response text', async () => {
    const resp: ResponseLike = {
      ok: false,
      status: 502,
      statusText: 'Bad Gateway',
      json: vi.fn(async () => ({})),
      text: vi.fn(async () => 'gateway down'),
      arrayBuffer: vi.fn(async () => new ArrayBuffer(0)),
      headers: { get: vi.fn(() => 'text/plain') },
    };

    (globalThis as any).fetch = vi.fn(async () => resp);

    const base = new TestRestBase({
      apiKey: 'KEY',
      apiSecret,
      userAgent: 'UA_TEST',
    });

    await expect(
      base._privatePostBinary('/0/private/RetrieveExport', { id: 'X' }),
    ).rejects.toThrow(/gateway down/i);
  });

  it("privatePostBinary() JSON content-type: throws if JSON body can't be parsed", async () => {
    const resp: ResponseLike = {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: vi.fn(async () => {
        throw new Error('bad json');
      }),
      text: vi.fn(async () => 'x'),
      arrayBuffer: vi.fn(async () => new ArrayBuffer(0)),
      headers: { get: vi.fn(() => 'application/json') },
    };

    (globalThis as any).fetch = vi.fn(async () => resp);

    const base = new TestRestBase({ apiKey: 'KEY', apiSecret });

    await expect(
      base._privatePostBinary('/0/private/RetrieveExport', { id: 'X' }),
    ).rejects.toThrow(/expected JSON body/i);
  });

  it('privatePostBinary() JSON content-type: throws and attaches krakenErrors when error[] present', async () => {
    const resp: ResponseLike = {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: vi.fn(async () => ({
        error: ['EGeneral:Permission denied'],
        result: null,
      })),
      text: vi.fn(async () => 'x'),
      arrayBuffer: vi.fn(async () => new ArrayBuffer(0)),
      headers: { get: vi.fn(() => 'application/json') },
    };

    (globalThis as any).fetch = vi.fn(async () => resp);

    const base = new TestRestBase({ apiKey: 'KEY', apiSecret });

    try {
      await base._privatePostBinary('/0/private/RetrieveExport', { id: 'X' });
      throw new Error('expected to throw');
    } catch (e: any) {
      expect(String(e.message)).toMatch(/Kraken API error/i);
      expect(e.krakenErrors).toEqual(['EGeneral:Permission denied']);
    }
  });

  it('privatePostBinary() JSON content-type: JSON without errors is treated as error', async () => {
    const resp: ResponseLike = {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: vi.fn(async () => ({ error: [], result: { weird: true } })),
      text: vi.fn(async () => 'x'),
      arrayBuffer: vi.fn(async () => new ArrayBuffer(0)),
      headers: { get: vi.fn(() => 'application/json') },
    };

    (globalThis as any).fetch = vi.fn(async () => resp);

    const base = new TestRestBase({ apiKey: 'KEY', apiSecret });

    await expect(
      base._privatePostBinary('/0/private/RetrieveExport', { id: 'X' }),
    ).rejects.toThrow(/expected binary data/i);
  });

  it('privatePostBinary() returns ArrayBuffer on non-JSON content-type and uses default UA when none provided', async () => {
    const buf = new ArrayBuffer(16);

    const resp: ResponseLike = {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: vi.fn(async () => ({})),
      text: vi.fn(async () => 'x'),
      arrayBuffer: vi.fn(async () => buf),
      headers: { get: vi.fn(() => 'application/octet-stream') },
    };

    const fetchMock = vi.fn(async (_url: any, init: any) => resp);
    (globalThis as any).fetch = fetchMock;

    const base = new TestRestBase({
      apiKey: 'KEY',
      apiSecret,
      // no userAgent => should use default in privatePostBinary()
    });

    const out = await base._privatePostBinary('/0/private/RetrieveExport', {
      id: 'EXPORT123',
    });

    expect(out).toBe(buf);

    const [, init] = fetchMock.mock.calls[0]!;
    expect(init.headers['User-Agent']).toBe('lynx-crypto-kraken-client/0.1.0');
    expect(String(init.body)).toMatch(/nonce=\d+/);
    expect(String(init.body)).toContain('id=EXPORT123');
  });
});
