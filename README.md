# ccprompt

[![npm version](https://img.shields.io/npm/v/@ccprompt/cli)](https://www.npmjs.com/package/@ccprompt/cli)
[![Tests](https://github.com/ccprompt/ccprompt/actions/workflows/test.yml/badge.svg)](https://github.com/ccprompt/ccprompt/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org/)

**A complete AI coding workflow in 8 slash commands.** Not a template collection. A session lifecycle that turns Claude Code into a repeatable production system.

```bash
npx @ccprompt/cli install-generic .
```

## The Problem

Most developers use AI like autocomplete: type a prompt, accept the output, move on. Then they wonder why their code has subtle bugs, their context gets lost between sessions, and they spend more time fixing AI mistakes than they save.

**The data backs this up:**
- Developers believe AI makes them 24% faster. They're actually **19% slower** without a methodology (METR, randomized controlled trial)
- 96% don't trust AI code, but only 48% verify it. The gap is where bugs live (Sonar, 1,100+ developers)

The missing piece isn't better prompts. It's a **workflow**.

## The Session Lifecycle

ccprompt installs 33 slash commands into Claude Code. Eight of them form a loop that runs every session:

```
/read-handover          Pick up where the last session left off
       |
/strategic-next         Decide what matters most right now
       |
/creative-brainstorm    Explore approaches before committing to one
       |
    [BUILD]             /feature-build, /quick-task, /debug-rootcause...
       |
/verify-thorough        Prove correctness: 5 verification layers
       |
/visual-verify          Prove it visually: screenshots, console, responsive
       |
/principles-check       Audit against your engineering standards
       |
/housekeeping           Clean up, consolidate, leave it better
       |
/low-context-handover   Save state for the next session
```

Every session starts at the top. Every session ends at the bottom. The middle adapts to whatever you're building. The handover connects one session to the next, so you never lose context.

### Start simple, add layers

**Week 1:** Just use `/kickoff` to start and `/low-context-handover` to end. That alone puts you ahead.

**Week 3:** Add `/read-handover` and `/verify-thorough`. Now you're preserving context and catching bugs.

**Month 2:** Add `/strategic-next` and `/visual-verify`. Now you're building the right things and proving they work.

**Month 4:** The full 8-command loop. Plus multiple IDEs running parallel sessions.

## The Parallelism Multiplier

The loop works for one session. It scales with parallel sessions:

- **IDE 1:** Building a feature (`/feature-build`)
- **IDE 2:** Writing tests for yesterday's work (`/test-write`)
- **IDE 3:** Security audit on the payment module (`/security-audit`)
- **IDE 4:** Researching next week's migration (`/research-investigate`)

Each IDE runs its own lifecycle. Each produces its own handover. Next day, `/read-handover` in each one and continue.

One developer. Team-level output.

## All 33 Commands

### Session lifecycle (the core loop)

| Command | Phase | What it does |
|---------|-------|-------------|
| `/read-handover` | Resume | Pick up where a previous session left off via HANDOVER.md |
| `/strategic-next` | Plan | Find what to build next with research, evaluation, prioritization |
| `/creative-brainstorm` | Explore | Think laterally, explore wild ideas, converge on the best one |
| `/verify-thorough` | Verify | 5-layer verification stack. Be 100% sure. Trust nothing |
| `/visual-verify` | Verify | Visual and browser verification: screenshots, console, Playwright |
| `/principles-check` | Audit | Systematic audit against your engineering principles |
| `/housekeeping` | Clean | Cleanup, organize, consolidate. Leave it better |
| `/low-context-handover` | Save | Save session state for the next session to pick up |

### Building

| Command | What it does |
|---------|-------------|
| `/kickoff` | Start session: read everything, understand context first |
| `/feature-build` | Structured feature implementation with incremental steps |
| `/quick-task` | Small focused task, no heavyweight protocol |
| `/architect` | Design before you build. Constraints first, then options, then decide |
| `/migrate` | Moving between frameworks, libraries, or APIs. Incremental, safe, reversible |
| `/refactor` | Safe restructuring: characterization tests first, small steps |

### Debugging and fixing

| Command | What it does |
|---------|-------------|
| `/debug-rootcause` | Find the REAL cause. 5 WHYs technique. Fix cause, not symptom |
| `/correction-stop` | Hit 2 failed fixes? Stop, revert, rethink, restart |
| `/incident-response` | Production incident triage: assess, contain, fix, postmortem |

### Quality and security

| Command | What it does |
|---------|-------------|
| `/code-review` | Pre-commit quality gate with security checklist |
| `/test-write` | Write comprehensive tests. Happy path, edge cases, error cases |
| `/test-audit` | Test coverage gaps and test quality audit |
| `/security-audit` | Full OWASP Top 10 mapped security review |
| `/best-practices` | Code quality standards audit |

### Thinking and planning

| Command | What it does |
|---------|-------------|
| `/think-first` | Developer plans first, AI independently, compare blind spots |
| `/plan-certain` | Stop, understand fully, plan precisely, then act |
| `/research-investigate` | Deep dive, brainstorm, plan with all context |
| `/confidence-calibration` | Track predicted vs actual confidence to improve judgment |
| `/emergency-handover` | Fast context save when things are critical |

### Operations

| Command | What it does |
|---------|-------------|
| `/deploy-checklist` | Pre-deployment validation. Every time. No exceptions |
| `/performance` | Profile first, optimize second. Never guess the bottleneck |

### Setup

| Command | What it does |
|---------|-------------|
| `/setup-claude-md` | Build CLAUDE.md with Hot/Warm/Cold memory hierarchy |
| `/setup-hooks` | Configure Claude Code hooks for automated verification |
| `/parallel-agents` | Orchestrate parallel agents with worktrees and subagents |
| `/iterate-visual` | Iterative UI/UX refinement with visual feedback loops |

Every template supports `$ARGUMENTS` for passing context directly:
```
/debug-rootcause TypeError in UserService.create()
/feature-build add dark mode toggle
/refactor extract auth logic from UserController
```

## How It Works

Templates are plain markdown files installed to `.claude/commands/`. Claude Code reads them as slash commands. No API key, no account, no setup beyond the one-liner.

**Want project-specific prompts?** ccprompt can scan your project and individualize each template with your actual file paths, commands, and conventions. This optional feature requires an [Anthropic API key](https://console.anthropic.com/).

```bash
npm install -g @ccprompt/cli
ccprompt scan .
ccprompt generate myproject    # requires ANTHROPIC_API_KEY
ccprompt install myproject
```

### Individualization example

Generic template:
```
## Step 2: Reproduce It
- Find the exact steps to trigger the issue
- Find the minimal reproduction
- Document the reproduction steps
```

After individualization (React + Remotion + Express project):
```
## Step 2: Reproduce It
- Find the exact steps to trigger the issue
- Find the minimal reproduction
- Document the reproduction steps

Project-specific reproduction workflow:
  # For video generation issues
  npm run dev                    # Open Remotion Studio
  npx remotion render video/index.ts CompositionName output/test.mp4

  # For web UI issues
  cd web && npm run dev          # Start frontend

  # For API issues
  npm run api:dev                # Start Express server

  # For test failures
  npm test                       # Run Vitest
```

The generic template is 113 lines. The individualized version is 191 lines, all project-specific.

## CLI Commands

```
ccprompt install-generic [path]  # Instant setup, free, no API key needed
ccprompt templates               # List all 33 templates
ccprompt scan <path>             # Auto-detect and register project
ccprompt generate <project>      # Individualize (requires API key)
ccprompt install <project>       # Install as slash commands
ccprompt refresh <project>       # Rescan + regenerate + install (one step)
ccprompt install-all             # Install into all projects
ccprompt regenerate-all          # Refresh all after template changes
ccprompt list                    # List registered projects
ccprompt stats                   # Overview dashboard
ccprompt rescan <project>        # Re-scan (preserves manual edits)
ccprompt update <project>        # Update context fields
ccprompt copy <proj> <tmpl>      # Copy prompt to clipboard
ccprompt show <proj> <tmpl>      # View in terminal
ccprompt diff <proj> <tmpl>      # Compare original vs individualized
ccprompt new-template <name>     # Create custom template scaffold
ccprompt remove <project>        # Delete project
```

## Keeping Prompts Up to Date

When your project evolves (new deps, new files, new conventions):

```bash
ccprompt refresh myproject    # rescan + regenerate + install in one step
```

Or for all projects:

```bash
ccprompt regenerate-all -y && ccprompt install-all
```

## Troubleshooting

### "command not found: ccprompt"

Global install didn't link properly. Use npx instead:
```bash
npx @ccprompt/cli install-generic .
```

Or reinstall globally:
```bash
npm install -g @ccprompt/cli
```

### Slash commands don't appear in Claude Code

Make sure you ran `install` (or `install-generic`) in the right project directory. Claude Code reads from `.claude/commands/` relative to your project root.

```bash
ls .claude/commands/    # should list .md files
```

### Templates look generic after install-generic

That's expected. `install-generic` copies templates as-is. For project-specific prompts, use `scan` + `generate` + `install` (requires API key).

## FAQ

**Do I need an API key?**
No. `install-generic` works with zero configuration and is completely free. An API key is only needed for the optional individualization feature (`generate`).

**Does this work with Cursor / other AI editors?**
The slash commands are specific to Claude Code's `.claude/commands/` convention. The template markdown files themselves work anywhere. Copy and paste them into any AI assistant.

**Can I edit templates after installation?**
Yes. They're plain markdown in `.claude/commands/`. Edit freely. Running `install` or `install-generic` again will overwrite them, so keep custom edits in a separate copy if needed.

**Where can I learn the full methodology?**
The session lifecycle is part of the Paranoid Verification methodology. Learn more at [codewithrigor.com](https://codewithrigor.com).

## Requirements

- Node.js 18+
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) (for using slash commands)
- Anthropic API key (optional, only for individualization)

## License

MIT. See [LICENSE](LICENSE).
