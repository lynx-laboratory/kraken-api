import 'dotenv/config';
import WebSocket from 'ws';
import { KrakenSpotWebsocketV2Client } from '@lynx-crypto/kraken-api';

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const wsClient = new KrakenSpotWebsocketV2Client({
    WebSocketImpl: WebSocket as any,
    autoReconnect: false,
  });

  await wsClient.publicConnection.connect();

  const offHeartbeat = wsClient.admin.onHeartbeat((msg) => {
    // Some heartbeat helpers pass the full message, some pass nothing.
    // Your current typings suggest a handler; we’ll just log whatever arrives.
    console.log('[heartbeat]', JSON.stringify(msg ?? null));
  });

  console.log('ok - listening for heartbeat messages (30s). Ctrl+C to exit.');

  let shuttingDown = false;
  const shutdown = async (reason: string) => {
    if (shuttingDown) return;
    shuttingDown = true;

    console.log(`\nclosing (${reason})...`);

    try {
      offHeartbeat();
    } catch {}

    await sleep(50);

    wsClient.publicConnection.close(1000, 'example done');
  };

  const timer = setTimeout(() => void shutdown('timeout'), 120_000);
  process.on('SIGINT', () => {
    clearTimeout(timer);
    void shutdown('SIGINT');
  });
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
