import fs from 'node:fs';
import path from 'node:path';
import yauzl from 'yauzl';
import { pipeline } from 'node:stream/promises';

import { ensureDir } from './fs';

export type ZipExtractProgress = {
  extractedFiles: number;
  totalFiles?: number;
  currentFile?: string;
};

export type ZipExtractProgressCallback = (p: ZipExtractProgress) => void;

export async function extractZipFile(
  zipPath: string,
  outDir: string,
  opts?: {
    onProgress?: ZipExtractProgressCallback;
    /**
     * Number of CSV files to extract concurrently.
     * - Default: 1
     * - Recommended starting point on SSD/NVMe: 4
     */
    concurrency?: number;
  },
): Promise<number> {
  await ensureDir(outDir);

  const onProgress = opts?.onProgress;
  const totalConcurrency = normalizeConcurrency(opts?.concurrency);

  let extractedFiles = 0;

  const emit = makeThrottledEmitter(onProgress);

  // Initial emit (UI init)
  emit({ extractedFiles });

  const zip = await openZip(zipPath);

  try {
    // One pass: collect CSV entries so we know totalFiles without re-opening the ZIP.
    const entries = await collectCsvEntries(zip);
    const totalFiles = entries.length;

    emit({ extractedFiles, totalFiles });

    // Extract with concurrency pool
    await runPool(entries, totalConcurrency, async (entry) => {
      const destPath = safeJoin(outDir, entry.fileName);
      await ensureDir(path.dirname(destPath));

      await extractEntryToFile(zip, entry, destPath);

      extractedFiles += 1;
      emit({
        extractedFiles,
        totalFiles,
        currentFile: entry.fileName,
      });
    });

    // Final emit
    emit({ extractedFiles, totalFiles });

    return extractedFiles;
  } finally {
    try {
      zip.close();
    } catch {
      // ignore
    }
  }
}

function openZip(zipPath: string): Promise<yauzl.ZipFile> {
  return new Promise((resolve, reject) => {
    yauzl.open(
      zipPath,
      { lazyEntries: true, autoClose: false },
      (err, zipfile) => {
        if (err || !zipfile)
          return reject(err ?? new Error('Failed to open ZIP'));
        resolve(zipfile);
      },
    );
  });
}

async function collectCsvEntries(zip: yauzl.ZipFile): Promise<yauzl.Entry[]> {
  const entries: yauzl.Entry[] = [];

  await new Promise<void>((resolve, reject) => {
    let done = false;

    const bail = (err: unknown) => {
      if (done) return;
      done = true;
      reject(err instanceof Error ? err : new Error(String(err)));
    };

    zip.on('entry', (entry: yauzl.Entry) => {
      // directory
      if (/\/$/.test(entry.fileName)) {
        zip.readEntry();
        return;
      }

      if (entry.fileName.toLowerCase().endsWith('.csv')) {
        entries.push(entry);
      }

      zip.readEntry();
    });

    zip.on('end', () => {
      if (done) return;
      done = true;
      resolve();
    });

    zip.on('error', bail);

    zip.readEntry();
  });

  return entries;
}

function extractEntryToFile(
  zip: yauzl.ZipFile,
  entry: yauzl.Entry,
  destPath: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    zip.openReadStream(entry, async (err, readStream) => {
      if (err || !readStream) {
        reject(err ?? new Error('ZIP openReadStream failed'));
        return;
      }

      const ws = fs.createWriteStream(destPath);

      try {
        await pipeline(readStream, ws);
        resolve();
      } catch (e) {
        // Best-effort cleanup of partial output file
        try {
          ws.destroy();
        } catch {
          // ignore
        }
        try {
          fs.rmSync(destPath, { force: true });
        } catch {
          // ignore
        }
        reject(e);
      }
    });
  });
}

function normalizeConcurrency(n?: number): number {
  const v = Number.isFinite(n) ? Math.floor(n as number) : 1;
  if (v <= 0) return 1;
  // safety clamp (avoid 1000 open files)
  return Math.min(v, 32);
}

async function runPool<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  if (items.length === 0) return;

  const lanes = Math.min(concurrency, items.length);

  let idx = 0;

  const runLane = async () => {
    while (true) {
      const i = idx++;
      if (i >= items.length) return;
      await worker(items[i]);
    }
  };

  await Promise.all(Array.from({ length: lanes }, () => runLane()));
}

function safeJoin(outDir: string, entryName: string): string {
  // prevent absolute paths
  const cleaned = entryName.replace(/^([/\\])+/, '');
  const destPath = path.join(outDir, cleaned);

  const outNorm = path.resolve(outDir) + path.sep;
  const destNorm = path.resolve(destPath);

  if (!destNorm.startsWith(outNorm)) {
    throw new Error(`ZIP entry path traversal blocked: ${entryName}`);
  }

  return destNorm;
}

function makeThrottledEmitter(cb: ZipExtractProgressCallback | undefined) {
  if (!cb) return (_p: ZipExtractProgress) => {};

  let lastAt = 0;
  let lastFiles = -1;

  return (p: ZipExtractProgress) => {
    const now = Date.now();

    const changed = p.extractedFiles !== lastFiles;
    const timeOk = now - lastAt >= 100;

    if (changed && timeOk) {
      lastAt = now;
      lastFiles = p.extractedFiles;
      cb(p);
    }
  };
}
