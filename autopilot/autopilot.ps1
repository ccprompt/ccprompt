# autopilot.ps1: the unattended version of "start claude, /read-handover, /relentless, handover, /clear, repeat".
#
#   powershell -ExecutionPolicy Bypass -File autopilot.ps1 C:\Users\kreyh\Projekte\forrestfarm
#   powershell -ExecutionPolicy Bypass -File autopilot.ps1 <repo> -MaxCycles 3 -MaxTurns 400
#
# Each cycle is a fresh headless `claude -p` process (= /clear). The prompt is /relentless with arguments that make
# it read HANDOVER.md first (= /read-handover) and end with a handover commit + push. Stop: create <repo>\.autopilot-stop
# (ends after the running cycle) or Ctrl+C. Logs: %USERPROFILE%\.autopilot\<repo>\<stamp>.jsonl, one file per cycle.
# Auth: whatever login `claude` already has on this machine (claude auth status). No API key is used.
param(
  [Parameter(Mandatory = $true)][string]$Repo,
  [int]$MaxCycles = 0,          # 0 = until stopped
  [int]$MaxTurns = 0,           # 0 = no cap per cycle
  [int]$PauseSec = 60,
  [int]$LimitSleepMin = 30,
  [string]$PermissionMode = 'bypassPermissions',
  [double]$MinFreeGB = 4,       # a cycle starts only with this much RAM free
  [int]$MaxCpu = 85             # ... and the CPU below this load (percent)
)
$ErrorActionPreference = 'Stop'
$Repo = (Resolve-Path $Repo).Path
$name = Split-Path -Leaf $Repo
$logDir = Join-Path $env:USERPROFILE ".autopilot\$name"
New-Item -ItemType Directory -Force $logDir | Out-Null
$stop = Join-Path $Repo '.autopilot-stop'
# A key in the environment would bill the API instead of the subscription login.
foreach ($v in 'ANTHROPIC_API_KEY', 'ANTHROPIC_AUTH_TOKEN', 'ANTHROPIC_BASE_URL', 'CLAUDECODE', 'CLAUDE_CODE_ENTRYPOINT') { Remove-Item "Env:$v" -ErrorAction SilentlyContinue }

$prompt = '/relentless You run unattended: nobody will answer questions, so never ask, decide. ' +
  'First read HANDOVER.md completely and follow it the way /read-handover would (verify state, then pick the top Next item), ' +
  'and read CLAUDE.md. Work through the Next list. Before your context runs low, overwrite HANDOVER.md with the current ' +
  'state (the handover rules in CLAUDE.md), commit and push it, then stop. Stop every server or browser you started.'

# Below normal priority: claude and every child it starts (vitest, playwright, builds) inherit it, so editor
# sessions on this machine (Cursor, interactive claude) always get the CPU first.
(Get-Process -Id $PID).PriorityClass = 'BelowNormal'
function Get-Load {
  $os = Get-CimInstance Win32_OperatingSystem
  $cpu = (Get-CimInstance Win32_Processor | Measure-Object -Property LoadPercentage -Average).Average
  [pscustomobject]@{ FreeGB = [math]::Round($os.FreePhysicalMemory / 1MB, 1); Cpu = [int]$cpu }
}
function Wait-ForRoom {
  while ($true) {
    $l = Get-Load
    if ($l.FreeGB -ge $MinFreeGB -and $l.Cpu -lt $MaxCpu) { return $l }
    Write-Host "[$(Get-Date -Format HH:mm)] ${name}: waiting for room (RAM free $($l.FreeGB) GB, need $MinFreeGB; CPU $($l.Cpu)%, max $MaxCpu%)"
    Start-Sleep -Seconds 120
  }
}

$exe = Join-Path $env:APPDATA 'npm\node_modules\@anthropic-ai\claude-code\bin\claude.exe'
if (-not (Test-Path $exe)) { $exe = (Get-Command claude.exe -ErrorAction Stop).Source }

$cycle = 0
while ($true) {
  if (Test-Path $stop) { Write-Host "${name}: stop file found, done."; break }
  if ($MaxCycles -gt 0 -and $cycle -ge $MaxCycles) { Write-Host "${name}: $MaxCycles cycle(s) done."; break }
  $room = Wait-ForRoom
  if (Test-Path $stop) { Write-Host "${name}: stop file found, done."; break }
  $cycle++
  $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
  $log = Join-Path $logDir "$stamp.jsonl"
  $head = (git -C $Repo rev-parse --short HEAD) 2>$null
  Write-Host "[$(Get-Date -Format HH:mm)] $name cycle $cycle at $head (RAM free $($room.FreeGB) GB, CPU $($room.Cpu)%), log $log"
  $cargs = @('-p', $prompt, '--permission-mode', $PermissionMode, '--output-format', 'stream-json', '--verbose')
  if ($MaxTurns -gt 0) { $cargs += @('--max-turns', "$MaxTurns") }
  Push-Location $Repo
  # Start-Process writes the raw UTF-8 stream (a PowerShell 5.1 redirect would turn it into UTF-16) and returns the exit code.
  $quoted = ($cargs | ForEach-Object { if ($_ -match '\s') { '"' + $_ + '"' } else { $_ } }) -join ' '
  try {
    $p = Start-Process -FilePath $exe -ArgumentList $quoted -WorkingDirectory $Repo -NoNewWindow -Wait -PassThru `
      -RedirectStandardOutput $log -RedirectStandardError "$log.err"
    $code = $p.ExitCode
  } finally { Pop-Location }
  $after = (git -C $Repo rev-parse --short HEAD) 2>$null
  $tail = (Get-Content $log, "$log.err" -Tail 40 -Encoding UTF8 -ErrorAction SilentlyContinue) | Out-String
  Write-Host "[$(Get-Date -Format HH:mm)] $name cycle $cycle exit $code, HEAD $head -> $after"
  if ($tail -match '(?i)usage limit|rate limit|limit reached|resets at|out of extra usage') {
    Write-Host "${name}: usage limit, sleeping $LimitSleepMin min"; Start-Sleep -Seconds ($LimitSleepMin * 60); continue
  }
  if ($code -ne 0 -and $head -eq $after) {
    # Failed without a single commit: do not spin. Wait longer, and give up after three in a row.
    $fails = 1 + [int]($script:fails)
    $script:fails = $fails
    if ($fails -ge 3) { Write-Host "${name}: 3 failed cycles in a row with no commit, stopping. See $log"; break }
    Start-Sleep -Seconds ($PauseSec * 10); continue
  }
  $script:fails = 0
  Start-Sleep -Seconds $PauseSec
}
