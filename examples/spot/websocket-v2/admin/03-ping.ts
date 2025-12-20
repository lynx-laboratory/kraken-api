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

  // Optional: log status messages too (handy when debugging)
  const off = wsClient.publicConnection.addMessageHandler((msg) => {
    if (msg && typeof msg === 'object') {
      const m = msg as any;
      if (m.event === 'status' || m.type === 'status') {
        console.log('[status]', JSON.stringify(m));
      }
    }
  });

  const res = await wsClient.admin.ping({}, { reqId: 8001 });

  // Some Kraken responses omit `success`. Consider it a failure only if:
  // - success is explicitly false, OR
  // - an error string exists.
  // Otherwise, treat "pong" as success.
  const ok =
    res.success !== false &&
    !res.error &&
    (res.method === 'pong' || res.method === 'ping' || !!res.time_out);

  if (!ok) {
    console.error('ping failed:', res.error ?? res);
    wsClient.publicConnection.close(1000, 'example failed');
    process.exitCode = 1;
    return;
  }

  console.log('ok - ping response:', JSON.stringify(res));

  // Give logs a moment to flush
  await sleep(50);

  off();
  wsClient.publicConnection.close(1000, 'example done');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
