#!/usr/bin/env bash
set -euo pipefail

ENV_NAME="${1:?env required (dev|stage)}"
# Optional: override which branch the server checks out/pulls.
BRANCH_OVERRIDE="${2:-}"

# ---------- SSH setup ----------
mkdir -p ~/.ssh
chmod 700 ~/.ssh

echo "$SSH_PRIVATE_KEY" | tr -d '\r' > ~/.ssh/id_ci
chmod 600 ~/.ssh/id_ci

echo "$SSH_KNOWN_HOSTS" > ~/.ssh/known_hosts
chmod 600 ~/.ssh/known_hosts

# ---------- Environment selection ----------
if [[ "$ENV_NAME" == "dev" ]]; then
  SSH_HOST="${DEV_SSH_HOST}"
  SSH_USER="${DEV_SSH_USER}"
  SSH_PORT="${DEV_SSH_PORT:-22}"
  APP_DIR="${DEV_APP_DIR}"
  DOTENV_CONTENT="${DEV_DOTENV}"
  BRANCH="${DEV_BRANCH:-develop}"
  SERVICE_NAME="${DEV_SERVICE_NAME:-nextjs}"
elif [[ "$ENV_NAME" == "stage" ]]; then
  SSH_HOST="${STAGE_SSH_HOST}"
  SSH_USER="${STAGE_SSH_USER}"
  SSH_PORT="${STAGE_SSH_PORT:-22}"
  APP_DIR="${STAGE_APP_DIR}"
  DOTENV_CONTENT="${STAGE_DOTENV}"
  BRANCH="${STAGE_BRANCH:-qa}"
  SERVICE_NAME="${STAGE_SERVICE_NAME:-nextjs}"
else
  echo "Unknown env: $ENV_NAME"
  exit 2
fi

# If provided, overrides the default branch per environment.
if [[ -n "$BRANCH_OVERRIDE" ]]; then
  BRANCH="$BRANCH_OVERRIDE"
fi

# Flag from CI variables (expected: 0 or 1)
# Expected: 0 or 1
STAGE_RUN_NPM="${STAGE_RUN_NPM:-0}"

echo "Deploying Next.js [$ENV_NAME] → $SSH_USER@$SSH_HOST:$APP_DIR (branch=$BRANCH)"

# ---------- Remote deploy ----------
ssh -o StrictHostKeyChecking=yes -i ~/.ssh/id_ci -p "$SSH_PORT" \
  "$SSH_USER@$SSH_HOST" \
  "ENV_NAME='$ENV_NAME' APP_DIR='$APP_DIR' BRANCH='$BRANCH' SERVICE_NAME='$SERVICE_NAME' STAGE_RUN_NPM='$STAGE_RUN_NPM' DOTENV_CONTENT=\$'${DOTENV_CONTENT//$'\n'/\\n}' bash -l -s" <<'EOF'
set -euo pipefail

cd "$APP_DIR"

echo "→ Fetching code"
git fetch origin
git checkout "$BRANCH"
git pull origin "$BRANCH"

echo "→ Writing .env.local"
printf "%b" "$DOTENV_CONTENT" > .env.local
chmod 600 .env.local

echo "→ Stopping service"
sudo systemctl stop "$SERVICE_NAME" || true

# ---------- npm handling ----------
# if [[ "$ENV_NAME" == "stage" ]]; then
#   if [[ "${STAGE_RUN_NPM:-0}" == "1" ]]; then
#     echo "→ Stage: STAGE_RUN_NPM=1, installing dependencies (internet must be enabled)"
#     if [[ -f package-lock.json ]]; then
#       npm ci --no-audit --no-fund
#     else
#       npm install --no-audit --no-fund
#     fi
#   else
#     echo "→ Stage: STAGE_RUN_NPM=0, skipping npm install/ci"
#   fi
# else
#   echo "→ Dev: installing dependencies"
#   if [[ -f package-lock.json ]]; then
#     npm ci --no-audit --no-fund
#   else
#     npm install --no-audit --no-fund
#   fi
# fi

npm install

echo "→ Building app"
npm run build

echo "→ Starting service"
sudo systemctl start "$SERVICE_NAME"

echo "→ Service status"
sudo systemctl --no-pager status "$SERVICE_NAME" || true
EOF
