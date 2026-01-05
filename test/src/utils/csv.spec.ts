import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import { describe, it, expect } from 'vitest';

import { streamCsvRows } from '../../../src/utils/csv';

async function mkTmpDir(prefix = 'kraken-api-csv-') {
  return await fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

describe('utils/csv.ts - streamCsvRows', () => {
  it('streams rows from a CSV file (trimmed, skip empty lines, relaxed column count)', async () => {
    const dir = await mkTmpDir();
    const file = path.join(dir, 'test.csv');

    await fs.writeFile(
      file,
      [
        'a,b,c',
        ' 1 , 2 , 3 ',
        '',
        'x,y', // relaxed column count
      ].join('\n'),
      'utf8',
    );

    const rows: string[][] = [];
    for await (const r of streamCsvRows(file)) {
      rows.push(r);
    }

    expect(rows).toEqual([
      ['a', 'b', 'c'],
      ['1', '2', '3'],
      ['x', 'y'],
    ]);
  });

  it('rejects iteration if the underlying read stream errors (missing file)', async () => {
    const missing = path.join(os.tmpdir(), `nope-${Date.now()}.csv`);

    const consume = async () => {
      const out: string[][] = [];
      for await (const r of streamCsvRows(missing)) out.push(r);
      return out;
    };

    await expect(consume()).rejects.toBeTruthy();
  });
});
