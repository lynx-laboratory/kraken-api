# @lynx-crypto/kraken-api

![Build](https://github.com/lynx-laboratory/kraken-api/actions/workflows/ci.yml/badge.svg)
![Coverage](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/lynx-laboratory/kraken-api/master/badges/coverage.json)
![npm](https://img.shields.io/npm/v/@lynx-crypto/kraken-api)
![minzipped size](https://img.shields.io/bundlephobia/minzip/@lynx-crypto/kraken-api)
![downloads](https://img.shields.io/npm/dm/@lynx-crypto/kraken-api)
![last commit](https://img.shields.io/github/last-commit/lynx-laboratory/kraken-api)
![license](https://img.shields.io/npm/l/@lynx-crypto/kraken-api)

TypeScript client for **Kraken SPOT**:
- **REST API** (public + private endpoints)
- **WebSocket v2** (public market-data + authenticated user-data/trading)

See [Kraken Official Documentation](https://docs.kraken.com/api/docs/category/guides)

IMPORTANT

- This package is currently **SPOT only**. It does **not** implement Kraken Futures.
- Unofficial project. Not affiliated with Kraken.

---

## Install

NPM:
```
npm i @lynx-crypto/kraken-api
```

Yarn:
```
yarn add @lynx-crypto/kraken-api
```

pnpm:
```
pnpm add @lynx-crypto/kraken-api
```

Node support
- Node >= 18 recommended (uses built-in fetch / AbortController)

---

## Quick start

ESM:
```
import { KrakenSpotRestClient, KrakenSpotWebsocketV2Client } from "@lynx-crypto/kraken-api";
```

CJS:
```
const { KrakenSpotRestClient, KrakenSpotWebsocketV2Client } = require("@lynx-crypto/kraken-api");
```

---

## REST (Spot)

### Create a REST client

```ts
const kraken = new KrakenSpotRestClient({
// Optional:
//   baseUrl: "https://api.kraken.com",
//   timeoutMs: 10_000,
//   userAgent: "my-app/1.0.0",

    // Required for private endpoints:
    apiKey: process.env.KRAKEN_API_KEY,
    apiSecret: process.env.KRAKEN_API_SECRET,

    // Optional logger:
    // logger: console,
});
```

### Public endpoint example

(Your exact public endpoints depend on what you’ve implemented in src/spot/rest.)

Example shape:
```ts
const serverTime = await kraken.public.getServerTime();
```

### Private endpoint example

(Your exact private endpoints depend on what you’ve implemented in src/spot/rest.)

Example shape:
const balances = await kraken.accountData.getAccountBalance();
console.log("USD:", balances["ZUSD"]);

---

## WebSocket v2 (Spot)

This package provides a top-level v2 WS client that creates:

- a **public connection** (market data + admin)
- a **private/auth connection** (user-data + user-trading)

### Create a WS v2 client

```ts
const ws = new KrakenSpotWebsocketV2Client({
// Optional override URLs:
// publicUrl: "wss://ws.kraken.com/v2",
// privateUrl: "wss://ws-auth.kraken.com/v2",

    // IMPORTANT: private WS requires a session token
    authToken: process.env.KRAKEN_WS_AUTH_TOKEN,

    // Optional connection tuning:
    // autoReconnect: true,
    // reconnectDelayMs: 1_000,
    // requestTimeoutMs: 10_000,

    // Optional logger:
    // logger: console,

    // Optional WS implementation:
    // - In Node, ws is used by default.
    // - In browsers, pass the browser WebSocket if needed.
    // WebSocketImpl: WebSocket,

});
```
Available sub-APIs:
- `ws.admin` (public connection)
- `ws.marketData` (public connection)
- `ws.userData` (private connection)
- `ws.userTrading` (private connection)

### Connect

You can connect explicitly:
```ts
await ws.publicConnection.connect();
await ws.privateConnection.connect();
```

Or let calls auto-connect (methods like `request()/sendRaw()` will connect if needed).

---

## WS routing: receiving streaming messages

The underlying `KrakenWebsocketBase` supports message fan-out:

```ts
const unsubscribe = ws.publicConnection.addMessageHandler((msg) => {
    // msg is already JSON-parsed when possible
    // route based on msg.channel / msg.type, etc.
    // console.log(msg);
});

// later:
unsubscribe();
```

---

## WS v2: Admin

Admin utilities exist on the public connection (ex: ping/status/heartbeat).

Example:
```ts
const pong = await ws.admin.ping({ reqId: 123 });
if (!pong.success) console.error("ping failed:", pong.error);
```

---

## WS v2: Market Data (public)

Market data subscriptions live on ws.marketData (public connection).
(Exact channel helpers depend on your implemented market-data modules.)

Typical pattern:
1. call subscribe helper (await ack)
2. listen via `addMessageHandler` and route messages by channel/type

---

## WS v2: User Data (authenticated)

User-data streams live on `ws.userData` (private connection).

Implemented channels:

- executions (order lifecycle + fills)
- balances (balance snapshots + ledger-derived updates)

Example (executions):
```
const ack = await ws.userData.subscribeExecutions({
    snap_trades: true,
    snap_orders: true,
    order_status: true,
});

if (!ack.success) console.error("executions subscribe error:", ack.error);
```

Then route messages:
```
ws.privateConnection.addMessageHandler((msg: any) => {
    if (msg?.channel === "executions" && (msg.type === "snapshot" || msg.type === "update")) {
        for (const report of msg.data ?? []) {
            console.log("[exec]", report.exec_type, report.order_id, report.order_status);
        }
    }
});
```

Example (balances):
```ts
const ack2 = await ws.userData.subscribeBalances({ snapshot: true });
if (!ack2.success) console.error("balances subscribe error:", ack2.error);

ws.privateConnection.addMessageHandler((msg: any) => {
    if (msg?.channel === "balances" && msg.type === "snapshot") {
        for (const asset of msg.data ?? []) {
            console.log("[balances snapshot]", asset.asset, "total:", asset.balance);
        }
    }
    if (msg?.channel === "balances" && msg.type === "update") {
            for (const tx of msg.data ?? []) {
            console.log("[balances update]", tx.asset, tx.type, "delta:", tx.amount, "new:", tx.balance);
        }
    }
});

---

## WS v2: User Trading (authenticated RPC)

User-trading methods live on `ws.userTrading` (private connection).

Implemented RPCs:

- `add_order`
- `amend_order`
- `edit_order` (legacy)
- `cancel_order`
- `cancel_all`
- `cancel_all_orders_after` (Dead Man’s Switch)
- `batch_add`
- `batch_cancel`

Add order:
```ts
const res = await ws.userTrading.addOrder({
    order_type: "limit",
    side: "buy",
    symbol: "BTC/USD",
    order_qty: 0.01,
    limit_price: 30000,
    time_in_force: "gtc",
    cl_ord_id: "demo-0001",
});


if (res.success) console.log("order_id:", res.result?.order_id);
else console.error("add_order error:", res.error);
```

Dead Man’s Switch:
```
// recommended: refresh every 15–30s with timeout=60
await ws.userTrading.cancelAllOrdersAfter({ timeout: 60 });
```

---

## Options reference

### `KrakenSpotRestClient` options

- `baseUrl?: string`
  Default: https://api.kraken.com
- `timeoutMs?: number`
  Default: 10_000
- `userAgent?: string`
- `apiKey?: string`
  Required for private endpoints
- `apiSecret?: string` (base64)
  Required for private endpoints
- `logger?: KrakenLogger`
  debug/info/warn/error(msg, meta?)

### KrakenSpotWebsocketV2Client options

- `publicUrl?: string`
  Default: wss://ws.kraken.com/v2
- `privateUrl?: string`
  Default: wss://ws-auth.kraken.com/v2
- `authToken?: string`
  Required for authenticated/private connection features
- `WebSocketImpl?: constructor`
  Optional override (browser / custom WS)
- `autoReconnect?: boolean`
  Default: true
- `reconnectDelayMs?: number`
  Default: 1000
- `requestTimeoutMs?: number`
  Default: 10_000
- `logger?: KrakenWebsocketLogger`
  debug/info/warn/error(msg, meta?)

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

- Keep API keys/secrets out of source control.
- Use least-privilege API key permissions.

---

## License

MIT (see LICENSE)
