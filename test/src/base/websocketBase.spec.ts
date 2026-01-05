import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  KrakenWebsocketBase,
  KrakenWebSocketLike,
} from '../../../src/base/websocketBase';
import { FakeWebSocket } from '../../utils/fakeWebSocket';

describe('KrakenWebsocketBase', () => {
  beforeEach(() => {
    FakeWebSocket.instances = [];
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('connect() opens a socket using WebSocketImpl', async () => {
    const ws = new KrakenWebsocketBase({
      url: 'wss://example.test/v2',
      WebSocketImpl: FakeWebSocket as any,
      autoReconnect: false,
    });

    const p = ws.connect();

    expect(FakeWebSocket.instances).toHaveLength(1);
    FakeWebSocket.instances[0]!.serverOpen();

    await p;
    expect(ws.readyState).toBe(1);
  });

  it('connect() returns immediately if already open (no new socket)', async () => {
    const ws = new KrakenWebsocketBase({
      url: 'wss://example.test/v2',
      WebSocketImpl: FakeWebSocket as any,
      autoReconnect: false,
    });

    const p1 = ws.connect();
    FakeWebSocket.instances[0]!.serverOpen();
    await p1;

    expect(FakeWebSocket.instances).toHaveLength(1);

    // already open -> should not create another instance
    await ws.connect();
    expect(FakeWebSocket.instances).toHaveLength(1);
  });

  it('connect() reuses an in-flight connectingPromise', async () => {
    const ws = new KrakenWebsocketBase({
      url: 'wss://example.test/v2',
      WebSocketImpl: FakeWebSocket as any,
      autoReconnect: false,
    });

    const p1 = ws.connect();
    const p2 = ws.connect();

    expect(FakeWebSocket.instances).toHaveLength(1);

    FakeWebSocket.instances[0]!.serverOpen();

    await expect(Promise.all([p1, p2])).resolves.toBeDefined();
    expect(ws.readyState).toBe(1);
  });

  it('request() sends {method, params, req_id} and resolves when matching req_id arrives', async () => {
    const ws = new KrakenWebsocketBase({
      url: 'wss://example.test/v2',
      WebSocketImpl: FakeWebSocket as any,
      autoReconnect: false,
    });

    const cp = ws.connect();
    FakeWebSocket.instances[0]!.serverOpen();
    await cp;

    const sock = FakeWebSocket.instances[0]!;

    const req = ws.request('ping', undefined, {
      reqId: 123,
      timeoutMs: 1000,
      attachAuthToken: false,
    });

    expect(sock.sent).toHaveLength(1);
    expect(JSON.parse(sock.sent[0]!)).toEqual({
      method: 'ping',
      params: undefined,
      req_id: 123,
    });

    sock.serverMessage(
      JSON.stringify({ req_id: 123, success: true, result: { ok: true } }),
    );

    const res = await req;
    expect(res.req_id).toBe(123);
    expect(res.success).toBe(true);
    expect(res.result).toEqual({ ok: true });
  });

  it('request() auto-injects auth token into params.token when attachAuthToken is true', async () => {
    const ws = new KrakenWebsocketBase({
      url: 'wss://example.test/v2',
      WebSocketImpl: FakeWebSocket as any,
      authToken: 'tok_abc',
      autoReconnect: false,
    });

    const cp = ws.connect();
    FakeWebSocket.instances[0]!.serverOpen();
    await cp;

    const sock = FakeWebSocket.instances[0]!;

    const req = ws.request('subscribe', { channel: 'balances' } as any, {
      reqId: 5,
      timeoutMs: 1000,
      attachAuthToken: true,
    });

    expect(sock.sent).toHaveLength(1);
    const sent = JSON.parse(sock.sent[0]!);
    expect(sent.method).toBe('subscribe');
    expect(sent.req_id).toBe(5);
    expect(sent.params).toMatchObject({
      channel: 'balances',
      token: 'tok_abc',
    });

    // complete the promise (avoid unhandled timeout)
    sock.serverMessage(
      JSON.stringify({ req_id: 5, success: true, result: {} }),
    );
    await req;
  });

  it('request() does NOT overwrite params.token if already provided', async () => {
    const ws = new KrakenWebsocketBase({
      url: 'wss://example.test/v2',
      WebSocketImpl: FakeWebSocket as any,
      authToken: 'tok_abc',
      autoReconnect: false,
    });

    const cp = ws.connect();
    FakeWebSocket.instances[0]!.serverOpen();
    await cp;

    const sock = FakeWebSocket.instances[0]!;

    const req = ws.request(
      'subscribe',
      { channel: 'balances', token: 'tok_override' } as any,
      { reqId: 6, timeoutMs: 1000, attachAuthToken: true },
    );

    expect(sock.sent).toHaveLength(1);
    const sent = JSON.parse(sock.sent[0]!);
    expect(sent.params.token).toBe('tok_override');

    sock.serverMessage(
      JSON.stringify({ req_id: 6, success: true, result: {} }),
    );
    await req;
  });

  it('request() rejects on timeout', async () => {
    vi.useFakeTimers();

    const ws = new KrakenWebsocketBase({
      url: 'wss://example.test/v2',
      WebSocketImpl: FakeWebSocket as any,
      autoReconnect: false,
    });

    const cp = ws.connect();
    FakeWebSocket.instances[0]!.serverOpen();
    await cp;

    const p = ws.request('ping', undefined, {
      reqId: 999,
      timeoutMs: 10,
      attachAuthToken: false,
    });

    // attach handler FIRST
    const assertion = expect(p).rejects.toThrow(/timed out/i);

    await vi.advanceTimersByTimeAsync(11);
    await assertion;
  });

  it('close event rejects pending requests (after request has been sent)', async () => {
    const ws = new KrakenWebsocketBase({
      url: 'wss://example.test/v2',
      WebSocketImpl: FakeWebSocket as any,
      autoReconnect: false,
    });

    const cp = ws.connect();
    const sock = FakeWebSocket.instances[0]!;
    sock.serverOpen();
    await cp;

    const p = ws.request('ping', undefined, {
      reqId: 1,
      timeoutMs: 1000,
      attachAuthToken: false,
    });

    expect(sock.sent).toHaveLength(1);

    sock.serverClose({ code: 1006 });

    await expect(p).rejects.toThrow(/closed before response/i);
  });

  it('autoReconnect reconnects on unexpected close (not manuallyClosed)', async () => {
    vi.useFakeTimers();

    const logger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    };

    const ws = new KrakenWebsocketBase({
      url: 'wss://example.test/v2',
      WebSocketImpl: FakeWebSocket as any,
      autoReconnect: true,
      reconnectDelayMs: 50,
      logger,
    });

    const p = ws.connect();
    const sock1 = FakeWebSocket.instances[0]!;
    sock1.serverOpen();
    await p;

    expect(FakeWebSocket.instances).toHaveLength(1);

    // unexpected close triggers reconnect timer
    sock1.serverClose({ code: 1006 });

    await vi.advanceTimersByTimeAsync(1001);

    expect(FakeWebSocket.instances).toHaveLength(2);

    // open the reconnect socket to avoid dangling connect
    FakeWebSocket.instances[1]!.serverOpen();
  });

  it('close() prevents autoReconnect (manuallyClosed = true)', async () => {
    vi.useFakeTimers();

    const logger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    };

    const ws = new KrakenWebsocketBase({
      url: 'wss://example.test/v2',
      WebSocketImpl: FakeWebSocket as any,
      autoReconnect: true,
      reconnectDelayMs: 10,
      logger,
    });

    const p = ws.connect();
    const sock1 = FakeWebSocket.instances[0]!;
    sock1.serverOpen();
    await p;

    ws.close(1000, 'bye'); // this calls FakeWebSocket.close -> triggers onclose

    await vi.advanceTimersByTimeAsync(20);
    expect(FakeWebSocket.instances).toHaveLength(1);
  });

  it('ws.onerror logs errors via logger', async () => {
    const logger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    };

    const ws = new KrakenWebsocketBase({
      url: 'wss://example.test/v2',
      WebSocketImpl: FakeWebSocket as any,
      autoReconnect: false,
      logger,
    });

    const p = ws.connect();
    const sock = FakeWebSocket.instances[0]!;
    sock.serverOpen();
    await p;

    sock.serverError({ message: 'boom' });

    expect(logger.error).toHaveBeenCalled();
  });

  it('onmessage invalid JSON triggers logger.warn (parse failure branch)', async () => {
    const logger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    };

    const ws = new KrakenWebsocketBase({
      url: 'wss://example.test/v2',
      WebSocketImpl: FakeWebSocket as any,
      autoReconnect: false,
      logger,
    });

    const p = ws.connect();
    const sock = FakeWebSocket.instances[0]!;
    sock.serverOpen();
    await p;

    sock.serverMessage('{not json');

    expect(logger.warn).toHaveBeenCalled();
  });

  it('addMessageHandler() receives parsed messages (including req_id messages)', async () => {
    const ws = new KrakenWebsocketBase({
      url: 'wss://example.test/v2',
      WebSocketImpl: FakeWebSocket as any,
      autoReconnect: false,
    });

    const cp = ws.connect();
    const sock = FakeWebSocket.instances[0]!;
    sock.serverOpen();
    await cp;

    const handler = vi.fn();
    const unsubscribe = ws.addMessageHandler(handler);

    const p = ws.request('ping', undefined, {
      reqId: 77,
      timeoutMs: 1000,
      attachAuthToken: false,
    });

    expect(sock.sent).toHaveLength(1);

    sock.serverMessage(
      JSON.stringify({ req_id: 77, success: true, result: { ok: true } }),
    );

    await p;

    // handler sees the parsed response too
    expect(handler).toHaveBeenCalledTimes(1);

    unsubscribe();

    sock.serverMessage(JSON.stringify({ channel: 'ticker', type: 'update' }));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('message handler errors are caught and logged (WS message handler threw)', async () => {
    const logger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    };

    const ws = new KrakenWebsocketBase({
      url: 'wss://example.test/v2',
      WebSocketImpl: FakeWebSocket as any,
      autoReconnect: false,
      logger,
    });

    const cp = ws.connect();
    const sock = FakeWebSocket.instances[0]!;
    sock.serverOpen();
    await cp;

    ws.addMessageHandler(() => {
      throw new Error('handler blew up');
    });

    sock.serverMessage(JSON.stringify({ channel: 'ticker', type: 'update' }));

    expect(logger.error).toHaveBeenCalled();
  });

  it('sendRaw() stringifies objects and sends them', async () => {
    const ws = new KrakenWebsocketBase({
      url: 'wss://example.test/v2',
      WebSocketImpl: FakeWebSocket as any,
      autoReconnect: false,
    });

    const cp = ws.connect();
    const sock = FakeWebSocket.instances[0]!;
    sock.serverOpen();
    await cp;

    await ws.sendRaw({ hello: 'world' });

    expect(sock.sent).toHaveLength(1);
    expect(JSON.parse(sock.sent[0]!)).toEqual({ hello: 'world' });
  });

  it('sendRaw() throws if socket is not open after connect attempt', async () => {
    // WebSocket that triggers onopen (so connect resolves) but is NOT actually OPEN.
    class HalfOpenWs extends FakeWebSocket {
      serverOpen(): void {
        // Pretend "open" event fired, but keep state non-OPEN
        this.readyState = 0; // CONNECTING (anything other than 1 works)
        this.onopen?.({});
      }
    }

    const ws = new KrakenWebsocketBase({
      url: 'wss://example.test/v2',
      WebSocketImpl: HalfOpenWs as any,
      autoReconnect: false,
    });

    const p = ws.sendRaw({ hello: 'world' });

    // Attach assertion first (prevents unhandled rejection warnings)
    const assertion = expect(p).rejects.toThrow(/WebSocket is not open/i);

    // Allow connect() to "resolve", but still not be OPEN
    FakeWebSocket.instances[0]!.serverOpen();

    await assertion;
  });

  it('request() hard-guard rejects cleanly if readyState flips between checks (covers hard guard)', async () => {
    class FlakyReadyStateWs implements KrakenWebSocketLike {
      static instances: FlakyReadyStateWs[] = [];

      readonly url: string;

      private reads = 0;

      onopen: ((ev: unknown) => void) | null = null;
      onclose: ((ev: unknown) => void) | null = null;
      onerror: ((ev: unknown) => void) | null = null;
      onmessage: ((ev: { data: unknown }) => void) | null = null;

      sent: string[] = [];

      constructor(url: string) {
        this.url = url;
        FlakyReadyStateWs.instances.push(this);
      }

      get readyState(): number {
        this.reads += 1;
        // 1st read: OPEN, 2nd+ reads: CLOSED
        return this.reads === 1 ? 1 : 3;
      }

      send(data: string): void {
        this.sent.push(data);
      }

      close(code?: number, reason?: string): void {
        this.onclose?.({ code, reason });
      }

      serverOpen(): void {
        this.onopen?.({});
      }
    }

    const ws = new KrakenWebsocketBase({
      url: 'wss://example.test/v2',
      WebSocketImpl: FlakyReadyStateWs as any,
      autoReconnect: false,
    });

    const cp = ws.connect();
    FlakyReadyStateWs.instances[0]!.serverOpen();
    await cp;

    const p = ws.request('ping', undefined, {
      reqId: 42,
      timeoutMs: 1000,
      attachAuthToken: false,
    });

    await expect(p).rejects.toThrow(/WebSocket is not open/i);
  });

  it('constructor throws when no WebSocketImpl is available (covers !this.WebSocketImpl)', async () => {
    vi.resetModules();
    vi.doMock('ws', () => ({ WebSocket: undefined }));

    const mod = await import('../../../src/base/websocketBase');
    const { KrakenWebsocketBase } = mod;

    expect(
      () =>
        new KrakenWebsocketBase({
          url: 'wss://example.test/v2',
          // do not pass WebSocketImpl
        } as any),
    ).toThrow(/No WebSocket implementation available/i);

    vi.resetModules();
    vi.unmock('ws');
  });

  it('connect() rejects if WebSocketImpl constructor throws (covers connect try/catch -> reject)', async () => {
    class ThrowCtor {
      constructor(_url: string) {
        throw new Error('ctor boom');
      }
    }

    const ws = new KrakenWebsocketBase({
      url: 'wss://example.test/v2',
      WebSocketImpl: ThrowCtor as any,
      autoReconnect: false,
    });

    await expect(ws.connect()).rejects.toThrow(/ctor boom/);

    // also proves connectingPromise was cleared (2nd call creates a fresh attempt)
    await expect(ws.connect()).rejects.toThrow(/ctor boom/);
  });

  it('request() triggers connect() when not already open (covers "if !ws || readyState !== 1")', async () => {
    const ws = new KrakenWebsocketBase({
      url: 'wss://example.test/v2',
      WebSocketImpl: FakeWebSocket as any,
      autoReconnect: false,
    });

    const p = ws.request('ping', undefined, {
      reqId: 321,
      timeoutMs: 1000,
      attachAuthToken: false,
    });

    expect(FakeWebSocket.instances).toHaveLength(1);
    const sock = FakeWebSocket.instances[0]!;
    sock.serverOpen();

    // let request continue after connect resolves
    await new Promise((r) => setTimeout(r, 0));

    expect(sock.sent).toHaveLength(1);

    sock.serverMessage(
      JSON.stringify({ req_id: 321, success: true, result: { ok: true } }),
    );

    await expect(p).resolves.toMatchObject({ req_id: 321, success: true });
  });

  it('request() rejects and cleans up if ws.send throws (covers request send try/catch)', async () => {
    class ThrowSendWs extends FakeWebSocket {
      send(_data: string): void {
        throw new Error('send boom');
      }
    }

    const ws = new KrakenWebsocketBase({
      url: 'wss://example.test/v2',
      WebSocketImpl: ThrowSendWs as any,
      autoReconnect: false,
    });

    const cp = ws.connect();
    FakeWebSocket.instances[0]!.serverOpen();
    await cp;

    const p = ws.request('ping', undefined, {
      reqId: 777,
      timeoutMs: 1000,
      attachAuthToken: false,
    });

    await expect(p).rejects.toThrow(/send boom/);

    // sanity: no pending request left behind
    expect(((ws as any).pending as Map<number, unknown>).size).toBe(0);
  });

  it('autoReconnect logs "reconnect failed" when reconnect connect() rejects (covers void connect().catch logger.error)', async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0); // stabilize jitter

    const logger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    };

    class FlakyCtorWs extends FakeWebSocket {
      static created = 0;
      constructor(url: string) {
        if (FlakyCtorWs.created >= 1) {
          throw new Error('reconnect ctor boom');
        }
        FlakyCtorWs.created++;
        super(url);
      }
    }
    FlakyCtorWs.created = 0;

    const ws = new KrakenWebsocketBase({
      url: 'wss://example.test/v2',
      WebSocketImpl: FlakyCtorWs as any,
      autoReconnect: true,
      reconnectDelayMs: 10,
      logger,
    });

    const p = ws.connect();
    const sock1 = FakeWebSocket.instances[0]!;
    sock1.serverOpen();
    await p;

    // trigger unexpected close -> schedules reconnect
    sock1.serverClose({ code: 1006 });

    // allow reconnect timer to run and attempt connect (which will reject)
    await vi.advanceTimersByTimeAsync(200);

    expect(logger.error).toHaveBeenCalledWith(
      'Kraken WS reconnect failed',
      expect.objectContaining({
        url: 'wss://example.test/v2',
        error: expect.any(Error),
      }),
    );
  });

  it('uses default WebSocket from ws when WebSocketImpl is not provided (typeof WebSocket !== "undefined" true branch)', async () => {
    vi.resetModules();
    vi.doMock('ws', () => ({ WebSocket: FakeWebSocket }));

    const mod = await import('../../../src/base/websocketBase');
    const { KrakenWebsocketBase } = mod;

    FakeWebSocket.instances = [];

    const ws = new KrakenWebsocketBase({
      url: 'wss://example.test/v2',
      autoReconnect: false,
      // no WebSocketImpl
    } as any);

    const p = ws.connect();
    expect(FakeWebSocket.instances).toHaveLength(1);

    FakeWebSocket.instances[0]!.serverOpen();
    await p;

    vi.resetModules();
    vi.unmock('ws');
  });

  it('readyState is -1 before socket is created (nullish coalescing branch)', () => {
    const ws = new KrakenWebsocketBase({
      url: 'wss://example.test/v2',
      WebSocketImpl: FakeWebSocket as any,
      autoReconnect: false,
    });

    expect(ws.readyState).toBe(-1);
  });

  it('readyState reflects underlying socket state once created', async () => {
    const ws = new KrakenWebsocketBase({
      url: 'wss://example.test/v2',
      WebSocketImpl: FakeWebSocket as any,
      autoReconnect: false,
    });

    const p = ws.connect();
    // created but not opened yet (FakeWebSocket defaults CONNECTING)
    expect(ws.readyState).toBe(0);

    FakeWebSocket.instances[0]!.serverOpen();
    await p;
    expect(ws.readyState).toBe(1);
  });

  it('autoReconnect backoff uses minAfterMany once reconnectAttempts >= 4 (branch coverage)', async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0); // jitter factor => 0.8

    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');

    const ws = new KrakenWebsocketBase({
      url: 'wss://example.test/v2',
      WebSocketImpl: FakeWebSocket as any,
      autoReconnect: true,
      reconnectDelayMs: 10, // base
      logger: { info: vi.fn(), error: vi.fn() },
    });

    const p = ws.connect();
    const sock = FakeWebSocket.instances[0]!;
    sock.serverOpen();
    await p;

    // Call onclose repeatedly on same socket to increment attempts and schedule timers
    sock.serverClose({ code: 1006 }); // attempt 1 => exp=10 => delay=10 => jittered=floor(10*0.8)=8
    sock.serverClose({ code: 1006 }); // attempt 2 => exp=20 => jittered=16
    sock.serverClose({ code: 1006 }); // attempt 3 => exp=40 => jittered=32
    sock.serverClose({ code: 1006 }); // attempt 4 => minAfterMany=5000 dominates => jittered=floor(5000*0.8)=4000

    const delays = setTimeoutSpy.mock.calls.map((c) => c[1]) as number[];
    expect(delays.slice(-4)).toEqual([8, 16, 32, 4000]);

    vi.clearAllTimers();
    vi.useRealTimers();
    (Math.random as any).mockRestore?.();
  });

  it('onmessage: non-string data is passed through; req_id with no pending still fans out to handlers (branches)', async () => {
    const logger = {
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      debug: vi.fn(),
    };

    const ws = new KrakenWebsocketBase({
      url: 'wss://example.test/v2',
      WebSocketImpl: FakeWebSocket as any,
      autoReconnect: false,
      logger,
    });

    const p = ws.connect();
    const sock = FakeWebSocket.instances[0]!;
    sock.serverOpen();
    await p;

    const handler = vi.fn();
    ws.addMessageHandler(handler);

    // non-string payload + req_id but no pending request registered
    sock.serverMessage({ req_id: 999, hello: 'world' } as any);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({ req_id: 999, hello: 'world' });
  });

  it('close() does nothing if no socket exists (close branch false)', () => {
    const ws = new KrakenWebsocketBase({
      url: 'wss://example.test/v2',
      WebSocketImpl: FakeWebSocket as any,
      autoReconnect: true,
    });

    expect(() => ws.close(1000, 'bye')).not.toThrow();
    expect(FakeWebSocket.instances).toHaveLength(0);
  });

  it('sendRaw() sends strings without JSON.stringify (typeof message === "string" branch)', async () => {
    const ws = new KrakenWebsocketBase({
      url: 'wss://example.test/v2',
      WebSocketImpl: FakeWebSocket as any,
      autoReconnect: false,
    });

    const cp = ws.connect();
    const sock = FakeWebSocket.instances[0]!;
    sock.serverOpen();
    await cp;

    await ws.sendRaw('hello');

    expect(sock.sent).toHaveLength(1);
    expect(sock.sent[0]).toBe('hello');
  });

  it('request() uses default reqId, default timeoutMs, and default attachAuthToken=true when options are omitted', async () => {
    const ws = new KrakenWebsocketBase({
      url: 'wss://example.test/v2',
      WebSocketImpl: FakeWebSocket as any,
      authToken: 'tok_default',
      autoReconnect: false,
      requestTimeoutMs: 123, // exercised via ?? path
    });

    const cp = ws.connect();
    const sock = FakeWebSocket.instances[0]!;
    sock.serverOpen();
    await cp;

    const req = ws.request('subscribe', { channel: 'balances' } as any); // no options

    expect(sock.sent).toHaveLength(1);
    const sent = JSON.parse(sock.sent[0]!);

    // default reqId starts at 1
    expect(sent.req_id).toBe(1);

    // default attachAuthToken = true => token injected
    expect(sent.params).toMatchObject({
      channel: 'balances',
      token: 'tok_default',
    });

    sock.serverMessage(
      JSON.stringify({ req_id: 1, success: true, result: {} }),
    );
    await req;
  });
});
