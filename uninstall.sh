#!/bin/bash
# uninstall.sh - Remove bkit-codex from the current project
# Usage: bash uninstall.sh [--global]
set -euo pipefail

# Reuse install.sh --uninstall logic (avoid code duplication)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec bash "$SCRIPT_DIR/install.sh" --uninstall "$@"
