#!/usr/bin/env node
// CI budget gate (P2-04): fail the build if the initial JS payload regresses.
// CRA emits main.<hash>.js (initial route bundle) plus lazy chunks; only the
// initial bundle is gated because lazy chunks load on demand by design.
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

// Set from the 26 Oct 2026 build (main ~95 kB gzip after full route-level
// splitting; interview room and LiveKit load on demand). Tight enough to
// catch a vendor accidentally pulled back into the shell; bump deliberately.
const MAIN_BUDGET_GZIP_BYTES = 160 * 1024;

const jsDir = path.join(__dirname, "..", "build", "static", "js");
if (!fs.existsSync(jsDir)) {
  console.error("check-bundle: build/static/js not found — run npm run build first.");
  process.exit(1);
}

const mains = fs.readdirSync(jsDir).filter((f) => /^main\.[a-f0-9]+\.js$/.test(f));
if (mains.length === 0) {
  console.error("check-bundle: no main.*.js chunk found.");
  process.exit(1);
}

let failed = false;
for (const file of mains) {
  const raw = fs.readFileSync(path.join(jsDir, file));
  const gzip = zlib.gzipSync(raw).length;
  const kb = (gzip / 1024).toFixed(1);
  console.log(`check-bundle: ${file} ${(raw.length / 1024).toFixed(1)} kB raw, ${kb} kB gzip`);
  if (gzip > MAIN_BUDGET_GZIP_BYTES) {
    console.error(
      `check-bundle: ${file} gzip ${kb} kB exceeds budget ${MAIN_BUDGET_GZIP_BYTES / 1024} kB. ` +
        `Split vendors or lazy-load the new weight; do not raise the budget to silence this.`
    );
    failed = true;
  }
}
process.exit(failed ? 1 : 0);
