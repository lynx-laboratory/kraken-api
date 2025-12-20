import 'dotenv/config';
import WebSocket from 'ws';
import {
  KrakenSpotWebsocketV2Client,
  type KrakenWsBookMessage,
} from '@lynx-crypto/kraken-api';

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function isObject(x: unknown): x is Record<string, unknown> {
  return !!x && typeof x === 'object';
}

function isBookMessage(msg: unknown): msg is KrakenWsBookMessage {
  return isObject(msg) && msg.channel === 'book';
}

async function main() {
  const wsClient = new KrakenSpotWebsocketV2Client({
    WebSocketImpl: WebSocket as any,
    autoReconnect: false,
  });

  await wsClient.publicConnection.connect();

  const removeHandler = wsClient.publicConnection.addMessageHandler((msg) => {
    if (isBookMessage(msg)) {
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
  const depth = 10; // keep small for examples; can bump to 100

  const ack = await wsClient.marketData.subscribeBook(
    {
      symbol,
      depth,
      snapshot: true,
    },
    { reqId: 1101 },
  );

  if (!ack.success) {
    console.error('subscribeBook failed:', ack.error ?? ack);
    removeHandler();
    wsClient.publicConnection.close(1000, 'example failed');
    process.exitCode = 1;
    return;
  }

  console.log(
    `ok - subscribed to book BTC/USD depth=${depth} (running 30s). Ctrl+C to exit.`,
  );

  let shuttingDown = false;
  const shutdown = async (reason: string) => {
    if (shuttingDown) return;
    shuttingDown = true;

    console.log(`\nclosing (${reason})...`);

    // Best-effort unsubscribe
    try {
      await wsClient.marketData.unsubscribeBook(
        { symbol, depth },
        { reqId: 1102 },
      );
    } catch (err) {
      console.warn('unsubscribeBook error (ignored):', err);
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
