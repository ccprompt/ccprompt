# start.ps1: starts this machine's autopilot on the game repo machines.json names for it.
#
#   powershell -ExecutionPolicy Bypass -File C:\Users\kreyh\Projekte\ccprompt\autopilot\start.ps1
#
# machines.json maps a machine name ($env:COMPUTERNAME) to one repo folder under ~/Projekte, or a list of them
# (each gets its own window). One repo is never on two machines: the loops would fight over HANDOVER.md.
# Pulls the repo first, refuses a dirty one (another session may be working in it), then opens one window per repo.
#   -DryRun   checks and pulls, prints what it would start, opens no window
#   -Map <p>  another machines.json (tests)
param([switch]$DryRun, [Alias('Map')][string]$MapFile)
$ErrorActionPreference = 'Stop'
$here = $PSScriptRoot
if (-not $MapFile) { $MapFile = Join-Path $here 'machines.json' }
$machines = Get-Content $MapFile -Raw | ConvertFrom-Json
$me = $env:COMPUTERNAME
$entry = $machines.$me
if (-not $entry) { throw "machines.json has no entry for $me. Add `"$me`": `"<repo folder>`" and run again." }
$repos = @($entry)

# Two machines must not share a repo.
$all = @{}
foreach ($p in $machines.PSObject.Properties) { foreach ($r in @($p.Value)) { if ($all[$r]) { throw "$r is on both $($all[$r]) and $($p.Name)" }; $all[$r] = $p.Name } }

foreach ($r in $repos) {
  $path = Join-Path $env:USERPROFILE "Projekte\$r"
  if (-not (Test-Path (Join-Path $path '.git'))) { Write-Host "${r}: no git repo at $path, skipped"; continue }
  $dirty = git -C $path status --porcelain --untracked-files=no
  if ($dirty) { Write-Host "${r}: uncommitted changes (another session?), skipped:"; $dirty | Select-Object -First 5 | ForEach-Object { "  $_" }; continue }
  git -C $path pull --ff-only -q
  if ($LASTEXITCODE -ne 0) { Write-Host "${r}: pull failed, skipped"; continue }
  if ($DryRun) { Write-Host "${r}: would start autopilot.ps1 on $path (dry run)"; continue }
  Write-Host "${r}: autopilot starting in a new window"
  Start-Process powershell -ArgumentList '-NoExit', '-ExecutionPolicy', 'Bypass', '-File', (Join-Path $here 'autopilot.ps1'), $path -WorkingDirectory $path
}
