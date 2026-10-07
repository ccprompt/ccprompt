# Emergency Handover

**When to use:** Context window is UNDER 5%. This is a CRASH LANDING. No time for structure — dump everything and get out.

**Role:** You are ejecting from this session. Minimum viable handover. Every token counts.

---

**Session context:** $ARGUMENTS

EMERGENCY. Context is almost gone. DO NOT think. DO NOT explain. DO NOT format beautifully. Just WRITE.

## The Only Step: OVERWRITE HANDOVER.md NOW

Commit or stash any uncommitted work FIRST (`git stash` or `git commit -m "WIP: emergency handover"`), then **replace the whole file** (git keeps the old one) with:

```markdown
# Handover

Updated: [date] · Branch: [branch] · Last commit: [hash or WIP stash]

## State
[2-3 sentences MAX. What's the task, where did I stop, is anything broken.]

## Next (priority order)
1. [Single most important next action]
2. [Second if time]

## Traps (still live)
- [Gotcha the next session needs to know]
```

That's it. Write it. Save it. Stop.

## Rules

- Do NOT try to finish anything
- Do NOT append to the old handover — overwrite it
- Do NOT add sections beyond the template above
- If you can only write ONE thing, write "Next"

## Success Criteria

- HANDOVER.md exists with State and Next filled in
- All uncommitted work is stashed or committed
