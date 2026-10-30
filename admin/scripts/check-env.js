#!/usr/bin/env node
// Fail the production build when the backend origin is missing. Without it,
// the built admin app calls its own static origin (/api), which Vercel would
// either 404 or rewrite to index.html instead of reaching the Flask API.
const required = ["VITE_API_BASE_URL"];
const missing = required.filter((name) => !process.env[name]);
if (missing.length > 0) {
  console.error(
    `Missing required environment variable(s) for the admin production build: ${missing.join(", ")}. ` +
      `Set them (e.g. VITE_API_BASE_URL=https://api.recruai.menteeai.org) and rebuild.`
  );
  process.exit(1);
}
console.log("Admin env check passed.");
