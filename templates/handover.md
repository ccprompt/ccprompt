# Session Handover

**When to use:** When you're deliberately ending a session and want a thorough, complete handover. You have plenty of context — use it. This is the "proper goodbye" template. Not rushed, not panicked — methodical and comprehensive.

**Role:** You are a senior engineer wrapping up a shift. Your replacement needs the CURRENT STATE and the NEXT MOVE — not your diary.

---

**Session context:** $ARGUMENTS

You're ending this session by choice. Use that time to make the handover SHORT and TRUE, not long. A 120-line handover that is all signal beats a 2 MB one nobody can find the next step in.

## The Doc Contract (binding)

- **HANDOVER.md is OVERWRITTEN, never appended.** It describes the state NOW. No "Session N" blocks, no stacking under the previous handover.
- **Hard cap: 150 lines / 12 KB.** A global hook blocks commits that grow it past the cap.
- **History lives in git.** Commit lists, file-change lists, rollback hash chains and "then I did X" narrative go in commit messages, never in .md files. The previous handover is always recoverable with `git log -p -- HANDOVER.md`.
- **No archive files.** Don't create HANDOVER_ARCHIVE.md or similar — git IS the archive.
- **Durable lessons go to CLAUDE.md as one-line rules** (no session numbers, no story, no "found in S412"). If CLAUDE.md is at its cap (~200 lines / 20 KB), put the detail in `docs/rules/<topic>.md` and leave a one-line pointer in CLAUDE.md.

## Don't

- Don't paste the previous handover below yours — delete it, git has it
- Don't list commits or changed files — `git log --stat` does that better
- Don't leave vague next steps — "continue working on X" is not actionable
- Don't keep a trap that code or a test now guards — delete it
- Don't write for a reader with your context — write for a stranger

## Step 1: Reflect on the Session

- What was the goal? Where does it stand now?
- What surprised you? What would you do differently?
- Which of this session's lessons are DURABLE (belong in CLAUDE.md as a rule) and which are only true until the next commit (belong in the handover or nowhere)?

## Step 2: Secure All Work

- **Uncommitted changes?** → Commit with clear messages (the commit body is where the story goes), or `git stash` with a descriptive name
- **Partial implementations?** → Commit with `WIP:` prefix and explain what's missing in the commit message
- **Temporary workarounds?** → They go in Traps below — these are landmines for the next session
- **Run `git status`** → Nothing untracked and undocumented

## Step 3: Rewrite HANDOVER.md (overwrite the whole file)

```markdown
# Handover

Updated: [date] · Branch: [branch] · Last commit: [short hash]

## State
[3 to 8 lines. What works, what's broken, what's half done and exactly how to resume it.]

## Next (priority order)
1. **[Action]** — [file/area, what to do, why it's first]
2. **[Action]** — [...]
3. **[Action]** — [...]

## Mental Model
[Optional, max ~15 lines. Only the non-obvious understanding the next session needs for the NEXT steps. If it's durable, it belongs in CLAUDE.md or docs/ instead.]

## Traps (still live)
- **[Trap]** — [why it bites] → [how to avoid]

## Dead Ends (don't retry)
- **[Approach]** — [why it failed]. Keep only while it's still tempting.

## Open Questions
- [Unresolved question for the next session or the user]
```

Sections with nothing in them: delete the heading. Don't write "N/A".

## Step 4: Promote Durable Lessons

For each lesson worth keeping beyond the next session:
- One line in CLAUDE.md, stated as a rule ("Never X, because Y") — no session number, no date, no narrative
- Before adding, check whether an existing rule already covers it — edit that rule instead of adding a near-duplicate
- If CLAUDE.md is over ~200 lines, evict: move a topic's detail to `docs/rules/<topic>.md` with a one-line pointer
- User preferences and cross-project facts → persistent memory, not the repo

## Step 5: Final Verification

- [ ] HANDOVER.md was overwritten, not appended — exactly one handover in the file
- [ ] `wc -l HANDOVER.md` ≤ 150 and `wc -c` ≤ 12 KB
- [ ] No commit hashes lists, no file-change lists, no session narrative
- [ ] Next steps are specific enough to act on without re-reading any code
- [ ] `git status` is clean

## Success Criteria

- A stranger can read HANDOVER.md in under a minute and start on Next step 1 without a question
- The file holds one handover, the current one, within 150 lines
- Every durable lesson is a one-line rule in CLAUDE.md, and every story is in a commit message
