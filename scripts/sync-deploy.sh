#!/bin/bash
# Sync development files to .bkit-codex/ deployment directory
set -euo pipefail

DEPLOY_DIR=".bkit-codex"
SRC_DIR="."

echo "[SYNC] Syncing to $DEPLOY_DIR..."

# Ensure deploy dir exists
mkdir -p "$DEPLOY_DIR/packages/mcp-server"
mkdir -p "$DEPLOY_DIR/.agents/skills"

# Sync packages
rsync -av --delete \
  "$SRC_DIR/packages/mcp-server/" \
  "$DEPLOY_DIR/packages/mcp-server/" \
  --exclude node_modules

# Sync skills
rsync -av --delete \
  "$SRC_DIR/.agents/skills/" \
  "$DEPLOY_DIR/.agents/skills/"

# Sync root config files
for f in agents.global.md AGENTS.md bkit.config.json; do
  if [ -f "$SRC_DIR/$f" ]; then
    cp "$SRC_DIR/$f" "$DEPLOY_DIR/$f"
  fi
done

echo "[SYNC] Done."
