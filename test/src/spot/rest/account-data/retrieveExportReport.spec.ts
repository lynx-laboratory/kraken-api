import { describe, it, expect, vi } from 'vitest';
import { retrieveExportReport } from '../../../../../src/spot/rest/account-data/retrieveExportReport';
import type { KrakenRestBase } from '../../../../../src/base/restBase';

describe('retrieveExportReport', () => {
  it('calls privatePostBinary with the right path + body and returns ArrayBuffer', async () => {
    const buf = new ArrayBuffer(3);

    const base = {
      privatePostBinary: vi.fn().mockResolvedValue(buf),
    } as unknown as KrakenRestBase & {
      privatePostBinary(
        path: string,
        body?: Record<string, string>,
      ): Promise<ArrayBuffer>;
    };

    const res = await retrieveExportReport(base, { id: 'RPT123' });

    expect(base.privatePostBinary).toHaveBeenCalledTimes(1);
    expect(base.privatePostBinary).toHaveBeenCalledWith(
      '/0/private/RetrieveExport',
      { id: 'RPT123' },
    );
    expect(res).toBe(buf);
  });
});
