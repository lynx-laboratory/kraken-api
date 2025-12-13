// test/utils/fakeWebSocket.ts
import type {
  KrakenWebSocketLike,
  KrakenWebsocketBase,
} from '../../src/base/websocketBase';

export class FakeWebSocket implements KrakenWebSocketLike {
  static instances: FakeWebSocket[] = [];

  readonly url: string;

  // 0=CONNECTING, 1=OPEN, 2=CLOSING, 3=CLOSED
  readyState = 0;

  onopen: ((ev: unknown) => void) | null = null;
  onclose: ((ev: unknown) => void) | null = null;
  onerror: ((ev: unknown) => void) | null = null;
  onmessage: ((ev: { data: unknown }) => void) | null = null;

  sent: string[] = [];
  closedWith: { code?: number; reason?: string } | null = null;

  constructor(url: string) {
    this.url = url;
    FakeWebSocket.instances.push(this);
  }

  send(data: string): void {
    this.sent.push(data);
  }

  close(code?: number, reason?: string): void {
    this.readyState = 3;
    this.closedWith = { code, reason };
    this.onclose?.({ code, reason });
  }

  // ---- server-side helpers for tests ----
  serverOpen(): void {
    this.readyState = 1;
    this.onopen?.({});
  }

  serverMessage(data: unknown): void {
    this.onmessage?.({ data });
  }

  serverClose(ev: unknown = {}): void {
    this.readyState = 3;
    this.onclose?.(ev);
  }

  serverError(ev: unknown = {}): void {
    this.onerror?.(ev);
  }
}

/**
 * Fake KrakenWebsocketBase harness for unit-testing message channel helpers
 * like admin/heartbeat, admin/status, etc.
 */
export function createFakeWsBase() {
  const handlers: Array<(msg: unknown) => void> = [];

  const ws = {
    addMessageHandler(fn: (msg: unknown) => void) {
      handlers.push(fn);
      return () => {
        const idx = handlers.indexOf(fn);
        if (idx >= 0) handlers.splice(idx, 1);
      };
    },
  };

  return {
    ws: ws as unknown as KrakenWebsocketBase,
    emit(msg: unknown) {
      // defensive copy so unsubscribe during emit is safe
      [...handlers].forEach((h) => h(msg));
    },
    handlerCount() {
      return handlers.length;
    },
  };
}
