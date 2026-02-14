# install.ps1 - bkit-codex project installer for Windows
# Usage: irm https://raw.githubusercontent.com/popup-studio-ai/bkit-codex/main/install.ps1 | iex

$ErrorActionPreference = "Stop"

$Repo = "popup-studio-ai/bkit-codex"
$InstallDir = ".bkit-codex"

Write-Host "Installing bkit-codex..."

# 1. Clone repository
if (Test-Path $InstallDir) {
    Write-Host "Updating existing installation..."
    Push-Location $InstallDir
    git pull
    Pop-Location
} else {
    git clone --depth 1 "https://github.com/$Repo.git" $InstallDir
}

# 2. Create skill symlinks (junctions on Windows)
$SkillsDir = ".agents\skills"
if (-not (Test-Path $SkillsDir)) {
    New-Item -ItemType Directory -Force -Path $SkillsDir | Out-Null
}

$SourceSkills = Get-ChildItem -Path "$InstallDir\.agents\skills" -Directory
foreach ($skill in $SourceSkills) {
    $targetPath = Join-Path $SkillsDir $skill.Name
    if (-not (Test-Path $targetPath)) {
        # Use directory junction (works without admin on Windows)
        cmd /c mklink /J $targetPath $skill.FullName
        Write-Host "  Linked: $($skill.Name)"
    }
}

# 3. Create/update AGENTS.md
if (-not (Test-Path "AGENTS.md")) {
    Copy-Item "$InstallDir\AGENTS.md" "AGENTS.md"
    Write-Host "  Created: AGENTS.md"
} else {
    Write-Host "  AGENTS.md already exists (skipped)"
}

# 4. Configure MCP server in config.toml
$ConfigDir = ".codex"
if (-not (Test-Path $ConfigDir)) {
    New-Item -ItemType Directory -Force -Path $ConfigDir | Out-Null
}
$ConfigFile = Join-Path $ConfigDir "config.toml"

$McpConfig = @"

[mcp_servers.bkit]
command = "node"
args = ["./.bkit-codex/packages/mcp-server/index.js"]
startup_timeout_sec = 10
tool_timeout_sec = 30
required = true
"@

if (-not (Test-Path $ConfigFile)) {
    $McpConfig.TrimStart() | Set-Content $ConfigFile -Encoding UTF8
    Write-Host "  Created: $ConfigFile"
} elseif (-not (Select-String -Path $ConfigFile -Pattern "mcp_servers.bkit" -Quiet)) {
    Add-Content $ConfigFile $McpConfig -Encoding UTF8
    Write-Host "  Updated: $ConfigFile"
}

# 5. Initialize PDCA directories
$PdcaDirs = @(
    "docs\01-plan\features",
    "docs\02-design\features",
    "docs\03-analysis",
    "docs\04-report"
)
foreach ($dir in $PdcaDirs) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Force -Path $dir | Out-Null
    }
}

# 6. Add to .gitignore
if (Test-Path ".gitignore") {
    $content = Get-Content ".gitignore" -Raw -ErrorAction SilentlyContinue
    if ($content -notmatch "\.bkit-codex/") {
        Add-Content ".gitignore" "`n# bkit-codex`n.bkit-codex/" -Encoding UTF8
    }
} else {
    "# bkit-codex`n.bkit-codex/" | Set-Content ".gitignore" -Encoding UTF8
}

$skillCount = (Get-ChildItem -Path ".agents\skills" -Directory).Count
Write-Host ""
Write-Host "bkit-codex installed successfully!"
Write-Host "  Skills: $skillCount linked"
Write-Host "  MCP Server: configured in $ConfigFile"
Write-Host "  PDCA Docs: docs/ directory ready"
Write-Host ""
Write-Host 'Start Codex and type $pdca to begin!'
