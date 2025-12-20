import 'dotenv/config';
import WebSocket from 'ws';
import {
  KrakenSpotWebsocketV2Client,
  type KrakenWsOhlcMessage,
} from '@lynx-crypto/kraken-api';

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function isObject(x: unknown): x is Record<string, unknown> {
  return !!x && typeof x === 'object';
}

function isOhlcMessage(msg: unknown): msg is KrakenWsOhlcMessage {
  return isObject(msg) && msg.channel === 'ohlc';
}

async function main() {
  const wsClient = new KrakenSpotWebsocketV2Client({
    WebSocketImpl: WebSocket as any,
    autoReconnect: false,
  });

  await wsClient.publicConnection.connect();

  const removeHandler = wsClient.publicConnection.addMessageHandler((msg) => {
    if (isOhlcMessage(msg)) {
      console.log(JSON.stringify(msg, null, 2));
      return;
    }

    // Helpful while developing
    if (isObject(msg) && (msg.event === 'status' || msg.type === 'status')) {
      console.log('[status]', JSON.stringify(msg));
      return;
    }
    if (
      isObject(msg) &&
      (msg.event === 'subscriptionStatus' || msg.type === 'subscribed')
    ) {
      console.log('[sub]', JSON.stringify(msg));
      return;
    }
  });

  const symbol = ['BTC/USD'];
  const interval = 1; // 1-minute candles

  const ack = await wsClient.marketData.subscribeOhlc(
    {
      symbol,
      interval,
      snapshot: true,
    },
    { reqId: 1301 },
  );

  if (!ack.success) {
    console.error('subscribeOhlc failed:', ack.error ?? ack);
    removeHandler();
    wsClient.publicConnection.close(1000, 'example failed');
    process.exitCode = 1;
    return;
  }

  console.log(
    'ok - subscribed to ohlc BTC/USD interval=1 (running 30s). Ctrl+C to exit.',
  );

  let shuttingDown = false;
  const shutdown = async (reason: string) => {
    if (shuttingDown) return;
    shuttingDown = true;

    console.log(`\nclosing (${reason})...`);

    // Best-effort unsubscribe
    try {
      await wsClient.marketData.unsubscribeOhlc(
        { symbol, interval },
        { reqId: 1302 },
      );
    } catch (err) {
      console.warn('unsubscribeOhlc error (ignored):', err);
    }

    await sleep(150);

    removeHandler();
    wsClient.publicConnection.close(1000, 'example done');
  };

  const timer = setTimeout(() => void shutdown('timeout'), 30_000);
  process.on('SIGINT', () => {
    clearTimeout(timer);
    void shutdown('SIGINT');
  });
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
