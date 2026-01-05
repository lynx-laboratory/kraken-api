import { KrakenBulkBase } from '../base/bulkBase';
import type { KrakenBulkClientOptions } from '../types/types';
import { KrakenBulkOhlcvtApi } from './ohlcvtApi';
import { KrakenBulkTradesApi } from './tradesApi';

export class KrakenBulkClient {
  readonly trades: KrakenBulkTradesApi;
  readonly ohlcvt: KrakenBulkOhlcvtApi;

  private readonly base: KrakenBulkBase;

  constructor(options: KrakenBulkClientOptions = {}) {
    this.base = new KrakenBulkBase(options);
    this.trades = new KrakenBulkTradesApi(this.base);
    this.ohlcvt = new KrakenBulkOhlcvtApi(this.base);
  }
}
