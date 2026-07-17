type SocketLike = {
  readyState: number;
  OPEN: number;
  send(payload: string): void;
  on(event: 'close' | 'error', listener: () => void): void;
};

export class RealtimeHub {
  private readonly sockets = new Set<SocketLike>();

  get connectionCount() {
    return this.sockets.size;
  }

  add(socket: SocketLike) {
    this.sockets.add(socket);
  }

  remove(socket: SocketLike) {
    this.sockets.delete(socket);
  }

  broadcast(payload: unknown) {
    const message = JSON.stringify(payload);
    for (const socket of this.sockets) {
      if (socket.readyState !== socket.OPEN) {
        this.sockets.delete(socket);
        continue;
      }
      try {
        socket.send(message);
      } catch {
        this.sockets.delete(socket);
      }
    }
  }
}

export class PlayerRealtimeHub {
  private readonly sockets = new Map<string, Set<SocketLike>>();

  add(playerId: string, socket: SocketLike) {
    const group = this.sockets.get(playerId) ?? new Set<SocketLike>();
    group.add(socket);
    this.sockets.set(playerId, group);
  }

  remove(playerId: string, socket: SocketLike) {
    const group = this.sockets.get(playerId);
    group?.delete(socket);
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
