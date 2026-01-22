#!/usr/bin/env bash
set -euo pipefail

ENV_NAME="${1:?env required (dev|stage)}"

mkdir -p ~/.ssh
chmod 700 ~/.ssh

echo "$SSH_PRIVATE_KEY" | tr -d '\r' > ~/.ssh/id_ci
chmod 600 ~/.ssh/id_ci

echo "$SSH_KNOWN_HOSTS" > ~/.ssh/known_hosts
chmod 600 ~/.ssh/known_hosts

if [[ "$ENV_NAME" == "dev" ]]; then
  SSH_HOST="${DEV_SSH_HOST}"
  SSH_USER="${DEV_SSH_USER}"
  APP_DIR="${DEV_APP_DIR}"
  DOTENV_CONTENT="${DEV_DOTENV}"
  BRANCH="develop"
  SERVICE_NAME="${DEV_SERVICE_NAME:-nextjs}"
elif [[ "$ENV_NAME" == "stage" ]]; then
  SSH_HOST="${STAGE_SSH_HOST}"
  SSH_USER="${STAGE_SSH_USER}"
  APP_DIR="${STAGE_APP_DIR}"
  DOTENV_CONTENT="${STAGE_DOTENV}"
  BRANCH="qa"
  SERVICE_NAME="${STAGE_SERVICE_NAME:-nextjs}"
else
  echo "Unknown env: $ENV_NAME"
  exit 2
fi

echo "Deploying Next.js $ENV_NAME to $SSH_USER@$SSH_HOST:$APP_DIR (branch=$BRANCH, service=$SERVICE_NAME)"

ssh -o StrictHostKeyChecking=yes -i ~/.ssh/id_ci \
  "$SSH_USER@$SSH_HOST" \
  "ENV_NAME='$ENV_NAME' APP_DIR='$APP_DIR' BRANCH='$BRANCH' SERVICE_NAME='$SERVICE_NAME' DOTENV_CONTENT=\$'${DOTENV_CONTENT//$'\n'/\\n}' bash -l -s" <<'EOF'
set -euo pipefail

cd "$APP_DIR"

git fetch origin
git checkout "$BRANCH"
git pull origin "$BRANCH"

# Write .env.local
printf "%b" "$DOTENV_CONTENT" > .env.local
chmod 600 .env.local

# Stop FIRST (frees memory; avoids npm killed)
sudo systemctl stop "$SERVICE_NAME"

if [[ "$ENV_NAME" == "stage" ]]; then
  echo "Stage: skipping npm ci/install"
else
  # Dev: install only if needed (optional — keep simple for now)
  if [[ -f package-lock.json ]]; then
    npm ci --no-audit --no-fund
  else
    npm install --no-audit --no-fund
  fi
fi

# Build (needs deps; stage can skip once artifacts are present)
if [[ "$ENV_NAME" == "stage" ]]; then
  echo "Stage: skipping next build (expects standalone artifacts already present)"
else
  npm run build
fi

# ---- Deploy standalone runtime ----
# 1) Copy standalone server + minimal node_modules to app root

# ---- Deploy standalone runtime (stable copy) ----
STAGE_DIR="$(mktemp -d /tmp/next-standalone-XXXXXX)"

# Copy build output into a stable temp dir first (avoids "vanished" during transfer)
cp -a .next/standalone/. "$STAGE_DIR/standalone"
mkdir -p "$STAGE_DIR/.next"
cp -a .next/static "$STAGE_DIR/.next/static"

# Now sync from the stable temp dir into app root
# Ignore rsync code 24 (vanished files) just in case
rsync -a --delete "$STAGE_DIR/standalone/" ./ || [[ $? -eq 24 ]]
mkdir -p .next
rsync -a --delete "$STAGE_DIR/.next/static/" .next/static/ || [[ $? -eq 24 ]]

rm -rf "$STAGE_DIR"

sudo systemctl start "$SERVICE_NAME"
sudo systemctl --no-pager status "$SERVICE_NAME" || true
EOF
