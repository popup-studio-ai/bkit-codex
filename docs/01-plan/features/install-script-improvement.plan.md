# install-script-improvement - Install Script Improvement Plan

> Version: 1.0.0 | Date: 2026-02-15 | Status: Draft
> Level: Dynamic
> Platform: OpenAI Codex CLI

---

## 1. Overview

### 1.1 Purpose

Improve install.sh and install.ps1 to align with OpenAI Codex CLI official conventions, fix discovered bugs, add missing features, and create automated installation tests for CI verification.

### 1.2 Background

Deep investigation of Codex CLI official documentation, GitHub issues, and third-party skill repositories revealed several gaps between bkit-codex's install scripts and official standards:

- **tool_timeout_sec** set to 30s vs official default 60s
- **No `--global` install option** for `~/.agents/skills/`
- **No post-install validation** (symlink integrity, MCP server health)
- **No automated test** for install scripts
- **install.ps1 specific bugs** (junction path issues, .gitignore escaping)
- **No uninstall capability**
- **No version check** on update

### 1.3 References

- [Codex Agent Skills](https://developers.openai.com/codex/skills) - Official skill docs
- [Codex MCP](https://developers.openai.com/codex/mcp/) - MCP config reference
- [Codex Config Reference](https://developers.openai.com/codex/config-reference/) - All config keys
- [GitHub Issue #11314](https://github.com/openai/codex/issues/11314) - Symlink discovery
- [GitHub Issue #10430](https://github.com/openai/codex/issues/10430) - ~/.agents/skills loading
- [openai/skills](https://github.com/openai/skills) - Official skills catalog

---

## 2. Problem Analysis

### 2.1 install.sh Issues

| ID | Issue | Severity | Description |
|----|-------|----------|-------------|
| SH-01 | tool_timeout_sec = 30 | Medium | Official default is 60s. Complex tools (bkit_pdca_plan with template I/O) may timeout |
| SH-02 | No --global option | Medium | Cannot install to ~/.agents/skills/ for cross-project use |
| SH-03 | No symlink validation | Medium | After creating symlinks, doesn't verify they resolve correctly |
| SH-04 | No MCP server health check | Low | Doesn't verify MCP server can start after install |
| SH-05 | cd in subshell unsafe | Low | `cd "$INSTALL_DIR" && git pull && cd ..` can fail silently |
| SH-06 | No version tracking | Low | Cannot detect which version is installed or if update is needed |
| SH-07 | No uninstall | Low | No way to cleanly remove bkit-codex |
| SH-08 | No color output | Low | No visual distinction between success/warning/error messages |

### 2.2 install.ps1 Issues

| ID | Issue | Severity | Description |
|----|-------|----------|-------------|
| PS-01 | tool_timeout_sec = 30 | Medium | Same as SH-01 |
| PS-02 | No --global option | Medium | Same as SH-02 |
| PS-03 | Junction uses absolute paths | Medium | `cmd /c mklink /J` with `$skill.FullName` creates absolute junction. Breaks if project directory moves. Should use relative paths |
| PS-04 | .gitignore backtick escaping | Medium | Line 90: `` "# bkit-codex`n.bkit-codex/" `` uses backtick-n which is PowerShell newline but written as literal text with `Set-Content`. Results in `.bkit-codex/` on same line as comment |
| PS-05 | No symlink validation | Medium | Same as SH-03 |
| PS-06 | No BOM handling | Low | `Set-Content -Encoding UTF8` in PS 5.1 adds BOM, which may confuse TOML parsers |
| PS-07 | No admin detection | Low | Junctions work without admin, but should warn if running elevated (may change file ownership) |
| PS-08 | No version tracking | Low | Same as SH-06 |

### 2.3 Shared Issues

| ID | Issue | Severity | Description |
|----|-------|----------|-------------|
| CM-01 | No test script | High | No automated test to verify install works correctly |
| CM-02 | No CI integration | High | install.sh/ps1 not tested in GitHub Actions |
| CM-03 | No --help flag | Medium | No usage documentation from command line |
| CM-04 | No idempotency guarantee | Medium | Multiple runs may create duplicate entries or miss updates |
| CM-05 | AGENTS.md never updates | Medium | On re-install, AGENTS.md is skipped even if outdated |

---

## 3. Goals

### 3.1 Primary Goals

- [ ] Fix all Medium+ severity issues in both install.sh and install.ps1
- [ ] Add `--global` flag for user-level installation (~/.agents/skills/)
- [ ] Create automated install test script for CI
- [ ] Add post-install validation (symlinks, MCP server, AGENTS.md)
- [ ] Ensure cross-platform parity between sh and ps1

### 3.2 Secondary Goals

- [ ] Add `--uninstall` flag for clean removal
- [ ] Add `--version` flag to display installed version
- [ ] Add `--help` flag with usage documentation
- [ ] Add color output for better UX
- [ ] Add CI workflow for install script testing

### 3.3 Non-Goals

- Custom `$skill-installer` integration (requires Codex plugin marketplace)
- npx/skills.sh package manager registration (separate effort)
- Windows MSI/installer package

---

## 4. Scope

### 4.1 Files to Modify

| File | Changes |
|------|---------|
| `install.sh` | Fix timeout, add flags, add validation, add color output |
| `install.ps1` | Fix junction paths, fix .gitignore, fix encoding, add flags |

### 4.2 Files to Create

| File | Purpose |
|------|---------|
| `uninstall.sh` | Clean removal script for Unix |
| `uninstall.ps1` | Clean removal script for Windows |
| `tests/install/install-test.sh` | Automated install verification (Unix) |
| `tests/install/install-test.ps1` | Automated install verification (Windows) |
| `.github/workflows/test-install.yml` | CI workflow for install testing |

---

## 5. Success Criteria

| Metric | Target |
|--------|--------|
| All Medium+ issues fixed | 100% |
| Install test passes on Ubuntu | Required |
| Install test passes on macOS | Required |
| Install test passes on Windows | Best effort |
| Post-install validation: symlinks | All 26 valid |
| Post-install validation: MCP server | Responds to initialize |
| Post-install validation: AGENTS.md | Exists and non-empty |
| Idempotent re-install | No errors, no duplicates |
| Uninstall leaves no artifacts | Clean removal |

---

## 6. Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Breaking existing installations | High | Test upgrade path from current version |
| Junction relative path not supported on all Windows | Medium | Fallback to absolute path with warning |
| CI matrix complexity (3 OS) | Low | Start with Ubuntu, expand later |
| AGENTS.md update may overwrite user edits | Medium | Diff-based merge or --force flag |

---

## 7. Task Breakdown

```
[PLAN] install-script-improvement ← Current
  Status: In Progress

[DESIGN] install-script-improvement
  Status: Pending (next)
  blockedBy: PLAN

[DO] install-script-improvement
  Status: Pending
  blockedBy: DESIGN
  Subtasks:
    1. Fix install.sh issues (SH-01 to SH-08)
    2. Fix install.ps1 issues (PS-01 to PS-08)
    3. Fix shared issues (CM-01 to CM-05)
    4. Create uninstall scripts
    5. Create test scripts
    6. Create CI workflow

[CHECK] install-script-improvement
  Status: Pending
  blockedBy: DO

[REPORT] install-script-improvement
  Status: Pending
  blockedBy: CHECK
```
