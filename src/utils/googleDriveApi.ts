import fs from 'node:fs';
import path from 'node:path';
import { rename, rm } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';

import { google } from 'googleapis';
import type { drive_v3 } from 'googleapis';

import type {
  KrakenLogger,
  KrakenBulkDownloadProgressCallback,
} from '../types/types';

import { ensureDir } from './fs';

function getDrive(): drive_v3.Drive {
  // API-key access uses the `key` parameter per request.
  return google.drive({ version: 'v3' });
}

export async function listDriveFolderFilesApiKey(args: {
  folderId: string;
  apiKey: string;
  userAgent?: string;
  logger?: KrakenLogger;
}): Promise<Array<{ id: string; name: string }>> {
  const { folderId, apiKey, userAgent, logger } = args;

  const drive = getDrive();
  logger?.debug?.('Drive API folder listing', { folderId });

  const out: Array<{ id: string; name: string }> = [];
  let pageToken: string | undefined;

  do {
    const res = await drive.files.list({
      key: apiKey,
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'nextPageToken, files(id, name)',
      pageSize: 1000,
      pageToken,
      ...(userAgent ? ({ headers: { 'User-Agent': userAgent } } as any) : {}),
    });

    for (const f of res.data.files ?? []) {
      if (!f.id || !f.name) continue;
      out.push({ id: f.id, name: f.name });
    }

    pageToken = res.data.nextPageToken ?? undefined;
  } while (pageToken);

  return out;
}

export async function downloadDriveFileByIdApiKey(args: {
  fileId: string;
  apiKey: string;
  destinationPath: string;
  userAgent?: string;
  logger?: KrakenLogger;
  onProgress?: KrakenBulkDownloadProgressCallback;
}): Promise<{ bytes: number; totalBytes?: number }> {
  const { fileId, apiKey, destinationPath, userAgent, logger, onProgress } =
    args;

  await ensureDir(path.dirname(destinationPath));

  const drive = getDrive();

  // Best-effort size lookup for progress totals
  let totalBytes: number | undefined;
  try {
    const meta = await drive.files.get({
      key: apiKey,
      fileId,
      fields: 'size',
    });
    const s = meta.data.size ? Number(meta.data.size) : undefined;
    if (s !== undefined && Number.isFinite(s) && s > 0) totalBytes = s;
  } catch {
    // ignore
  }

  const tmpPath = `${destinationPath}.tmp.${Date.now()}.${Math.random()
    .toString(16)
    .slice(2)}`;

  let downloadedBytes = 0;

  try {
    logger?.debug?.('Drive API download starting', { fileId, destinationPath });

    const res = await drive.files.get(
      { key: apiKey, fileId, alt: 'media' },
      {
        responseType: 'stream',
        ...(userAgent ? ({ headers: { 'User-Agent': userAgent } } as any) : {}),
      },
    );

    const stream = res.data as unknown as NodeJS.ReadableStream;
    if (!stream || typeof (stream as any).pipe !== 'function') {
      throw new Error('Drive download missing response body');
    }

    // emit an initial 0 for UI init
    onProgress?.({ downloadedBytes: 0, totalBytes });

    stream.on('data', (chunk: Buffer) => {
      downloadedBytes += chunk.length;
      onProgress?.({ downloadedBytes, totalBytes });
    });

    await pipeline(stream, fs.createWriteStream(tmpPath));

    // Only now replace the destination (safe)
    await rm(destinationPath, { force: true }).catch(() => {});
    await rename(tmpPath, destinationPath);

    // final emit
    onProgress?.({ downloadedBytes, totalBytes });

    return { bytes: downloadedBytes, totalBytes };
  } catch (err) {
    try {
      await rm(tmpPath, { force: true });
    } catch {
      // ignore
    }
    const msg = err instanceof Error ? err.message : String(err);
    logger?.error?.('Drive API download failed', { fileId, err: msg });
    throw err;
  }
}
