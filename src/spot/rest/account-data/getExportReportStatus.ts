import type { KrakenRestBase } from '../../../base/restBase';
import type { KrakenExportReportType } from './requestExportReport';

/**
 * Status of a single export report.
 */
export type KrakenExportReportStatusState =
  | 'Queued'
  | 'Processing'
  | 'Processed';

export interface KrakenExportReportStatus {
  /** Report ID */
  id: string;

  /** Description provided when the export was requested */
  descr: string;

  /** File format (CSV or TSV) */
  format: string;

  /** Report type ("trades" or "ledgers") */
  report: KrakenExportReportType;

  /** Subtype (not well-documented; keep as string) */
  subtype: string;

  /** Status of the report */
  status: KrakenExportReportStatusState;

  /** Deprecated flags field */
  flags?: string;

  /** Comma-delimited list of fields included in the report */
  fields: string;

  /** UNIX timestamp of report request (string per docs) */
  createdtm: string;

  /** Deprecated expire time */
  expiretm?: string;

  /** UNIX timestamp report processing began (string per docs) */
  starttm: string;

  /** UNIX timestamp report processing finished (string per docs) */
  completedtm: string;

  /** UNIX timestamp of report data start time (string per docs) */
  datastarttm: string;

  /** UNIX timestamp of report data end time (string per docs) */
  dataendtm: string;

  /** Deprecated asset class */
  aclass?: string;

  /** Asset (if applicable) */
  asset: string;
}

/**
 * Request parameters for ExportStatus.
 */
export interface KrakenGetExportReportStatusParams {
  /**
   * Type of reports to inquire about.
   * - "trades"
   * - "ledgers"
   */
  report: KrakenExportReportType;
}

/**
 * POST /0/private/ExportStatus
 *
 * Get status of requested data exports.
 *
 * Note:
 * - `nonce` is handled automatically by the client.
 * - Requires "Data – Export data" permission.
 */
export function getExportReportStatus(
  base: KrakenRestBase,
  params: KrakenGetExportReportStatusParams,
): Promise<KrakenExportReportStatus[]> {
  const body: Record<string, string> = {
    report: params.report,
  };

  return base.privatePost<KrakenExportReportStatus[]>(
    '/0/private/ExportStatus',
    body,
  );
}
