# ccprompt

[![npm version](https://img.shields.io/npm/v/@ccprompt/cli)](https://www.npmjs.com/package/@ccprompt/cli)
[![Tests](https://github.com/ccprompt/ccprompt/actions/workflows/test.yml/badge.svg)](https://github.com/ccprompt/ccprompt/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org/)

**16 structured AI coding prompts, installed as slash commands in Claude Code.** Type `/kickoff`, `/debug-rootcause`, `/security-audit` and get structured, opinionated workflows.

Optionally individualize them per project — generic "read the codebase" becomes specific "read `src/app.module.ts`, `CLAUDE.md`, and check `tsconfig.json`."

## Table of Contents

- [Quick Start](#quick-start-30-seconds-no-api-key)
- [What You Get](#what-you-get)
- [Three Ways to Use](#three-ways-to-use)
- [How Individualization Works](#how-individualization-works)
- [All Commands](#all-commands)
- [Custom Templates](#custom-templates)
- [Keeping Prompts Up to Date](#keeping-prompts-up-to-date)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)
- [Requirements](#requirements)
- [License](#license)

## Quick Start (30 seconds, no API key)

```bash
npx @ccprompt/cli install-generic .
```

That's it. Open Claude Code in your project and type `/kickoff`.

## What You Get

| Command | What it does |
|---------|-------------|
| `/kickoff` | Start session — read everything, understand context first |
| `/debug-rootcause` | Find the REAL cause. 5 WHYs technique. Fix cause, not symptom |
| `/feature-build` | Structured feature implementation with incremental steps |
| `/code-review` | Pre-commit quality gate with security checklist |
| `/verify-thorough` | Be 100% sure. Trace every path. Trust nothing |
| `/security-audit` | Full OWASP Top 10 mapped security review |
| `/refactor` | Safe restructuring — characterization tests first, small steps |
| `/test-write` | Write comprehensive tests. Happy path, edge cases, error cases |
| `/performance` | Profile first, optimize second. Never guess the bottleneck |
| `/deploy-checklist` | Pre-deployment validation. Every time. No exceptions |
| `/housekeeping` | Cleanup, organize, consolidate — leave it better |
| `/research-investigate` | Deep dive, brainstorm, plan with all context |
| `/quick-task` | Small focused task, no heavyweight protocol |
| `/architect` | Design before you build. Constraints first, then options, then decide |
| `/think-plan` | Deep reasoning, plan with checkpoints, self-correct, adapt as you go |
| `/low-context-handover` | Emergency context save when running low |

Every template supports `$ARGUMENTS` — pass context directly:
```
/debug-rootcause TypeError in UserService.create()
/feature-build add dark mode toggle
/refactor extract auth logic from UserController
```

## Three Ways to Use

### 1. Generic (no API key)

```bash
npx @ccprompt/cli install-generic .
```

Installs all 16 templates as-is. Works great for any project.

### 2. Individualized (no API key needed)

```bash
npm install -g @ccprompt/cli
ccprompt scan .
ccprompt generate myproject
ccprompt install myproject
```

If you have Claude Code installed, `generate` auto-detects it — no API key, no flags. Prompts get tailored to your project's stack, files, and conventions.

### 3. Individualized via API (bulk operations)

```bash
mkdir -p ~/.ccprompt && echo "ANTHROPIC_API_KEY=sk-ant-..." > ~/.ccprompt/.env
ccprompt generate myproject
ccprompt install myproject
```

Uses Claude API directly. Faster for many projects (5 templates in parallel). Falls back to Claude Code automatically if no key is set.

## How Individualization Works

ccprompt scans your project (package.json, folder structure, CLAUDE.md, configs) and sends that context + each template to Claude. Supports Node.js, Python, Go, Rust, Java (Maven/Gradle), C# (.NET), and Docker. Generic instructions become project-specific.

**Real example — `/debug-rootcause` reproduction step:**

Generic template:
```
## Step 2: Reproduce It
- Find the exact steps to trigger the issue
- Find the minimal reproduction
- Document the reproduction steps
```

After individualization (from a real project — React + Remotion + Express):
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

The generic template is 113 lines. The individualized version is 191 lines — all project-specific commands, file paths, and gotchas. Across 16 templates, that's hundreds of lines of context your AI assistant would otherwise have to figure out each session.

## All Commands

```
ccprompt install-generic [path]  # Instant setup – no API key needed
ccprompt templates               # List all 16 templates
ccprompt scan <path>             # Auto-detect & register project
ccprompt generate <project>     # Individualize via API or Claude Code
ccprompt install <project>      # Install as slash commands
ccprompt refresh <project>      # Rescan + regenerate + install (one step)
ccprompt install-all             # Install into all projects
ccprompt regenerate-all          # Refresh all after template changes
ccprompt list                    # List registered projects
ccprompt stats                   # Overview dashboard
ccprompt rescan <project>       # Re-scan (preserves manual edits)
ccprompt update <project>       # Update context fields
ccprompt copy <proj> <tmpl>     # Copy prompt to clipboard
ccprompt show <proj> <tmpl>     # View in terminal
ccprompt diff <proj> <tmpl>     # Compare original vs individualized
ccprompt new-template <name>    # Create custom template scaffold
ccprompt remove <project>       # Delete project
```

## Custom Templates

```bash
ccprompt new-template my-workflow
# Edit templates/my-workflow.md
ccprompt regenerate-all --template my-workflow
ccprompt install-all
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

### "No API key and Claude Code not found"

For `generate`, ccprompt needs either:
1. An Anthropic API key in `~/.ccprompt/.env`, or
2. Claude Code installed and accessible via `claude` in your terminal

If you just want the templates without individualization, use `install-generic` instead.

### Slash commands don't appear in Claude Code

Make sure you ran `install` (or `install-generic`) in the right project directory. Claude Code reads from `.claude/commands/` relative to your project root.

```bash
ls .claude/commands/    # should list .md files
```

### Templates look generic after install-generic

That's expected. `install-generic` copies templates as-is. For project-specific prompts, use `scan` + `generate` + `install`.

## FAQ

**Do I need an API key?**
No. `install-generic` works with zero configuration. For individualization, ccprompt auto-detects Claude Code — no API key needed unless you want parallel generation via the API.

**Does this work with Cursor / other AI editors?**
The slash commands are specific to Claude Code's `.claude/commands/` convention. The template markdown files themselves work anywhere — copy and paste them into any AI assistant.

**How much does individualization cost?**
About $0.01–0.02 per template (16 templates ≈ $0.15–0.30 total per project). One-time cost unless you regenerate.

**Can I edit individualized prompts after generation?**
Yes. They're plain markdown in `.claude/commands/`. Edit freely. Running `install` again will overwrite them, so keep custom edits in a separate copy if needed.

## Requirements

- Node.js 18+
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) (for using slash commands)
- Anthropic API key (optional — only for API-based individualization)

## License

MIT — see [LICENSE](LICENSE).
