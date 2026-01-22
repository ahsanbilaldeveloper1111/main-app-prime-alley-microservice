#!/usr/bin/env bash
set -euo pipefail

ENV_NAME="${1:?env required (dev|stage)}"

mkdir -p ~/.ssh
chmod 700 ~/.ssh

# CI key
echo "$SSH_PRIVATE_KEY" | tr -d '\r' > ~/.ssh/id_ci
chmod 600 ~/.ssh/id_ci

# known_hosts
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

ssh -o StrictHostKeyChecking=yes -i ~/.ssh/id_ci "$SSH_USER@$SSH_HOST" "bash -l -s" <<EOF
set -euo pipefail
cd "$APP_DIR"

git fetch origin
git checkout "$BRANCH"
git pull origin "$BRANCH"

# Write .env.local BEFORE install/build
cat > .env.local <<'ENVEOF'
$DOTENV_CONTENT
ENVEOF
chmod 600 .env.local

# Stop FIRST to free memory
sudo systemctl stop "$SERVICE_NAME"

if [[ "$ENV_NAME" == "stage" ]]; then
  echo "Stage has no internet: skipping npm ci/install"
else
  # Only install when lockfile changed
  LOCK_HASH_FILE=".last_package_lock_sha"
  CURRENT_LOCK_SHA="$(sha256sum package-lock.json | awk '{print $1}')"
  LAST_LOCK_SHA="$(cat "$LOCK_HASH_FILE" 2>/dev/null || true)"

  if [[ "$CURRENT_LOCK_SHA" != "$LAST_LOCK_SHA" ]]; then
    echo "package-lock changed: running npm ci"
    npm ci --no-audit --no-fund
    echo "$CURRENT_LOCK_SHA" > "$LOCK_HASH_FILE"
  else
    echo "package-lock unchanged: skipping npm ci"
  fi
fi

npm run build
sudo systemctl start "$SERVICE_NAME"
sudo systemctl --no-pager status "$SERVICE_NAME" || true
EOF
