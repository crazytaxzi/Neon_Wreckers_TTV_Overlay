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
