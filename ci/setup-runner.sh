#!/usr/bin/env bash
set -euo pipefail

# Generic GitHub self-hosted runner setup script.
# Run this directly on any server where you want a runner.
#
# It will:
#   - Ask you for the GitHub repo URL
#   - Ask for a runner name
#   - Ask for labels (e.g. "self-hosted,dev" or "self-hosted,stage")
#   - Ask for an install directory (default: $HOME/actions-runner)
#   - Ask for the GitHub runner registration token (once)
#   - Download, configure and install the runner as a service
#
# You can reuse this same script on dev, stage, or prod machines.

echo "=== GitHub Self-Hosted Runner Setup ==="

read -rp "GitHub repository URL (e.g. https://github.com/OWNER/REPO): " GITHUB_URL
if [[ -z "$GITHUB_URL" ]]; then
  echo "GitHub URL is required."
  exit 1
fi

default_name="$(hostname)-runner"
read -rp "Runner name [${default_name}]: " RUNNER_NAME
RUNNER_NAME="${RUNNER_NAME:-$default_name}"

read -rp "Runner labels (comma-separated, e.g. self-hosted,dev): " RUNNER_LABELS
if [[ -z "$RUNNER_LABELS" ]]; then
  RUNNER_LABELS="self-hosted"
fi

default_install_dir="$HOME/actions-runner"
read -rp "Install directory [${default_install_dir}]: " INSTALL_DIR
INSTALL_DIR="${INSTALL_DIR:-$default_install_dir}"

echo
read -rs -p "GitHub runner registration token (from GitHub UI): " REG_TOKEN
echo
if [[ -z "$REG_TOKEN" ]]; then
  echo "Registration token is required."
  exit 1
fi

RUNNER_WORK_DIR="_work"

echo
echo "Summary:"
echo "  Repo URL     : $GITHUB_URL"
echo "  Runner name  : $RUNNER_NAME"
echo "  Labels       : $RUNNER_LABELS"
echo "  Install dir  : $INSTALL_DIR"
echo
read -rp "Proceed with installation? [y/N]: " CONFIRM
case "$CONFIRM" in
  y|Y|yes|YES) ;;
  *) echo "Aborted."; exit 0 ;;
esac

echo "→ Creating install dir at: $INSTALL_DIR"
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

echo "→ Downloading latest GitHub Actions runner..."
LATEST_URL="https://api.github.com/repos/actions/runner/releases/latest"
RUNNER_URL=$(curl -fsSL "$LATEST_URL" | grep browser_download_url | grep linux-x64 | cut -d '"' -f 4)

if [[ -z "$RUNNER_URL" ]]; then
  echo "Failed to determine latest runner download URL."
  exit 1
fi

curl -fsSL "$RUNNER_URL" -o actions-runner-linux-x64.tar.gz
tar xzf actions-runner-linux-x64.tar.gz

echo "→ Configuring runner..."

# Allow running as root (GitHub runner normally forbids this unless explicitly enabled).
export RUNNER_ALLOW_RUNASROOT=1

./config.sh \
  --unattended \
  --url "$GITHUB_URL" \
  --token "$REG_TOKEN" \
  --name "$RUNNER_NAME" \
  --labels "$RUNNER_LABELS" \
  --work "$RUNNER_WORK_DIR"

echo "→ Installing runner as a service..."
sudo ./svc.sh install
sudo ./svc.sh start

echo "→ Runner installation complete."
echo "This machine is now registered as a self-hosted runner."

