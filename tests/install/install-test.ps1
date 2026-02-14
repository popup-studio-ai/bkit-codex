# install-test.ps1 - Automated install script verification for Windows
# Tests install.ps1 in isolated temp directories to verify all behavior.
# Usage: pwsh tests/install/install-test.ps1
$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = (Resolve-Path (Join-Path $ScriptDir "..\..")).Path
$Pass = 0
$Fail = 0
$Skip = 0
$TmpDirs = @()

# ── Helpers ──────────────────────────────────────────────────────────────────

function Cleanup {
    foreach ($d in $script:TmpDirs) {
        if (Test-Path $d) {
            Remove-Item $d -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
}

function New-TmpDir {
    $d = Join-Path ([System.IO.Path]::GetTempPath()) ("bkit-test-" + [guid]::NewGuid().ToString("N").Substring(0, 8))
    New-Item -ItemType Directory -Force -Path $d | Out-Null
    $script:TmpDirs += $d
    return $d
}

function Assert {
    param([string]$Desc, [scriptblock]$Test)
    try {
        $result = & $Test
        if ($result) {
            Write-Host "  PASS: $Desc" -ForegroundColor Green
            $script:Pass++
        } else {
            Write-Host "  FAIL: $Desc" -ForegroundColor Red
            $script:Fail++
        }
    } catch {
        Write-Host "  FAIL: $Desc ($_)" -ForegroundColor Red
        $script:Fail++
    }
}

function Assert-File { param([string]$Desc, [string]$Path) Assert $Desc { Test-Path $Path -PathType Leaf } }
function Assert-Dir  { param([string]$Desc, [string]$Path) Assert $Desc { Test-Path $Path -PathType Container } }
function Assert-Not  { param([string]$Desc, [string]$Path) Assert $Desc { -not (Test-Path $Path) } }

function Assert-Grep {
    param([string]$Desc, [string]$Path, [string]$Pattern)
    Assert $Desc { (Select-String -Path $Path -Pattern $Pattern -Quiet) -eq $true }
}

function Assert-Count {
    param([string]$Desc, [string]$Path, [string]$Pattern, [int]$Expected)
    $actual = (Select-String -Path $Path -Pattern $Pattern).Count
    if ($actual -eq $Expected) {
        Write-Host "  PASS: $Desc (count=$actual)" -ForegroundColor Green
        $script:Pass++
    } else {
        Write-Host "  FAIL: $Desc (expected=$Expected, got=$actual)" -ForegroundColor Red
        $script:Fail++
    }
}

function Skip-Test { param([string]$Desc) Write-Host "  SKIP: $Desc" -ForegroundColor Yellow; $script:Skip++ }

try {
    # ============================================================================
    # Test 1: Fresh Project Install
    # ============================================================================
    Write-Host "=== Test 1: Fresh Project Install ==="
    $tmp = New-TmpDir
    Push-Location $tmp
    git init -q

    & "$RepoRoot\install.ps1"

    Assert-Dir  "bkit-codex clone"     ".bkit-codex"
    Assert-Dir  "agents skills dir"    ".agents\skills"
    Assert-File "AGENTS.md"            "AGENTS.md"
    Assert-File "config.toml"          ".codex\config.toml"
    Assert-Grep "MCP config has bkit"  ".codex\config.toml" "mcp_servers.bkit"
    Assert-Grep "tool_timeout is 60"   ".codex\config.toml" "tool_timeout_sec = 60"
    Assert-Dir  "PDCA plan dir"        "docs\01-plan\features"
    Assert-Dir  "PDCA design dir"      "docs\02-design\features"
    Assert-Dir  "PDCA analysis dir"    "docs\03-analysis"
    Assert-Dir  "PDCA report dir"      "docs\04-report"
    Assert-Grep "gitignore has bkit"   ".gitignore" ".bkit-codex/"
    Assert-File "Version file"         ".bkit-codex\.installed-version"

    # Check skill count
    $skills = Get-ChildItem ".agents\skills" -Directory -ErrorAction SilentlyContinue
    Assert "At least 20 skills linked (got $($skills.Count))" { $skills.Count -ge 20 }

    # Check each skill has SKILL.md
    foreach ($skill in $skills) {
        $skillMd = Join-Path $skill.FullName "SKILL.md"
        Assert-File "SKILL.md in $($skill.Name)" $skillMd
    }

    Pop-Location

    # ============================================================================
    # Test 2: Idempotent Re-Install
    # ============================================================================
    Write-Host ""
    Write-Host "=== Test 2: Idempotent Re-Install ==="
    $tmp = New-TmpDir
    Push-Location $tmp
    git init -q

    & "$RepoRoot\install.ps1"
    & "$RepoRoot\install.ps1"

    Assert-Count "No duplicate MCP config"     ".codex\config.toml" "mcp_servers.bkit" 1
    Assert-Count "No duplicate gitignore entry" ".gitignore" ".bkit-codex/" 1
    Assert-File  "AGENTS.md still exists"       "AGENTS.md"

    Pop-Location

    # ============================================================================
    # Test 3: Existing config.toml Preserved
    # ============================================================================
    Write-Host ""
    Write-Host "=== Test 3: Existing config.toml ==="
    $tmp = New-TmpDir
    Push-Location $tmp
    git init -q

    New-Item -ItemType Directory -Force -Path ".codex" | Out-Null
    @('model = "o3-mini"', '', '[mcp_servers.other]', 'command = "other-server"') | Set-Content ".codex\config.toml"

    & "$RepoRoot\install.ps1"

    Assert-Grep "Preserves existing model" ".codex\config.toml" 'model = "o3-mini"'
    Assert-Grep "Preserves other MCP"      ".codex\config.toml" "mcp_servers.other"
    Assert-Grep "Adds bkit MCP"            ".codex\config.toml" "mcp_servers.bkit"

    Pop-Location

    # ============================================================================
    # Test 4: Existing AGENTS.md Preserved
    # ============================================================================
    Write-Host ""
    Write-Host "=== Test 4: Existing AGENTS.md ==="
    $tmp = New-TmpDir
    Push-Location $tmp
    git init -q

    "# My Custom Agent Instructions" | Set-Content "AGENTS.md"

    & "$RepoRoot\install.ps1"

    Assert-Grep "Preserves user AGENTS.md" "AGENTS.md" "My Custom Agent Instructions"

    Pop-Location

    # ============================================================================
    # Test 5: Uninstall
    # ============================================================================
    Write-Host ""
    Write-Host "=== Test 5: Uninstall ==="
    $tmp = New-TmpDir
    Push-Location $tmp
    git init -q

    & "$RepoRoot\install.ps1"
    & "$RepoRoot\install.ps1" -Uninstall

    Assert-Not  "bkit-codex dir removed"  ".bkit-codex"
    Assert-File "AGENTS.md preserved"     "AGENTS.md"
    Assert-Dir  "docs preserved"          "docs"

    Pop-Location

    # ============================================================================
    # Test 6: Flags
    # ============================================================================
    Write-Host ""
    Write-Host "=== Test 6: Flags ==="

    $helpOut = & "$RepoRoot\install.ps1" -Help 2>&1 | Out-String
    Assert "-Help shows usage" { $helpOut -match "Usage" }

    $versionOut = & "$RepoRoot\install.ps1" -Version 2>&1 | Out-String
    Assert "-Version shows version info" { $versionOut -match "bkit-codex" }

    # ============================================================================
    # Test 7: Global Install
    # ============================================================================
    Write-Host ""
    Write-Host "=== Test 7: Global Install ==="
    Skip-Test "Global install requires manual verification (modifies ~/.agents/)"

    # ============================================================================
    # Summary
    # ============================================================================
    Write-Host ""
    Write-Host "================================="
    Write-Host "Results: $Pass passed, $Fail failed, $Skip skipped"
    Write-Host "================================="

    if ($Fail -gt 0) { exit 1 } else { exit 0 }
} finally {
    Pop-Location -ErrorAction SilentlyContinue
    Cleanup
}
