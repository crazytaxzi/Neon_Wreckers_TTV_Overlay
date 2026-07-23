import { realtimeEventSchema } from '@neon-wreckers/contracts';
import type { RequestMetrics } from '../services/metrics.js';

type SocketLike = {
  readyState: number;
  OPEN: number;
  send(payload: string): void;
  on(event: 'close' | 'error', listener: () => void): void;
};

export class RealtimeHub {
  private readonly sockets = new Set<SocketLike>();
  constructor(private readonly metrics?: RequestMetrics) {}

  get connectionCount() { return this.sockets.size; }

  add(socket: SocketLike) {
    const before = this.sockets.size;
    this.sockets.add(socket);
    if (this.sockets.size > before) this.metrics?.increment('websocket_connections_opened_total');
  }

  remove(socket: SocketLike) {
    if (this.sockets.delete(socket)) this.metrics?.increment('websocket_disconnects_total');
  }

  broadcast(payload: unknown) {
    let wirePayload: unknown;
    try {
      wirePayload = JSON.parse(JSON.stringify(payload));
    } catch (error) {
      this.metrics?.increment('realtime_malformed_packets_total');
      console.error('Realtime payload serialization failed', { error, type: (payload as { type?: unknown } | null)?.type });
      return false;
    }
    const parsed = realtimeEventSchema.safeParse(wirePayload);
    if (!parsed.success) {
      this.metrics?.increment('realtime_malformed_packets_total');
      console.error('Realtime contract validation failed', { issues: parsed.error.issues, type: (wirePayload as { type?: unknown } | null)?.type });
      return false;
    }
    const message = JSON.stringify(parsed.data);
    for (const socket of this.sockets) {
      if (socket.readyState !== socket.OPEN) { this.remove(socket); continue; }
      try { socket.send(message); } catch { this.remove(socket); }
    }
    return true;
  }
}

export class PlayerRealtimeHub {
  private readonly sockets = new Map<string, Set<SocketLike>>();
  constructor(private readonly metrics?: RequestMetrics) {}

  get connectionCount() {
    let total = 0;
    for (const group of this.sockets.values()) total += group.size;
    return total;
  }

  add(playerId: string, socket: SocketLike) {
    const group = this.sockets.get(playerId) ?? new Set<SocketLike>();
    const before = group.size;
    group.add(socket);
    this.sockets.set(playerId, group);
    if (group.size > before) this.metrics?.increment('websocket_connections_opened_total');
  }

  remove(playerId: string, socket: SocketLike) {
    const group = this.sockets.get(playerId);
    if (group?.delete(socket)) this.metrics?.increment('websocket_disconnects_total');
    if (!group?.size) this.sockets.delete(playerId);
  }

  broadcast(playerId: string, payload: unknown) {
    const group = this.sockets.get(playerId);
    if (!group) return;
    const message = JSON.stringify(payload);
    for (const socket of group) {
      if (socket.readyState !== socket.OPEN) this.remove(playerId, socket);
      else try { socket.send(message); } catch { this.remove(playerId, socket); }
    }
  }
}
