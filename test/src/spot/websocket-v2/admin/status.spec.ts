import { describe, it, expect, vi } from 'vitest';
import { createFakeWsBase } from '../../../../utils/fakeWebSocket';
import {
  onStatus,
  type KrakenWsStatusUpdateMessage,
} from '../../../../../src/spot/websocket-v2/admin/status';

describe('spot/websocket-v2/admin/status', () => {
  it('calls handler only for channel === "status" and type === "update"', () => {
    const { ws, emit } = createFakeWsBase();
    const handler = vi.fn();

    onStatus(ws, handler);

    emit({ channel: 'heartbeat' });
    emit({ channel: 'status', type: 'snapshot', data: [] });
    emit({ channel: 'status', type: 'update' }); // no data array
    emit({ type: 'update', data: [] }); // no channel
    expect(handler).toHaveBeenCalledTimes(0);

    const msg: KrakenWsStatusUpdateMessage = {
      channel: 'status',
      type: 'update',
      data: [
        {
          system: 'online',
          api_version: 'v2',
          connection_id: 123456,
          version: '2.0.0',
        },
      ],
    };

    emit(msg);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(msg);
  });

  it('ignores null and non-object messages', () => {
    const { ws, emit } = createFakeWsBase();
    const handler = vi.fn();

    onStatus(ws, handler);

    emit(null);
    emit(undefined);
    emit('status');
    emit(123);

    expect(handler).toHaveBeenCalledTimes(0);
  });

  it('unsubscribe stops future calls', () => {
    const { ws, emit, handlerCount } = createFakeWsBase();
    const handler = vi.fn();

    const unsubscribe = onStatus(ws, handler);
    expect(handlerCount()).toBe(1);

    emit({
      channel: 'status',
      type: 'update',
      data: [
        {
          system: 'online',
          api_version: 'v2',
          connection_id: 1,
          version: '2.0.0',
        },
      ],
    });

    expect(handler).toHaveBeenCalledTimes(1);

    unsubscribe();
    expect(handlerCount()).toBe(0);

    emit({
      channel: 'status',
      type: 'update',
      data: [
        {
          system: 'maintenance',
          api_version: 'v2',
          connection_id: 2,
          version: '2.0.0',
        },
      ],
    });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('requires msg.data to be an array (guards malformed messages)', () => {
    const { ws, emit } = createFakeWsBase();
    const handler = vi.fn();

    onStatus(ws, handler);

    emit({ channel: 'status', type: 'update', data: null });
    emit({ channel: 'status', type: 'update', data: {} });
    emit({ channel: 'status', type: 'update', data: 'nope' });

    expect(handler).toHaveBeenCalledTimes(0);
  });
});
