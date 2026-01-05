# @lynx-crypto/kraken-api

[![Build](https://img.shields.io/github/actions/workflow/status/lynx-laboratory/kraken-api/coverage-badge.yml?branch=master)](https://github.com/lynx-laboratory/kraken-api/actions/workflows/coverage-badge.yml)
[![Coverage](https://github.com/lynx-laboratory/kraken-api/raw/master/badges/coverage.svg)](https://github.com/lynx-laboratory/kraken-api/actions/workflows/coverage-badge.yml)
[![npm](https://img.shields.io/npm/v/%40lynx-crypto%2Fkraken-api)](https://www.npmjs.com/package/@lynx-crypto/kraken-api)
[![downloads](https://img.shields.io/npm/dm/%40lynx-crypto%2Fkraken-api)](https://www.npmjs.com/package/@lynx-crypto/kraken-api)
[![bundlephobia](https://img.shields.io/bundlephobia/minzip/%40lynx-crypto%2Fkraken-api)](https://bundlephobia.com/package/@lynx-crypto/kraken-api)
[![last commit](https://img.shields.io/github/last-commit/lynx-laboratory/kraken-api?branch=master)](https://github.com/lynx-laboratory/kraken-api/commits/master)
[![license](https://img.shields.io/github/license/lynx-laboratory/kraken-api)](./LICENSE.md)

A modern, strongly-typed TypeScript client for the **Kraken Spot API**, providing both **REST** and **WebSocket v2** access in a single package.

- **REST API** (public + private endpoints)
- **WebSocket v2** (public market-data + authenticated user-data/trading)
- **Bulk historical CSV datasets** (OHLCVT + Trades) via Kraken’s official Google Drive downloads

See [Kraken Official Documentation](https://docs.kraken.com/api/docs/category/guides)

## Important

- This package is currently **SPOT only**. It does **not** implement Kraken Futures.
- Unofficial project. Not affiliated with Kraken.

---

## Features

### Spot REST API

- Public market data (time, assets, pairs, ticker, OHLC, order book, trades, spreads)
- Private account data (balances, orders, trades, ledgers, export reports)
- Trading endpoints (add/amend/edit/cancel orders, batch operations)
- Funding endpoints (deposits, withdrawals, transfers)
- Earn endpoints (strategies, allocations, status)
- Subaccounts (master account operations)
- Transparency endpoints (pre-trade / post-trade data)

### Spot WebSocket v2 API

- Public streams (ticker, trades, book, OHLC, instruments)
- Private user streams (balances, executions)
- Private trading RPC methods
- Automatic request/response correlation (`req_id`)
- Optional auto-reconnect with backoff
- Works in Node.js (via `ws`) or browser environments

### Bulk historical CSV datasets (OHLCVT + Trades)

Support for Kraken’s downloadable historical datasets:

- OHLCVT (open/high/low/close/volume/trades)
- Trades (time and sales)

Data source (Kraken Support):

- https://support.kraken.com/sections/360009899492-csv-data
- https://support.kraken.com/articles/360047124832-downloadable-historical-ohlcvt-open-high-low-close-volume-trades-data
- https://support.kraken.com/articles/360047543791-downloadable-historical-market-data-time-and-sales-

Bulk workflow:

- Download ZIPs (seamless via Drive API, or manually)
- Extract ZIPs into a stable on-disk layout
- Query extracted CSVs (streaming)

---

## Installation

Using Yarn:

'''sh
yarn add @lynx-crypto/kraken-api
'''

Using npm:

'''sh
npm install @lynx-crypto/kraken-api
'''

---

## Requirements

- Node.js 18+ recommended
- TypeScript 4.9+ recommended
- For private endpoints:
  - Kraken API key and secret
  - Appropriate permissions enabled in Kraken
  - “WebSocket interface” enabled for private WS usage
- For bulk downloads (optional):
  - A Google Drive API key for seamless downloads (manual ZIP placement is supported)

---

## Environment Variables (for private usage)

'''bash
KRAKEN_API_KEY="your_api_key"
KRAKEN_API_SECRET="your_api_secret"
'''

## Environment Variables (optional, for bulk downloads)

'''bash

# If set, bulk downloads can be performed via the Google Drive API.

# If not set, ZIPs can be downloaded manually and placed into the expected folders.

LYNX_CRYPTO_KRAKEN_API_GOOGLE_DRIVE_API_KEY="your_google_drive_api_key"
'''

---

## Package Exports

### REST

- `KrakenSpotRestClient`

Sub-APIs available on the client:

- `marketData`
- `accountData`
- `trading`
- `funding`
- `subaccounts`
- `earn`
- `transparency`

### WebSocket

- `KrakenSpotWebsocketV2Client`
- `KrakenWebsocketBase` (advanced / custom integrations)

Typed channel namespaces:

- `admin`
- `marketData`
- `userData`
- `userTrading`

### Bulk

- `KrakenBulkClient`

All public request/response and stream payloads are exported as TypeScript types.

---

## REST Usage

### Public REST example (no authentication)

'''ts
import { KrakenSpotRestClient } from '@lynx-crypto/kraken-api';

async function main() {
const kraken = new KrakenSpotRestClient({
userAgent: 'example-app/1.0.0',
});

const time = await kraken.marketData.getServerTime();
console.log('Kraken time:', time.rfc1123);
}

main().catch((err) => {
console.error(err);
process.exitCode = 1;
});
'''

### Private REST example (authenticated)

'''ts
import 'dotenv/config';
import { KrakenSpotRestClient } from '@lynx-crypto/kraken-api';

function requireEnv(name: string): string {
const v = process.env[name];
if (!v) throw new Error(`Missing env var: ${name}`);
return v;
}

async function main() {
const kraken = new KrakenSpotRestClient({
userAgent: 'example-app/1.0.0',
apiKey: requireEnv('KRAKEN_API_KEY'),
apiSecret: requireEnv('KRAKEN_API_SECRET'),
});

const balances = await kraken.accountData.getAccountBalance();
console.log('Asset count:', Object.keys(balances).length);
}

main().catch((err) => {
console.error(err);
process.exitCode = 1;
});
'''

---

## WebSocket v2 Usage

### Public WebSocket (market data)

'''ts
import { KrakenSpotWebsocketV2Client } from '@lynx-crypto/kraken-api';

async function main() {
const wsClient = new KrakenSpotWebsocketV2Client({
autoReconnect: false,
});

await wsClient.publicConnection.connect();

const ack = await wsClient.marketData.subscribeTrade(
{ symbol: ['BTC/USD'], snapshot: true },
{ reqId: 1 },
);

if (!ack.success) {
throw new Error(`Subscribe failed: ${ack.error}`);
}

const unsubscribe = wsClient.publicConnection.addMessageHandler((msg) => {
console.log(JSON.stringify(msg));
});

setTimeout(() => {
unsubscribe();
wsClient.publicConnection.close(1000, 'example done');
}, 20_000);
}

main().catch((err) => {
console.error(err);
process.exitCode = 1;
});
'''

### Private WebSocket (balances / executions)

Authenticated WebSocket usage requires a token obtained via REST.

'''ts
import 'dotenv/config';
import {
KrakenSpotRestClient,
KrakenSpotWebsocketV2Client,
} from '@lynx-crypto/kraken-api';

function requireEnv(name: string): string {
const v = process.env[name];
if (!v) throw new Error(`Missing env var: ${name}`);
return v;
}

async function main() {
const rest = new KrakenSpotRestClient({
userAgent: 'example-app/1.0.0',
apiKey: requireEnv('KRAKEN_API_KEY'),
apiSecret: requireEnv('KRAKEN_API_SECRET'),
});

const { token } = await rest.trading.getWebSocketsToken();

const wsClient = new KrakenSpotWebsocketV2Client({
authToken: token,
autoReconnect: false,
});

await wsClient.privateConnection.connect();

const ack = await wsClient.userData.subscribeBalances({}, { reqId: 10 });

if (!ack.success) {
throw new Error(`Subscribe failed: ${ack.error}`);
}

const off = wsClient.privateConnection.addMessageHandler((msg) => {
console.log(JSON.stringify(msg));
});

setTimeout(() => {
off();
wsClient.privateConnection.close(1000, 'example done');
}, 30_000);
}

main().catch((err) => {
console.error(err);
process.exitCode = 1;
});
'''

---

## Bulk historical data (OHLCVT + Trades)

Bulk data is managed by `KrakenBulkClient`. It supports:

- Downloading complete and quarterly ZIPs
- Extracting ZIPs into a stable directory layout
- Listing available pairs (and OHLC intervals)
- Streaming query results from extracted CSVs

### Storage layout

A `storageDir` is provided when constructing the client (examples use `.bulk-data`). The library stores ZIPs and extracted CSVs under dataset-specific folders:

'''txt
<storageDir>/
ohlcvt/
zips/
complete/complete.zip
quarterly/<YYYYQn>.zip
extracted/
complete/
quarterly/<YYYYQn>/
trades/
zips/
complete/complete.zip
quarterly/<YYYYQn>.zip
extracted/
complete/
quarterly/<YYYYQn>/
'''

Recommended:

- Add the storage directory to `.gitignore` (e.g. `.bulk-data/`).

### Downloading ZIPs (two options)

1. Seamless downloads (Drive API)

- Set `LYNX_CRYPTO_KRAKEN_API_GOOGLE_DRIVE_API_KEY`.
- Run the bulk download examples (see below).

2. Manual ZIP placement (no API key)

- Download the ZIP(s) from Kraken’s support pages.
- Place the ZIP(s) into the expected `zips/complete/` or `zips/quarterly/` folders.
- Run extraction and query examples as usual (extraction/query do not require an API key).

---

## REST rate limiting & retries

This library supports Kraken-style rate limiting with optional automatic retries:

- Lightweight in-memory token bucket limiter by default
- Automatic retries are configurable
- Handles:
  - EAPI:Rate limit exceeded
  - EService: Throttled: <unix timestamp>
  - HTTP 429 Too Many Requests

Example:

'''ts
const kraken = new KrakenSpotRestClient({
apiKey: process.env.KRAKEN_API_KEY,
apiSecret: process.env.KRAKEN_API_SECRET,
rateLimit: {
mode: 'auto',
tier: 'starter',
retryOnRateLimit: true,
maxRetries: 5,
// restCostFn: (path) => (path.includes("Ledgers") ? 2 : 1),
},
});
'''

Disable built-in throttling:

'''ts
rateLimit: {
mode: 'off',
}
'''

### Redis rate limiting (multi-process / multi-container)

If you run multiple Node processes, Docker containers, or workers, they all share the same Kraken IP-level limits. In-memory rate limiting only protects a single process.

For cross-process coordination, you can use the Redis-backed token bucket limiter.

Example (you provide the Redis client + EVAL wrapper):

'''ts
import { KrakenSpotRestClient } from '@lynx-crypto/kraken-api';
import { RedisTokenBucketLimiter } from '@lynx-crypto/kraken-api/base/redisRateLimit';

// Your Redis EVAL wrapper should return a number:
// - 0 means "proceed now"
// - >0 means "wait this many ms then retry"
const evalRedis = async (
key: string,
maxCounter: number,
decayPerSec: number,
cost: number,
ttlSeconds: number,
minWaitMs: number,
): Promise<number> => {
// Example shape (pseudo-code):
// return await redis.eval(luaScript, { keys: [key], arguments: [maxCounter, decayPerSec, cost, ttlSeconds, minWaitMs] });
return 0;
};

const kraken = new KrakenSpotRestClient({
apiKey: process.env.KRAKEN_API_KEY,
apiSecret: process.env.KRAKEN_API_SECRET,
rateLimit: {
mode: 'auto',
tier: 'starter',
retryOnRateLimit: true,
maxRetries: 5,

    // Cross-process limiter (Redis):
    redis: {
      limiter: new RedisTokenBucketLimiter({
        key: 'kraken:rest:global',
        maxCounter: 15,
        decayPerSec: 0.33,
        ttlSeconds: 30,
        minWaitMs: 50,
        evalRedis,
      }),
    },

},
});
'''

Notes:

- Redis is optional. Only use it when you need cross-process coordination.
- If Redis is down / eval fails, the request fails (no silent bypass).

---

## Examples

The repository includes a comprehensive [examples](./examples) directory:

- REST (public + safe private endpoints)
- WebSocket v2 public streams
- WebSocket v2 private streams (balances, executions)
- Bulk historical data (OHLCVT + Trades): download, extract, list pairs/intervals, query

Bulk examples live under:

- [./examples/bulk/ohlcvt](./examples/bulk/ohlcvt)
- [./examples/bulk/trades](./examples/bulk/trades)

A minimal bulk flow:

- Download (or manually place ZIPs) → Extract → Query

Examples are designed to be:

- Runnable
- Safe by default
- Self-contained
- Easy to copy into your own project

---

## Design Philosophy

- Explicit APIs over magic
- Strong typing without sacrificing usability
- Clear separation of REST vs WebSocket concerns
- No hidden background workers
- Safe defaults, especially for trading operations

---

## Development

Install:
`yarn`

Test:
`yarn test`

Coverage:
`yarn test:coverage`

Build:
`yarn build`

---

## Security notes

- Keep API keys and secrets out of source control
- Use least-privilege API key permissions

---

## License

MIT (see LICENSE.md)
