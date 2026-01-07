import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { mockDownload, mockListFolder } = vi.hoisted(() => ({
  mockDownload: vi.fn(),
  mockListFolder: vi.fn(),
}));

const { mockExtractZip } = vi.hoisted(() => ({
  mockExtractZip: vi.fn(),
}));

vi.mock('../../../src/utils/googleDriveApi', () => ({
  downloadDriveFileByIdApiKey: mockDownload,
  listDriveFolderFilesApiKey: mockListFolder,
}));

vi.mock('../../../src/utils/zip', () => ({
  extractZipFile: mockExtractZip,
}));

import { KrakenBulkBase } from '../../../src/base/bulkBase';

async function mkTmpDir(prefix = 'kraken-bulkbase-') {
  return await fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

async function exists(p: string): Promise<boolean> {
  try {
    await fs.stat(p);
    return true;
  } catch {
    return false;
  }
}

describe('base/bulkBase.ts - KrakenBulkBase', () => {
  const ENV = 'KRAKEN_API_GOOGLE_DRIVE_API_KEY';
  let prevEnv: string | undefined;

  const tmpDirs: string[] = [];

  afterEach(async () => {
    // restore env
    if (prevEnv === undefined) delete process.env[ENV];
    else process.env[ENV] = prevEnv;

    // cleanup tmp dirs
    for (const d of tmpDirs.splice(0)) {
      try {
        await fs.rm(d, { recursive: true, force: true });
      } catch {
        // ignore
      }
    }

    vi.restoreAllMocks();
  });

  beforeEach(() => {
    prevEnv = process.env[ENV];
    delete process.env[ENV];

    mockDownload.mockReset();
    mockListFolder.mockReset();
    mockExtractZip.mockReset();
  });

  it('getStorageDir returns normalized absolute storage directory', async () => {
    const dir = await mkTmpDir();
    tmpDirs.push(dir);

    const rel = '.tmp-bulk-test';
    const baseRel = new KrakenBulkBase({ storageDir: rel });
    expect(baseRel.getStorageDir()).toBe(path.resolve(process.cwd(), rel));

    const baseAbs = new KrakenBulkBase({ storageDir: dir });
    expect(baseAbs.getStorageDir()).toBe(dir);
  });

  it('config helpers: driveApiKeyEnvVar() and hasGoogleDriveApiKey() (true/false)', async () => {
    const dir = await mkTmpDir();
    tmpDirs.push(dir);

    // no key -> false
    const baseNoKey = new KrakenBulkBase({ storageDir: dir });
    expect(baseNoKey.driveApiKeyEnvVar()).toBe(
      'KRAKEN_API_GOOGLE_DRIVE_API_KEY',
    );
    expect(baseNoKey.hasGoogleDriveApiKey()).toBe(false);

    // explicit key -> true
    const baseWithKey = new KrakenBulkBase({
      storageDir: dir,
      googleDriveApiKey: 'KEY',
    });
    expect(baseWithKey.hasGoogleDriveApiKey()).toBe(true);
  });

  it('covers extractBucket private helper (both branches)', async () => {
    const dir = await mkTmpDir();
    tmpDirs.push(dir);

    const base = new KrakenBulkBase({ storageDir: dir });

    // private method access for coverage
    expect((base as any).extractBucket({ type: 'complete' })).toBe('complete');
    expect(
      (base as any).extractBucket({ type: 'quarterly', quarter: '2024Q3' }),
    ).toBe('quarterly');
  });

  it('builds the correct directory layout (new zip + extracted buckets)', async () => {
    const dir = await mkTmpDir();
    tmpDirs.push(dir);

    const base = new KrakenBulkBase({ storageDir: dir });

    const complete = { type: 'complete' as const };
    const q = { type: 'quarterly' as const, quarter: '2024Q3' as any };

    expect(base.zipPath('ohlcvt', complete)).toBe(
      path.join(dir, 'ohlcvt', 'zips', 'complete', 'complete.zip'),
    );

    expect(base.zipPath('ohlcvt', q)).toBe(
      path.join(dir, 'ohlcvt', 'zips', 'quarterly', '2024Q3.zip'),
    );

    expect(base.extractedDir('trades', complete)).toBe(
      path.join(dir, 'trades', 'extracted', 'complete'),
    );

    expect(base.extractedDir('trades', q)).toBe(
      path.join(dir, 'trades', 'extracted', 'quarterly', '2024Q3'),
    );
  });

  it('ensureDatasetDirs creates required bucket directories', async () => {
    const dir = await mkTmpDir();
    tmpDirs.push(dir);

    const base = new KrakenBulkBase({ storageDir: dir });
    await base.ensureDatasetDirs('ohlcvt');

    expect(await exists(path.join(dir, 'ohlcvt'))).toBe(true);
    expect(await exists(path.join(dir, 'ohlcvt', 'zips', 'complete'))).toBe(
      true,
    );
    expect(await exists(path.join(dir, 'ohlcvt', 'zips', 'quarterly'))).toBe(
      true,
    );
    expect(
      await exists(path.join(dir, 'ohlcvt', 'extracted', 'complete')),
    ).toBe(true);
    expect(
      await exists(path.join(dir, 'ohlcvt', 'extracted', 'quarterly')),
    ).toBe(true);
  });

  it('constructor uses default storageDir when options.storageDir is undefined (?? branch)', () => {
    const base = new KrakenBulkBase(); // no options

    const expected = path.join(os.homedir(), '.lynx-crypto', 'bulk');
    expect(base.getStorageDir()).toBe(expected);
    expect(path.isAbsolute(base.getStorageDir())).toBe(true);
  });

  it('downloadByFileId logs String(err) when the thrown value is not an Error (ternary branch)', async () => {
    const dir = await mkTmpDir();
    tmpDirs.push(dir);

    // non-Error rejection value
    mockDownload.mockRejectedValueOnce('boom');

    const logger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    };

    const base = new KrakenBulkBase({
      storageDir: dir,
      googleDriveApiKey: 'KEY',
      logger,
    });

    await expect(
      base.downloadByFileId(
        'trades',
        { type: 'complete' },
        'FILEID',
        'https://drive/view',
      ),
    ).rejects.toMatchObject({
      code: 'BULK_DRIVE_DOWNLOAD_FAILED',
    });

    // err should be String('boom') => 'boom'
    expect(logger.error).toHaveBeenCalledWith(
      'Bulk ZIP download failed (Drive API)',
      expect.objectContaining({ err: 'boom' }),
    );
  });

  it('extract() logs String(err) when extractZipFile rejects with non-Error (ternary branch)', async () => {
    const dir = await mkTmpDir();
    tmpDirs.push(dir);

    const logger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    };

    const base = new KrakenBulkBase({ storageDir: dir, logger });

    await base.ensureDatasetDirs('ohlcvt');

    // create a zip so extract proceeds to extractZipFile
    const zipPath = base.zipPath('ohlcvt', { type: 'complete' });
    await fs.writeFile(zipPath, 'zip', 'utf8');

    mockExtractZip.mockRejectedValueOnce('zip fail');

    await expect(
      base.extract('ohlcvt', { type: 'complete' }),
    ).rejects.toBeTruthy();

    // err should be String('zip fail') => 'zip fail'
    expect(logger.error).toHaveBeenCalledWith(
      'Bulk ZIP extraction failed',
      expect.objectContaining({ err: 'zip fail' }),
    );

    // in-progress marker should remain on failure
    const extractedDir = base.extractedDir('ohlcvt', { type: 'complete' });
    expect(await exists(path.join(extractedDir, '.extracting'))).toBe(true);
  });

  it('delete() dataset-wide scope="zips" runs zips branch and skips extracted branch', async () => {
    const dir = await mkTmpDir();
    tmpDirs.push(dir);

    const base = new KrakenBulkBase({ storageDir: dir });
    await base.ensureDatasetDirs('ohlcvt');

    // create both a zip and an extracted file
    const zipPath = base.zipPath('ohlcvt', { type: 'complete' });
    await fs.writeFile(zipPath, 'zip', 'utf8');

    const extractedFile = path.join(
      base.extractedDir('ohlcvt', { type: 'complete' }),
      'keep.csv',
    );
    await fs.writeFile(extractedFile, 'a,b,c', 'utf8');

    await base.delete('ohlcvt', { scope: 'zips' });

    // zips removed/recreated
    expect(await exists(zipPath)).toBe(false);
    expect(await exists(path.join(dir, 'ohlcvt', 'zips', 'complete'))).toBe(
      true,
    );
    expect(await exists(path.join(dir, 'ohlcvt', 'zips', 'quarterly'))).toBe(
      true,
    );

    // extracted untouched (branch false)
    expect(await exists(extractedFile)).toBe(true);
  });

  it('delete() dataset-wide scope="extracted" runs extracted branch and skips zips branch', async () => {
    const dir = await mkTmpDir();
    tmpDirs.push(dir);

    const base = new KrakenBulkBase({ storageDir: dir });
    await base.ensureDatasetDirs('ohlcvt');

    // create both a zip and an extracted file
    const zipPath = base.zipPath('ohlcvt', { type: 'complete' });
    await fs.writeFile(zipPath, 'zip', 'utf8');

    const extractedDir = base.extractedDir('ohlcvt', { type: 'complete' });
    const extractedFile = path.join(extractedDir, 'gone.csv');
    await fs.writeFile(extractedFile, 'a,b,c', 'utf8');

    await base.delete('ohlcvt', { scope: 'extracted' });

    // extracted removed/recreated
    expect(await exists(extractedDir)).toBe(true);
    expect(await exists(extractedFile)).toBe(false);
    expect(
      await exists(path.join(dir, 'ohlcvt', 'extracted', 'complete')),
    ).toBe(true);
    expect(
      await exists(path.join(dir, 'ohlcvt', 'extracted', 'quarterly')),
    ).toBe(true);

    // zips untouched (branch false)
    expect(await exists(zipPath)).toBe(true);
  });

  it('has() quarterly source hits isExtractedReady early-return when extractedDir does not exist (fileExists false branch)', async () => {
    const dir = await mkTmpDir();
    tmpDirs.push(dir);

    const base = new KrakenBulkBase({ storageDir: dir });

    // ensureDatasetDirs creates extracted/quarterly but NOT extracted/quarterly/<quarter>
    const res = await base.has('trades', {
      type: 'quarterly',
      quarter: '2024Q3' as any,
    });

    expect(res.zip).toBe(false);
    expect(res.extracted).toBe(false);
  });

  it('dirHasCsv: depth=0 does NOT descend into subdirectories (covers `if (depth > 0)` false)', async () => {
    const dir = await mkTmpDir();
    tmpDirs.push(dir);

    const base = new KrakenBulkBase({ storageDir: dir });

    const root = path.join(dir, 'scan-depth0');
    const subdir = path.join(root, 'A');
    await fs.mkdir(subdir, { recursive: true });

    // csv exists only inside subdir
    await fs.writeFile(path.join(subdir, 'hidden.csv'), 'x', 'utf8');

    // depth=0 => should not look into subdir, so returns false
    const ok = await (base as any).dirHasCsv(root, 0);
    expect(ok).toBe(false);
  });

  it('dirHasCsv: depth=1 scans one level but does NOT recurse to second level (covers `if (depth - 1 > 0)` false)', async () => {
    const dir = await mkTmpDir();
    tmpDirs.push(dir);

    const base = new KrakenBulkBase({ storageDir: dir });

    const root = path.join(dir, 'scan-depth1');
    const a = path.join(root, 'A');
    const b = path.join(a, 'B');
    await fs.mkdir(b, { recursive: true });

    // csv exists only at second level (A/B)
    await fs.writeFile(path.join(b, 'deep.csv'), 'x', 'utf8');

    // depth=1 => will scan A but will NOT recurse into A/B
    const ok = await (base as any).dirHasCsv(root, 1);
    expect(ok).toBe(false);
  });

  describe('has()', () => {
    it('returns zip/extracted false when nothing exists', async () => {
      const dir = await mkTmpDir();
      tmpDirs.push(dir);

      const base = new KrakenBulkBase({ storageDir: dir });

      const res = await base.has('ohlcvt', { type: 'complete' });
      expect(res).toEqual({ zip: false, extracted: false });
    });

    it('zip true when zip exists', async () => {
      const dir = await mkTmpDir();
      tmpDirs.push(dir);

      const base = new KrakenBulkBase({ storageDir: dir });

      await base.ensureDatasetDirs('ohlcvt');
      const zipPath = base.zipPath('ohlcvt', { type: 'complete' });
      await fs.writeFile(zipPath, 'zipdata', 'utf8');

      const res = await base.has('ohlcvt', { type: 'complete' });
      expect(res.zip).toBe(true);
      expect(res.extracted).toBe(false);
    });

    it('extracted true when marker OK exists', async () => {
      const dir = await mkTmpDir();
      tmpDirs.push(dir);

      const base = new KrakenBulkBase({ storageDir: dir });

      await base.ensureDatasetDirs('trades');
      const extractedDir = base.extractedDir('trades', { type: 'complete' });
      await fs.writeFile(
        path.join(extractedDir, '.extracted.ok'),
        '{"ok":true}',
        'utf8',
      );

      const res = await base.has('trades', { type: 'complete' });
      expect(res.extracted).toBe(true);
    });

    it('extracted false when in-progress marker exists', async () => {
      const dir = await mkTmpDir();
      tmpDirs.push(dir);

      const base = new KrakenBulkBase({ storageDir: dir });

      await base.ensureDatasetDirs('trades');
      const extractedDir = base.extractedDir('trades', { type: 'complete' });
      await fs.writeFile(
        path.join(extractedDir, '.extracting'),
        '{"inprog":true}',
        'utf8',
      );

      const res = await base.has('trades', { type: 'complete' });
      expect(res.extracted).toBe(false);
    });

    it('legacy extracted detection: csv found (no markers) => extracted true', async () => {
      const dir = await mkTmpDir();
      tmpDirs.push(dir);

      const base = new KrakenBulkBase({ storageDir: dir });

      await base.ensureDatasetDirs('trades');
      const extractedDir = base.extractedDir('trades', { type: 'complete' });
      await fs.writeFile(
        path.join(extractedDir, 'XBTUSD.csv'),
        'a,b,c',
        'utf8',
      );

      const res = await base.has('trades', { type: 'complete' });
      expect(res.extracted).toBe(true);
    });
  });

  describe('downloadByFileId()', () => {
    it('returns downloaded:false if zip exists and !forceRefresh (covers !forceRefresh branch)', async () => {
      const dir = await mkTmpDir();
      tmpDirs.push(dir);

      const logger = {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
      };

      const base = new KrakenBulkBase({ storageDir: dir, logger });

      await base.ensureDatasetDirs('ohlcvt');
      const zipPath = base.zipPath('ohlcvt', { type: 'complete' });
      await fs.writeFile(zipPath, '123456', 'utf8');

      const res = await base.downloadByFileId(
        'ohlcvt',
        { type: 'complete' },
        'FILEID',
        'https://example.com/view',
        { forceRefresh: false },
      );

      expect(res.downloaded).toBe(false);
      expect(res.zipPath).toBe(zipPath);
      expect(res.bytes).toBe(6);
      expect(mockDownload).not.toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalled(); // logger?.info branch
    });

    it('throws BULK_DRIVE_API_KEY_REQUIRED when zip missing and key absent (covers logger?.warn branch)', async () => {
      const dir = await mkTmpDir();
      tmpDirs.push(dir);

      const logger = {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
      };

      const base = new KrakenBulkBase({ storageDir: dir, logger });

      await expect(
        base.downloadByFileId(
          'ohlcvt',
          { type: 'complete' },
          'FILEID',
          'https://example.com/view',
        ),
      ).rejects.toMatchObject({
        code: 'BULK_DRIVE_API_KEY_REQUIRED',
      });

      expect(logger.warn).toHaveBeenCalled();
    });

    it('downloads via Drive when key present and returns downloaded:true', async () => {
      const dir = await mkTmpDir();
      tmpDirs.push(dir);

      mockDownload.mockResolvedValueOnce({ bytes: 42, totalBytes: 100 });

      const logger = {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
      };

      const base = new KrakenBulkBase({
        storageDir: dir,
        googleDriveApiKey: 'KEY',
        userAgent: 'UA/1.0',
        logger,
      });

      const res = await base.downloadByFileId(
        'trades',
        { type: 'complete' },
        'FILEID',
        'https://drive/view',
      );

      expect(res.downloaded).toBe(true);
      expect(res.bytes).toBe(42);
      expect(res.directUrl).toBe('https://drive/view');

      expect(mockDownload).toHaveBeenCalledWith(
        expect.objectContaining({
          fileId: 'FILEID',
          apiKey: 'KEY',
          destinationPath: base.zipPath('trades', { type: 'complete' }),
          userAgent: 'UA/1.0',
        }),
      );

      expect(logger.info).toHaveBeenCalled(); // starting log
    });

    it('wraps drive failures as BULK_DRIVE_DOWNLOAD_FAILED (covers logger?.error branch)', async () => {
      const dir = await mkTmpDir();
      tmpDirs.push(dir);

      mockDownload.mockRejectedValueOnce(new Error('drive boom'));

      const logger = {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
      };

      const base = new KrakenBulkBase({
        storageDir: dir,
        googleDriveApiKey: 'KEY',
        logger,
      });

      await expect(
        base.downloadByFileId(
          'trades',
          { type: 'complete' },
          'FILEID',
          'https://drive/view',
        ),
      ).rejects.toMatchObject({
        code: 'BULK_DRIVE_DOWNLOAD_FAILED',
      });

      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('listDriveFolder()', () => {
    it('throws BULK_DRIVE_API_KEY_REQUIRED when key is missing', async () => {
      const dir = await mkTmpDir();
      tmpDirs.push(dir);

      const base = new KrakenBulkBase({ storageDir: dir });

      await expect(base.listDriveFolder('FOLDER')).rejects.toMatchObject({
        code: 'BULK_DRIVE_API_KEY_REQUIRED',
      });
    });

    it('caches by folderId (single underlying call)', async () => {
      const dir = await mkTmpDir();
      tmpDirs.push(dir);

      mockListFolder.mockResolvedValueOnce([
        { id: '1', name: 'a.zip' },
        { id: '2', name: 'b.zip' },
      ]);

      const base = new KrakenBulkBase({
        storageDir: dir,
        googleDriveApiKey: 'KEY',
      });

      const p1 = base.listDriveFolder('FOLDER');
      const p2 = base.listDriveFolder('FOLDER');

      const [a, b] = await Promise.all([p1, p2]);
      expect(a).toStrictEqual(b);

      expect(mockListFolder).toHaveBeenCalledTimes(1);
    });
  });

  describe('safeStatSize()', () => {
    it('returns 0 for missing file (catch branch)', async () => {
      const dir = await mkTmpDir();
      tmpDirs.push(dir);

      const base = new KrakenBulkBase({ storageDir: dir });

      expect(await base.safeStatSize(path.join(dir, 'missing.zip'))).toBe(0);
    });

    it('returns actual size for existing file (try branch)', async () => {
      const dir = await mkTmpDir();
      tmpDirs.push(dir);

      const base = new KrakenBulkBase({ storageDir: dir });

      const p = path.join(dir, 'x.bin');
      await fs.writeFile(p, Buffer.from([1, 2, 3, 4, 5]));

      expect(await base.safeStatSize(p)).toBe(5);
    });
  });

  describe('extract()', () => {
    it('returns extracted:false when zip missing (warn branch)', async () => {
      const dir = await mkTmpDir();
      tmpDirs.push(dir);

      const logger = {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
      };
      const base = new KrakenBulkBase({ storageDir: dir, logger });

      const res = await base.extract('ohlcvt', { type: 'complete' });

      expect(res.extracted).toBe(false);
      expect(res.filesExtracted).toBe(0);
      expect(mockExtractZip).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalled();
    });

    it('covers else-branch: extractedDir does NOT exist -> ensureDir(extractedDir)', async () => {
      const dir = await mkTmpDir();
      tmpDirs.push(dir);

      const logger = {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
      };
      const base = new KrakenBulkBase({ storageDir: dir, logger });

      const source = { type: 'quarterly' as const, quarter: '2024Q3' as any };

      await base.ensureDatasetDirs('trades');

      // create zip so extraction proceeds
      const zipPath = base.zipPath('trades', source);
      await fs.mkdir(path.dirname(zipPath), { recursive: true });
      await fs.writeFile(zipPath, 'zip', 'utf8');

      const extractedDir = base.extractedDir('trades', source);

      // ensure the quarter dir is truly missing so we hit the `else { await ensureDir(extractedDir) }`
      await fs.rm(extractedDir, { recursive: true, force: true });

      mockExtractZip.mockResolvedValueOnce(1);

      const res = await base.extract('trades', source);

      expect(res.extracted).toBe(true);
      expect(res.filesExtracted).toBe(1);
      expect(await exists(extractedDir)).toBe(true);
      expect(mockExtractZip).toHaveBeenCalledWith(
        zipPath,
        extractedDir,
        expect.any(Object),
      );
    });

    it('skips extraction when marker OK exists (ok branch)', async () => {
      const dir = await mkTmpDir();
      tmpDirs.push(dir);

      const logger = {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
      };
      const base = new KrakenBulkBase({ storageDir: dir, logger });

      await base.ensureDatasetDirs('ohlcvt');

      const zipPath = base.zipPath('ohlcvt', { type: 'complete' });
      await fs.writeFile(zipPath, 'zip', 'utf8');

      const extractedDir = base.extractedDir('ohlcvt', { type: 'complete' });
      await fs.writeFile(
        path.join(extractedDir, '.extracted.ok'),
        '{"ok":1}',
        'utf8',
      );

      const res = await base.extract('ohlcvt', { type: 'complete' });
      expect(res.extracted).toBe(false);
      expect(mockExtractZip).not.toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalled();
    });

    it('legacy extraction: csv exists but no marker => writes OK marker and skips', async () => {
      const dir = await mkTmpDir();
      tmpDirs.push(dir);

      const logger = {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
      };
      const base = new KrakenBulkBase({ storageDir: dir, logger });

      await base.ensureDatasetDirs('trades');

      const zipPath = base.zipPath('trades', { type: 'complete' });
      await fs.writeFile(zipPath, 'zip', 'utf8');

      const extractedDir = base.extractedDir('trades', { type: 'complete' });
      await fs.writeFile(
        path.join(extractedDir, 'XBTUSD.csv'),
        'a,b,c',
        'utf8',
      );

      const res = await base.extract('trades', { type: 'complete' });

      expect(res.extracted).toBe(false);
      expect(mockExtractZip).not.toHaveBeenCalled();

      const okPath = path.join(extractedDir, '.extracted.ok');
      expect(await exists(okPath)).toBe(true);

      const okJson = JSON.parse(await fs.readFile(okPath, 'utf8'));
      expect(okJson.meta).toMatchObject({
        dataset: 'trades',
        source: { type: 'complete' },
        note: 'legacy-extraction-detected',
      });
    });

    it('re-extracts when in-progress marker exists OR missing CSVs (inprog || !hasCsv branch)', async () => {
      const dir = await mkTmpDir();
      tmpDirs.push(dir);

      const logger = {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
      };
      const base = new KrakenBulkBase({ storageDir: dir, logger });

      await base.ensureDatasetDirs('ohlcvt');

      const zipPath = base.zipPath('ohlcvt', { type: 'complete' });
      await fs.writeFile(zipPath, 'zip', 'utf8');

      const extractedDir = base.extractedDir('ohlcvt', { type: 'complete' });

      // in-progress marker forces re-extract
      await fs.writeFile(
        path.join(extractedDir, '.extracting'),
        '{"inprog":1}',
        'utf8',
      );
      await fs.writeFile(
        path.join(extractedDir, 'SENTINEL.txt'),
        'old',
        'utf8',
      );

      mockExtractZip.mockResolvedValueOnce(2);

      const res = await base.extract('ohlcvt', { type: 'complete' });

      expect(res.extracted).toBe(true);
      expect(res.filesExtracted).toBe(2);

      // sentinel should be gone because dir was nuked
      expect(await exists(path.join(extractedDir, 'SENTINEL.txt'))).toBe(false);

      // markers: in-progress removed, ok exists
      expect(await exists(path.join(extractedDir, '.extracting'))).toBe(false);
      expect(await exists(path.join(extractedDir, '.extracted.ok'))).toBe(true);

      expect(logger.warn).toHaveBeenCalled(); // incomplete; re-extracting
    });

    it('on extraction failure: keeps .extracting marker and does not write OK', async () => {
      const dir = await mkTmpDir();
      tmpDirs.push(dir);

      const logger = {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
      };
      const base = new KrakenBulkBase({ storageDir: dir, logger });

      await base.ensureDatasetDirs('ohlcvt');

      const zipPath = base.zipPath('ohlcvt', { type: 'complete' });
      await fs.writeFile(zipPath, 'zip', 'utf8');

      const extractedDir = base.extractedDir('ohlcvt', { type: 'complete' });

      mockExtractZip.mockRejectedValueOnce(new Error('zip fail'));

      await expect(
        base.extract('ohlcvt', { type: 'complete' }),
      ).rejects.toThrow();

      expect(await exists(path.join(extractedDir, '.extracting'))).toBe(true);
      expect(await exists(path.join(extractedDir, '.extracted.ok'))).toBe(
        false,
      );

      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('delete()', () => {
    it('deletes only zip for a specific source (zips branch in deleteOne)', async () => {
      const dir = await mkTmpDir();
      tmpDirs.push(dir);

      const base = new KrakenBulkBase({ storageDir: dir });

      const src = { type: 'complete' as const };

      await base.ensureDatasetDirs('trades');

      const zipPath = base.zipPath('trades', src);
      const extractedDir = base.extractedDir('trades', src);

      await fs.writeFile(zipPath, 'zip', 'utf8');
      await fs.writeFile(
        path.join(extractedDir, 'XBTUSD.csv'),
        'a,b,c',
        'utf8',
      );

      await base.delete('trades', { scope: 'zips', source: src });

      expect(await exists(zipPath)).toBe(false);
      expect(await exists(extractedDir)).toBe(true);
    });

    it('deletes only extracted for a specific source (covers extracted branch in deleteOne)', async () => {
      const dir = await mkTmpDir();
      tmpDirs.push(dir);

      const base = new KrakenBulkBase({ storageDir: dir });

      const src = { type: 'complete' as const };

      await base.ensureDatasetDirs('trades');

      const zipPath = base.zipPath('trades', src);
      const extractedDir = base.extractedDir('trades', src);

      await fs.writeFile(zipPath, 'zip', 'utf8');
      await fs.writeFile(
        path.join(extractedDir, 'XBTUSD.csv'),
        'a,b,c',
        'utf8',
      );

      await base.delete('trades', { scope: 'extracted', source: src });

      expect(await exists(zipPath)).toBe(true);
      expect(await exists(extractedDir)).toBe(false);
    });

    it('dataset-wide delete recreates bucket directories (covers zips/all and extracted/all branches)', async () => {
      const dir = await mkTmpDir();
      tmpDirs.push(dir);

      const base = new KrakenBulkBase({ storageDir: dir });

      await base.ensureDatasetDirs('ohlcvt');

      // create some junk
      await fs.writeFile(
        base.zipPath('ohlcvt', { type: 'complete' }),
        'zip',
        'utf8',
      );
      await fs.writeFile(
        path.join(base.extractedDir('ohlcvt', { type: 'complete' }), 'a.csv'),
        'a,b,c',
        'utf8',
      );

      await base.delete('ohlcvt', { scope: 'all' });

      expect(await exists(path.join(dir, 'ohlcvt', 'zips', 'complete'))).toBe(
        true,
      );
      expect(await exists(path.join(dir, 'ohlcvt', 'zips', 'quarterly'))).toBe(
        true,
      );
      expect(
        await exists(path.join(dir, 'ohlcvt', 'extracted', 'complete')),
      ).toBe(true);
      expect(
        await exists(path.join(dir, 'ohlcvt', 'extracted', 'quarterly')),
      ).toBe(true);
    });
  });

  describe('dirHasCsv() private helper - branch coverage', () => {
    it('dirHasCsv: returns true when a second-level (sub2) entry is a .csv (covers `t.toLowerCase().endsWith(".csv")`)', async () => {
      const dir = await mkTmpDir();
      tmpDirs.push(dir);

      const base = new KrakenBulkBase({ storageDir: dir });

      const root = path.join(dir, 'scan-sub2-csv');
      const a = path.join(root, 'A');
      const b = path.join(a, 'B');
      await fs.mkdir(b, { recursive: true });

      // Ensure first-level subdir A has NO csv so we don't return early there
      await fs.writeFile(path.join(a, 'note.txt'), 'x', 'utf8');

      // Put csv only in the second-level directory (A/B)
      await fs.writeFile(path.join(b, 'TARGET.CSV'), 'x', 'utf8'); // uppercase to hit toLowerCase()

      const ok = await (base as any).dirHasCsv(root, 2);
      expect(ok).toBe(true);
    });

    it('returns false when readdir(dir) throws (catch branch)', async () => {
      const dir = await mkTmpDir();
      tmpDirs.push(dir);

      const base = new KrakenBulkBase({ storageDir: dir });

      const missing = path.join(dir, 'does-not-exist');
      const ok = await (base as any).dirHasCsv(missing, 2);
      expect(ok).toBe(false);
    });

    it('returns true when immediate subdirectory contains a .csv (covers `for (const s of sub)` early return)', async () => {
      const dir = await mkTmpDir();
      tmpDirs.push(dir);

      const base = new KrakenBulkBase({ storageDir: dir });

      const root = path.join(dir, 'scan1');
      const subdir = path.join(root, 'A');
      await fs.mkdir(subdir, { recursive: true });

      // immediate sub contains csv -> should return true in the first sub-scan loop
      await fs.writeFile(path.join(subdir, 'yes.csv'), 'x', 'utf8');
      await fs.writeFile(path.join(subdir, 'no.txt'), 'x', 'utf8');

      const ok = await (base as any).dirHasCsv(root, 2);
      expect(ok).toBe(true);
    });

    it('returns true when nested (2nd-level) subdirectory contains a .csv (covers depth-1 recursion)', async () => {
      const dir = await mkTmpDir();
      tmpDirs.push(dir);

      const base = new KrakenBulkBase({ storageDir: dir });

      const root = path.join(dir, 'scan2');
      const a = path.join(root, 'A');
      const b = path.join(a, 'B');
      await fs.mkdir(b, { recursive: true });

      // no csv in A directly; only in A/B
      await fs.writeFile(path.join(a, 'note.txt'), 'x', 'utf8');
      await fs.writeFile(path.join(b, 'deep.csv'), 'x', 'utf8');

      // also add a non-dir child in A to hit the inner catch for readdir(subFull)
      await fs.writeFile(path.join(a, 'not-a-dir'), 'x', 'utf8');

      const ok = await (base as any).dirHasCsv(root, 2);
      expect(ok).toBe(true);
    });

    it('returns false when directory tree has no csv and tolerates non-directory children (covers inner catch blocks)', async () => {
      const dir = await mkTmpDir();
      tmpDirs.push(dir);

      const base = new KrakenBulkBase({ storageDir: dir });

      const root = path.join(dir, 'scan3');
      const a = path.join(root, 'A');
      await fs.mkdir(a, { recursive: true });

      // add only non-csv files
      await fs.writeFile(path.join(root, 'file.txt'), 'x', 'utf8'); // will cause readdir(full) to throw -> caught
      await fs.writeFile(path.join(a, 'note.txt'), 'x', 'utf8');

      const ok = await (base as any).dirHasCsv(root, 2);
      expect(ok).toBe(false);
    });
  });
});
