import { io } from "socket.io-client";
import { ensureFreshAccessToken } from "./auth";

function resolveSocketUrl() {
  const url =
    process.env.REACT_APP_SOCKET_URL ||
    process.env.REACT_APP_API_BASE_URL;
  if (url) return url;
  // Fail fast in production: connecting Socket.IO to the frontend origin
  // silently breaks realtime without an obvious error. Development keeps the
  // same-origin fallback so local work does not need a .env file.
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "REACT_APP_SOCKET_URL (or REACT_APP_API_BASE_URL) is not set - define it in Vercel"
    );
  }
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

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
    this.socket = io(resolveSocketUrl(), {
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
