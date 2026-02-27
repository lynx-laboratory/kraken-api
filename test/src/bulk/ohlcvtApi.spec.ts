import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { KrakenBulkOhlcvtApi } from '../../../src/bulk/ohlcvtApi';
import { fileExists } from '../../../src/utils/fs';

async function mkTmpDir(prefix = 'kraken-ohlcvt-') {
  return await fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

async function write(p: string, data: string) {
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, data, 'utf8');
}

async function readAll<T>(it: AsyncIterable<T>): Promise<T[]> {
  const out: T[] = [];
  for await (const x of it) out.push(x);
  return out;
}

/** Real implementation of resolveCsvPath for tests that use temp dirs. */
async function realResolveCsvPath(
  extractedDir: string,
  filename: string,
): Promise<string | null> {
  const flat = path.join(extractedDir, filename);
  if (await fileExists(flat)) return flat;
  let entries: string[];
  try {
    entries = await fs.readdir(extractedDir);
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

/** Real implementation of listCsvFiles for tests that use temp dirs. */
async function realListCsvFiles(extractedDir: string): Promise<string[]> {
  if (!(await fileExists(extractedDir))) return [];
  const result: string[] = [];
  let entries: string[];
  try {
    entries = await fs.readdir(extractedDir);
  } catch {
    return [];
  }
  for (const entry of entries) {
    if (entry.toLowerCase().endsWith('.csv')) {
      result.push(entry);
      continue;
    }
    if (entry.startsWith('.')) continue;
    const subDir = path.join(extractedDir, entry);
    try {
      const subEntries = await fs.readdir(subDir);
      for (const sub of subEntries) {
        if (sub.toLowerCase().endsWith('.csv')) result.push(sub);
      }
    } catch {
      // skip
    }
  }
  return result;
}

function makeBase(overrides: any = {}) {
  const logger = {
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  };

  const base: any = {
    logger,
    downloadByFileId: vi.fn(),
    extract: vi.fn(),
    has: vi.fn(),
    delete: vi.fn(),
    ensureDatasetDirs: vi.fn(),
    zipPath: vi.fn(),
    safeStatSize: vi.fn(),
    hasGoogleDriveApiKey: vi.fn(() => true),
    driveApiKeyEnvVar: vi.fn(() => 'ENV'),
    listDriveFolder: vi.fn(),
    extractedDir: vi.fn(),
    resolveCsvPath: vi.fn(realResolveCsvPath),
    listCsvFiles: vi.fn(realListCsvFiles),
    ...overrides,
  };

  return base;
}

describe('bulk/ohlcvtApi.ts - KrakenBulkOhlcvtApi', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('download(complete) delegates to base.downloadByFileId with fixed fileId/url', async () => {
    const base = makeBase();
    base.downloadByFileId.mockResolvedValueOnce({
      dataset: 'ohlcvt',
      downloaded: true,
    });

    const api = new KrakenBulkOhlcvtApi(base);

    await api.download({ type: 'complete' });

    expect(base.downloadByFileId).toHaveBeenCalledWith(
      'ohlcvt',
      { type: 'complete' },
      '1ptNqWYidLkhb2VAKuLCxmp2OXEfGO-AP',
      expect.stringContaining('/file/d/1ptNqWYidLkhb2VAKuLCxmp2OXEfGO-AP/'),
      undefined,
    );
  });

  it('extract/has/delete delegate to base with dataset=ohlcvt', async () => {
    const base = makeBase();
    base.extract.mockResolvedValueOnce({ extracted: true });
    base.has.mockResolvedValueOnce({ zip: true, extracted: true });
    base.delete.mockResolvedValueOnce(undefined);

    const api = new KrakenBulkOhlcvtApi(base);

    await api.extract({ type: 'complete' });
    expect(base.extract).toHaveBeenCalledWith(
      'ohlcvt',
      { type: 'complete' },
      undefined,
    );

    await api.has({ type: 'complete' });
    expect(base.has).toHaveBeenCalledWith('ohlcvt', { type: 'complete' });

    await api.delete({ scope: 'all', source: { type: 'complete' } });
    expect(base.delete).toHaveBeenCalledWith('ohlcvt', {
      scope: 'all',
      source: { type: 'complete' },
    });
  });

  it('listPairs parses <pair>_<interval>.csv and returns unique sorted pairs', async () => {
    const dir = await mkTmpDir();
    const extracted = path.join(dir, 'extracted');

    await write(path.join(extracted, 'XBTUSD_1.csv'), 'x');
    await write(path.join(extracted, 'XBTUSD_5.csv'), 'x');
    await write(path.join(extracted, 'ETHUSD_60.csv'), 'x');
    await write(path.join(extracted, 'BAD.csv'), 'x'); // no interval part
    await write(path.join(extracted, 'NOPE_abc.csv'), 'x'); // interval not numeric
    await write(path.join(extracted, 'README.txt'), 'x');

    const base = makeBase({
      extractedDir: vi.fn(() => extracted),
    });

    const api = new KrakenBulkOhlcvtApi(base);

    const pairs = await api.listPairs({ type: 'complete' } as any);
    expect(pairs).toEqual(['ETHUSD', 'XBTUSD']);
  });

  it('listIntervals returns sorted valid intervals for a pair', async () => {
    const dir = await mkTmpDir();
    const extracted = path.join(dir, 'extracted');

    await write(path.join(extracted, 'XBTUSD_1.csv'), 'x');
    await write(path.join(extracted, 'XBTUSD_5.csv'), 'x');
    await write(path.join(extracted, 'XBTUSD_2.csv'), 'x'); // invalid by isValidInterval
    await write(path.join(extracted, 'XBTUSD_1440.csv'), 'x');
    await write(path.join(extracted, 'ETHUSD_60.csv'), 'x');

    const base = makeBase({
      extractedDir: vi.fn(() => extracted),
    });

    const api = new KrakenBulkOhlcvtApi(base);

    const intervals = await api.listIntervals('XBTUSD', {
      type: 'complete',
    } as any);
    expect(intervals).toEqual([1, 5, 1440]);
  });

  it('query filters by ts range and respects limit', async () => {
    const dir = await mkTmpDir();
    const extracted = path.join(dir, 'extracted');

    const csv = [
      'ts,open,high,low,close,volume,trades', // header ignored
      '100,1,2,0,1,10,5',
      '200,1,2,0,1,10,6',
      '300,1,2,0,1,10,7',
      'bad,1,2,0,1,10,8',
      '400,1,2,0,1,10,NaN',
    ].join('\n');

    await write(path.join(extracted, 'XBTUSD_1.csv'), csv);

    const base = makeBase({
      extractedDir: vi.fn(() => extracted),
    });

    const api = new KrakenBulkOhlcvtApi(base);

    const rows = await readAll(
      api.query(
        {
          pair: 'XBTUSD',
          interval: 1,
          startTs: 150,
          endTs: 350,
          source: { type: 'complete' },
        } as any,
        { limit: 1 },
      ),
    );

    expect(rows).toEqual([
      {
        ts: 200,
        open: '1',
        high: '2',
        low: '0',
        close: '1',
        volume: '10',
        trades: 6,
      },
    ]);
  });

  it('query yields nothing and warns when extracted dir missing', async () => {
    const base = makeBase({
      extractedDir: vi.fn(() =>
        path.join(os.tmpdir(), `missing-${Date.now()}`),
      ),
    });

    const api = new KrakenBulkOhlcvtApi(base);

    const rows = await readAll(
      api.query({ pair: 'XBTUSD', interval: 1 } as any),
    );
    expect(rows).toEqual([]);
    expect(base.logger.warn).toHaveBeenCalled();
  });

  it('query yields nothing and warns when extracted dir exists but pair/interval CSV is missing', async () => {
    const dir = await mkTmpDir();
    const extracted = path.join(dir, 'extracted');

    // ensure extracted dir exists, but do NOT create the pair/interval CSV
    await fs.mkdir(extracted, { recursive: true });

    const base = makeBase({
      extractedDir: vi.fn(() => extracted),
    });

    const api = new KrakenBulkOhlcvtApi(base);

    const rows = await readAll(
      api.query({
        pair: 'XBTUSD',
        interval: 60,
        source: { type: 'complete' },
      } as any),
    );

    expect(rows).toEqual([]);

    expect(base.logger.warn).toHaveBeenCalledWith(
      'Bulk OHLCVT CSV not found for pair/interval',
      expect.objectContaining({
        source: { type: 'complete' },
        extractedDir: extracted,
        pair: 'XBTUSD',
        interval: 60,
      }),
    );
  });

  it('listAvailableQuarters parses drive names and returns sorted quarters', async () => {
    const base = makeBase({
      hasGoogleDriveApiKey: vi.fn(() => true),
      listDriveFolder: vi.fn().mockResolvedValueOnce([
        { id: 'a', name: 'Kraken_OHLCVT_Q3_2024.zip' },
        { id: 'b', name: 'Kraken_OHLCVT_Q1_2024.zip' },
        { id: 'c', name: 'not-a-match.zip' },
        { id: 'd', name: 'Kraken_OHLCVT_Q4_2023.zip' },
      ]),
    });

    const api = new KrakenBulkOhlcvtApi(base);

    const qs = await api.listAvailableQuarters();
    expect(qs).toEqual(['2023Q4', '2024Q1', '2024Q3']);
  });

  it('listAvailableQuarters throws BULK_DRIVE_API_KEY_REQUIRED when key missing', async () => {
    const base = makeBase({
      hasGoogleDriveApiKey: vi.fn(() => false),
      driveApiKeyEnvVar: vi.fn(() => 'ENV'),
      listDriveFolder: vi.fn(),
    });

    const api = new KrakenBulkOhlcvtApi(base);

    await expect(api.listAvailableQuarters()).rejects.toMatchObject({
      code: 'BULK_DRIVE_API_KEY_REQUIRED',
    });

    expect(base.driveApiKeyEnvVar).toHaveBeenCalled();
    expect(base.listDriveFolder).not.toHaveBeenCalled();
  });

  it('download(quarterly) finds the correct file in Drive folder and delegates to base.downloadByFileId', async () => {
    const dir = await mkTmpDir();
    const zipPath = path.join(dir, 'zips', '2024Q3.zip');

    const base = makeBase({
      ensureDatasetDirs: vi.fn(),
      zipPath: vi.fn(() => zipPath),
      safeStatSize: vi.fn(),
      hasGoogleDriveApiKey: vi.fn(() => true),
      listDriveFolder: vi
        .fn()
        .mockResolvedValueOnce([
          { id: 'X', name: 'Kraken_OHLCVT_Q3_2024.zip' },
        ]),
      downloadByFileId: vi.fn().mockResolvedValueOnce({
        dataset: 'ohlcvt',
        source: { type: 'quarterly', quarter: '2024Q3' },
        zipPath,
        downloaded: true,
        bytes: 1,
      }),
    });

    const api = new KrakenBulkOhlcvtApi(base);

    const res = await api.download({
      type: 'quarterly',
      quarter: '2024Q3',
    } as any);

    expect(base.downloadByFileId).toHaveBeenCalledWith(
      'ohlcvt',
      { type: 'quarterly', quarter: '2024Q3' },
      'X',
      expect.stringContaining('/file/d/X/view'),
      undefined,
    );

    expect(res.downloaded).toBe(true);
  });

  it('download(quarterly) returns downloaded:false when zip exists locally and no forceRefresh', async () => {
    const dir = await mkTmpDir();
    const zipPath = path.join(dir, 'zips', '2024Q3.zip');
    await write(zipPath, 'zip');

    const base = makeBase({
      ensureDatasetDirs: vi.fn(),
      zipPath: vi.fn(() => zipPath),
      safeStatSize: vi.fn().mockResolvedValueOnce(3),
      hasGoogleDriveApiKey: vi.fn(() => true),
      listDriveFolder: vi.fn(),
      downloadByFileId: vi.fn(),
    });

    const api = new KrakenBulkOhlcvtApi(base);

    const res = await api.download({
      type: 'quarterly',
      quarter: '2024Q3',
    } as any);

    expect(res).toMatchObject({ downloaded: false, bytes: 3, zipPath });
    expect(base.listDriveFolder).not.toHaveBeenCalled();
    expect(base.downloadByFileId).not.toHaveBeenCalled();
  });

  it('download(quarterly) throws BULK_DRIVE_API_KEY_REQUIRED when key missing', async () => {
    const dir = await mkTmpDir();
    const zipPath = path.join(dir, 'zips', '2024Q3.zip');

    const base = makeBase({
      ensureDatasetDirs: vi.fn(),
      zipPath: vi.fn(() => zipPath),
      hasGoogleDriveApiKey: vi.fn(() => false),
      driveApiKeyEnvVar: vi.fn(() => 'ENV'),
    });

    const api = new KrakenBulkOhlcvtApi(base);

    await expect(
      api.download({ type: 'quarterly', quarter: '2024Q3' } as any),
    ).rejects.toMatchObject({ code: 'BULK_DRIVE_API_KEY_REQUIRED' });
  });

  it('download(quarterly) throws BULK_DRIVE_QUARTER_NOT_FOUND when file not in folder', async () => {
    const dir = await mkTmpDir();
    const zipPath = path.join(dir, 'zips', '2024Q3.zip');

    const base = makeBase({
      ensureDatasetDirs: vi.fn(),
      zipPath: vi.fn(() => zipPath),
      hasGoogleDriveApiKey: vi.fn(() => true),
      listDriveFolder: vi
        .fn()
        .mockResolvedValueOnce([{ id: '1', name: 'something.zip' }]),
    });

    const api = new KrakenBulkOhlcvtApi(base);

    await expect(
      api.download({ type: 'quarterly', quarter: '2024Q3' } as any),
    ).rejects.toMatchObject({ code: 'BULK_DRIVE_QUARTER_NOT_FOUND' });
  });

  it('listPairs returns [] when extractedDir does not exist (fileExists false branch)', async () => {
    const base = makeBase({
      extractedDir: vi.fn(() =>
        path.join(os.tmpdir(), `missing-pairs-${Date.now()}`),
      ),
    });

    const api = new KrakenBulkOhlcvtApi(base);

    const pairs = await api.listPairs({ type: 'complete' } as any);
    expect(pairs).toEqual([]);
  });

  it('listIntervals returns [] when extractedDir does not exist (fileExists false branch)', async () => {
    const base = makeBase({
      extractedDir: vi.fn(() =>
        path.join(os.tmpdir(), `missing-intervals-${Date.now()}`),
      ),
    });

    const api = new KrakenBulkOhlcvtApi(base);

    const intervals = await api.listIntervals('XBTUSD', {
      type: 'complete',
    } as any);
    expect(intervals).toEqual([]);
  });

  it('listIntervals skips non-.csv files (covers `if (!f.endsWith(".csv")) continue` true branch)', async () => {
    const dir = await mkTmpDir();
    const extracted = path.join(dir, 'extracted');

    await write(path.join(extracted, 'XBTUSD_1.csv'), 'x');
    await write(path.join(extracted, 'README.txt'), 'x'); // non-csv -> continue branch
    await write(path.join(extracted, 'XBTUSD_5.csv'), 'x');

    const base = makeBase({ extractedDir: vi.fn(() => extracted) });
    const api = new KrakenBulkOhlcvtApi(base);

    const intervals = await api.listIntervals('XBTUSD', {
      type: 'complete',
    } as any);
    expect(intervals).toEqual([1, 5]);
  });

  it('listIntervals skips files where last "_" is not at pair.length (covers `if (idx !== pair.length) continue` true branch)', async () => {
    const dir = await mkTmpDir();
    const extracted = path.join(dir, 'extracted');

    await write(path.join(extracted, 'XBTUSD_1.csv'), 'x'); // valid
    await write(path.join(extracted, 'XBTUSD_EXTRA_5.csv'), 'x'); // startsWith XBTUSD_ but idx !== pair.length -> continue

    const base = makeBase({ extractedDir: vi.fn(() => extracted) });
    const api = new KrakenBulkOhlcvtApi(base);

    const intervals = await api.listIntervals('XBTUSD', {
      type: 'complete',
    } as any);
    expect(intervals).toEqual([1]);
  });

  it('listIntervals ignores NaN interval suffix (covers `if (Number.isFinite(n)) intervals.add(n)` false branch)', async () => {
    const dir = await mkTmpDir();
    const extracted = path.join(dir, 'extracted');

    await write(path.join(extracted, 'XBTUSD_1.csv'), 'x'); // finite
    await write(path.join(extracted, 'XBTUSD_abc.csv'), 'x'); // NaN -> not added

    const base = makeBase({ extractedDir: vi.fn(() => extracted) });
    const api = new KrakenBulkOhlcvtApi(base);

    const intervals = await api.listIntervals('XBTUSD', {
      type: 'complete',
    } as any);
    expect(intervals).toEqual([1]);
  });

  it('query skips short rows and filters by endTs (covers `row.length < 7` and `endTs && ts >= endTs` branches)', async () => {
    const dir = await mkTmpDir();
    const extracted = path.join(dir, 'extracted');

    const csv = [
      'ts,open,high,low,close,volume,trades',
      '100,1,2,0,1,10,5', // yield
      '150,1,2,0,1,10', // length 6 -> row.length < 7 -> continue
      '250,1,2,0,1,10,7', // ts >= endTs(200) -> continue
    ].join('\n');

    await write(path.join(extracted, 'XBTUSD_1.csv'), csv);

    const base = makeBase({ extractedDir: vi.fn(() => extracted) });
    const api = new KrakenBulkOhlcvtApi(base);

    const rows = await readAll(
      api.query(
        {
          pair: 'XBTUSD',
          interval: 1,
          endTs: 200,
          source: { type: 'complete' },
        } as any,
        undefined,
      ),
    );

    expect(rows).toEqual([
      {
        ts: 100,
        open: '1',
        high: '2',
        low: '0',
        close: '1',
        volume: '10',
        trades: 5,
      },
    ]);
  });

  it('query skips non-finite trades and yields all when limit is undefined (covers trades-isFinite false + limit branch false)', async () => {
    const dir = await mkTmpDir();
    const extracted = path.join(dir, 'extracted');

    const csv = [
      'ts,open,high,low,close,volume,trades',
      '100,1,2,0,1,10,5', // yield
      '200,1,2,0,1,10,NaN', // trades NaN -> continue
      '300,1,2,0,1,10,7', // yield
    ].join('\n');

    await write(path.join(extracted, 'XBTUSD_1.csv'), csv);

    const base = makeBase({ extractedDir: vi.fn(() => extracted) });
    const api = new KrakenBulkOhlcvtApi(base);

    const rows = await readAll(
      api.query({
        pair: 'XBTUSD',
        interval: 1,
        source: { type: 'complete' },
      } as any),
    );

    expect(rows.map((r) => r.ts)).toEqual([100, 300]);
  });

  it('download(quarterly) uses raw quarter when format is invalid (covers `if (!m) return q` in toFolderQuarter)', async () => {
    const dir = await mkTmpDir();
    const zipPath = path.join(dir, 'zips', 'WEIRD.zip'); // just a path; file won't exist

    const base = makeBase({
      ensureDatasetDirs: vi.fn(),
      zipPath: vi.fn(() => zipPath),
      safeStatSize: vi.fn(),
      hasGoogleDriveApiKey: vi.fn(() => true),
      // Make exact-match fail but case-insensitive match succeed (also covers the ?? fallback)
      listDriveFolder: vi
        .fn()
        .mockResolvedValueOnce([{ id: 'X', name: 'kraken_ohlcvt_qweird.zip' }]),
      downloadByFileId: vi.fn().mockResolvedValueOnce({
        dataset: 'ohlcvt',
        source: { type: 'quarterly', quarter: 'WEIRD' },
        zipPath,
        downloaded: true,
        bytes: 1,
      }),
    });

    const api = new KrakenBulkOhlcvtApi(base);

    await api.download({ type: 'quarterly', quarter: 'WEIRD' } as any);

    expect(base.downloadByFileId).toHaveBeenCalledWith(
      'ohlcvt',
      { type: 'quarterly', quarter: 'WEIRD' },
      'X',
      expect.stringContaining('/file/d/X/view'),
      undefined,
    );
  });
});
