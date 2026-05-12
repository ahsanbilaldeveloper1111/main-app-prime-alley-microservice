/**
 * Streaming sidecar.
 *
 * The four endpoints used to live at `/api/*-stream` inside Next.js. They
 * stay server-side because the backend still doesn't expose direct SSE/WS
 * streams to the browser (per migration decision #3). This Express server
 * runs on its own port and the SPA reaches it through Vite's dev proxy
 * (`/streaming/*` -> `http://localhost:3100/*`) and via reverse proxy in
 * production.
 *
 * Each handler is the unmodified `pages/api/*-stream.js` body — they were
 * already written against `(req, res)` with `res.write/writeHead/end`,
 * which is exactly what Express provides.
 *
 * The file is plain ESM JavaScript so Node can run it directly with no
 * transpile step. `npm run dev` and `npm run start:streaming` both invoke
 * `node server/index.js`.
 *
 * Env loading order (first match wins, later values fill in any gaps):
 *   1. .env.local        — local overrides written by the deploy pipeline
 *   2. .env              — committed defaults / shared values
 *   3. process.env       — anything systemd / the shell already exported
 * This matches Vite's own load order so build-time and runtime see the same
 * values from the same files.
 */

import { config as loadDotenv } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";

// Load env before importing handler modules — they read process.env at module
// scope (e.g. NODE_ENV-driven cleanup intervals), so dotenv must run first.
// Dynamic `import()` is the only way to reliably interleave a side effect
// between import statements in pure ESM. `override: false` means values
// already exported by systemd / the shell win over what's in the files.
const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
for (const file of [".env.local", ".env"]) {
  loadDotenv({ path: path.join(projectRoot, file), override: false });
}

const { default: analysisStream } = await import(
  "./streaming/analysis-stream.js"
);
const { default: ctiStompStream } = await import(
  "./streaming/cti-stomp-stream.js"
);
const { default: finesseWsStream } = await import(
  "./streaming/finesse-ws-stream.js"
);
const { default: notificationStream } = await import(
  "./streaming/notification-stream.js"
);

const app = express();

const allowedOrigins = (process.env.STREAMING_ALLOWED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
    credentials: true,
  }),
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// The handlers were written for Next.js so they expect `req.query` to be a
// plain object — Express already provides that.
app.get("/analysis-stream", (req, res) => analysisStream(req, res));
app.get("/cti-stomp-stream", (req, res) => ctiStompStream(req, res));
app.post("/cti-stomp-stream", (req, res) => ctiStompStream(req, res));
app.get("/finesse-ws-stream", (req, res) => finesseWsStream(req, res));
app.post("/finesse-ws-stream", (req, res) => finesseWsStream(req, res));
app.get("/notification-stream", (req, res) => notificationStream(req, res));

app.get("/healthz", (_req, res) => {
  res.json({ ok: true });
});

const PORT = Number.parseInt(process.env.STREAMING_PORT || "3100", 10);
app.listen(PORT, () => {
  console.log(`[streaming] listening on http://localhost:${PORT}`);
});
