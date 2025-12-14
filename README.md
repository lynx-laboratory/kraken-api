# @lynx-crypto/kraken-api

[![Build](https://img.shields.io/github/actions/workflow/status/lynx-laboratory/kraken-api/coverage-badge.yml?branch=master)](https://github.com/lynx-laboratory/kraken-api/actions/workflows/coverage-badge.yml)
[![Coverage](https://github.com/lynx-laboratory/kraken-api/raw/master/badges/coverage.svg)](https://github.com/lynx-laboratory/kraken-api/actions/workflows/coverage-badge.yml)
[![npm](https://img.shields.io/npm/v/%40lynx-crypto%2Fkraken-api)](https://www.npmjs.com/package/@lynx-crypto/kraken-api)
[![downloads](https://img.shields.io/npm/dm/%40lynx-crypto%2Fkraken-api)](https://www.npmjs.com/package/@lynx-crypto/kraken-api)
[![bundlephobia](https://img.shields.io/bundlephobia/minzip/%40lynx-crypto%2Fkraken-api)](https://bundlephobia.com/package/@lynx-crypto/kraken-api)
[![last commit](https://img.shields.io/github/last-commit/lynx-laboratory/kraken-api?branch=master)](https://github.com/lynx-laboratory/kraken-api/commits/master)
[![license](https://img.shields.io/github/license/lynx-laboratory/kraken-api)](./LICENSE.md)

TypeScript client for **Kraken SPOT**:

- **REST API** (public + private endpoints)
- **WebSocket v2** (public market-data + authenticated user-data/trading)

See [Kraken Official Documentation](https://docs.kraken.com/api/docs/category/guides)

## Important

- This package is currently **SPOT only**. It does **not** implement Kraken Futures.
- Unofficial project. Not affiliated with Kraken.

---

## Install

NPM:
`npm i @lynx-crypto/kraken-api`

Yarn:
`yarn add @lynx-crypto/kraken-api`

pnpm:
`pnpm add @lynx-crypto/kraken-api`

### Node support

- Node >= 18 recommended (uses built-in fetch / AbortController)

---

## Quick start

ESM:

```ts
import {
  KrakenSpotRestClient,
  KrakenSpotWebsocketV2Client,
} from '@lynx-crypto/kraken-api';
```

CJS:

```js
const {
  KrakenSpotRestClient,
  KrakenSpotWebsocketV2Client,
} = require('@lynx-crypto/kraken-api');
```

---

## REST (Spot)

### Create a REST client

```ts
const kraken = new KrakenSpotRestClient({
  // Optional:
  // baseUrl: "https://api.kraken.com",
  // timeoutMs: 10_000,
  // userAgent: "my-app/1.0.0",

  // Required for private endpoints:
  apiKey: process.env.KRAKEN_API_KEY,
  apiSecret: process.env.KRAKEN_API_SECRET,

  // Optional logger:
  // logger: console,

  // Optional rate limiting:
  // rateLimit: { mode: "auto" },
});
```

### Public endpoint example

(Exact public endpoints depend on what you’ve implemented under src/spot/rest.)

```ts
const serverTime = await kraken.public.getServerTime();
console.log(serverTime);
```

### Private endpoint example

(Exact private endpoints depend on what you’ve implemented under src/spot/rest.)

```ts
const balances = await kraken.accountData.getAccountBalance();
console.log('USD:', balances['ZUSD']);
```

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

```ts
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
```

Disable built-in throttling:

```ts
rateLimit: {
  mode: 'off';
}
```

### Redis rate limiting (multi-process / multi-container)

If you run multiple Node processes, Docker containers, or workers, they all share the same Kraken IP-level limits. In-memory rate limiting only protects a single process.

For cross-process coordination, you can use the Redis-backed token bucket limiter.

Example (you provide the Redis client + EVAL wrapper):

```ts
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
```

Notes:

- Redis is optional. Only use it when you need cross-process coordination.
- If Redis is down / eval fails, the request fails (no silent bypass).

---

## WebSocket v2 (Spot)

This package provides a top-level v2 WS client that creates:

- a public connection (market data + admin)
- a private/auth connection (user-data + user-trading)

### Create a WS v2 client

```ts
const ws = new KrakenSpotWebsocketV2Client({
  // publicUrl: "wss://ws.kraken.com/v2",
  // privateUrl: "wss://ws-auth.kraken.com/v2",

  authToken: process.env.KRAKEN_WS_AUTH_TOKEN,

  // autoReconnect: true,
  // reconnectDelayMs: 1_000,
  // requestTimeoutMs: 10_000,

  // logger: console,
  // WebSocketImpl: WebSocket,
});
```

Available sub-APIs:

- `ws.admin`
- `ws.marketData`
- `ws.userData`
- `ws.userTrading`

### Connect

```ts
await ws.publicConnection.connect();
await ws.privateConnection.connect();
```

---

## WS routing: receiving streaming messages

```ts
const unsubscribe = ws.publicConnection.addMessageHandler((msg) => {
  // route by msg.channel / msg.type
});

// later
unsubscribe();
```

---

## WS v2: Admin

```ts
const pong = await ws.admin.ping({ reqId: 123 });
if (!pong.success) console.error('ping failed:', pong.error);
```

---

## WS v2: User Data (authenticated)

Implemented channels:

- `executions`
- `balances`

### Executions example

```ts
const ack = await ws.userData.subscribeExecutions({
  snap_trades: true,
  snap_orders: true,
  order_status: true,
});
```

```ts
ws.privateConnection.addMessageHandler((msg) => {
  if (msg?.channel === 'executions') {
    for (const report of msg.data ?? []) {
      console.log(report.order_id, report.order_status);
    }
  }
});
```

### Balances example

```ts
const ack2 = await ws.userData.subscribeBalances({ snapshot: true });
```

```ts
ws.privateConnection.addMessageHandler((msg) => {
  if (msg?.channel === 'balances') {
    console.log(msg.data);
  }
});
```

---

## WS v2: User Trading (authenticated RPC)

Implemented RPCs:

- `add_order`
- `amend_order`
- `cancel_order`
- `cancel_all`
- `cancel_all_orders_after`
- `batch_add`
- `batch_cancel`

Add order:

```ts
const res = await ws.userTrading.addOrder({
  order_type: 'limit',
  side: 'buy',
  symbol: 'BTC/USD',
  order_qty: 0.01,
  limit_price: 30000,
  time_in_force: 'gtc',
});
```

Dead Man’s Switch:

```ts
await ws.userTrading.cancelAllOrdersAfter({ timeout: 60 });
```

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
