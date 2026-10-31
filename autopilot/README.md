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

One command on every machine, no list: `powershell -ExecutionPolicy Bypass -File C:\Users\kreyh\Projekte\ccprompt\autopilot\start.ps1`.
It reads the machine's git reflog: a game with 20 or more commits made on this machine in two days is developed here,
so each game runs on exactly the machine that develops it. A repo with uncommitted changes (a session is working in
it) is skipped: close that session first. `-DryRun` shows what it would start, `-Map <file>` takes an explicit list.
