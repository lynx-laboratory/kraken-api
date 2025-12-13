import { describe, it, expect } from 'vitest';
import { deleteExportReport } from '../../../../../src/spot/rest/account-data/deleteExportReport';
import {
  mockRestBase,
  expectPrivatePostOnce,
} from '../../../../utils/restBaseMock';

describe('deleteExportReport', () => {
  it('calls base.privatePost with correct path + body', async () => {
    const { base, privatePost } = mockRestBase();
    privatePost.mockResolvedValue({ delete: true, cancel: false });

    const res = await deleteExportReport(base, {
      id: 'abc123',
      type: 'delete',
    });

    expectPrivatePostOnce(privatePost, '/0/private/RemoveExport', {
      id: 'abc123',
      type: 'delete',
    });

    expect(res).toEqual({ delete: true, cancel: false });
  });

  it('supports type=cancel', async () => {
    const { base, privatePost } = mockRestBase();
    privatePost.mockResolvedValue({ delete: false, cancel: true });

    const res = await deleteExportReport(base, {
      id: 'rpt_999',
      type: 'cancel',
    });

    expectPrivatePostOnce(privatePost, '/0/private/RemoveExport', {
      id: 'rpt_999',
      type: 'cancel',
    });

    expect(res).toEqual({ delete: false, cancel: true });
  });
});
