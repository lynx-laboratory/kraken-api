import type { KrakenRestBase } from '../../../base/restBase';

/**
 * Operation to perform on the export report:
 * - "cancel": for queued or processing reports
 * - "delete": for already processed reports
 */
export type KrakenDeleteExportReportType = 'cancel' | 'delete';

export interface KrakenDeleteExportReportParams {
  /**
   * ID of report to delete or cancel.
   */
  id: string;

  /**
   * Operation to perform:
   * - "cancel" for queued/processing reports
   * - "delete" for processed reports
   */
  type: KrakenDeleteExportReportType;
}

export interface KrakenDeleteExportReportResult {
  /**
   * Whether deletion was successful.
   * Only meaningful when `type = "delete"`.
   */
  delete: boolean;

  /**
   * Whether cancellation was successful.
   * Only meaningful when `type = "cancel"`.
   */
  cancel: boolean;
}

/**
 * POST /0/private/RemoveExport
 *
 * Delete or cancel an exported trades/ledgers report.
 *
 * Note:
 * - `nonce` is handled automatically by the client.
 * - Requires "Data – Export data" permission.
 */
export function deleteExportReport(
  base: KrakenRestBase,
  params: KrakenDeleteExportReportParams,
): Promise<KrakenDeleteExportReportResult> {
  const body: Record<string, string> = {
    id: params.id,
    type: params.type,
  };

  return base.privatePost<KrakenDeleteExportReportResult>(
    '/0/private/RemoveExport',
    body,
  );
}
