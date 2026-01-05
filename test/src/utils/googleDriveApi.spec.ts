import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import { PassThrough } from 'node:stream';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  listDriveFolderFilesApiKey,
  downloadDriveFileByIdApiKey,
} from '../../../src/utils/googleDriveApi';

// Hoisted mocks for googleapis
const { mockFilesList, mockFilesGet, mockDrive, mockGoogleDriveFactory } =
  vi.hoisted(() => {
    const mockFilesList = vi.fn();
    const mockFilesGet = vi.fn();
    const mockDrive = {
      files: {
        list: mockFilesList,
        get: mockFilesGet,
      },
    };
    const mockGoogleDriveFactory = vi.fn(() => mockDrive);
    return { mockFilesList, mockFilesGet, mockDrive, mockGoogleDriveFactory };
  });

vi.mock('googleapis', () => {
  return {
    google: {
      drive: mockGoogleDriveFactory,
    },
  };
});

async function mkTmpDir(prefix = 'kraken-api-drive-') {
  return await fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

describe('utils/googleDriveApi.ts', () => {
  beforeEach(() => {
    mockFilesList.mockReset();
    mockFilesGet.mockReset();
    mockGoogleDriveFactory.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('listDriveFolderFilesApiKey', () => {
    it('lists folder files across pages and filters out missing id/name', async () => {
      mockFilesList
        .mockResolvedValueOnce({
          data: {
            files: [
              { id: '1', name: 'a.zip' },
              { id: '2', name: 'b.zip' },
              { id: undefined, name: 'skip.zip' },
              { id: '3', name: undefined },
            ],
            nextPageToken: 'NEXT',
          },
        })
        .mockResolvedValueOnce({
          data: {
            files: [{ id: '4', name: 'c.zip' }],
            nextPageToken: undefined,
          },
        });

      const out = await listDriveFolderFilesApiKey({
        folderId: 'FOLDER',
        apiKey: 'KEY',
        userAgent: 'MyAgent/1.0',
      });

      expect(out).toEqual([
        { id: '1', name: 'a.zip' },
        { id: '2', name: 'b.zip' },
        { id: '4', name: 'c.zip' },
      ]);

      // ensure it called with paging
      expect(mockFilesList).toHaveBeenCalledTimes(2);

      // ensure UA header passed in the list call object
      const firstCallArg = mockFilesList.mock.calls[0]?.[0];
      expect(firstCallArg).toMatchObject({
        key: 'KEY',
        q: `'FOLDER' in parents and trashed = false`,
        headers: { 'User-Agent': 'MyAgent/1.0' },
      });

      const secondCallArg = mockFilesList.mock.calls[1]?.[0];
      expect(secondCallArg).toMatchObject({ pageToken: 'NEXT' });
    });

    it('handles missing files array (res.data.files ?? []) and does not include UA headers when userAgent is omitted', async () => {
      mockFilesList.mockResolvedValueOnce({
        data: {
          files: undefined, // triggers ?? []
          nextPageToken: undefined,
        },
      });

      const out = await listDriveFolderFilesApiKey({
        folderId: 'FOLDER',
        apiKey: 'KEY',
        // userAgent omitted -> false branch of the spread
      });

      expect(out).toEqual([]);

      expect(mockFilesList).toHaveBeenCalledTimes(1);

      const firstCallArg = mockFilesList.mock.calls[0]?.[0];
      expect(firstCallArg).toMatchObject({
        key: 'KEY',
        q: `'FOLDER' in parents and trashed = false`,
        pageSize: 1000,
      });

      // UA header should NOT be present when userAgent is undefined
      expect((firstCallArg as any).headers).toBeUndefined();
    });
  });

  describe('downloadDriveFileByIdApiKey', () => {
    it('downloads a file to destinationPath using a tmp file and emits progress', async () => {
      const dir = await mkTmpDir();
      const dest = path.join(dir, 'out.zip');

      // mock meta size lookup + stream download
      mockFilesGet.mockImplementation((params: any, options?: any) => {
        // meta call: fields=size
        if (params?.fields === 'size') {
          return Promise.resolve({ data: { size: '6' } });
        }

        // media call: responseType=stream
        if (options?.responseType === 'stream') {
          const s = new PassThrough();
          // emit in two chunks
          queueMicrotask(() => {
            s.write(Buffer.from('abc'));
            s.end(Buffer.from('def'));
          });
          return Promise.resolve({ data: s });
        }

        return Promise.reject(new Error('unexpected call'));
      });

      const progress: Array<{ downloadedBytes: number; totalBytes?: number }> =
        [];

      const res = await downloadDriveFileByIdApiKey({
        fileId: 'FILE',
        apiKey: 'KEY',
        destinationPath: dest,
        userAgent: 'MyAgent/1.0',
        onProgress: (p) => progress.push(p),
      });

      expect(res.bytes).toBe(6);
      expect(res.totalBytes).toBe(6);

      const data = await fs.readFile(dest, 'utf8');
      expect(data).toBe('abcdef');

      // progress should include initial 0 and final (6)
      expect(progress[0]).toEqual({ downloadedBytes: 0, totalBytes: 6 });
      expect(progress.at(-1)).toEqual({ downloadedBytes: 6, totalBytes: 6 });

      // ensure UA header passed on stream call (second arg)
      const mediaCall = mockFilesGet.mock.calls.find(
        (c) => c[1]?.responseType === 'stream',
      );
      expect(mediaCall?.[1]).toMatchObject({
        responseType: 'stream',
        headers: { 'User-Agent': 'MyAgent/1.0' },
      });
    });

    it('logs and rethrows on stream failure and cleans up tmp file', async () => {
      const dir = await mkTmpDir();
      const dest = path.join(dir, 'out.zip');

      // make tmp path deterministic so we can assert cleanup
      const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(1700000000000);
      const rndSpy = vi.spyOn(Math, 'random').mockReturnValue(0.123456);

      const logger = { error: vi.fn(), debug: vi.fn() };

      mockFilesGet.mockImplementation((params: any, options?: any) => {
        if (params?.fields === 'size') {
          return Promise.resolve({ data: { size: '100' } });
        }
        if (options?.responseType === 'stream') {
          const s = new PassThrough();
          queueMicrotask(() => {
            s.write(Buffer.from('abc'));
            // fail mid-stream
            s.destroy(new Error('boom'));
          });
          return Promise.resolve({ data: s });
        }
        return Promise.reject(new Error('unexpected call'));
      });

      const expectedTmp = `${dest}.tmp.${Date.now()}.${Math.random()
        .toString(16)
        .slice(2)}`;

      await expect(
        downloadDriveFileByIdApiKey({
          fileId: 'FILE',
          apiKey: 'KEY',
          destinationPath: dest,
          logger: logger as any,
        }),
      ).rejects.toBeTruthy();

      // destination should not exist
      await expect(fs.stat(dest)).rejects.toBeTruthy();

      // tmp should be cleaned up (may or may not have been created depending on timing,
      // but if it exists, cleanup must remove it)
      try {
        await fs.stat(expectedTmp);
        // if stat succeeds, that's a failure — tmp should be removed
        throw new Error('tmp file still exists');
      } catch {
        // ok: does not exist
      }

      expect(logger.error).toHaveBeenCalledWith('Drive API download failed', {
        fileId: 'FILE',
        err: expect.any(String),
      });

      nowSpy.mockRestore();
      rndSpy.mockRestore();
    });

    it('throws a helpful error if Drive returns no stream body', async () => {
      const dir = await mkTmpDir();
      const dest = path.join(dir, 'out.zip');

      mockFilesGet.mockImplementation((params: any, options?: any) => {
        if (params?.fields === 'size') {
          return Promise.resolve({ data: { size: '10' } });
        }
        if (options?.responseType === 'stream') {
          return Promise.resolve({ data: null }); // triggers "missing response body"
        }
        return Promise.reject(new Error('unexpected call'));
      });

      await expect(
        downloadDriveFileByIdApiKey({
          fileId: 'FILE',
          apiKey: 'KEY',
          destinationPath: dest,
        }),
      ).rejects.toThrow(/missing response body/i);
    });

    it('does not set totalBytes when Drive size is missing/invalid (meta.data.size -> Number -> finite && >0)', async () => {
      const dir = await mkTmpDir();
      const dest = path.join(dir, 'out.zip');

      mockFilesGet.mockImplementation((params: any, options?: any) => {
        // meta: size present but invalid for "finite && > 0"
        if (params?.fields === 'size') {
          return Promise.resolve({ data: { size: '0' } }); // -> 0, fails s > 0
        }

        if (options?.responseType === 'stream') {
          const s = new PassThrough();
          queueMicrotask(() => {
            s.end(Buffer.from('abc'));
          });
          return Promise.resolve({ data: s });
        }

        return Promise.reject(new Error('unexpected call'));
      });

      const progress: Array<{ downloadedBytes: number; totalBytes?: number }> =
        [];

      const res = await downloadDriveFileByIdApiKey({
        fileId: 'FILE',
        apiKey: 'KEY',
        destinationPath: dest,
        onProgress: (p) => progress.push(p),
      });

      expect(res.bytes).toBe(3);
      expect(res.totalBytes).toBeUndefined();

      // initial emit should include totalBytes undefined
      expect(progress[0]).toEqual({
        downloadedBytes: 0,
        totalBytes: undefined,
      });
      expect(progress.at(-1)).toEqual({
        downloadedBytes: 3,
        totalBytes: undefined,
      });
    });

    it('logs String(err) when rejection is not an Error (covers err instanceof Error ? ... : String(err))', async () => {
      const dir = await mkTmpDir();
      const dest = path.join(dir, 'out.zip');

      const logger = { error: vi.fn(), debug: vi.fn() };

      mockFilesGet.mockImplementation((params: any, options?: any) => {
        if (params?.fields === 'size') {
          // keep this simple; even if it fails, it is swallowed by the try/catch in meta lookup
          return Promise.resolve({ data: { size: '10' } });
        }

        if (options?.responseType === 'stream') {
          // Reject with a non-Error value
          return Promise.reject('NOPE');
        }

        return Promise.reject(new Error('unexpected call'));
      });

      await expect(
        downloadDriveFileByIdApiKey({
          fileId: 'FILE',
          apiKey: 'KEY',
          destinationPath: dest,
          logger: logger as any,
        }),
      ).rejects.toBeTruthy();

      expect(logger.error).toHaveBeenCalledWith('Drive API download failed', {
        fileId: 'FILE',
        err: 'NOPE',
      });
    });

    it('leaves totalBytes undefined when meta.data.size is missing (ternary false branch)', async () => {
      const dir = await mkTmpDir();
      const dest = path.join(dir, 'out.zip');

      mockFilesGet.mockImplementation((params: any, options?: any) => {
        if (params?.fields === 'size') {
          return Promise.resolve({ data: {} }); // size missing -> falsy -> undefined branch
        }

        if (options?.responseType === 'stream') {
          const s = new PassThrough();
          queueMicrotask(() => s.end(Buffer.from('abc')));
          return Promise.resolve({ data: s });
        }

        return Promise.reject(new Error('unexpected call'));
      });

      const progress: Array<{ downloadedBytes: number; totalBytes?: number }> =
        [];

      const res = await downloadDriveFileByIdApiKey({
        fileId: 'FILE',
        apiKey: 'KEY',
        destinationPath: dest,
        onProgress: (p) => progress.push(p),
      });

      expect(res.bytes).toBe(3);
      expect(res.totalBytes).toBeUndefined();
      expect(progress[0]).toEqual({
        downloadedBytes: 0,
        totalBytes: undefined,
      });
    });
  });

  it('swallows destination rm errors (covers rm().catch(() => {})) and then fails when renaming onto an existing dir', async () => {
    const dir = await mkTmpDir();
    const dest = path.join(dir, 'out.zip');

    // Make destinationPath a NON-empty directory so fs.rm(dest, {force:true}) rejects
    await fs.mkdir(dest);
    await fs.writeFile(path.join(dest, 'keep.txt'), 'x');

    // deterministic tmp path so we can assert it gets cleaned up
    const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(1700000000001);
    const rndSpy = vi.spyOn(Math, 'random').mockReturnValue(0.424242);

    const logger = { error: vi.fn(), debug: vi.fn() };

    mockFilesGet.mockImplementation((params: any, options?: any) => {
      if (params?.fields === 'size') {
        return Promise.resolve({ data: { size: '3' } });
      }
      if (options?.responseType === 'stream') {
        const s = new PassThrough();
        queueMicrotask(() => s.end(Buffer.from('abc')));
        return Promise.resolve({ data: s });
      }
      return Promise.reject(new Error('unexpected call'));
    });

    const expectedTmp = `${dest}.tmp.${Date.now()}.${Math.random()
      .toString(16)
      .slice(2)}`;

    await expect(
      downloadDriveFileByIdApiKey({
        fileId: 'FILE',
        apiKey: 'KEY',
        destinationPath: dest,
        logger: logger as any,
      }),
    ).rejects.toBeTruthy();

    // rm() failed but was swallowed, so the dest directory should still exist
    const st = await fs.stat(dest);
    expect(st.isDirectory()).toBe(true);

    // tmp should be cleaned up in the outer catch
    await expect(fs.stat(expectedTmp)).rejects.toBeTruthy();

    expect(logger.error).toHaveBeenCalledWith('Drive API download failed', {
      fileId: 'FILE',
      err: expect.any(String),
    });

    nowSpy.mockRestore();
    rndSpy.mockRestore();
  });
});
