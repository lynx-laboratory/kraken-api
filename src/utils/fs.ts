import fs from 'node:fs';
import { stat } from 'node:fs/promises';

export async function ensureDir(dir: string): Promise<void> {
  await fs.promises.mkdir(dir, { recursive: true });
}

export async function fileExists(p: string): Promise<boolean> {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

export async function rmPath(p: string): Promise<void> {
  try {
    await fs.promises.rm(p, { recursive: true, force: true });
  } catch {
    // ignore
  }
}
