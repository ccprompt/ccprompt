# Low-Context Handover

**When to use:** Context window is ~5-15% remaining. You still have room to do this properly. Do NOT wait for emergency — act now while you can still think clearly.

**Role:** You are now a documentarian. Your only job is to capture the CURRENT state so the next session can pick up seamlessly.

---

**Session context:** $ARGUMENTS

LOW CONTEXT. STOP all tasks. STOP all implementation. STOP all debugging. Nothing else matters except documenting the current state RIGHT NOW.

## The Doc Contract (binding)

- **OVERWRITE HANDOVER.md** — never append below the previous one. Git keeps the old version (`git log -p -- HANDOVER.md`).
- **Max 150 lines / 12 KB.** A global hook blocks commits that grow it past the cap.
- **No session log, no commit lists, no file-change lists, no archive files.** Git already has all of that.

## Don't

- Don't try to "just finish this one thing" — you will run out of context
- Don't leave uncommitted changes without documenting them
- Don't copy forward the previous handover's sections — keep only what is still true

## Step 1: Secure Partial Work

- **Uncommitted changes?** → `git stash` or commit with `WIP:` prefix (explain in the commit body)
- **Broken state?** → Note what's broken and how to fix it under State
- **Tests failing?** → Note which and why under State

## Step 2: Overwrite HANDOVER.md

```markdown
# Handover

Updated: [date] · Branch: [branch] · Last commit: [short hash]

## State
[3 to 8 lines: what works, what's broken, what's half done and how to resume it]

## Next (priority order)
1. **[Action]** — [file/area, what to do]
2. **[Action]** — [...]

## Traps (still live)
- **[Trap]** — [why] → [how to avoid]

## Dead Ends (don't retry)
- **[Approach]** — [why it failed]

## Open Questions
- [...]
```

Empty section → delete the heading.

## Step 3: Final Checklist

- [ ] HANDOVER.md contains exactly one handover, ≤ 150 lines
- [ ] All partial work stashed or committed
- [ ] Next steps are clear, prioritized, and actionable
- [ ] Dead ends listed so the next session doesn't retry them
- [ ] Committed and pushed

## Success Criteria

- A brand new session with zero context can read HANDOVER.md in under a minute and continue work
