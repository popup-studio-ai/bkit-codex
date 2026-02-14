# uninstall.ps1 - Remove bkit-codex from the current project
# Usage: .\uninstall.ps1 [-Global]
param(
    [switch]$Global
)

# Reuse install.ps1 -Uninstall logic (avoid code duplication)
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$installScript = Join-Path $ScriptDir "install.ps1"

$params = @{ Uninstall = $true }
if ($Global) { $params.Global = $true }

& $installScript @params
