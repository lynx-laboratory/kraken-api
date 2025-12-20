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

  // Status is a special channel Kraken sends automatically on connect,
  // and whenever engine status changes. No subscribe call needed.
  const offStatus = wsClient.admin.onStatus((msg) => {
    console.log(JSON.stringify(msg, null, 2));
  });

  console.log(
    'ok - listening for admin status messages (30s). Ctrl+C to exit.',
  );

  let shuttingDown = false;
  const shutdown = async (reason: string) => {
    if (shuttingDown) return;
    shuttingDown = true;

    console.log(`\nclosing (${reason})...`);

    try {
      offStatus();
    } catch {}

    // small delay so last logs flush cleanly
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
