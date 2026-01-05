import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import { EventEmitter } from 'node:events';
import { Readable, PassThrough } from 'node:stream';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ---- yauzl mock ----
type FakeEntry = { fileName: string };

class FakeZipFile extends EventEmitter {
  private idx = 0;

  constructor(
    private entries: FakeEntry[],
    private entryToStream: (e: FakeEntry) => NodeJS.ReadableStream,
  ) {
    super();
  }

  readEntry() {
    const e = this.entries[this.idx++];
    if (!e) {
      queueMicrotask(() => this.emit('end'));
      return;
    }
    queueMicrotask(() => this.emit('entry', e));
  }

  openReadStream(entry: FakeEntry, cb: (err: any, s?: any) => void) {
    try {
      const s = this.entryToStream(entry);
      cb(null, s);
    } catch (err) {
      cb(err);
    }
  }

  close() {
    // no-op
  }
}

const { mockYauzlOpen } = vi.hoisted(() => {
  const mockYauzlOpen = vi.fn();
  return { mockYauzlOpen };
});

vi.mock('yauzl', () => ({
  // IMPORTANT: src/utils/zip.ts does `import yauzl from 'yauzl'`
  // and calls `yauzl.open(...)`, so default.open must exist.
  default: { open: mockYauzlOpen },
  open: mockYauzlOpen, // optional, but harmless
}));

import { extractZipFile } from '../../../src/utils/zip';

async function mkTmpDir(prefix = 'kraken-api-zip-') {
  return await fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

describe('utils/zip.ts - extractZipFile', () => {
  beforeEach(() => {
    mockYauzlOpen.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('extracts only .csv entries, preserves folder structure, returns extracted count', async () => {
    const outDir = await mkTmpDir();

    // make throttled progress deterministic (always passes 100ms gate)
    let t = 1_000_000;
    vi.spyOn(Date, 'now').mockImplementation(() => (t += 101));

    const entries: FakeEntry[] = [
      { fileName: 'folder/' }, // directory
      { fileName: 'folder/a.csv' },
      { fileName: 'folder/b.txt' }, // ignored
      { fileName: 'c.csv' },
    ];

    const zip = new FakeZipFile(entries, (e) => {
      if (e.fileName.endsWith('.csv')) {
        return Readable.from([Buffer.from(`data-for-${e.fileName}`)]);
      }
      return Readable.from([Buffer.from('ignored')]);
    });

    mockYauzlOpen.mockImplementation((_zipPath: string, _opts: any, cb: any) =>
      cb(null, zip),
    );

    const progress: any[] = [];
    const extracted = await extractZipFile('fake.zip', outDir, {
      concurrency: 4,
      onProgress: (p) => progress.push(p),
    });

    expect(extracted).toBe(2);

    const a = await fs.readFile(path.join(outDir, 'folder/a.csv'), 'utf8');
    const c = await fs.readFile(path.join(outDir, 'c.csv'), 'utf8');

    expect(a).toBe('data-for-folder/a.csv');
    expect(c).toBe('data-for-c.csv');

    // progress should include totalFiles=2 at least once
    expect(progress.some((p) => p.totalFiles === 2)).toBe(true);
    expect(progress.at(-1)).toMatchObject({ extractedFiles: 2, totalFiles: 2 });
  });

  it('blocks ZIP path traversal via ..', async () => {
    const outDir = await mkTmpDir();

    let t = 1_000_000;
    vi.spyOn(Date, 'now').mockImplementation(() => (t += 101));

    const entries: FakeEntry[] = [{ fileName: '../evil.csv' }];

    const zip = new FakeZipFile(entries, () =>
      Readable.from([Buffer.from('evil')]),
    );

    mockYauzlOpen.mockImplementation((_zipPath: string, _opts: any, cb: any) =>
      cb(null, zip),
    );

    await expect(extractZipFile('fake.zip', outDir)).rejects.toThrow(
      /path traversal blocked/i,
    );

    const children = await fs.readdir(outDir);
    expect(children).toEqual([]);
  });

  it('cleans up partial output file if extraction stream fails', async () => {
    const outDir = await mkTmpDir();

    let t = 1_000_000;
    vi.spyOn(Date, 'now').mockImplementation(() => (t += 101));

    const entries: FakeEntry[] = [{ fileName: 'bad.csv' }];

    const zip = new FakeZipFile(entries, () => {
      const s = new PassThrough();
      queueMicrotask(() => {
        s.write(Buffer.from('partial'));
        s.destroy(new Error('zip read failed'));
      });
      return s;
    });

    mockYauzlOpen.mockImplementation((_zipPath: string, _opts: any, cb: any) =>
      cb(null, zip),
    );

    await expect(extractZipFile('fake.zip', outDir)).rejects.toBeTruthy();

    await expect(fs.stat(path.join(outDir, 'bad.csv'))).rejects.toBeTruthy();
  });

  // ------------------ Added coverage tests ------------------

  it('rejects when yauzl.open returns an error (openZip err branch)', async () => {
    const outDir = await mkTmpDir();

    mockYauzlOpen.mockImplementation((_zipPath: string, _opts: any, cb: any) =>
      cb(new Error('open failed')),
    );

    await expect(extractZipFile('fake.zip', outDir)).rejects.toThrow(
      /open failed/i,
    );
  });

  it('rejects with "Failed to open ZIP" when yauzl.open returns no zipfile (openZip !zipfile branch)', async () => {
    const outDir = await mkTmpDir();

    mockYauzlOpen.mockImplementation((_zipPath: string, _opts: any, cb: any) =>
      cb(null, undefined),
    );

    await expect(extractZipFile('fake.zip', outDir)).rejects.toThrow(
      /failed to open zip/i,
    );
  });

  it('rejects when zip emits non-Error "error" event and converts to Error(String(err)) (collectCsvEntries bail else-branch)', async () => {
    const outDir = await mkTmpDir();

    const closeSpy = vi.fn();

    class ErrorZipFile extends EventEmitter {
      readEntry() {
        queueMicrotask(() => this.emit('error', 'boom')); // non-Error
      }
      openReadStream(_entry: any, _cb: any) {
        // not reached
      }
      close() {
        closeSpy();
      }
    }

    const zip = new ErrorZipFile();

    mockYauzlOpen.mockImplementation((_zipPath: string, _opts: any, cb: any) =>
      cb(null, zip as any),
    );

    await expect(extractZipFile('fake.zip', outDir)).rejects.toThrow(/boom/i);
    expect(closeSpy).toHaveBeenCalledTimes(1);
  });

  it('rejects when zip emits Error instance via "error" event (collectCsvEntries bail Error-branch)', async () => {
    const outDir = await mkTmpDir();

    class ErrorZipFile extends EventEmitter {
      readEntry() {
        queueMicrotask(() => this.emit('error', new Error('zip blew up')));
      }
      openReadStream(_entry: any, _cb: any) {
        // not reached
      }
      close() {
        // no-op
      }
    }

    const zip = new ErrorZipFile();

    mockYauzlOpen.mockImplementation((_zipPath: string, _opts: any, cb: any) =>
      cb(null, zip as any),
    );

    await expect(extractZipFile('fake.zip', outDir)).rejects.toThrow(
      /zip blew up/i,
    );
  });

  it('rejects when openReadStream provides no stream (extractEntryToFile !readStream branch)', async () => {
    const outDir = await mkTmpDir();

    class NoStreamZipFile extends FakeZipFile {
      openReadStream(_entry: FakeEntry, cb: (err: any, s?: any) => void) {
        cb(null, undefined); // triggers "ZIP openReadStream failed"
      }
    }

    const entries: FakeEntry[] = [{ fileName: 'a.csv' }];
    const zip = new NoStreamZipFile(entries, () =>
      Readable.from([Buffer.from('never')]),
    );

    mockYauzlOpen.mockImplementation((_zipPath: string, _opts: any, cb: any) =>
      cb(null, zip),
    );

    await expect(extractZipFile('fake.zip', outDir)).rejects.toThrow(
      /openreadstream failed/i,
    );

    await expect(fs.stat(path.join(outDir, 'a.csv'))).rejects.toBeTruthy();
  });

  it('rejects when openReadStream returns an error (extractEntryToFile err branch)', async () => {
    const outDir = await mkTmpDir();

    class ErrZipFile extends FakeZipFile {
      openReadStream(_entry: FakeEntry, cb: (err: any, s?: any) => void) {
        cb(new Error('openReadStream err'));
      }
    }

    const entries: FakeEntry[] = [{ fileName: 'a.csv' }];
    const zip = new ErrZipFile(entries, () =>
      Readable.from([Buffer.from('never')]),
    );

    mockYauzlOpen.mockImplementation((_zipPath: string, _opts: any, cb: any) =>
      cb(null, zip),
    );

    await expect(extractZipFile('fake.zip', outDir)).rejects.toThrow(
      /openreadstream err/i,
    );
  });

  it('throttles progress callbacks (covers changed/timeOk false branches) and ignores zip.close errors', async () => {
    const outDir = await mkTmpDir();

    // We want:
    // - initial emit skipped (timeOk false)
    // - emit after collect called (timeOk true)
    // - first file emit skipped (timeOk false)
    // - second file emit called (timeOk true)
    // - final emit skipped (changed false)
    const times = [0, 150, 160, 260, 261, 400];
    vi.spyOn(Date, 'now').mockImplementation(() => times.shift() ?? 1000);

    const entries: FakeEntry[] = [{ fileName: 'a.csv' }, { fileName: 'b.csv' }];

    const zip = new FakeZipFile(entries, (e) =>
      Readable.from([Buffer.from(`data-${e.fileName}`)]),
    );

    // make close throw to hit the `try { zip.close() } catch {}` swallow path
    (zip as any).close = () => {
      throw new Error('close failed');
    };

    mockYauzlOpen.mockImplementation((_zipPath: string, _opts: any, cb: any) =>
      cb(null, zip),
    );

    const progress: any[] = [];
    const extracted = await extractZipFile('fake.zip', outDir, {
      onProgress: (p) => progress.push(p),
    });

    expect(extracted).toBe(2);

    // With the timing above, we expect only 2 callback invocations.
    expect(progress.length).toBe(2);
    expect(progress[0]).toMatchObject({ extractedFiles: 0, totalFiles: 2 });
    expect(progress[1]).toMatchObject({ extractedFiles: 2, totalFiles: 2 });

    const a = await fs.readFile(path.join(outDir, 'a.csv'), 'utf8');
    const b = await fs.readFile(path.join(outDir, 'b.csv'), 'utf8');
    expect(a).toBe('data-a.csv');
    expect(b).toBe('data-b.csv');
  });

  it('ignores repeated error/end events after first failure (covers `if (done) return;` in bail + end)', async () => {
    const outDir = await mkTmpDir();

    class DoubleErrorZipFile extends EventEmitter {
      readEntry() {
        queueMicrotask(() => {
          // first error sets done=true + rejects
          this.emit('error', 'boom');

          // these should hit guards:
          // - bail() sees done and returns
          // - end handler sees done and returns
          this.emit('error', 'late');
          this.emit('end');
        });
      }
      openReadStream(_entry: any, _cb: any) {
        // not reached
      }
      close() {
        // no-op
      }
    }

    const zip = new DoubleErrorZipFile();

    mockYauzlOpen.mockImplementation((_zipPath: string, _opts: any, cb: any) =>
      cb(null, zip as any),
    );

    await expect(extractZipFile('fake.zip', outDir)).rejects.toThrow(/boom/i);
  });

  it('ignores subsequent worker failures after first worker failure (covers `if (done) return;` in pool catch)', async () => {
    const outDir = await mkTmpDir();

    let t = 1_000_000;
    vi.spyOn(Date, 'now').mockImplementation(() => (t += 101));

    const entries: FakeEntry[] = [{ fileName: 'a.csv' }, { fileName: 'b.csv' }];

    class AsyncFailZipFile extends FakeZipFile {
      openReadStream(entry: FakeEntry, cb: (err: any, s?: any) => void) {
        if (entry.fileName === 'a.csv') {
          // fail immediately so this is guaranteed to be the first rejection
          cb(new Error('a fail'));
          return;
        }

        // fail later so it happens after `done=true` and hits the guard
        setTimeout(() => cb(new Error('b fail')), 0);
      }
    }

    const zip = new AsyncFailZipFile(entries, () =>
      Readable.from([Buffer.from('never')]),
    );

    mockYauzlOpen.mockImplementation((_zipPath: string, _opts: any, cb: any) =>
      cb(null, zip),
    );

    await expect(
      extractZipFile('fake.zip', outDir, { concurrency: 2 }),
    ).rejects.toThrow(/a fail/i);

    // allow the delayed b failure to run (so its catch path hits `if (done) return;`)
    await new Promise((r) => setTimeout(r, 0));
  });

  it('treats non-positive concurrency as 1 (covers `if (v <= 0) return 1;`)', async () => {
    const outDir = await mkTmpDir();

    const entries: FakeEntry[] = [{ fileName: 'a.csv' }, { fileName: 'b.csv' }];

    let gateResolved = false;
    let bCalledBeforeGate = false;

    class SeqZipFile extends FakeZipFile {
      openReadStream(entry: FakeEntry, cb: (err: any, s?: any) => void) {
        if (entry.fileName === 'a.csv') {
          const s = new PassThrough();
          // keep "a" open for a tick, then finish it
          setTimeout(() => {
            gateResolved = true;
            s.end(Buffer.from('A'));
          }, 0);
          cb(null, s);
          return;
        }

        // If concurrency were > 1, b would be requested before a finishes.
        if (!gateResolved) bCalledBeforeGate = true;

        cb(null, Readable.from([Buffer.from('B')]));
      }
    }

    const zip = new SeqZipFile(entries, () => Readable.from([]));

    mockYauzlOpen.mockImplementation((_zipPath: string, _opts: any, cb: any) =>
      cb(null, zip),
    );

    const extracted = await extractZipFile('fake.zip', outDir, {
      concurrency: 0, // <-- should normalize to 1
    });

    expect(extracted).toBe(2);
    expect(bCalledBeforeGate).toBe(false);
  });

  it('caps very large concurrency at 32 (covers `return Math.min(v, 32);`)', async () => {
    const outDir = await mkTmpDir();

    const entries: FakeEntry[] = Array.from({ length: 40 }, (_, i) => ({
      fileName: `f${i}.csv`,
    }));

    let inFlight = 0;
    let maxInFlight = 0;

    class TrackingZipFile extends FakeZipFile {
      openReadStream(entry: FakeEntry, cb: (err: any, s?: any) => void) {
        inFlight += 1;
        maxInFlight = Math.max(maxInFlight, inFlight);

        const s = new PassThrough();

        // decrement exactly once when the stream finishes/closes
        let decDone = false;
        const dec = () => {
          if (decDone) return;
          decDone = true;
          inFlight -= 1;
        };
        s.once('end', dec);
        s.once('close', dec);

        // keep streams open briefly so the pool can fill up
        setTimeout(() => {
          s.end(Buffer.from(`data-${entry.fileName}`));
        }, 10);

        cb(null, s);
      }
    }

    const zip = new TrackingZipFile(entries, () => Readable.from([]));

    mockYauzlOpen.mockImplementation((_zipPath: string, _opts: any, cb: any) =>
      cb(null, zip),
    );

    const extracted = await extractZipFile('fake.zip', outDir, {
      concurrency: 999, // <-- should clamp to 32
    });

    expect(extracted).toBe(40);
    expect(maxInFlight).toBeLessThanOrEqual(32);
  });

  it('returns 0 when ZIP has no CSV entries (covers `if (items.length === 0) return;`)', async () => {
    const outDir = await mkTmpDir();

    const entries: FakeEntry[] = [
      { fileName: 'folder/' }, // directory
      { fileName: 'README.txt' }, // non-csv
    ];

    class NoCsvZipFile extends FakeZipFile {
      openReadStream(_entry: FakeEntry, _cb: (err: any, s?: any) => void) {
        throw new Error(
          'openReadStream should not be called when no CSV entries exist',
        );
      }
    }

    const zip = new NoCsvZipFile(entries, () => Readable.from([]));

    mockYauzlOpen.mockImplementation((_zipPath: string, _opts: any, cb: any) =>
      cb(null, zip),
    );

    const extracted = await extractZipFile('fake.zip', outDir, {
      concurrency: 4,
    });
    expect(extracted).toBe(0);
  });
});
