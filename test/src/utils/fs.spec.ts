import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import { describe, it, expect } from 'vitest';

import { ensureDir, fileExists, rmPath } from '../../../src/utils/fs';

async function mkTmpDir(prefix = 'kraken-api-fs-') {
  return await fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

describe('utils/fs.ts', () => {
  it('ensureDir creates nested directories (idempotent)', async () => {
    const dir = await mkTmpDir();
    const nested = path.join(dir, 'a/b/c');

    await ensureDir(nested);
    await ensureDir(nested); // should not throw

    expect(await fileExists(nested)).toBe(true);
  });

  it('fileExists returns true/false correctly', async () => {
    const dir = await mkTmpDir();
    const f = path.join(dir, 'x.txt');

    expect(await fileExists(f)).toBe(false);

    await fs.writeFile(f, 'hi', 'utf8');
    expect(await fileExists(f)).toBe(true);
  });

  it('rmPath removes files/directories and ignores missing paths', async () => {
    const dir = await mkTmpDir();
    const nestedDir = path.join(dir, 'deep');
    const f = path.join(nestedDir, 'file.txt');

    await ensureDir(nestedDir);
    await fs.writeFile(f, 'data', 'utf8');

    expect(await fileExists(f)).toBe(true);

    await rmPath(nestedDir);
    expect(await fileExists(nestedDir)).toBe(false);

    // missing path should not throw
    await rmPath(path.join(dir, 'does-not-exist'));
  });
});
