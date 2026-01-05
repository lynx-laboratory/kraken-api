import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import { describe, it, expect } from 'vitest';

import { KrakenBulkClient } from '../../../src/bulk/bulkClient';
import { KrakenBulkOhlcvtApi } from '../../../src/bulk/ohlcvtApi';
import { KrakenBulkTradesApi } from '../../../src/bulk/tradesApi';

async function mkTmpDir(prefix = 'kraken-bulkclient-') {
  return await fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

describe('bulk/bulkClient.ts - KrakenBulkClient', () => {
  it('constructs and exposes trades + ohlcvt APIs', async () => {
    const dir = await mkTmpDir();

    const client = new KrakenBulkClient({ storageDir: dir });

    expect(client.trades).toBeInstanceOf(KrakenBulkTradesApi);
    expect(client.ohlcvt).toBeInstanceOf(KrakenBulkOhlcvtApi);
  });

  it('uses the provided storageDir (error meta includes expectedPath under it)', async () => {
    const dir = await mkTmpDir();

    const client = new KrakenBulkClient({ storageDir: dir });

    // no api key + no existing zip => base throws key-required error
    try {
      await client.trades.download({ type: 'complete' });
      throw new Error('expected throw');
    } catch (err: any) {
      expect(err?.code).toBe('BULK_DRIVE_API_KEY_REQUIRED');
      const expectedPath = err?.meta?.expectedPath ?? err?.meta?.zipPath;
      expect(typeof expectedPath).toBe('string');
      expect(String(expectedPath)).toContain(path.join(dir, 'trades'));
    }
  });
});
