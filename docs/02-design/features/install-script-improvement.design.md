# install-script-improvement - Design Document

> Version: 1.0.0 | Date: 2026-02-15 | Status: Draft
> Level: Dynamic
> Plan: docs/01-plan/features/install-script-improvement.plan.md

---

## 1. Current State Analysis

### 1.1 install.sh (89 lines)

```
Step 1: git clone → .bkit-codex/
Step 2: symlink .bkit-codex/.agents/skills/* → .agents/skills/*
Step 3: copy AGENTS.md → project root
Step 4: create/append .codex/config.toml (MCP config)
Step 5: mkdir docs/{01-plan/features,02-design/features,03-analysis,04-report}
Step 6: append .gitignore
```

**Bugs Found:**
- Line 16: `cd "$INSTALL_DIR" && git pull && cd ..` — if git pull fails, `cd ..` still runs. If the initial `cd` fails, the script continues with wrong CWD due to `set -e` only catching the last command in `&&` chain.
- Line 50: `tool_timeout_sec = 30` — below official default of 60s.
- Line 26: Symlink uses relative path `../../$INSTALL_DIR/...` — correct for CWD but fragile if `.agents/skills/` is moved.

### 1.2 install.ps1 (101 lines)

Same 6-step flow but with Windows-specific patterns.

**Bugs Found:**
- Line 32: `cmd /c mklink /J $targetPath $skill.FullName` — uses absolute path (`$skill.FullName`). Directory junctions with absolute paths break if the project folder is moved or renamed.
- Line 87: `Add-Content ".gitignore" "`n# bkit-codex`n.bkit-codex/"` — this works correctly in PowerShell (backtick-n is newline), BUT:
- Line 90: `"# bkit-codex`n.bkit-codex/" | Set-Content ".gitignore"` — the backtick-n inside double quotes IS interpreted as newline by PowerShell. However, this creates a NEW .gitignore with only bkit-codex entry, losing the `node_modules/` and other common ignores that a user might expect.
- Line 63: `Set-Content $ConfigFile -Encoding UTF8` — in PowerShell 5.1 (Windows default), `-Encoding UTF8` adds a BOM (byte order mark). Codex's TOML parser should handle this, but other tools may not.
- Line 50: `tool_timeout_sec = 30` — same as SH issue.

### 1.3 .codex/config.toml (Current)

```toml
[mcp_servers.bkit]
command = "node"
args = ["./.bkit-codex/packages/mcp-server/index.js"]
startup_timeout_sec = 10
tool_timeout_sec = 30
required = true
```

**Issues:**
- `tool_timeout_sec = 30` → should be `60` (official default)
- Missing `enabled = true` (optional but explicit is better)
- Missing comment explaining the MCP server

### 1.4 scripts/validate-skills.js (189 lines)

Validates SKILL.md frontmatter and openai.yaml. Currently only validates skill structure, not installation integrity (symlinks, config).

---

## 2. Target Design

### 2.1 install.sh Improvements

```bash
#!/bin/bash
# install.sh - bkit-codex project installer
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/popup-studio-ai/bkit-codex/main/install.sh | bash
#   ./install.sh [--global] [--uninstall] [--version] [--help]

set -euo pipefail
```

#### 2.1.1 New Flags

| Flag | Behavior |
|------|----------|
| `--global` | Install to `~/.agents/skills/` and `~/.codex/config.toml` instead of project-level |
| `--uninstall` | Remove bkit-codex installation cleanly |
| `--version` | Display installed version (from package.json) |
| `--help` | Show usage information |
| (no flag) | Project-level install (current behavior, improved) |

#### 2.1.2 Argument Parsing

```bash
MODE="project"  # project | global | uninstall | version | help

while [[ $# -gt 0 ]]; do
  case "$1" in
    --global)   MODE="global"; shift ;;
    --uninstall) MODE="uninstall"; shift ;;
    --version)  MODE="version"; shift ;;
    --help|-h)  MODE="help"; shift ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done
```

#### 2.1.3 Color Output

```bash
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info()  { echo -e "${BLUE}[INFO]${NC} $1"; }
ok()    { echo -e "${GREEN}[OK]${NC}   $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
fail()  { echo -e "${RED}[FAIL]${NC} $1"; }
```

#### 2.1.4 Path Resolution by Mode

```bash
if [ "$MODE" = "global" ]; then
  SKILLS_DIR="$HOME/.agents/skills"
  CONFIG_FILE="$HOME/.codex/config.toml"
  INSTALL_DIR="$HOME/.bkit-codex"
else
  SKILLS_DIR=".agents/skills"
  CONFIG_FILE=".codex/config.toml"
  INSTALL_DIR=".bkit-codex"
fi
```

#### 2.1.5 Fix: Safe Update (SH-05)

```bash
# BEFORE (broken):
cd "$INSTALL_DIR" && git pull && cd ..

# AFTER (safe):
git -C "$INSTALL_DIR" pull --ff-only
```

#### 2.1.6 Fix: tool_timeout_sec (SH-01)

```toml
[mcp_servers.bkit]
command = "node"
args = ["./.bkit-codex/packages/mcp-server/index.js"]
startup_timeout_sec = 10
tool_timeout_sec = 60
required = true
```

#### 2.1.7 New: Post-Install Validation (SH-03, SH-04)

```bash
validate_install() {
  local errors=0

  # Check symlinks resolve
  for skill in "$SKILLS_DIR"/*/; do
    if [ -L "$skill" ] && [ ! -e "$skill" ]; then
      fail "Broken symlink: $skill"
      errors=$((errors + 1))
    fi
  done

  # Check SKILL.md exists in each skill
  for skill in "$SKILLS_DIR"/*/; do
    if [ ! -f "${skill}SKILL.md" ]; then
      fail "Missing SKILL.md in: $(basename "$skill")"
      errors=$((errors + 1))
    fi
  done

  # Check MCP server responds
  local mcp_path
  if [ "$MODE" = "global" ]; then
    mcp_path="$HOME/.bkit-codex/packages/mcp-server/index.js"
  else
    mcp_path=".bkit-codex/packages/mcp-server/index.js"
  fi

  if [ -f "$mcp_path" ]; then
    local response
    response=$(echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","clientInfo":{"name":"test","version":"1.0.0"}}}' | \
      timeout 5 node "$mcp_path" 2>/dev/null | head -1)
    if echo "$response" | grep -q "protocolVersion"; then
      ok "MCP server responds correctly"
    else
      warn "MCP server did not respond (may need node >= 18)"
    fi
  fi

  # Check config.toml
  if grep -q "mcp_servers.bkit" "$CONFIG_FILE" 2>/dev/null; then
    ok "MCP configuration present in $CONFIG_FILE"
  else
    fail "MCP configuration missing from $CONFIG_FILE"
    errors=$((errors + 1))
  fi

  return $errors
}
```

#### 2.1.8 New: Version Tracking (SH-06)

```bash
# After clone/pull, save version
VERSION=$(node -e "console.log(require('./$INSTALL_DIR/packages/mcp-server/package.json').version)" 2>/dev/null || echo "unknown")
echo "$VERSION" > "$INSTALL_DIR/.installed-version"

show_version() {
  if [ -f "$INSTALL_DIR/.installed-version" ]; then
    echo "bkit-codex v$(cat "$INSTALL_DIR/.installed-version")"
  else
    echo "bkit-codex: not installed"
  fi
}
```

#### 2.1.9 New: AGENTS.md Smart Update (CM-05)

```bash
# Compare version hashes to detect changes
current_hash=""
if [ -f "AGENTS.md" ]; then
  current_hash=$(md5sum "AGENTS.md" 2>/dev/null | cut -d' ' -f1 || md5 -q "AGENTS.md" 2>/dev/null)
fi
source_hash=$(md5sum "$INSTALL_DIR/AGENTS.md" 2>/dev/null | cut -d' ' -f1 || md5 -q "$INSTALL_DIR/AGENTS.md" 2>/dev/null)

if [ ! -f "AGENTS.md" ]; then
  cp "$INSTALL_DIR/AGENTS.md" "AGENTS.md"
  ok "Created: AGENTS.md"
elif [ "$current_hash" != "$source_hash" ]; then
  warn "AGENTS.md differs from source (use --force to overwrite)"
else
  ok "AGENTS.md is up to date"
fi
```

#### 2.1.10 New: Uninstall (SH-07)

```bash
do_uninstall() {
  info "Uninstalling bkit-codex..."

  # Remove skill symlinks
  if [ -d "$SKILLS_DIR" ]; then
    for skill in "$SKILLS_DIR"/*/; do
      if [ -L "$skill" ]; then
        local target
        target=$(readlink "$skill")
        if echo "$target" | grep -q "bkit-codex"; then
          rm "$skill"
          ok "Removed symlink: $(basename "$skill")"
        fi
      fi
    done
    # Remove .agents/skills if empty
    rmdir "$SKILLS_DIR" 2>/dev/null && rmdir ".agents" 2>/dev/null || true
  fi

  # Remove MCP config entry
  if [ -f "$CONFIG_FILE" ]; then
    # Remove [mcp_servers.bkit] section
    local tmp_file
    tmp_file=$(mktemp)
    awk '/^\[mcp_servers\.bkit\]/{skip=1; next} /^\[/{skip=0} !skip' "$CONFIG_FILE" > "$tmp_file"
    mv "$tmp_file" "$CONFIG_FILE"
    ok "Removed MCP config from $CONFIG_FILE"
    # Remove config.toml if empty
    if [ ! -s "$CONFIG_FILE" ]; then
      rm "$CONFIG_FILE"
      rmdir ".codex" 2>/dev/null || true
    fi
  fi

  # Remove clone directory
  if [ -d "$INSTALL_DIR" ]; then
    rm -rf "$INSTALL_DIR"
    ok "Removed: $INSTALL_DIR"
  fi

  # Note: AGENTS.md, docs/, .gitignore left untouched (user data)
  warn "AGENTS.md, docs/, .gitignore left intact (may contain user data)"
  info "Uninstall complete"
}
```

---

### 2.2 install.ps1 Improvements

#### 2.2.1 Fix: Junction Relative Paths (PS-03)

```powershell
# BEFORE (absolute path - breaks on move):
cmd /c mklink /J $targetPath $skill.FullName

# AFTER (relative path via symbolic link):
# PowerShell 5+ supports New-Item -ItemType SymbolicLink with relative targets
$relativePath = [System.IO.Path]::GetRelativePath(
    (Split-Path $targetPath -Parent),
    $skill.FullName
)
# Fallback: use junction with absolute path + warn
try {
    New-Item -ItemType SymbolicLink -Path $targetPath -Target $relativePath -ErrorAction Stop | Out-Null
} catch {
    # SymbolicLink requires admin on some Windows versions, fallback to junction
    cmd /c mklink /J $targetPath $skill.FullName 2>$null
    Write-Host "  [WARN] Used absolute junction (may break if project moves)" -ForegroundColor Yellow
}
```

#### 2.2.2 Fix: .gitignore Content (PS-04)

```powershell
# BEFORE (line 90 - creates file with single entry):
"# bkit-codex`n.bkit-codex/" | Set-Content ".gitignore" -Encoding UTF8

# AFTER (proper multi-line content):
@("# bkit-codex", ".bkit-codex/") | Set-Content ".gitignore" -NoNewline:$false -Encoding UTF8NoBOM
```

#### 2.2.3 Fix: UTF-8 Encoding Without BOM (PS-06)

```powershell
# PowerShell 5.1 compatibility: -Encoding UTF8 adds BOM
# Solution: Use .NET directly for BOM-free UTF-8
function Set-Utf8Content {
    param([string]$Path, [string]$Content)
    [System.IO.File]::WriteAllText(
        (Resolve-Path $Path -ErrorAction SilentlyContinue ?? $Path),
        $Content,
        [System.Text.UTF8Encoding]::new($false)
    )
}

# Or for PS 7+:
# Set-Content -Encoding utf8NoBOM
```

#### 2.2.4 Fix: tool_timeout_sec (PS-01)

Same as install.sh — change `tool_timeout_sec = 30` to `tool_timeout_sec = 60`.

#### 2.2.5 New: Flag Support

```powershell
param(
    [switch]$Global,
    [switch]$Uninstall,
    [switch]$Version,
    [switch]$Help
)

# When piped via iex, params aren't available. Detect via args:
if ($args -contains "--global")    { $Global = $true }
if ($args -contains "--uninstall") { $Uninstall = $true }
if ($args -contains "--version")   { $Version = $true }
if ($args -contains "--help")      { $Help = $true }
```

#### 2.2.6 New: Color Output

```powershell
function Write-Info  { Write-Host "[INFO] $args" -ForegroundColor Cyan }
function Write-Ok    { Write-Host "[OK]   $args" -ForegroundColor Green }
function Write-Warn  { Write-Host "[WARN] $args" -ForegroundColor Yellow }
function Write-Fail  { Write-Host "[FAIL] $args" -ForegroundColor Red }
```

---

### 2.3 uninstall.sh Design

```bash
#!/bin/bash
# uninstall.sh - Remove bkit-codex from the current project
# Usage: bash .bkit-codex/uninstall.sh [--global]
set -euo pipefail

# Reuse install.sh --uninstall logic
# This file is a convenience wrapper
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec bash "$(dirname "$SCRIPT_DIR")/install.sh" --uninstall "$@"
```

Actual uninstall logic lives in install.sh (--uninstall flag) to avoid code duplication.

### 2.4 uninstall.ps1 Design

Same pattern — delegates to `install.ps1 -Uninstall`.

---

### 2.5 Test Script Design

#### 2.5.1 tests/install/install-test.sh

```bash
#!/bin/bash
# Automated install script verification
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
PASS=0
FAIL=0

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
assert_link() { assert "$1 is valid symlink" test -L "$2" -a -e "$2"; }
assert_grep() { assert "$1" grep -q "$3" "$2"; }

# ============ Test 1: Fresh Project Install ============
echo "=== Test 1: Fresh Project Install ==="
TMPDIR=$(mktemp -d)
cd "$TMPDIR"
git init -q

# Copy install script (simulate curl | bash)
bash "$REPO_ROOT/install.sh"

assert_dir  ".bkit-codex clone"        ".bkit-codex"
assert_dir  ".agents/skills"           ".agents/skills"
assert_file "AGENTS.md"                "AGENTS.md"
assert_file "config.toml"              ".codex/config.toml"
assert_grep "MCP config has bkit"      ".codex/config.toml" "mcp_servers.bkit"
assert_grep "tool_timeout is 60"       ".codex/config.toml" "tool_timeout_sec = 60"
assert_dir  "PDCA plan dir"            "docs/01-plan/features"
assert_dir  "PDCA design dir"          "docs/02-design/features"
assert_dir  "PDCA analysis dir"        "docs/03-analysis"
assert_dir  "PDCA report dir"          "docs/04-report"
assert_grep ".gitignore has bkit"      ".gitignore" ".bkit-codex/"

# Check all 26 skill symlinks
SKILL_COUNT=$(ls -1d .agents/skills/*/ 2>/dev/null | wc -l | tr -d ' ')
assert "26 skills linked" test "$SKILL_COUNT" -eq 26

# Check symlinks are valid
for skill in .agents/skills/*/; do
  skill_name=$(basename "$skill")
  assert_link "Symlink $skill_name"    "$skill"
  assert_file "SKILL.md in $skill_name" "${skill}SKILL.md"
done

# Check MCP server responds
MCP_RESPONSE=$(echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","clientInfo":{"name":"test","version":"1.0.0"}}}' | \
  timeout 5 node .bkit-codex/packages/mcp-server/index.js 2>/dev/null | head -1 || echo "")
assert "MCP server responds" echo "$MCP_RESPONSE" | grep -q "protocolVersion"

# Check version file
assert_file "Version file" ".bkit-codex/.installed-version"

rm -rf "$TMPDIR"

# ============ Test 2: Idempotent Re-Install ============
echo ""
echo "=== Test 2: Idempotent Re-Install ==="
TMPDIR=$(mktemp -d)
cd "$TMPDIR"
git init -q

bash "$REPO_ROOT/install.sh"
bash "$REPO_ROOT/install.sh"  # Second run

# Should not duplicate config entries
MCP_COUNT=$(grep -c "mcp_servers.bkit" .codex/config.toml)
assert "No duplicate MCP config" test "$MCP_COUNT" -eq 1

# Skills should still be valid
for skill in .agents/skills/*/; do
  assert_link "Re-install: $(basename "$skill")" "$skill"
done

rm -rf "$TMPDIR"

# ============ Test 3: Existing config.toml ============
echo ""
echo "=== Test 3: Existing config.toml ==="
TMPDIR=$(mktemp -d)
cd "$TMPDIR"
git init -q

# Pre-existing config
mkdir -p .codex
cat > .codex/config.toml << 'EXISTING'
model = "gpt-5.2-codex"

[mcp_servers.other]
command = "other-server"
EXISTING

bash "$REPO_ROOT/install.sh"

assert_grep "Preserves existing model"  ".codex/config.toml" 'model = "gpt-5.2-codex"'
assert_grep "Preserves other MCP"       ".codex/config.toml" "mcp_servers.other"
assert_grep "Adds bkit MCP"             ".codex/config.toml" "mcp_servers.bkit"

rm -rf "$TMPDIR"

# ============ Test 4: Existing AGENTS.md ============
echo ""
echo "=== Test 4: Existing AGENTS.md ==="
TMPDIR=$(mktemp -d)
cd "$TMPDIR"
git init -q

echo "# My Custom Instructions" > AGENTS.md

bash "$REPO_ROOT/install.sh"

assert_grep "Preserves user AGENTS.md" "AGENTS.md" "My Custom Instructions"

rm -rf "$TMPDIR"

# ============ Test 5: Uninstall ============
echo ""
echo "=== Test 5: Uninstall ==="
TMPDIR=$(mktemp -d)
cd "$TMPDIR"
git init -q

bash "$REPO_ROOT/install.sh"
bash "$REPO_ROOT/install.sh" --uninstall

assert "No .bkit-codex dir"     test ! -d ".bkit-codex"
assert "No skill symlinks"      test ! -d ".agents/skills" -o -z "$(ls .agents/skills/ 2>/dev/null)"
assert "AGENTS.md preserved"    test -f "AGENTS.md"
assert "docs/ preserved"        test -d "docs"

rm -rf "$TMPDIR"

# ============ Test 6: Global Install ============
echo ""
echo "=== Test 6: Global Install (simulated) ==="
# Skip if HOME is not writable or in CI without permission
if [ "${CI:-}" = "true" ]; then
  echo "  SKIP: Global install test skipped in CI"
else
  echo "  SKIP: Global install requires manual verification"
fi

# ============ Summary ============
echo ""
echo "================================="
echo "Results: $PASS passed, $FAIL failed"
echo "================================="

[ "$FAIL" -eq 0 ] && exit 0 || exit 1
```

#### 2.5.2 .github/workflows/test-install.yml

```yaml
name: Test Install Scripts
on:
  push:
    paths:
      - 'install.sh'
      - 'install.ps1'
      - 'tests/install/**'
  pull_request:
    paths:
      - 'install.sh'
      - 'install.ps1'
      - 'tests/install/**'

jobs:
  test-unix:
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Run install tests
        run: bash tests/install/install-test.sh

  test-skills-validation:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Validate skills
        run: node scripts/validate-skills.js
```

---

## 3. File-by-File Change Specification

### 3.1 install.sh (Full Rewrite)

| Section | Lines (est.) | Changes |
|---------|:----------:|---------|
| Header & flags | 1-30 | Add `set -euo pipefail`, argument parsing, help text |
| Color helpers | 31-40 | New: info/ok/warn/fail functions |
| Path resolution | 41-55 | New: project vs global mode paths |
| Clone/update | 56-75 | Fix: `git -C` instead of `cd`, add version tracking |
| Skill symlinks | 76-105 | Keep: existing logic, add validation |
| AGENTS.md | 106-125 | Fix: hash comparison for smart update |
| MCP config | 126-160 | Fix: `tool_timeout_sec = 60`, add comment |
| PDCA dirs | 161-170 | Keep: unchanged |
| .gitignore | 171-185 | Keep: unchanged |
| Post-validation | 186-230 | New: validate_install function |
| Uninstall | 231-280 | New: do_uninstall function |
| Main dispatch | 281-300 | New: mode switch (project/global/uninstall/version/help) |

**Estimated: ~300 lines** (from current 89)

### 3.2 install.ps1 (Full Rewrite)

| Section | Lines (est.) | Changes |
|---------|:----------:|---------|
| Header & params | 1-25 | Add param block, args detection |
| Color helpers | 26-35 | New: Write-Info/Ok/Warn/Fail |
| UTF-8 helper | 36-45 | New: Set-Utf8Content for BOM-free writes |
| Path resolution | 46-60 | New: project vs global mode |
| Clone/update | 61-80 | Same git logic |
| Skill links | 81-110 | Fix: prefer SymbolicLink, fallback to Junction |
| AGENTS.md | 111-130 | Fix: hash comparison |
| MCP config | 131-165 | Fix: timeout, BOM-free encoding |
| PDCA dirs | 166-175 | Keep: unchanged |
| .gitignore | 176-195 | Fix: proper array-based multi-line content |
| Post-validation | 196-240 | New: validation |
| Uninstall | 241-280 | New: uninstall |
| Main dispatch | 281-300 | New: mode switch |

**Estimated: ~300 lines** (from current 101)

### 3.3 New Files

| File | Lines (est.) | Purpose |
|------|:----------:|---------|
| `uninstall.sh` | 10 | Wrapper → `install.sh --uninstall` |
| `uninstall.ps1` | 10 | Wrapper → `install.ps1 -Uninstall` |
| `tests/install/install-test.sh` | 180 | 6 test suites, ~40 assertions |
| `.github/workflows/test-install.yml` | 30 | CI on push/PR for install files |

### 3.4 Modified Files

| File | Change |
|------|--------|
| `.codex/config.toml` | `tool_timeout_sec = 30` → `60` |
| `packages/mcp-server/package.json` | No change needed (version already exists) |

---

## 4. Implementation Order

```
Step 1: Fix .codex/config.toml (1 line change)
Step 2: Rewrite install.sh with all improvements
Step 3: Rewrite install.ps1 with all improvements
Step 4: Create uninstall wrapper scripts
Step 5: Create install-test.sh
Step 6: Create CI workflow
Step 7: Run tests locally to verify
```

---

## 5. Compatibility Matrix

| OS | Shell | Install | Global | Uninstall | Test |
|----|-------|:-------:|:------:|:---------:|:----:|
| macOS | bash/zsh | Yes | Yes | Yes | Yes |
| Ubuntu 22+ | bash | Yes | Yes | Yes | Yes (CI) |
| Windows 10+ | PowerShell 5.1 | Yes | Yes | Yes | Manual |
| Windows 10+ | PowerShell 7+ | Yes | Yes | Yes | Manual |

---

## 6. Breaking Changes

None. All changes are backward-compatible:
- `install.sh` without flags behaves identically to current version (except fixed timeout and added validation output)
- `install.ps1` without flags behaves identically (except fixed junction type and encoding)
- Existing installations can be updated by re-running install script
