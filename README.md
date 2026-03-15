# ccprompt

[![npm version](https://img.shields.io/npm/v/@ccprompt/cli)](https://www.npmjs.com/package/@ccprompt/cli)
[![Tests](https://github.com/ccprompt/ccprompt/actions/workflows/test.yml/badge.svg)](https://github.com/ccprompt/ccprompt/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org/)

**A complete AI coding workflow in 8 slash commands.** Not a template collection. A session lifecycle that turns Claude Code into a repeatable production system.

```bash
npx @ccprompt/cli install .
```

## The Problem

Most developers use AI like autocomplete: type a prompt, accept the output, move on. Then they wonder why their code has subtle bugs, their context gets lost between sessions, and they spend more time fixing AI mistakes than they save.

**The data backs this up:**
- Developers believe AI makes them 24% faster. They're actually **19% slower** without a methodology (METR, randomized controlled trial)
- 96% don't trust AI code, but only 48% verify it. The gap is where bugs live (Sonar, 1,100+ developers)

The missing piece isn't better prompts. It's a **workflow**.

## The Session Lifecycle

ccprompt installs 27 slash commands into Claude Code. Eight of them form a loop that runs every session:

```
/read-handover          Pick up where the last session left off
       |
/strategic-next         Decide what matters most right now
       |
/creative-brainstorm    Explore approaches before committing to one
       |
    [BUILD]             /feature-build, /debug-rootcause, /refactor...
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

The loop works for one project. It scales across projects: one project per IDE, multiple IDEs open simultaneously.

- **IDE 1:** Building a website
- **IDE 2:** Writing an ebook
- **IDE 3:** Developing a CLI tool
- **IDE 4:** Preparing marketing content

Each project runs its own lifecycle. Each produces its own handover. When you switch back to a project, `/read-handover` picks up exactly where you left off. Ten projects progressing simultaneously, zero context loss.

One developer. Portfolio-level output.

## All 27 Commands

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
| `/architect` | Design before you build. Constraints first, then options, then decide |
| `/refactor` | Safe restructuring: characterization tests first, small steps |

### Debugging and fixing

| Command | What it does |
|---------|-------------|
| `/debug-rootcause` | Find the REAL cause. 5 WHYs technique. Fix cause, not symptom |

### Quality and security

| Command | What it does |
|---------|-------------|
| `/code-review` | Pre-commit quality gate with security checklist |
| `/test-audit` | Test coverage gaps and test quality audit |
| `/security-audit` | Full OWASP Top 10 mapped security review |
| `/best-practices` | Code quality standards audit |
| `/game-tester` | Play and test games with Playwright MCP, find bugs and UX issues |
| `/flow-tester` | Systematically test every logical flow end-to-end |
| `/asset-quality-audit` | Audit game asset quality, consistency, AI art defects |

### Thinking and planning

| Command | What it does |
|---------|-------------|
| `/think-first` | Developer plans first, AI independently, compare blind spots |
| `/plan-certain` | Stop, understand fully, plan precisely, then act |
| `/research-investigate` | Deep dive, brainstorm, plan with all context |
| `/emergency-handover` | Fast context save when things are critical |

### Operations

| Command | What it does |
|---------|-------------|
| `/deploy-checklist` | Pre-deployment validation. Every time. No exceptions |

### Setup

| Command | What it does |
|---------|-------------|
| `/setup-claude-md` | Build CLAUDE.md with Hot/Warm/Cold memory hierarchy |
| `/iterate-visual` | Iterative UI/UX refinement with visual feedback loops |

Every template supports `$ARGUMENTS` for passing context directly:
```
/debug-rootcause TypeError in UserService.create()
/feature-build add dark mode toggle
/refactor extract auth logic from UserController
```

## How It Works

Templates are plain markdown files installed to `.claude/commands/`. Claude Code reads them as slash commands. No API key, no account, no setup beyond the one-liner.

```bash
npx @ccprompt/cli install .
```

Or install globally:

```bash
npm install -g @ccprompt/cli
ccprompt install .
```

## CLI Commands

```
ccprompt install [path]      # Install templates as slash commands
ccprompt templates           # List all 27 templates
ccprompt show <template>     # View a template in the terminal
ccprompt copy <template>     # Copy a template to clipboard
ccprompt new-template <name> # Create a custom template
```

## Troubleshooting

### "command not found: ccprompt"

Global install didn't link properly. Use npx instead:
```bash
npx @ccprompt/cli install .
```

Or reinstall globally:
```bash
npm install -g @ccprompt/cli
```

### Slash commands don't appear in Claude Code

Make sure you ran `install` in the right project directory. Claude Code reads from `.claude/commands/` relative to your project root.

```bash
ls .claude/commands/    # should list .md files
```

## FAQ

**Does this work with Cursor / other AI editors?**
The slash commands are specific to Claude Code's `.claude/commands/` convention. The template markdown files themselves work anywhere. Copy and paste them into any AI assistant.

**Can I edit templates after installation?**
Yes. They're plain markdown in `.claude/commands/`. Edit freely. Running `install` again will overwrite them, so keep custom edits in a separate copy if needed.

**Where can I learn the full methodology?**
The session lifecycle is part of the Paranoid Verification methodology. Learn more at [codewithrigor.com](https://codewithrigor.com).

## Requirements

- Node.js 18+
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) (for using slash commands)

## License

MIT. See [LICENSE](LICENSE).
