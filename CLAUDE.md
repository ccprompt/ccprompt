# Prompt Manager (ccprompt)

**What:** CLI tool that installs AI coding prompts as Claude Code slash commands.

**Maintainer:** ccprompt contributors

## How It Works

1. Prompt templates live in `templates/` (31 templates)
2. `ccprompt install [path]` copies templates into the project's `.claude/commands/` folder
3. User types `/<template-name>` (e.g., `/kickoff`) in Claude Code → runs the prompt

## Tech Stack

- Node.js (no build step)
- Commander.js (CLI)
- Flat markdown files (no database, no API)

## Key Files

- `promptm.js` – CLI entry point, all commands
- `templates/` – 31 prompt templates
- No external API dependencies

## Commands

```
ccprompt install [path]      # Install templates as slash commands
ccprompt templates           # List all templates
ccprompt show <template>     # View a template
ccprompt copy <template>     # Copy to clipboard
ccprompt new-template <name> # Create custom template
```

## Templates (31)

kickoff, read-handover, low-context-handover, emergency-handover, think-first, creative-brainstorm, strategic-next, research-investigate, architect, feature-build, refactor, code-review, test-audit, security-audit, verify-thorough, principles-check, deploy-checklist, housekeeping, setup-claude-md, visual-verify, debug-rootcause, iterate-visual, plan-certain, best-practices, game-tester, flow-tester, asset-quality-audit, bug-hunt, performance-hunt, accessibility-audit, dependency-audit

## Rules

- Follow KISS, DRY, YAGNI, SOLID principles
- Templates should be energetic and directive, not corporate checklists
- Global install via `npm install -g @ccprompt/cli`
- Slash commands installed to `.claude/commands/` → `/<template>` in Claude Code
- CI: GitHub Actions runs tests on Node 18/20/22
