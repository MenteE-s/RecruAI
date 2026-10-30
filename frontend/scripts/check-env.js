#!/usr/bin/env node
// Fail the production build when required backend URLs are missing, instead
// of shipping a frontend that silently calls its own origin for API traffic.
// CI builds must set these (placeholder values are fine — Vercel rebuilds
// with the real ones); `npm start` is unaffected.
const required = ["REACT_APP_API_BASE_URL", "REACT_APP_SOCKET_URL"];
const missing = required.filter((name) => !process.env[name]);
if (missing.length > 0) {
  console.error(
    `Missing required environment variable(s) for the production build: ${missing.join(", ")}. ` +
      `Set them (e.g. REACT_APP_API_BASE_URL=https://api.recruai.menteeai.org) and rebuild.`
  );
  process.exit(1);
}
console.log("Frontend env check passed.");
