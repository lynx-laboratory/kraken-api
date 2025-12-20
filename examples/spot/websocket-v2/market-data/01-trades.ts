import 'dotenv/config';
import WebSocket from 'ws';
import {
  KrakenSpotWebsocketV2Client,
  KrakenWsTradeMessage,
} from '@lynx-crypto/kraken-api';

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function isObject(x: unknown): x is Record<string, unknown> {
  return !!x && typeof x === 'object';
}

/**
 * Very small type guard for trade channel messages.
 * (We keep this minimal so the example stays readable.)
 */
function isTradeMessage(msg: unknown): msg is KrakenWsTradeMessage {
  return isObject(msg) && msg.channel === 'trade';
}

async function main() {
  const wsClient = new KrakenSpotWebsocketV2Client({
    WebSocketImpl: WebSocket as any,
    autoReconnect: false,
    // logger: { info: console.log, warn: console.warn, error: console.error, debug: console.debug },
  });

  // Public WS connection (ws.kraken.com/v2)
  await wsClient.publicConnection.connect();

  // Log streaming messages
  const unsubscribeHandler = wsClient.publicConnection.addMessageHandler(
    (msg) => {
      // Useful connection / ack messages can also show up; keep output focused.
      if (isTradeMessage(msg)) {
        // Print the entire message (snapshot + updates)
        console.log(JSON.stringify(msg, null, 2));
        return;
      }

      // Optional: show status/subscription responses if you want them
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
    },
  );

  const symbol = ['BTC/USD'];

  const ack = await wsClient.marketData.subscribeTrade(
    { symbol, snapshot: true },
    { reqId: 1401 },
  );

  if (!ack.success) {
    console.error('subscribeTrade failed:', ack.error ?? ack);
    unsubscribeHandler();
    wsClient.publicConnection.close(1000, 'example failed');
    process.exitCode = 1;
    return;
  }

  console.log(
    'ok - subscribed to trade BTC/USD (running 30s). Ctrl+C to exit.',
  );

  let shuttingDown = false;
  const shutdown = async (reason: string) => {
    if (shuttingDown) return;
    shuttingDown = true;

    console.log(`\nclosing (${reason})...`);

    // Best-effort unsubscribe: examples should not crash/hang here.
    try {
      await wsClient.marketData.unsubscribeTrade({ symbol }, { reqId: 1402 });
    } catch (err) {
      console.warn('unsubscribeTrade error (ignored):', err);
    }

    // Give Kraken a moment to receive the unsubscribe before closing.
    await sleep(150);

    unsubscribeHandler();
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
