import { describe, it, expect, vi } from 'vitest';
import { createFakeWsBase } from '../../../../utils/fakeWebSocket';
import { onHeartbeat } from '../../../../../src/spot/websocket-v2/admin/heartbeat';

describe('spot/websocket-v2/admin/heartbeat', () => {
  it('calls handler only when channel === "heartbeat"', () => {
    const { ws, emit } = createFakeWsBase();
    const handler = vi.fn();

    onHeartbeat(ws, handler);

    emit({ channel: 'status' });
    emit({ channel: 'ping' });
    expect(handler).toHaveBeenCalledTimes(0);

    const msg = { channel: 'heartbeat' as const };
    emit(msg);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(msg);
  });

  it('ignores null and non-object messages', () => {
    const { ws, emit } = createFakeWsBase();
    const handler = vi.fn();

    onHeartbeat(ws, handler);

    emit(null);
    emit(undefined);
    emit('heartbeat');
    emit(123);

    expect(handler).toHaveBeenCalledTimes(0);
  });

  it('unsubscribe stops future calls', () => {
    const { ws, emit, handlerCount } = createFakeWsBase();
    const handler = vi.fn();

    const unsubscribe = onHeartbeat(ws, handler);
    expect(handlerCount()).toBe(1);

    emit({ channel: 'heartbeat' });
    expect(handler).toHaveBeenCalledTimes(1);

    unsubscribe();
    expect(handlerCount()).toBe(0);

    emit({ channel: 'heartbeat' });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('passes through extra fields (future-proof)', () => {
    const { ws, emit } = createFakeWsBase();
    const handler = vi.fn();

    onHeartbeat(ws, handler);

    const msg = { channel: 'heartbeat' as const, ts: 123, foo: 'bar' };
    emit(msg);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(msg);
  });
});
