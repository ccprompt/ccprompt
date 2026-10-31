# autopilot

Runs the manual loop "start claude, /read-handover, /relentless, handover, /clear" unattended, one repo per window.

```powershell
powershell -ExecutionPolicy Bypass -File C:\Users\kreyh\Projekte\ccprompt\autopilot\autopilot.ps1 C:\Users\kreyh\Projekte\<repo>
```

- Each cycle is a fresh headless `claude -p` (that is the /clear). The prompt is `/relentless` with arguments that
  read HANDOVER.md first and end with a handover commit and push.
- Uses the machine's own `claude` login (subscription); API key variables are removed from the environment.
- Below normal priority for claude and everything it starts, and a new cycle starts only with 4 GB RAM free and
  CPU under 85 percent (`-MinFreeGB`, `-MaxCpu`), so editor sessions on the machine keep running.
- Stop: create `<repo>\.autopilot-stop` (ends after the running cycle) or Ctrl+C. Usage limit: sleeps 30 min and
  retries. Three failed cycles in a row with no commit: stops.
- Logs: `%USERPROFILE%\.autopilot\<repo>\<stamp>.jsonl` (stream json, UTF-8) and `.err`.
- Options: `-MaxCycles N`, `-MaxTurns N`, `-PauseSec`, `-LimitSleepMin`, `-PermissionMode`.

## All machines

`machines.json` maps each machine name (`$env:COMPUTERNAME`) to its game repo folder under `~/Projekte` (or a list).
On each machine, one command: `powershell -ExecutionPolicy Bypass -File C:\Users\kreyh\Projekte\ccprompt\autopilot\start.ps1`.
`-DryRun` checks everything and opens no window. It refuses a machine with no entry and a repo listed on two machines, skips a repo with uncommitted changes (another
session), pulls, and opens one autopilot window per repo. Replace the placeholder names with the real machine names.
