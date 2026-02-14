#!/bin/bash
# install.sh - bkit-codex project installer
# Installs bkit-codex into the current project directory.
# Usage: curl -fsSL https://raw.githubusercontent.com/popup-studio-ai/bkit-codex/main/install.sh | bash

set -e

REPO="popup-studio-ai/bkit-codex"
INSTALL_DIR=".bkit-codex"

echo "Installing bkit-codex..."

# 1. Clone repository
if [ -d "$INSTALL_DIR" ]; then
  echo "Updating existing installation..."
  cd "$INSTALL_DIR" && git pull && cd ..
else
  git clone --depth 1 "https://github.com/$REPO.git" "$INSTALL_DIR"
fi

# 2. Create skill symlinks
mkdir -p .agents/skills
for skill_dir in "$INSTALL_DIR/.agents/skills"/*/; do
  skill_name=$(basename "$skill_dir")
  if [ ! -L ".agents/skills/$skill_name" ]; then
    ln -sf "../../$INSTALL_DIR/.agents/skills/$skill_name" ".agents/skills/$skill_name"
    echo "  Linked: $skill_name"
  fi
done

# 3. Create/update AGENTS.md (append if exists)
if [ ! -f "AGENTS.md" ]; then
  cp "$INSTALL_DIR/AGENTS.md" "AGENTS.md"
  echo "  Created: AGENTS.md"
else
  echo "  AGENTS.md already exists (skipped)"
fi

# 4. Configure MCP server in config.toml
CONFIG_DIR=".codex"
mkdir -p "$CONFIG_DIR"
CONFIG_FILE="$CONFIG_DIR/config.toml"

if [ ! -f "$CONFIG_FILE" ]; then
  cat > "$CONFIG_FILE" << 'EOF'
[mcp_servers.bkit]
command = "node"
args = ["./.bkit-codex/packages/mcp-server/index.js"]
startup_timeout_sec = 10
tool_timeout_sec = 30
required = true
EOF
  echo "  Created: $CONFIG_FILE"
elif ! grep -q "mcp_servers.bkit" "$CONFIG_FILE" 2>/dev/null; then
  cat >> "$CONFIG_FILE" << 'EOF'

[mcp_servers.bkit]
command = "node"
args = ["./.bkit-codex/packages/mcp-server/index.js"]
startup_timeout_sec = 10
tool_timeout_sec = 30
required = true
EOF
  echo "  Updated: $CONFIG_FILE"
fi

# 5. Initialize PDCA directories
mkdir -p docs/01-plan/features
mkdir -p docs/02-design/features
mkdir -p docs/03-analysis
mkdir -p docs/04-report

# 6. Add to .gitignore
if [ -f ".gitignore" ]; then
  if ! grep -q ".bkit-codex/" ".gitignore" 2>/dev/null; then
    printf "\n# bkit-codex\n.bkit-codex/\n" >> ".gitignore"
  fi
else
  printf "# bkit-codex\n.bkit-codex/\n" > ".gitignore"
fi

echo ""
echo "bkit-codex installed successfully!"
echo "  Skills: $(ls .agents/skills/ | wc -l | tr -d ' ') linked"
echo "  MCP Server: configured in $CONFIG_FILE"
echo "  PDCA Docs: docs/ directory ready"
echo ""
echo "Start Codex and type \$pdca to begin!"
