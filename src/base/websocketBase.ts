// kraken/base/websocketBase.ts

import { WebSocket } from 'ws';

export interface KrakenWebSocketLike {
  readonly readyState: number;
  onopen: ((ev: unknown) => void) | null;
  onclose: ((ev: unknown) => void) | null;
  onerror: ((ev: unknown) => void) | null;
  onmessage: ((ev: { data: unknown }) => void) | null;

  close(code?: number, reason?: string): void;
  send(data: string): void;
}

export type KrakenWebSocketLikeCtor = new (url: string) => KrakenWebSocketLike;

export interface KrakenWebsocketLogger {
  debug?(msg: string, meta?: unknown): void;
  info?(msg: string, meta?: unknown): void;
  warn?(msg: string, meta?: unknown): void;
  error?(msg: string, meta?: unknown): void;
}

export interface KrakenWebsocketConnectionOptions {
  /** Full WSS URL, e.g. wss://ws.kraken.com/v2 or wss://ws-auth.kraken.com/v2 */
  url: string;

  /**
   * Optional session token for authenticated channels.
   * If provided, it will be auto-injected into params.token for requests
   * when `attachAuthToken` is true (default).
   */
  authToken?: string;

  /** Constructor for WebSocket implementation (browser or `ws` in Node). */
  WebSocketImpl?: KrakenWebSocketLikeCtor;

  /** Optional logger (same shape as REST). */
  logger?: KrakenWebsocketLogger;

  /** Automatically reconnect on unexpected close. Default: true. */
  autoReconnect?: boolean;

  /** Delay before reconnect attempt (ms). Default: 1_000. */
  reconnectDelayMs?: number;

  /** Default timeout for request/ack style calls (ms). Default: 10_000. */
  requestTimeoutMs?: number;
}

/** Envelope for method/ack style messages. */
export interface KrakenWsMethodResponseEnvelope<Result = unknown> {
  method?: string;
  result?: Result;
  success?: boolean;
  error?: string;
  req_id?: number;
  time_in?: string;
  time_out?: string;
  [key: string]: unknown;
}

/** Generic handler type for any incoming message. */
export type KrakenWsMessageHandler = (msg: unknown) => void;

interface PendingRequest {
  resolve: (msg: KrakenWsMethodResponseEnvelope<unknown>) => void;
  reject: (err: unknown) => void;
  timeoutId: ReturnType<typeof setTimeout>;
}

/**
 * Low-level WebSocket v2 connection used by all Spot WS v2 APIs.
 *
 * - Speaks Kraken's `{ method, params, req_id }` envelope
 * - Correlates acks/responses by `req_id`
 * - Exposes a simple message subscription API for streaming data
 */
export class KrakenWebsocketBase {
  private readonly url: string;
  private readonly authToken?: string;
  private readonly WebSocketImpl?: KrakenWebSocketLikeCtor;
  private readonly logger?: KrakenWebsocketLogger;
  private readonly autoReconnect: boolean;
  private readonly reconnectDelayMs: number;
  private readonly requestTimeoutMs: number;

  private ws: KrakenWebSocketLike | null = null;
  private connectingPromise: Promise<void> | null = null;
  private manuallyClosed = false;

  private nextReqId = 1;
  private readonly pending = new Map<number, PendingRequest>();
  private readonly messageHandlers = new Set<KrakenWsMessageHandler>();

  private reconnectAttempts = 0;

  constructor(options: KrakenWebsocketConnectionOptions) {
    this.url = options.url;
    this.authToken = options.authToken;
    this.WebSocketImpl =
      options.WebSocketImpl ??
      (typeof WebSocket !== 'undefined'
        ? (WebSocket as unknown as KrakenWebSocketLikeCtor)
        : undefined);
    this.logger = options.logger;
    this.autoReconnect = options.autoReconnect ?? true;
    this.reconnectDelayMs = options.reconnectDelayMs ?? 1_000;
    this.requestTimeoutMs = options.requestTimeoutMs ?? 10_000;

    if (!this.WebSocketImpl) {
      throw new Error(
        'No WebSocket implementation available. ' +
          'Pass `WebSocketImpl` in KrakenWebsocketConnectionOptions when using Node.js.',
      );
    }
  }

  /** Current readyState of the underlying WebSocket (or -1 if not created). */
  get readyState(): number {
    return this.ws?.readyState ?? -1;
  }

  /** Connect (or reuse an in-flight connect). */
  async connect(): Promise<void> {
    if (this.ws && this.ws.readyState === 1) {
      return;
    }

    if (this.connectingPromise) {
      return this.connectingPromise;
    }

    this.manuallyClosed = false;

    this.connectingPromise = new Promise<void>((resolve, reject) => {
      try {
        const WS = this.WebSocketImpl!;
        const ws = new WS(this.url);
        this.ws = ws;

        ws.onopen = () => {
          this.reconnectAttempts = 0;
          this.logger?.info?.('Kraken WS connected', { url: this.url });
          this.connectingPromise = null;
          resolve();
        };

        ws.onclose = (ev) => {
          this.logger?.info?.('Kraken WS closed', {
            url: this.url,
            event: ev,
            manuallyClosed: this.manuallyClosed,
          });

          this.ws = null;
          this.connectingPromise = null;

          // Fail all pending requests
          for (const [reqId, pending] of this.pending) {
            clearTimeout(pending.timeoutId);
            pending.reject(
              new Error(`WebSocket closed before response for req_id ${reqId}`),
            );
          }
          this.pending.clear();

          if (!this.manuallyClosed && this.autoReconnect) {
            this.reconnectAttempts++;

            // exponential backoff with caps + jitter
            const base = this.reconnectDelayMs; // your configured base (default 1000)
            const exp = Math.min(
              30_000,
              base * Math.pow(2, this.reconnectAttempts - 1),
            );

            // After several failures, slow down to >= 5s as Kraken suggests post-maintenance.
            const minAfterMany = this.reconnectAttempts >= 4 ? 5_000 : 0;

            const delay = Math.max(minAfterMany, exp);
            const jittered = Math.max(
              0,
              Math.floor(delay * (0.8 + Math.random() * 0.4)),
            );

            setTimeout(() => {
              this.logger?.info?.('Kraken WS reconnecting', {
                url: this.url,
                attempt: this.reconnectAttempts,
                delayMs: jittered,
              });

              void this.connect().catch((err) => {
                this.logger?.error?.('Kraken WS reconnect failed', {
                  url: this.url,
                  error: err,
                });
              });
            }, jittered);
          }
        };

        ws.onerror = (ev) => {
          this.logger?.error?.('Kraken WS error', { url: this.url, event: ev });
        };

        ws.onmessage = (ev) => {
          let parsed: unknown = ev.data;
          if (typeof ev.data === 'string') {
            try {
              parsed = JSON.parse(ev.data);
            } catch (err) {
              this.logger?.warn?.('Failed to parse WS JSON message', {
                data: ev.data,
                error: err,
              });
            }
          }

          // First, resolve any pending request waiting on this req_id
          if (
            parsed &&
            typeof parsed === 'object' &&
            'req_id' in parsed &&
            typeof (parsed as any).req_id === 'number'
          ) {
            const reqId = (parsed as any).req_id as number;
            const pending = this.pending.get(reqId);
            if (pending) {
              this.pending.delete(reqId);
              clearTimeout(pending.timeoutId);
              pending.resolve(
                parsed as KrakenWsMethodResponseEnvelope<unknown>,
              );
            }
          }

          // Then fan out to generic handlers (for streaming data, etc.)
          for (const handler of this.messageHandlers) {
            try {
              handler(parsed);
            } catch (err) {
              this.logger?.error?.('WS message handler threw', { error: err });
            }
          }
        };
      } catch (err) {
        this.connectingPromise = null;
        reject(err);
      }
    });

    return this.connectingPromise;
  }

  /**
   * Close the WebSocket and prevent automatic reconnects
   * until `connect()` is called again.
   */
  close(code?: number, reason?: string): void {
    this.manuallyClosed = true;
    if (this.ws && this.ws.readyState === 1) {
      this.ws.close(code, reason);
    }
  }

  /**
   * Register a message handler. Returns an unsubscribe function.
   *
   * Streaming channels (ticker, book, trades, balances, etc.)
   * should typically be consumed via this hook.
   */
  addMessageHandler(handler: KrakenWsMessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  /**
   * Fire-and-forget: send arbitrary JSON over the socket.
   * Use this for pure streaming commands if you don't care
   * about the ack (e.g., manual `subscribe`).
   */
  async sendRaw(message: unknown): Promise<void> {
    // Avoid an async gap if we're already open
    if (!this.ws || this.ws.readyState !== 1) {
      await this.connect();
    }

    const ws = this.ws;
    if (!ws || ws.readyState !== 1) {
      throw new Error('WebSocket is not open');
    }

    const payload =
      typeof message === 'string' ? message : JSON.stringify(message);
    ws.send(payload);
  }

  /**
   * Send a Kraken-style `{ method, params, req_id }` message and
   * await the corresponding ack / response.
   */
  async request<Params extends object | undefined, Result = unknown>(
    method: string,
    params?: Params,
    options?: {
      reqId?: number;
      timeoutMs?: number;
      attachAuthToken?: boolean;
    },
  ): Promise<KrakenWsMethodResponseEnvelope<Result>> {
    // Avoid an async gap if we're already open
    if (!this.ws || this.ws.readyState !== 1) {
      await this.connect();
    }

    const reqId = options?.reqId ?? this.nextReqId++;
    const timeoutMs = options?.timeoutMs ?? this.requestTimeoutMs;
    const attachAuthToken = options?.attachAuthToken ?? true;

    const baseParams: Record<string, unknown> = params
      ? { ...(params as Record<string, unknown>) }
      : {};

    if (
      attachAuthToken &&
      this.authToken &&
      (baseParams.token === undefined || baseParams.token === null)
    ) {
      baseParams.token = this.authToken;
    }

    const envelope = {
      method,
      params: Object.keys(baseParams).length ? baseParams : undefined,
      req_id: reqId,
    };

    this.logger?.debug?.('Kraken WS request', { envelope });

    return await new Promise<KrakenWsMethodResponseEnvelope<Result>>(
      (resolve, reject) => {
        const timeoutId = setTimeout(() => {
          this.pending.delete(reqId);
          reject(
            new Error(
              `Kraken WS request timed out after ${timeoutMs}ms (method=${method}, req_id=${reqId})`,
            ),
          );
        }, timeoutMs);

        const pendingRequest: PendingRequest = {
          resolve: (msg) =>
            resolve(msg as KrakenWsMethodResponseEnvelope<Result>),
          reject,
          timeoutId,
        };

        this.pending.set(reqId, pendingRequest);

        try {
          const ws = this.ws;

          // ✅ Hard guard: if closed between connect() and here, reject cleanly
          if (!ws || ws.readyState !== 1) {
            clearTimeout(timeoutId);
            this.pending.delete(reqId);
            reject(
              new Error(
                `WebSocket is not open (method=${method}, req_id=${reqId})`,
              ),
            );
            return;
          }

          ws.send(JSON.stringify(envelope));
        } catch (err) {
          clearTimeout(timeoutId);
          this.pending.delete(reqId);
          reject(err);
        }
      },
    );
  }
}
