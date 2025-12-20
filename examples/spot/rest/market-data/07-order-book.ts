import { KrakenSpotRestClient } from '@lynx-crypto/kraken-api';

async function main() {
  const kraken = new KrakenSpotRestClient({
    userAgent: 'lynx-crypto/examples (order-book)',
  });

  const books = await kraken.marketData.getOrderBook({
    pair: 'XBTUSD',
    count: 25,
  });

  const keys = Object.keys(books);
  const key = books['XXBTZUSD'] ? 'XXBTZUSD' : keys[0];

  const book = key ? books[key] : undefined;
  const bestBid = book?.bids?.[0];
  const bestAsk = book?.asks?.[0];

  console.log('Returned keys:', keys);
  console.log('pair used:', key);
  console.log('best bid:', bestBid);
  console.log('best ask:', bestAsk);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
