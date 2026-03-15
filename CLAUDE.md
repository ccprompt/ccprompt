# Prompt Manager (ccprompt)

**What:** CLI tool that manages and individualizes AI coding prompts per project.

**Maintainer:** ccprompt contributors

## How It Works

1. General prompt templates live in `templates/` (27 templates)
2. Projects are registered via `ccprompt scan <path>` → saves context to `projects/<name>/context.json`
3. `ccprompt generate <project>` sends templates + project context to Claude API → saves individualized prompts to `projects/<name>/`
4. `ccprompt install <project>` copies individualized prompts into the project's `.claude/commands/` folder
5. User types `/<template-name>` (e.g., `/kickoff`) in Claude Code → runs the individualized prompt

## Tech Stack

- Node.js (no build step)
- Commander.js (CLI)
- Anthropic SDK (Claude API for individualization)
- Flat markdown files (no database)

## Key Files

- `promptm.js` – CLI entry point, all commands (~1300 lines)
- `templates/` – 27 prompt templates
- `projects/` – per-project context.json + individualized prompts
- `.env` – ANTHROPIC_API_KEY
## Commands

```
ccprompt templates          # List all templates
ccprompt list               # List all projects
ccprompt scan <path>        # Auto-detect & register project
ccprompt rescan <project>   # Re-scan preserving manual edits
ccprompt init <name>        # Manual project registration
ccprompt update <project>   # Update context fields
ccprompt generate <project> # Individualize via Claude API
ccprompt install <project>  # Copy to .claude/commands/ (slash commands)
ccprompt install-all        # Install into all projects
ccprompt regenerate-all     # Refresh all after template changes
ccprompt refresh <project>  # Rescan + regenerate + install (one step)
ccprompt copy <proj> <tmpl> # Copy to clipboard
ccprompt show <proj> <tmpl> # View in terminal
ccprompt diff <proj> <tmpl> # Compare original vs individualized
ccprompt new-template <n>   # Create custom template scaffold
ccprompt stats              # Full overview dashboard
ccprompt remove <project>   # Delete project
```

## Templates (27)

kickoff, read-handover, low-context-handover, emergency-handover, think-first, creative-brainstorm, strategic-next, research-investigate, architect, feature-build, refactor, code-review, test-audit, security-audit, verify-thorough, principles-check, deploy-checklist, housekeeping, setup-claude-md, visual-verify, debug-rootcause, iterate-visual, plan-certain, best-practices, game-tester, flow-tester, asset-quality-audit

## Rules

- Follow KISS, DRY, YAGNI, SOLID principles
- Templates should be energetic and directive, not corporate checklists
- Never commit .env (contains API key)
- projects/ is gitignored (contains project-specific data)
- Global install via `npm install -g @ccprompt/cli`
- Slash commands installed to `.claude/commands/` → `/<template>` in Claude Code
- CI: GitHub Actions runs tests on Node 18/20/22
