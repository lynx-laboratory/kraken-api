import { KrakenSpotRestClient } from '@lynx-crypto/kraken-api';

async function main() {
  const kraken = new KrakenSpotRestClient({
    userAgent: 'lynx-crypto/examples (ohlc)',
  });

  const res = await kraken.marketData.getOhlcData({
    pair: 'XBTUSD',
    interval: 1,
  });

  // Kraken commonly returns these internal pair codes:
  // - XXBTZUSD for XBT/USD
  const keys = Object.keys(res.ohlc);
  const key = res.ohlc['XXBTZUSD']
    ? 'XXBTZUSD'
    : res.ohlc['XBTUSD']
      ? 'XBTUSD'
      : keys[0];

  const candles = res.ohlc[key] ?? [];

  console.log('Returned keys:', keys);
  console.log('pair used:', key);
  console.log('next since:', res.last);
  console.log('candles returned:', candles.length);
  console.log('last 3 candles:', candles.slice(-3));
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
