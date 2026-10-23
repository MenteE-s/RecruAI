import { io } from "socket.io-client";
import { ensureFreshAccessToken } from "./auth";

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || process.env.REACT_APP_API_BASE_URL || window.location.origin;

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect() {
    if (this.socket) return;

    // Auth handshake carries the short-lived JWT (never the URL query string,
    // which would leak it into server/proxy logs). The auth function runs on
    // every reconnect, refreshing the HttpOnly cookie session if needed.
    this.socket = io(SOCKET_URL, {
      auth: (cb) => {
        ensureFreshAccessToken()
          .then((token) => cb(token ? { token } : {}))
          .catch(() => cb({}));
      },
      withCredentials: true,
      transports: ["websocket"],
      reconnectionAttempts: 5,
    });

    this.socket.on("connect", () => {
      // Connected — App.js joins the caller's org room explicitly.
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
