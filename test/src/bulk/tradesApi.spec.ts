import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { KrakenBulkTradesApi } from '../../../src/bulk/tradesApi';

async function mkTmpDir(prefix = 'kraken-trades-') {
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
    ...overrides,
  };

  return base;
}

describe('bulk/tradesApi.ts - KrakenBulkTradesApi', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('download(complete) delegates to base.downloadByFileId with fixed fileId/url', async () => {
    const base = makeBase();
    base.downloadByFileId.mockResolvedValueOnce({
      dataset: 'trades',
      downloaded: true,
    });

    const api = new KrakenBulkTradesApi(base);

    await api.download({ type: 'complete' });

    expect(base.downloadByFileId).toHaveBeenCalledWith(
      'trades',
      { type: 'complete' },
      '10zh3tDpqANYvVtYVgczwVz3UZFRUb1el',
      expect.stringContaining('/file/d/10zh3tDpqANYvVtYVgczwVz3UZFRUb1el/'),
      undefined,
    );
  });

  it('extract/has/delete delegate to base with dataset=trades', async () => {
    const base = makeBase();
    base.extract.mockResolvedValueOnce({ extracted: true });
    base.has.mockResolvedValueOnce({ zip: true, extracted: true });
    base.delete.mockResolvedValueOnce(undefined);

    const api = new KrakenBulkTradesApi(base);

    await api.extract({ type: 'complete' });
    expect(base.extract).toHaveBeenCalledWith(
      'trades',
      { type: 'complete' },
      undefined,
    );

    await api.has({ type: 'complete' });
    expect(base.has).toHaveBeenCalledWith('trades', { type: 'complete' });

    await api.delete({ scope: 'all', source: { type: 'complete' } });
    expect(base.delete).toHaveBeenCalledWith('trades', {
      scope: 'all',
      source: { type: 'complete' },
    });
  });

  it('listPairs returns csv basenames sorted', async () => {
    const dir = await mkTmpDir();
    const extracted = path.join(dir, 'extracted');

    await write(path.join(extracted, 'XBTUSD.csv'), 'x');
    await write(path.join(extracted, 'ETHUSD.csv'), 'x');
    await write(path.join(extracted, 'README.txt'), 'x');

    const base = makeBase({ extractedDir: vi.fn(() => extracted) });
    const api = new KrakenBulkTradesApi(base);

    const pairs = await api.listPairs({ type: 'complete' } as any);
    expect(pairs).toEqual(['ETHUSD', 'XBTUSD']);
  });

  it('query supports layout [ts, price, volume] and filters by range + limit', async () => {
    const dir = await mkTmpDir();
    const extracted = path.join(dir, 'extracted');

    const csv = [
      'ts,price,volume',
      '100,10.0,0.5',
      '200,11.0,0.6',
      '300,12.0,0.7',
      'bad,13.0,0.8',
    ].join('\n');

    await write(path.join(extracted, 'XBTUSD.csv'), csv);

    const base = makeBase({ extractedDir: vi.fn(() => extracted) });
    const api = new KrakenBulkTradesApi(base);

    const rows = await readAll(
      api.query(
        {
          pair: 'XBTUSD',
          startTs: 150,
          endTs: 350,
          source: { type: 'complete' },
        } as any,
        { limit: 1 },
      ),
    );

    expect(rows).toEqual([{ ts: 200, price: '11.0', volume: '0.6' }]);
  });

  it('query supports layout [price, volume, ts] (ts in index 2 heuristic)', async () => {
    const dir = await mkTmpDir();
    const extracted = path.join(dir, 'extracted');

    // row[2] is epoch seconds -> triggers tsIdx=2
    const csv = [
      'price,volume,ts',
      '10.0,0.5,1700000001',
      '11.0,0.6,1700000002',
    ].join('\n');

    await write(path.join(extracted, 'XBTUSD.csv'), csv);

    const base = makeBase({ extractedDir: vi.fn(() => extracted) });
    const api = new KrakenBulkTradesApi(base);

    const rows = await readAll(
      api.query({ pair: 'XBTUSD', source: { type: 'complete' } } as any),
    );

    expect(rows).toEqual([
      { ts: 1700000001, price: '10.0', volume: '0.5' },
      { ts: 1700000002, price: '11.0', volume: '0.6' },
    ]);
  });

  it('query yields nothing and warns when extracted dir missing', async () => {
    const base = makeBase({
      extractedDir: vi.fn(() =>
        path.join(os.tmpdir(), `missing-${Date.now()}`),
      ),
    });
    const api = new KrakenBulkTradesApi(base);

    const rows = await readAll(api.query({ pair: 'XBTUSD' } as any));
    expect(rows).toEqual([]);
    expect(base.logger.warn).toHaveBeenCalled();
  });

  it('listAvailableQuarters parses both Trades and Trading_History naming patterns', async () => {
    const base = makeBase({
      hasGoogleDriveApiKey: vi.fn(() => true),
      listDriveFolder: vi.fn().mockResolvedValueOnce([
        { id: 'a', name: 'Kraken_Trades_Q3_2024.zip' },
        { id: 'b', name: 'Kraken_Trading_History_Q1_2024.zip' },
        { id: 'c', name: 'Kraken_Trades_Q4_2023.zip' },
        { id: 'd', name: 'nope.zip' },
      ]),
    });

    const api = new KrakenBulkTradesApi(base);

    const qs = await api.listAvailableQuarters();
    expect(qs).toEqual(['2023Q4', '2024Q1', '2024Q3']);
  });

  it('download(quarterly) finds candidate name and delegates to base.downloadByFileId', async () => {
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
          { id: 'X', name: 'Kraken_Trading_History_Q3_2024.zip' },
        ]),
      downloadByFileId: vi.fn().mockResolvedValueOnce({
        dataset: 'trades',
        source: { type: 'quarterly', quarter: '2024Q3' },
        zipPath,
        downloaded: true,
        bytes: 1,
      }),
    });

    const api = new KrakenBulkTradesApi(base);

    const res = await api.download({
      type: 'quarterly',
      quarter: '2024Q3',
    } as any);

    expect(base.downloadByFileId).toHaveBeenCalledWith(
      'trades',
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

    const api = new KrakenBulkTradesApi(base);

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

    const api = new KrakenBulkTradesApi(base);

    await expect(
      api.download({ type: 'quarterly', quarter: '2024Q3' } as any),
    ).rejects.toMatchObject({ code: 'BULK_DRIVE_API_KEY_REQUIRED' });
  });

  it('download(quarterly) throws BULK_DRIVE_QUARTER_NOT_FOUND when no match', async () => {
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

    const api = new KrakenBulkTradesApi(base);

    await expect(
      api.download({ type: 'quarterly', quarter: '2024Q3' } as any),
    ).rejects.toMatchObject({ code: 'BULK_DRIVE_QUARTER_NOT_FOUND' });
  });

  it('listAvailableQuarters throws BULK_DRIVE_API_KEY_REQUIRED when key missing', async () => {
    const base = makeBase({
      hasGoogleDriveApiKey: vi.fn(() => false),
      driveApiKeyEnvVar: vi.fn(() => 'ENV_VAR_NAME'),
    });

    const api = new KrakenBulkTradesApi(base);

    await expect(api.listAvailableQuarters()).rejects.toMatchObject({
      code: 'BULK_DRIVE_API_KEY_REQUIRED',
    });

    // ensure it used the envVar helper (covers envVar line usage too)
    expect(base.driveApiKeyEnvVar).toHaveBeenCalled();
  });

  it('query yields nothing and warns when CSV missing for pair (covers csvPath missing branch)', async () => {
    const dir = await mkTmpDir();
    const extracted = path.join(dir, 'extracted');
    await fs.mkdir(extracted, { recursive: true }); // extracted dir exists, but pair CSV does not

    const base = makeBase({
      extractedDir: vi.fn(() => extracted),
    });

    const api = new KrakenBulkTradesApi(base);

    const rows = await readAll(
      api.query({ pair: 'XBTUSD', source: { type: 'complete' } } as any),
    );

    expect(rows).toEqual([]);
    expect(base.logger.warn).toHaveBeenCalledWith(
      'Bulk trades CSV not found for pair',
      expect.objectContaining({
        pair: 'XBTUSD',
        extractedDir: extracted,
        csvPath: path.join(extracted, 'XBTUSD.csv'),
      }),
    );
  });

  it('listPairs returns [] when extractedDir does not exist (fileExists false branch)', async () => {
    const base = makeBase({
      extractedDir: vi.fn(() =>
        path.join(os.tmpdir(), `missing-trades-pairs-${Date.now()}`),
      ),
    });

    const api = new KrakenBulkTradesApi(base);

    const pairs = await api.listPairs({ type: 'complete' } as any);
    expect(pairs).toEqual([]);
  });

  it('query skips rows with length < 3 (covers `if (row.length < 3) continue` true branch)', async () => {
    const dir = await mkTmpDir();
    const extracted = path.join(dir, 'extracted');

    const csv = [
      'ts,price,volume',
      '100,10.0,0.5', // good
      '200,11.0', // length 2 -> should be skipped
      '300,12.0,0.7', // good
    ].join('\n');

    await write(path.join(extracted, 'XBTUSD.csv'), csv);

    const base = makeBase({ extractedDir: vi.fn(() => extracted) });
    const api = new KrakenBulkTradesApi(base);

    const rows = await readAll(
      api.query({ pair: 'XBTUSD', source: { type: 'complete' } } as any),
    );

    expect(rows).toEqual([
      { ts: 100, price: '10.0', volume: '0.5' },
      { ts: 300, price: '12.0', volume: '0.7' },
    ]);
  });

  it('query filters out rows where ts >= endTs (covers `endTs && ts >= endTs` true branch)', async () => {
    const dir = await mkTmpDir();
    const extracted = path.join(dir, 'extracted');

    const csv = [
      'ts,price,volume',
      '100,10.0,0.5', // keep
      '200,11.0,0.6', // ts >= endTs(200) -> skip
      '250,12.0,0.7', // skip
    ].join('\n');

    await write(path.join(extracted, 'XBTUSD.csv'), csv);

    const base = makeBase({ extractedDir: vi.fn(() => extracted) });
    const api = new KrakenBulkTradesApi(base);

    const rows = await readAll(
      api.query(
        {
          pair: 'XBTUSD',
          endTs: 200,
          source: { type: 'complete' },
        } as any,
        undefined,
      ),
    );

    expect(rows).toEqual([{ ts: 100, price: '10.0', volume: '0.5' }]);
  });

  it('download(quarterly) uses raw quarter when format is invalid (covers `if (!m) return q` in toFolderQuarter)', async () => {
    const dir = await mkTmpDir();
    const zipPath = path.join(dir, 'zips', 'WEIRD.zip');

    const base = makeBase({
      ensureDatasetDirs: vi.fn(),
      zipPath: vi.fn(() => zipPath),
      safeStatSize: vi.fn(),
      hasGoogleDriveApiKey: vi.fn(() => true),
      // exact match fails, but case-insensitive fallback succeeds
      listDriveFolder: vi
        .fn()
        .mockResolvedValueOnce([{ id: 'X', name: 'kraken_trades_qweird.zip' }]),
      downloadByFileId: vi.fn().mockResolvedValueOnce({
        dataset: 'trades',
        source: { type: 'quarterly', quarter: 'WEIRD' },
        zipPath,
        downloaded: true,
        bytes: 1,
      }),
    });

    const api = new KrakenBulkTradesApi(base);

    await api.download({ type: 'quarterly', quarter: 'WEIRD' } as any);

    expect(base.downloadByFileId).toHaveBeenCalledWith(
      'trades',
      { type: 'quarterly', quarter: 'WEIRD' },
      'X',
      expect.stringContaining('/file/d/X/view'),
      undefined,
    );
  });
});
