# CLAUDE.md Setup & Maintenance

**When to use:** Creating a new CLAUDE.md for a project, or updating an existing one. When you want Claude to understand your project deeply from the first prompt.

**Role:** You are a context architect. Your job is to build the memory system that makes every future AI session faster, more accurate, and less error-prone. A good CLAUDE.md is worth more than hours of re-explaining.

---

**Project to configure:** $ARGUMENTS

CLAUDE.md is a living document, not a configuration file. Boris Cherny (creator of Claude Code): "Anytime we see Claude do something incorrectly, we add it to the CLAUDE.md, so Claude knows not to do it next time." **But it is loaded into EVERY session, so it must also shrink.** Every rule added means checking whether an old one can be merged, shortened or evicted. A CLAUDE.md that only grows ends up bigger than the context window (this has happened: 810 KB, ~200k tokens).

## Don't

- Don't dump everything in one CLAUDE.md (use the Hot/Warm/Cold hierarchy)
- Don't include information that changes frequently (use hooks for dynamic context)
- Don't exceed 200 lines / 20 KB in root CLAUDE.md (it's always loaded, context is precious). A global hook blocks commits that grow it past 20 KB
- Don't write stories into rules: no session numbers, no dates, no "found in S412, fixed in S413", no measured A/B numbers. State the rule and the one-clause reason. The story goes in the commit message
- Don't annotate superseded rules (strike-through, "UPDATE:", "was X until") — REPLACE them. Git keeps the old text
- Don't duplicate information already in README.md or package.json
- Don't forget to update CLAUDE.md when conventions change

## Step 1: Scan the Project

Before writing anything, understand the project:
- Read existing CLAUDE.md (if any), README.md, package.json/pyproject.toml
- Identify the tech stack, frameworks, and key dependencies
- Look at folder structure and understand what lives where
- Read recent git history (last 20 commits) for patterns
- Run the build and test commands to see what exists
- Note any existing `.claude/` directory structure

## Step 2: Build Hot Memory (Root CLAUDE.md)

The root CLAUDE.md is always loaded. Keep it lean (under 200 lines). Include ONLY:

**Project identity (5 lines):**
- What this project is, who it's for, what it does
- Current status (production? prototype? in development?)

**Tech stack (5-10 lines):**
- Languages, frameworks, key dependencies
- Runtime requirements (Node version, Python version, etc.)

**Key commands (5-10 lines):**
- Build: `[command]`
- Test: `[command]`
- Dev: `[command]`
- Lint: `[command]`
- Deploy: `[command]`

**Architecture overview (10-15 lines):**
- Entry points and hot paths
- Key directories and what they contain
- Data flow (how requests/data moves through the system)

**Coding conventions (10-20 lines):**
- Naming patterns (camelCase, snake_case, file naming)
- Error handling approach
- Testing expectations
- Import order conventions
- Any framework-specific patterns

**Anti-patterns (5-15 lines):**
- Things Claude has done wrong before
- Patterns that look right but are wrong in this project
- Common mistakes with the tech stack

**NOT here: current sprint, recent decisions, known issues.** Those change every session and belong in HANDOVER.md.

## Step 3: Build Warm Memory (.claude/rules/)

For domain-specific patterns that don't apply to every task:

```
.claude/rules/
  api-patterns.md        # API conventions, endpoint patterns, auth handling
  error-handling.md       # How errors are handled across the project
  testing-conventions.md  # Test file structure, mocking patterns, fixtures
  database.md             # ORM patterns, migration conventions, query style
  frontend.md             # Component patterns, state management, styling
```

A rules file loads only when Claude works with matching files **if it has `paths:` frontmatter** (e.g. `paths: ["src/api/**"]`). Without it, it is loaded every session just like CLAUDE.md, so it counts toward the budget.

Topic detail that is not tied to paths goes in `docs/rules/<topic>.md`, with a one-line pointer in CLAUDE.md ("Before touching the renderer, read `docs/rules/renderer.md`"). Keep each focused on one domain.

## Step 4: Configure Context Re-injection

Add a SessionStart hook to re-inject critical context after compaction:

```json
{
  "hooks": {
    "SessionStart": [{
      "matcher": "compact",
      "hooks": [{
        "type": "command",
        "command": "echo 'CRITICAL REMINDERS: [key rules that must survive compaction]'"
      }]
    }]
  }
}
```

Include in the re-injection: the 3-5 most important rules that Claude tends to forget.

## Step 5: Set Up Cold Memory

For archival context that loads on demand:
- `HANDOVER.md` for session continuity — current state only, overwritten each session, ≤ 150 lines
- `docs/` for detailed documentation
- `knowledge-base/` for research and decisions
- MCP servers for external data (GitHub, Slack, browser state)

Reference these in CLAUDE.md: "For detailed API docs, see `docs/api.md`"

## Step 6: Tag for Code Review Updates

Add this practice to your team workflow:
- During code reviews, tag `@.claude` when you spot a convention violation
- Add the rule to CLAUDE.md as part of the PR — or sharpen an existing rule instead of adding a near-duplicate
- When CLAUDE.md passes 200 lines, evict: merge overlapping rules, delete rules the code/tests/lint now enforce, move a topic's detail to `docs/rules/`

## Step 7: Verify the Configuration

Test the CLAUDE.md by starting a fresh session:
- Run `/kickoff` or start a new conversation
- Ask Claude to explain the project (should be accurate from CLAUDE.md alone)
- Ask Claude to implement a small change (should follow conventions)
- Intentionally trigger an anti-pattern (should be caught)

## Output Format

```
## CLAUDE.md Configuration Report

### Hot Memory (root CLAUDE.md)
- Lines: [count] (target: under 200)
- Sections: [list]

### Warm Memory (.claude/rules/)
- Files created: [list]
- Total lines: [count]

### Cold Memory
- Handover: [exists / created / not needed]
- Docs: [referenced files]

### Context Re-injection Hook
- Configured: YES/NO
- Critical reminders: [list]

### Verification
- Fresh session test: PASS/FAIL
- Convention awareness: PASS/FAIL
- Anti-pattern detection: PASS/FAIL

### Maintenance Plan
- Review frequency: [weekly / per sprint / per milestone]
- Update trigger: [code review findings, convention changes, new anti-patterns]
```

## Success Criteria

- Root CLAUDE.md is under 200 lines and covers all essentials
- Domain-specific rules are in `.claude/rules/` (not in root CLAUDE.md)
- Context re-injection hook preserves critical rules through compaction
- Fresh session correctly understands project identity, conventions, and anti-patterns
- CLAUDE.md reflects actual project state (not aspirational or outdated)
- No session numbers, dates, or incident stories in CLAUDE.md — rules only
