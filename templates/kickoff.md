# Session Kickoff

**When to use:** Start of a new Claude Code session. Before you touch ANYTHING.

**Role:** You are the project's navigator. Your job is to fully understand the terrain before taking a single step.

---

**Focus for this session:** $ARGUMENTS

This is a new session. You know NOTHING yet. Do NOT assume, do NOT guess, do NOT start coding. Read first. Understand everything. Then confirm alignment before any work begins.

## Don't

- Don't start coding before reading the core docs below
- Don't read every .md in the repo — big knowledge bases and old handovers burn context; open docs on demand when a task touches them
- Don't assume you know the project from the file names
- Don't skip reading HANDOVER.md — it has critical context from the last session
- Don't make changes until the user confirms your understanding
- Don't ignore failing tests or build errors — report them first

## Step 1: Read Everything

Read these in full — no skimming:
- `CLAUDE.md` — project rules, overview, architecture (already loaded; reread if long)
- `README.md` — what this project is
- `HANDOVER.md` — current state and next steps (if exists). If it is over ~150 lines or stacks several "Session N" blocks, read only the newest block and flag the bloat to the user
- `package.json` / `pyproject.toml` / equivalent — dependencies, scripts
- `git log --oneline -20` — what happened recently (history lives here, not in .md files)

Then list (don't read) the rest: `ls docs/` and root `.md` files. Open one only when the task touches its topic. Files over ~50 KB: grep or read the relevant section, never the whole file.

## Step 2: Understand the Project

Answer these questions for yourself:
- What does this app do? Who uses it?
- What's the tech stack and why?
- What's the folder structure? What lives where?
- What are the key entry points and hot paths?
- What patterns and conventions does this codebase follow?
- What's the current state — working? broken? half-finished?

## Step 3: Understand Current State

- What was the last work done? Is it complete?
- Are there uncommitted changes? Understand what they are.
- Are there open TODOs, known bugs, or blocked tasks?
- What were the planned next steps from the last session?
- Is anything in a half-finished, fragile state?

## Step 4: Verify the Environment

Actually run these — don't assume they work:
- Can the project build? (`npm run build` / equivalent)
- Can it start? (`npm run dev` / equivalent)
- Do tests pass? (`npm test` / equivalent)
- Is the git state clean?
- Report ANY issues found.

## Step 5: Assess Session Risk Profile

Before planning, assess what kind of session this is:

| Risk Factor | Low | Medium | High |
|-------------|-----|--------|------|
| Scope | Single file | Multi-file | Architectural |
| Reversibility | Easy undo | Moderate | Hard to reverse |
| Dependencies | None | Some | Many systems |
| Familiarity | Known code | Partially known | New territory |
| Blast radius | Local change | Module-wide | System-wide |

**Session risk: [LOW / MEDIUM / HIGH]**

Map risk to verification depth:
- **LOW risk** — Standard verification (quick checks after changes)
- **MEDIUM risk** — Enhanced verification (test each change, cross-reference)
- **HIGH risk** — Full 7-layer falsification stack (`/verify-thorough` on every significant change)

## Step 6: Plan Your Context Budget

This is critical — context is finite:
- Estimate how much context this session needs
- If the task is large, plan for a handover before context runs out
- If the task needs more than one session, carry decisions in HANDOVER.md (Dead Ends) and commit messages — don't create new log files
- Always keep enough reserve to do a clean handover (~15%)

## Step 7: Confirm Alignment

Before ANY work:
- Summarize what you understand about the project (2-3 sentences)
- State the current priorities as you understand them
- State the assessed risk level and planned verification depth
- Ask clarifying questions if ANYTHING is unclear
- Do NOT start work until the user confirms your understanding

## Rules for This Session

- Follow all principles in PRINCIPLES.md (DRY, SOLID, KISS, YAGNI)
- Put the reasoning for decisions in commit messages; promote only durable rules to CLAUDE.md (one line each, no story)
- Commit regularly with clear, conventional messages
- If context gets low (~15%), STOP and switch to handover protocol immediately
- No heroics — if something is unclear, ask

## Success Criteria

- You can explain the project to someone in 30 seconds
- You know exactly what needs to be done and in what order
- The environment works and you've verified it
- Risk level is assessed and verification depth is planned
- User has confirmed your understanding before work begins
