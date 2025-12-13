import type { KrakenRestBase } from '../../../base/restBase';

/**
 * Params for RetrieveExport.
 */
export interface KrakenRetrieveExportParams {
  /**
   * Report ID to retrieve (from AddExport / ExportStatus).
   */
  id: string;
}

/**
 * Result of RetrieveExport.
 *
 * We return raw binary (ZIP archive). You can wrap/convert this to
 * Buffer, write to disk, etc., in your calling code.
 */
export type KrakenRetrieveExportResult = ArrayBuffer;

/**
 * POST /0/private/RetrieveExport
 *
 * Retrieve a processed data export.
 *
 * Note:
 * - Response is `application/octet-stream` (binary ZIP), not JSON.
 * - `nonce` is handled automatically by the client.
 * - Requires "Data – Export data" permission.
 *
 * IMPORTANT:
 * - Your KrakenRestBase should expose a `privatePostBinary` (or similar)
 *   that returns an ArrayBuffer instead of JSON.
 */
export function retrieveExportReport(
  base: KrakenRestBase & {
    // You’ll need to add this to your concrete RestBase implementation.
    privatePostBinary(
      path: string,
      body?: Record<string, string>,
    ): Promise<ArrayBuffer>;
  },
  params: KrakenRetrieveExportParams,
): Promise<KrakenRetrieveExportResult> {
  const body: Record<string, string> = {
    id: params.id,
  };

  return base.privatePostBinary('/0/private/RetrieveExport', body);
}
