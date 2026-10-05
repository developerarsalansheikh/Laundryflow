import { io } from 'socket.io-client';
import { SOCKET_URL } from '../constants/api';
import { useAuthStore } from '../store/authStore';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.activeRooms = new Set();
    this.reconnectAttempts = 0;
  }

  /**
   * Connect to backend Socket.io server with authentication
   */
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
      this.reconnectAttempts = 0;
      if (__DEV__) {
        console.log('[SocketService] Connected successfully:', this.socket.id);
      }

      // Automatically restore active rooms upon connection / reconnection
      this.restoreActiveRooms();
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      if (__DEV__) {
        console.log('[SocketService] Disconnected:', reason);
      }
    });

    this.socket.on('connect_error', (error) => {
      this.reconnectAttempts++;
      if (__DEV__) {
        console.warn('[SocketService] Connect error:', error.message);
      }

      // If token expired or auth error, update auth headers on next attempt
      const freshToken = useAuthStore.getState().token;
      if (this.socket && freshToken) {
        this.socket.auth = { token: freshToken };
      }
    });

    this.socket.on('error:unauthorized', (data) => {
      if (__DEV__) {
        console.warn('[SocketService] Unauthorized error received:', data);
      }
    });

    return this.socket;
  }

  /**
   * Disconnect socket cleanly
   */
  disconnect() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.activeRooms.clear();
    }
  }

  /**
   * Restore all rooms that were active before reconnect
   */
  restoreActiveRooms() {
    if (!this.socket || !this.isConnected || this.activeRooms.size === 0) return;

    this.activeRooms.forEach((room) => {
      this.socket.emit('room:join', { room }, (resp) => {
        if (__DEV__) {
          console.log(`[SocketService] Restored room ${room}:`, resp?.success ? 'OK' : 'FAILED');
        }
      });
    });
  }

  /**
   * Join an authorized room and register it for auto-reconnect
   */
  joinRoom(room, callback) {
    if (!room) return;
    this.activeRooms.add(room);

    if (!this.socket?.connected) {
      this.connect();
    }

    if (this.socket?.connected) {
      this.socket.emit('room:join', { room }, (response) => {
        if (callback) callback(response);
      });
    }
  }

  /**
   * Leave a room and unregister it
   */
  leaveRoom(room, callback) {
    if (!room) return;
    this.activeRooms.delete(room);

    if (this.socket?.connected) {
      this.socket.emit('room:leave', { room }, (response) => {
        if (callback) callback(response);
      });
    }
  }

  /**
   * Track order live updates (customer & assigned driver)
   */
  trackOrder(orderId, callback) {
    if (!orderId) return;
    const room = `order:${orderId}`;
    this.activeRooms.add(room);

    if (!this.socket?.connected) {
      this.connect();
    }

    if (this.socket?.connected) {
      this.socket.emit('order:track', { orderId }, (response) => {
        if (callback) callback(response);
      });
    }
  }

  /**
   * Stop tracking order
   */
  untrackOrder(orderId, callback) {
    if (!orderId) return;
    const room = `order:${orderId}`;
    this.activeRooms.delete(room);

    if (this.socket?.connected) {
      this.socket.emit('order:untrack', { orderId }, (response) => {
        if (callback) callback(response);
      });
    }
  }

  /**
   * Send throttled driver GPS location update
   */
  sendDriverLocation(data, callback) {
    if (!this.socket?.connected) {
      this.connect();
    }

    if (this.socket?.connected) {
      this.socket.emit('driver:locationUpdate', data, (response) => {
        if (callback) callback(response);
      });
    }
  }

  /**
   * Set driver availability
   */
  setDriverAvailability(status, isAvailable, callback) {
    if (!this.socket?.connected) {
      this.connect();
    }

    if (this.socket?.connected) {
      this.socket.emit('driver:setAvailability', { status, isAvailable }, (response) => {
        if (callback) callback(response);
      });
    }
  }

  /**
   * Listen for an event with auto-connect and cleanup unsubscriber
   */
  on(event, callback) {
    if (!this.socket) {
      this.connect();
    }
    // Prevent duplicate listener accumulation
    this.socket?.off(event, callback);
    this.socket?.on(event, callback);
    return () => this.off(event, callback);
  }

  /**
   * Remove a specific event listener
   */
  off(event, callback) {
    this.socket?.off(event, callback);
  }

  /**
   * Emit arbitrary event
   */
  emit(event, data, callback) {
    if (!this.socket) {
      this.connect();
    }
    this.socket?.emit(event, data, callback);
  }
}

export const socketService = new SocketService();
export default socketService;
