# Streaming sidecar

After Next.js was removed, the four streaming endpoints stayed server-side
because the backend doesn't yet expose direct SSE/WebSocket streams to the
browser (per migration decision #3). This tiny Express server hosts them.

## Endpoints

| Path                    | Source                                      | Type                          |
| ----------------------- | ------------------------------------------- | ----------------------------- |
| `/analysis-stream`      | `server/streaming/analysis-stream.js`       | SSE → upstream WS (analysis)  |
| `/cti-stomp-stream`     | `server/streaming/cti-stomp-stream.js`      | SSE → upstream STOMP (CTI)    |
| `/finesse-ws-stream`    | `server/streaming/finesse-ws-stream.js`     | SSE → upstream STOMP (Finesse) |
| `/notification-stream`  | `server/streaming/notification-stream.js`   | SSE → upstream Socket.IO      |
| `/healthz`              | `server/index.js`                           | JSON liveness probe           |

## Architecture

```
Browser  ───── http://localhost:3000  (Vite dev server)
                       │
                       │   /streaming/* → proxied + prefix-stripped
                       ▼
         http://localhost:3100  (this sidecar, server/index.js)
                       │
                       ▼
       Upstream STOMP / WebSocket / Socket.IO services
       (CTI, Finesse, ML gateway, notifications)
```

In production the same idea applies behind a reverse proxy:

```
location /streaming/ { proxy_pass http://127.0.0.1:3100/; }
```

## Run

The sidecar is plain ESM JavaScript — Node runs it directly, no build step:

```bash
npm run dev              # SPA + sidecar concurrently (recommended for dev)
npm run dev:web          # just Vite
npm run dev:streaming    # just the sidecar (alias for the prod command)
npm run start:streaming  # production: node server/index.js
```

## Build

There is **no build step for the sidecar.**
- `server/index.js` and the four handler modules under `server/streaming/`
  are pure ESM JavaScript.
- The project's `package.json` has `"type": "module"`, so Node treats `.js`
  files as ESM out of the box.
- `import "dotenv/config";` at the top of `server/index.js` loads the
  project-root `.env` automatically; deployments that inject env via the
  orchestrator (k8s, systemd, PaaS, etc.) don't need a `.env` file at all.

The SPA still builds normally (`npm run build` → `dist/`); the sidecar is
deployed as source alongside `node_modules`.

## Env

The sidecar uses `dotenv/config` to load the project-root `.env`, so all
values defined for the SPA are visible. Keys are looked up in this order
(first match wins):

| Endpoint               | Keys (in order)                                                                                                  | Default               |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------- | --------------------- |
| `/cti-stomp-stream`    | `VITE_PRIVATE_CTI_SOCKET_URL` → `NEXT_PUBLIC_PRIVATE_CTI_SOCKET_URL`                                              | _required_            |
| `/cti-stomp-stream`    | `CTI_SERVER_PORT`                                                                                                | `8008`                |
| `/analysis-stream`     | `VITE_PRIVATE_AIML_SOCKET_URL` → `NEXT_PUBLIC_PRIVATE_AIML_SOCKET_URL`                                            | _required_            |
| `/analysis-stream`     | `VITE_AIML_WEBSOCKET_PROTOCOL` → `WEBSOCKET_PROTOCOL`                                                             | `wss`                 |
| `/analysis-stream`     | `VITE_BASE_URL` → `NEXT_PUBLIC_BASE_URL` (used as `Origin` header)                                                | _omitted if unset_    |
| `/finesse-ws-stream`   | `FINESSE_WS_BACKEND` → `VITE_FINESSE_WS_BASE` → `NEXT_PUBLIC_FINESSE_WS_BASE`                                     | `http://localhost:8010` |
| `/notification-stream` | `NOTIFICATION_SOCKET_URL` → `PRIVATE_NOTIFICATION_SOCKET_URL`                                                     | _required_            |
| `/notification-stream` | `NOTIFICATION_SOCKET_PATH`                                                                                       | `/socket.io`          |
| `/notification-stream` | `NOTIFICATION_SOCKET_TRANSPORTS`                                                                                 | `websocket,polling`   |
| Sidecar process        | `STREAMING_PORT`                                                                                                 | `3100`                |
| Sidecar process        | `STREAMING_ALLOWED_ORIGINS` (comma-separated)                                                                    | _all origins_         |

If your `.env` already populates the `VITE_*` keys for the SPA, the sidecar
picks them up automatically — no duplicated `NEXT_PUBLIC_*` block required.

## Frontend wiring

`vite.config.ts` proxies `/streaming/*` to the sidecar in dev (the prefix is
stripped before forwarding). All client code calls `/streaming/<endpoint>`,
so the browser only ever talks to port 3000 in dev or to the SPA's origin in
production.
