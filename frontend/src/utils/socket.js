import { io } from "socket.io-client";

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:5000";

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect(token) {
    if (this.socket) return;

    this.socket = io(SOCKET_URL, {
      query: { token },
      transports: ["websocket"],
      reconnectionAttempts: 5,
    });

    this.socket.on("connect", () => {
      console.log("Connected to Real-Time Bridge (Socket.IO)");
    });

    this.socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    // Re-register all previous listeners on reconnect
    this.socket.on("reconnect", () => {
      this.listeners.forEach((callbacks, event) => {
        callbacks.forEach((cb) => this.socket.on(event, cb));
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }

    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  joinOrg(orgId) {
    if (this.socket) {
      this.socket.emit("join_org", { org_id: orgId });
    }
  }
}

const socketService = new SocketService();
export default socketService;
