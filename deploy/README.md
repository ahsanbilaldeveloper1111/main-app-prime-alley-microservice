# Production deployment

The app ships as **two** processes that run on the same host:

| Process              | What it does                                          | Default port |
| -------------------- | ----------------------------------------------------- | ------------ |
| nginx                | Serves the Vite SPA build, terminates TLS, reverse-proxies `/streaming/*` to the sidecar | 80 / 443     |
| Streaming sidecar    | Express server that bridges the browser to the upstream STOMP / WebSocket / SSE services (analysis, CTI, Finesse, notifications) | 3102 (`STREAMING_PORT`) |

The browser only ever talks to nginx; nginx forwards `/streaming/*` to the sidecar over loopback.

```
browser ──► nginx :443 ──┬─► /              static SPA from $APP_DIR/dist
                         └─► /streaming/*   127.0.0.1:3102 (mainapp-streaming.service)
```

## Files in this folder

```
deploy/
├── nginx/
│   └── mainapp.conf                  # nginx server block
├── systemd/
│   └── mainapp-streaming.service     # systemd unit for the sidecar
└── README.md                         # this file
```

## One-time host setup

These steps are idempotent — run them once when bootstrapping a server (or any time `mainapp.conf` / `mainapp-streaming.service` change).

### 1. Create a service user and the deploy directory

```bash
sudo adduser --system --group --home /var/www/mainapp mainapp
sudo install -d -o mainapp -g mainapp /var/www/mainapp
```

The pipeline expects the project to live at `$APP_DIR` (e.g. `/var/www/mainapp/current`). Update `WorkingDirectory` and `EnvironmentFile` in the systemd unit and the `root` directive in the nginx config if you use a different path.

### 2. Install the streaming sidecar service

```bash
sudo cp deploy/systemd/mainapp-streaming.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable mainapp-streaming
```

(Don't `start` it yet — the pipeline will do that after the first build.)

### 3. Install the nginx config

```bash
sudo cp deploy/nginx/mainapp.conf /etc/nginx/sites-available/mainapp.conf
sudo ln -sf /etc/nginx/sites-available/mainapp.conf /etc/nginx/sites-enabled/mainapp.conf
sudo rm -f /etc/nginx/sites-enabled/default        # if Debian/Ubuntu shipped a default site
sudo nginx -t
sudo systemctl reload nginx
```

> The `map $http_upgrade $connection_upgrade { ... }` block in `mainapp.conf` lives at `http {}` scope. If you already declare `$connection_upgrade` somewhere else (e.g. `/etc/nginx/conf.d/upgrade-map.conf`), delete the duplicate from `mainapp.conf` to avoid `duplicate map` errors when reloading.

### 4. TLS

The shipped config listens on `:80` only; for production add a TLS server block. With certbot:

```bash
sudo certbot --nginx -d app.example.com
```

certbot will edit `mainapp.conf` to add the `:443` listener, redirect `:80` to HTTPS, and renew automatically. Re-run `nginx -t && systemctl reload nginx` afterwards.

## Per-deploy steps (handled by the pipeline)

The GitHub Actions deploy workflow does:

1. `git pull` on the deploy host.
2. Write secrets into `$APP_DIR/.env.local` (read by both Vite at build time and by the sidecar at runtime).
3. `npm ci && npm run build` — produces the SPA into `$APP_DIR/dist/`.
4. `systemctl restart mainapp-streaming` — picks up the new sidecar code and the latest `.env.local`.
5. `nginx -t && systemctl reload nginx` — only needed if you changed `mainapp.conf`, but a reload is cheap.

The pipeline never touches `/etc/nginx/sites-available/mainapp.conf`. If you change the nginx config in this repo, ssh in and copy it manually (or extend the workflow to do it — see the comment block in `.github/workflows/deploy.yml`).

## Health checks

```bash
# Sidecar reachable directly
curl -fsS http://127.0.0.1:3102/healthz
# {"ok":true}

# Sidecar reachable through nginx
curl -fsS http://localhost/streaming/healthz
# {"ok":true}

# Sidecar logs
sudo journalctl -u mainapp-streaming -f

# nginx error log for this site
sudo tail -f /var/log/nginx/mainapp.error.log
```

## Why a same-origin proxy and not direct browser → sidecar?

* **No CORS** for SSE / WebSocket — same origin sidesteps every preflight quirk.
* **Bearer tokens stay on one origin** — no extra cookie / CORS allow-credentials logic.
* The sidecar's port (`3102`) doesn't need to be open to the internet; it binds loopback only and nginx does TLS termination.

## Tuning for high streaming concurrency

The unit ships with `LimitNOFILE=65536`. If you run many concurrent SSE connections, also raise nginx's `worker_connections` and bump `keepalive_timeout` accordingly. Long-lived streams already get `proxy_read_timeout 24h` in the supplied config.
