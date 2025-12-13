import type { KrakenRestBase } from '../../../base/restBase';

export type KrakenExportReportType = 'trades' | 'ledgers';
export type KrakenExportReportFormat = 'CSV' | 'TSV';

export interface KrakenRequestExportReportParams {
  /**
   * Type of data to export.
   * - "trades"
   * - "ledgers"
   */
  report: KrakenExportReportType;

  /**
   * File format to export.
   * Default on Kraken is "CSV" if omitted.
   */
  format?: KrakenExportReportFormat;

  /**
   * Description for the export (required by API).
   */
  description: string;

  /**
   * Comma-delimited list of fields to include.
   *
   * Default on Kraken is "all" if omitted.
   *
   * For trades:
   *   ordertxid, time, ordertype, price, cost, fee, vol,
   *   margin, misc, ledgers
   *
   * For ledgers:
   *   refid, time, type, subtype, aclass, asset,
   *   amount, fee, balance, wallet
   */
  fields?: string;

  /**
   * UNIX timestamp for report start time.
   * Default on Kraken is the 1st of the current month if omitted.
   */
  starttm?: number;

  /**
   * UNIX timestamp for report end time.
   * Default on Kraken is "now" if omitted.
   */
  endtm?: number;
}

/**
 * Response payload when requesting an export.
 */
export interface KrakenRequestExportReportResult {
  /** Report ID assigned by Kraken */
  id: string;
}

/**
 * POST /0/private/AddExport
 *
 * Request export of trades or ledgers.
 *
 * Note:
 * - `nonce` is handled automatically by the client.
 * - Requires "Data – Export data" permission.
 */
export function requestExportReport(
  base: KrakenRestBase,
  params: KrakenRequestExportReportParams,
): Promise<KrakenRequestExportReportResult> {
  const body: Record<string, string> = {
    report: params.report,
    description: params.description,
  };

  if (params.format) {
    body.format = params.format;
  }

  if (params.fields) {
    body.fields = params.fields;
  }

  if (params.starttm !== undefined) {
    body.starttm = String(params.starttm);
  }

  if (params.endtm !== undefined) {
    body.endtm = String(params.endtm);
  }

  return base.privatePost<KrakenRequestExportReportResult>(
    '/0/private/AddExport',
    body,
  );
}
