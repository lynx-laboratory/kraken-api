import 'dotenv/config';
import WebSocket from 'ws';
import {
  KrakenSpotRestClient,
  KrakenSpotWebsocketV2Client,
  type KrakenWsExecutionsMessage,
} from '@lynx-crypto/kraken-api';

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function isObject(x: unknown): x is Record<string, unknown> {
  return !!x && typeof x === 'object';
}

function isExecutionsMessage(msg: unknown): msg is KrakenWsExecutionsMessage {
  return isObject(msg) && msg.channel === 'executions';
}

async function main() {
  const kraken = new KrakenSpotRestClient({
    userAgent: 'lynx-crypto/examples (ws-v2 executions)',
    apiKey: requireEnv('KRAKEN_API_KEY'),
    apiSecret: requireEnv('KRAKEN_API_SECRET'),
  });

  // REST → WS auth token (requires "WebSocket interface - On")
  const { token, expires } = await kraken.trading.getWebSocketsToken();
  console.log('ok - got ws token (expires in seconds):', expires);

  const wsClient = new KrakenSpotWebsocketV2Client({
    WebSocketImpl: WebSocket as any,
    autoReconnect: false,
    authToken: token,
  });

  await wsClient.privateConnection.connect();

  const removeHandler = wsClient.privateConnection.addMessageHandler((msg) => {
    if (isExecutionsMessage(msg)) {
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

  // You can tune these flags depending on how chatty you want it.
  const ack = await wsClient.userData.subscribeExecutions(
    {
      snap_trades: true,
      snap_orders: true,
      order_status: true,
    },
    { reqId: 10001, attachAuthToken: true },
  );

  if (!ack.success) {
    console.error('subscribeExecutions failed:', ack.error ?? ack);
    removeHandler();
    wsClient.privateConnection.close(1000, 'example failed');
    process.exitCode = 1;
    return;
  }

  console.log('ok - subscribed to executions (running 30s). Ctrl+C to exit.');

  let shuttingDown = false;
  const shutdown = async (reason: string) => {
    if (shuttingDown) return;
    shuttingDown = true;

    console.log(`\nclosing (${reason})...`);

    // Best-effort unsubscribe
    try {
      await wsClient.userData.unsubscribeExecutions({}, { reqId: 10002 });
    } catch (err) {
      console.warn('unsubscribeExecutions error (ignored):', err);
    }

    await sleep(150);

    removeHandler();
    wsClient.privateConnection.close(1000, 'example done');
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
