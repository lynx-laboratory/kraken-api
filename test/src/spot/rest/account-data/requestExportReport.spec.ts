import { describe, it, expect } from 'vitest';
import { requestExportReport } from '../../../../../src/spot/rest/account-data/requestExportReport';
import {
  mockRestBase,
  expectPrivatePostOnce,
} from '../../../../utils/restBaseMock';

describe('requestExportReport', () => {
  it('sends required fields (report + description)', async () => {
    const { base, privatePost } = mockRestBase();
    privatePost.mockResolvedValue({ id: 'RPT123' });

    const res = await requestExportReport(base, {
      report: 'trades',
      description: 'my export',
    });

    expectPrivatePostOnce(privatePost, '/0/private/AddExport', {
      report: 'trades',
      description: 'my export',
    });

    expect(res).toEqual({ id: 'RPT123' });
  });

  it('includes optional format and fields when provided', async () => {
    const { base, privatePost } = mockRestBase();
    privatePost.mockResolvedValue({ id: 'RPT999' });

    await requestExportReport(base, {
      report: 'ledgers',
      description: 'ledger export',
      format: 'TSV',
      fields: 'refid,time,type',
    });

    expectPrivatePostOnce(privatePost, '/0/private/AddExport', {
      report: 'ledgers',
      description: 'ledger export',
      format: 'TSV',
      fields: 'refid,time,type',
    });
  });

  it('stringifies starttm/endtm numbers', async () => {
    const { base, privatePost } = mockRestBase();
    privatePost.mockResolvedValue({ id: 'RPT777' });

    await requestExportReport(base, {
      report: 'trades',
      description: 'range export',
      starttm: 1700000000,
      endtm: 1700009999,
    });

    expectPrivatePostOnce(privatePost, '/0/private/AddExport', {
      report: 'trades',
      description: 'range export',
      starttm: '1700000000',
      endtm: '1700009999',
    });
  });

  it('does not include optional keys when omitted', async () => {
    const { base, privatePost } = mockRestBase();
    privatePost.mockResolvedValue({ id: 'RPT1' });

    await requestExportReport(base, {
      report: 'trades',
      description: 'minimal',
      // format/fields/starttm/endtm omitted
    });

    const [, body] = privatePost.mock.calls[0]!;
    expect(body).toEqual({
      report: 'trades',
      description: 'minimal',
    });
  });
});
