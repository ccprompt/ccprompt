# Read Handover

**When to use:** Start of a new session when a previous session left a HANDOVER.md. The companion to `/low-context-handover` — that one writes it, this one reads it and picks up where the last session stopped.

**Role:** You are a session successor. Your job is to absorb everything the previous session documented, verify the current state matches what was described, and seamlessly continue the work without re-exploring dead ends or losing decisions.

---

**Continue from:** $ARGUMENTS

A previous session ended and left you a handover. Your job is to pick up EXACTLY where it stopped — not restart, not re-investigate, not second-guess decisions unless there's clear evidence they were wrong. Read everything, verify the state, then continue.

## Don't

- Don't skip reading HANDOVER.md — it's the single most important document right now
- Don't re-explore approaches the previous session already rejected (check the Decisions table)
- Don't assume the handover is wrong — verify first, then trust or challenge with evidence
- Don't start new work before finishing the in-progress items from the handover
- Don't ignore the rollback info — you may need it
- Don't redo work that's already marked as completed without checking it first

## Step 1: Read the Handover

Read HANDOVER.md completely. Extract and internalize:

1. **Summary** — What happened? What's the current state?
2. **Completed items** — What's done? Don't redo these.
3. **In-progress items** — What's partially done? This is your starting point.
4. **Decisions made** — What was chosen and WHY? What was rejected and WHY?
5. **Known issues** — What's broken or fragile?
6. **Next steps** — What's the priority order?
7. **Rollback info** — What's the escape plan if things go wrong?
8. **Files modified** — What changed recently?

## Step 2: Read Supporting Context

After the handover, read in this order:
- `CLAUDE.md` — project rules and conventions (always authoritative)
- `PRINCIPLES.md` — engineering principles (if exists)
- Recent git log — verify the commits match what the handover describes
- Any files listed in "Files Modified This Session"

## Step 3: Verify Current State

Trust but verify. The handover describes expected state — check if reality matches:

- **Git status**: Is it clean? Are there uncommitted changes or WIP commits?
- **Completed items**: Spot-check 1-2 completed items — do they actually work?
- **In-progress items**: Look at the actual code — does it match the described state?
- **Tests**: Run the test suite — do they pass? Do any new failures exist?
- **Build**: Does the project build/start without errors?

If reality doesn't match the handover, document the discrepancies before continuing.

## Step 4: Absorb Decisions

This is critical. The previous session made decisions for reasons. Before continuing:

- Review every row in the Decisions table
- Understand WHY each alternative was rejected
- Do NOT revisit rejected approaches unless you have NEW information the previous session didn't have
- If you disagree with a decision, explain why with evidence before changing course

## Step 5: Plan Continuation

Based on the handover's "Next Steps" and your verification:

1. **Finish in-progress items first** — don't start new work with loose ends
2. **Follow the priority order** from the handover unless verification revealed a reason to change it
3. **Identify any blockers** the previous session didn't anticipate
4. **Estimate context budget** — will you finish, or should you plan for another handover?

## Step 6: Confirm Alignment

Before starting any work, report to the user:

```
## Handover Received

**Previous session:** [one-sentence summary of what happened]
**Current state:** [verified state — matches handover? any discrepancies?]
**Decisions inherited:** [list key decisions you're carrying forward]
**Continuing with:** [what you'll work on first]
**Estimated scope:** [can you finish, or plan for another handover?]
**Questions:** [anything unclear from the handover?]
```

Wait for user confirmation before proceeding.

## Step 7: Continue Work

Once confirmed:
- Pick up from the in-progress items
- Follow the next steps in priority order
- Honor all inherited decisions unless explicitly overridden
- If context gets low (~40%), start thinking about your own handover
- If context hits ~15%, stop and run `/low-context-handover`

## Success Criteria

- HANDOVER.md was read completely — no sections skipped
- Current state was verified against the handover description
- No rejected approaches were re-explored without new evidence
- All inherited decisions were acknowledged and respected
- The user confirmed alignment before work started
- Work continued from exactly where the previous session stopped
