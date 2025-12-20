import 'dotenv/config';
import WebSocket from 'ws';
import {
  KrakenSpotRestClient,
  KrakenSpotWebsocketV2Client,
  type KrakenWsBalancesMessage,
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

function isBalancesMessage(msg: unknown): msg is KrakenWsBalancesMessage {
  return isObject(msg) && msg.channel === 'balances';
}

async function main() {
  const kraken = new KrakenSpotRestClient({
    userAgent: 'lynx-crypto/examples (ws-v2 balances)',
    apiKey: requireEnv('KRAKEN_API_KEY'),
    apiSecret: requireEnv('KRAKEN_API_SECRET'),
  });

  // REST → WS auth token
  // NOTE: Your REST surface currently exposes this under `trading.getWebSocketsToken()`.
  // Requires API key permission: "WebSocket interface - On"
  const { token, expires } = await kraken.trading.getWebSocketsToken();
  console.log('ok - got ws token (expires in seconds):', expires);

  // WS client with auth token for private WS connection
  const wsClient = new KrakenSpotWebsocketV2Client({
    WebSocketImpl: WebSocket as any,
    autoReconnect: false,
    authToken: token,
  });

  // Private WS is `ws-auth.kraken.com/v2`
  await wsClient.privateConnection.connect();

  const removeHandler = wsClient.privateConnection.addMessageHandler((msg) => {
    if (isBalancesMessage(msg)) {
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

  const ack = await wsClient.userData.subscribeBalances(
    { snapshot: true },
    { reqId: 9001, attachAuthToken: true },
  );

  if (!ack.success) {
    console.error('subscribeBalances failed:', ack.error ?? ack);
    removeHandler();
    wsClient.privateConnection.close(1000, 'example failed');
    process.exitCode = 1;
    return;
  }

  console.log('ok - subscribed to balances (running 30s). Ctrl+C to exit.');

  let shuttingDown = false;
  const shutdown = async (reason: string) => {
    if (shuttingDown) return;
    shuttingDown = true;

    console.log(`\nclosing (${reason})...`);

    // Best-effort unsubscribe
    try {
      await wsClient.userData.unsubscribeBalances({}, { reqId: 9002 });
    } catch (err) {
      console.warn('unsubscribeBalances error (ignored):', err);
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
