import { io } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') ||
  'http://localhost:8080';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.activeRooms = new Set();
  }

  connect() {
    const token = useAuthStore.getState().token;
    if (!token) {
      return null;
    }

    if (this.socket?.connected) {
      return this.socket;
    }

    if (this.socket) {
      this.socket.auth = { token };
      this.socket.connect();
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      timeout: 15000,
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
      if (import.meta.env.DEV) {
        console.log('[WebSocketService] Connected:', this.socket.id);
      }
      this.restoreActiveRooms();
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      if (import.meta.env.DEV) {
        console.log('[WebSocketService] Disconnected:', reason);
      }
    });

    this.socket.on('connect_error', (error) => {
      if (import.meta.env.DEV) {
        console.warn('[WebSocketService] Connect error:', error.message);
      }
      const freshToken = useAuthStore.getState().token;
      if (this.socket && freshToken) {
        this.socket.auth = { token: freshToken };
      }
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.activeRooms.clear();
    }
  }

  restoreActiveRooms() {
    if (!this.socket || !this.isConnected || this.activeRooms.size === 0) return;

    this.activeRooms.forEach((room) => {
      this.socket.emit('room:join', { room }, (resp) => {
        if (import.meta.env.DEV) {
          console.log(`[WebSocketService] Restored room ${room}:`, resp?.success ? 'OK' : 'FAIL');
        }
      });
    });
  }

  joinRoom(room, callback) {
    if (!room) return;
    this.activeRooms.add(room);

    if (!this.socket?.connected) {
      this.connect();
    }

    if (this.socket?.connected) {
      this.socket.emit('room:join', { room }, (resp) => {
        if (callback) callback(resp);
      });
    }
  }

  leaveRoom(room, callback) {
    if (!room) return;
    this.activeRooms.delete(room);

    if (this.socket?.connected) {
      this.socket.emit('room:leave', { room }, (resp) => {
        if (callback) callback(resp);
      });
    }
  }

  on(event, callback) {
    if (!this.socket) {
      this.connect();
    }
    this.socket?.on(event, callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    this.socket?.off(event, callback);
  }

  emit(event, data, callback) {
    if (!this.socket) {
      this.connect();
    }
    this.socket?.emit(event, data, callback);
  }
}

export const webSocketService = new WebSocketService();
export default webSocketService;
