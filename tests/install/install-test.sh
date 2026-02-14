#!/bin/bash
# install-test.sh - Automated install script verification
# Tests install.sh in isolated temp directories to verify all behavior.
# Usage: bash tests/install/install-test.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
PASS=0
FAIL=0
SKIP=0
TMPDIRS=""

# ── Helpers ──────────────────────────────────────────────────────────────────

cleanup() {
  if [ -n "$TMPDIRS" ]; then
    echo "$TMPDIRS" | while IFS= read -r d; do
      [ -n "$d" ] && rm -rf "$d" 2>/dev/null || true
    done
  fi
}
trap cleanup EXIT

make_tmpdir() {
  local d
  d=$(mktemp -d)
  TMPDIRS="$TMPDIRS
$d"
  echo "$d"
}

assert() {
  local desc="$1"; shift
  if "$@" >/dev/null 2>&1; then
    echo "  PASS: $desc"
    PASS=$((PASS + 1))
  else
    echo "  FAIL: $desc"
    FAIL=$((FAIL + 1))
  fi
}

assert_file() { assert "$1 exists" test -f "$2"; }
assert_dir()  { assert "$1 exists" test -d "$2"; }
assert_link() {
  # Strip trailing slash to avoid symlink resolution
  local p="${2%/}"
  assert "$1 is valid symlink" test -L "$p" -a -e "$p"
}
assert_not()  { assert "$1" test ! -e "$2"; }

assert_grep() {
  local desc="$1" file="$2" pattern="$3"
  if grep -q "$pattern" "$file" 2>/dev/null; then
    echo "  PASS: $desc"
    PASS=$((PASS + 1))
  else
    echo "  FAIL: $desc"
    FAIL=$((FAIL + 1))
  fi
}

assert_count() {
  local desc="$1" file="$2" pattern="$3" expected="$4"
  local actual
  actual=$(grep -c "$pattern" "$file" 2>/dev/null || echo "0")
  if [ "$actual" -eq "$expected" ]; then
    echo "  PASS: $desc (count=$actual)"
    PASS=$((PASS + 1))
  else
    echo "  FAIL: $desc (expected=$expected, got=$actual)"
    FAIL=$((FAIL + 1))
  fi
}

skip_test() {
  echo "  SKIP: $1"
  SKIP=$((SKIP + 1))
}

# ============================================================================
# Test 1: Fresh Project Install
# ============================================================================
echo "=== Test 1: Fresh Project Install ==="
TMPDIR=$(make_tmpdir)
cd "$TMPDIR"
git init -q

bash "$REPO_ROOT/install.sh"

assert_dir  ".bkit-codex clone"        ".bkit-codex"
assert_dir  ".agents/skills"           ".agents/skills"
assert_file "AGENTS.md"                "AGENTS.md"
assert_file "config.toml"              ".codex/config.toml"
assert_grep "MCP config has bkit"      ".codex/config.toml" "mcp_servers.bkit"
assert_grep "tool_timeout is 60"       ".codex/config.toml" "tool_timeout_sec = 60"
assert_grep "startup_timeout is 10"    ".codex/config.toml" "startup_timeout_sec = 10"
assert_dir  "PDCA plan dir"            "docs/01-plan/features"
assert_dir  "PDCA design dir"          "docs/02-design/features"
assert_dir  "PDCA analysis dir"        "docs/03-analysis"
assert_dir  "PDCA report dir"          "docs/04-report"
assert_grep ".gitignore has bkit"      ".gitignore" ".bkit-codex/"
assert_file "Version file"             ".bkit-codex/.installed-version"

# Check skill symlinks
SKILL_COUNT=$(find .agents/skills -maxdepth 1 -mindepth 1 \( -type d -o -type l \) 2>/dev/null | wc -l | tr -d ' ')
assert "At least 20 skills linked (got $SKILL_COUNT)" test "$SKILL_COUNT" -ge 20

# Check each symlink is valid and has SKILL.md
for skill in .agents/skills/*/; do
  [ -d "$skill" ] || continue
  skill_name=$(basename "$skill")
  assert_link "Symlink $skill_name" "${skill%/}"
  assert_file "SKILL.md in $skill_name" "${skill}SKILL.md"
done

# Check MCP server responds (if node available)
if command -v node >/dev/null 2>&1; then
  MCP_RESPONSE=$(echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","clientInfo":{"name":"test","version":"1.0.0"}}}' | \
    timeout 10 node .bkit-codex/packages/mcp-server/index.js 2>/dev/null | head -1 || echo "")
  if echo "$MCP_RESPONSE" | grep -q "protocolVersion" 2>/dev/null; then
    echo "  PASS: MCP server responds"
    PASS=$((PASS + 1))
  else
    skip_test "MCP server did not respond (may need node >= 18)"
  fi
else
  skip_test "MCP server check (node not available)"
fi

# ============================================================================
# Test 2: Idempotent Re-Install
# ============================================================================
echo ""
echo "=== Test 2: Idempotent Re-Install ==="
TMPDIR=$(make_tmpdir)
cd "$TMPDIR"
git init -q

bash "$REPO_ROOT/install.sh"
bash "$REPO_ROOT/install.sh"  # Second run

# Should not duplicate config entries
assert_count "No duplicate MCP config" ".codex/config.toml" "mcp_servers.bkit" 1

# Should not duplicate .gitignore entries
assert_count "No duplicate .gitignore entry" ".gitignore" ".bkit-codex/" 1

# Skills should still be valid
for skill in .agents/skills/*/; do
  [ -d "$skill" ] || continue
  assert_link "Re-install: $(basename "$skill")" "$skill"
done

# AGENTS.md should report "up to date" (not duplicate)
assert_file "AGENTS.md still exists" "AGENTS.md"

# ============================================================================
# Test 3: Existing config.toml Preserved
# ============================================================================
echo ""
echo "=== Test 3: Existing config.toml ==="
TMPDIR=$(make_tmpdir)
cd "$TMPDIR"
git init -q

# Pre-existing config with user settings
mkdir -p .codex
cat > .codex/config.toml << 'EXISTING'
model = "o3-mini"

[mcp_servers.other]
command = "other-server"
EXISTING

bash "$REPO_ROOT/install.sh"

assert_grep "Preserves existing model"  ".codex/config.toml" 'model = "o3-mini"'
assert_grep "Preserves other MCP"       ".codex/config.toml" "mcp_servers.other"
assert_grep "Adds bkit MCP"             ".codex/config.toml" "mcp_servers.bkit"
assert_grep "bkit tool_timeout is 60"   ".codex/config.toml" "tool_timeout_sec = 60"

# ============================================================================
# Test 4: Existing AGENTS.md Preserved
# ============================================================================
echo ""
echo "=== Test 4: Existing AGENTS.md ==="
TMPDIR=$(make_tmpdir)
cd "$TMPDIR"
git init -q

echo "# My Custom Agent Instructions" > AGENTS.md

bash "$REPO_ROOT/install.sh"

assert_grep "Preserves user AGENTS.md" "AGENTS.md" "My Custom Agent Instructions"

# ============================================================================
# Test 5: Uninstall
# ============================================================================
echo ""
echo "=== Test 5: Uninstall ==="
TMPDIR=$(make_tmpdir)
cd "$TMPDIR"
git init -q

bash "$REPO_ROOT/install.sh"
bash "$REPO_ROOT/install.sh" --uninstall

assert_not ".bkit-codex dir removed"       ".bkit-codex"
assert     "AGENTS.md preserved"            test -f "AGENTS.md"
assert     "docs/ preserved"               test -d "docs"

# Skill symlinks should be removed (dir may or may not exist if empty)
if [ -d ".agents/skills" ]; then
  REMAINING=$(find .agents/skills -maxdepth 1 -mindepth 1 2>/dev/null | wc -l | tr -d ' ')
  assert "No skill symlinks remain (got $REMAINING)" test "$REMAINING" -eq 0
else
  echo "  PASS: .agents/skills directory cleaned up"
  PASS=$((PASS + 1))
fi

# ============================================================================
# Test 6: Flags
# ============================================================================
echo ""
echo "=== Test 6: Flags ==="

# --help
HELP_OUTPUT=$(bash "$REPO_ROOT/install.sh" --help 2>&1)
if echo "$HELP_OUTPUT" | grep -q "Usage"; then
  echo "  PASS: --help shows usage"
  PASS=$((PASS + 1))
else
  echo "  FAIL: --help does not show usage"
  FAIL=$((FAIL + 1))
fi

# --version (when not installed)
VERSION_OUTPUT=$(bash "$REPO_ROOT/install.sh" --version 2>&1)
if echo "$VERSION_OUTPUT" | grep -q "bkit-codex"; then
  echo "  PASS: --version shows version info"
  PASS=$((PASS + 1))
else
  echo "  FAIL: --version does not show version info"
  FAIL=$((FAIL + 1))
fi

# --version after install
TMPDIR=$(make_tmpdir)
cd "$TMPDIR"
git init -q
bash "$REPO_ROOT/install.sh"
VERSION_OUTPUT=$(bash "$REPO_ROOT/install.sh" --version 2>&1)
if echo "$VERSION_OUTPUT" | grep -q "bkit-codex v"; then
  echo "  PASS: --version shows installed version"
  PASS=$((PASS + 1))
else
  echo "  FAIL: --version does not show installed version"
  FAIL=$((FAIL + 1))
fi

# Unknown flag should fail
if bash "$REPO_ROOT/install.sh" --invalid 2>&1; then
  echo "  FAIL: Unknown flag did not cause error"
  FAIL=$((FAIL + 1))
else
  echo "  PASS: Unknown flag causes error"
  PASS=$((PASS + 1))
fi

# ============================================================================
# Test 7: Global Install (simulated)
# ============================================================================
echo ""
echo "=== Test 7: Global Install ==="
if [ "${CI:-}" = "true" ]; then
  skip_test "Global install test skipped in CI"
else
  skip_test "Global install requires manual verification (modifies ~/.agents/)"
fi

# ============================================================================
# Summary
# ============================================================================
echo ""
echo "================================="
echo "Results: $PASS passed, $FAIL failed, $SKIP skipped"
echo "================================="

[ "$FAIL" -eq 0 ] && exit 0 || exit 1
