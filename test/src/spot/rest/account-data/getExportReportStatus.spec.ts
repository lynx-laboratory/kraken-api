import { describe, it, expect } from 'vitest';
import { getExportReportStatus } from '../../../../../src/spot/rest/account-data/getExportReportStatus';
import {
  mockRestBase,
  expectPrivatePostOnce,
} from '../../../../utils/restBaseMock';

describe('getExportReportStatus', () => {
  it('calls base.privatePost with correct path + body and returns result', async () => {
    const { base, privatePost } = mockRestBase();

    const fakeResult = [
      {
        id: 'RPT1',
        descr: 'Trades export',
        format: 'CSV',
        report: 'trades',
        subtype: 'all',
        status: 'Processed',
        fields: 'time,pair',
        createdtm: '1700000000',
        starttm: '1700000001',
        completedtm: '1700000002',
        datastarttm: '1699990000',
        dataendtm: '1700000000',
        asset: 'ZUSD',
      },
    ];

    privatePost.mockResolvedValue(fakeResult);

    const res = await getExportReportStatus(base, { report: 'trades' });

    expectPrivatePostOnce(privatePost, '/0/private/ExportStatus', {
      report: 'trades',
    });

    expect(res).toEqual(fakeResult);
  });
});
