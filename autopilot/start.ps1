# start.ps1: starts this machine's autopilot on the games this machine actually develops.
#
#   powershell -ExecutionPolicy Bypass -File C:\Users\kreyh\Projekte\ccprompt\autopilot\start.ps1
#
# The same command on every machine, no list: a machine's git reflog records the commits made ON it, so a game with
# 20 or more local commits in the last two days is developed here (pulls and loop commits stay in single digits).
# One repo is never on two machines, because only one machine commits to it. Pulls the repo first, skips a dirty one
# (a session is working in it: close that session first), then opens one window per repo.
#   -DryRun      checks and pulls, prints what it would start, opens no window
#   -Map <file>  an explicit machines.json ({ "<COMPUTERNAME>": "<repo>" or [...] }) instead of the reflog
#   -MinCommits  the local commit count that means "developed here" (default 20)
param([switch]$DryRun, [Alias('Map')][string]$MapFile, [int]$MinCommits = 20)
$ErrorActionPreference = 'Stop'
$here = $PSScriptRoot
$me = $env:COMPUTERNAME
$Games = 'tabletop-siege', 'SidewalkSimulator', 'forrestfarm', 'surf', 'TheGame', 'hearthacre', 'ADHDgame', 'frontier-kingdom', 'the-forgelands', 'hurricane', 'the-block', 'diplomancy', 'gnome-league'
if ($MapFile) {
  $machines = Get-Content $MapFile -Raw | ConvertFrom-Json
  $entry = $machines.$me
  if (-not $entry) { throw "machines.json has no entry for $me. Add `"$me`": `"<repo folder>`" and run again." }
  $repos = @($entry)
  # Two machines must not share a repo.
  $all = @{}
  foreach ($p in $machines.PSObject.Properties) { foreach ($r in @($p.Value)) { if ($all[$r]) { throw "$r is on both $($all[$r]) and $($p.Name)" }; $all[$r] = $p.Name } }
} else {
  $since = (Get-Date).AddDays(-2).ToString('yyyy-MM-dd HH:mm')
  $repos = foreach ($g in $Games) {
    $path = Join-Path $env:USERPROFILE "Projekte\$g"
    if (-not (Test-Path (Join-Path $path '.git'))) { continue }
    $n = @(git -C $path reflog --since="$since" --format='%gs' | Where-Object { $_ -match '^commit' }).Count
    Write-Host ("{0,-20} {1,4} local commits in two days" -f $g, $n)
    if ($n -ge $MinCommits) { $g }
  }
  $repos = @($repos)
  if (-not $repos.Count) { Write-Host "No game has $MinCommits local commits in two days on $me. Nothing to start."; exit 0 }
  Write-Host "Developed on ${me}: $($repos -join ', ')"
}

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
