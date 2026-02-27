# Correction Stop (2-Corrections Rule)

**When to use:** When a fix attempt fails. After the SECOND failed correction on the same issue, this protocol is MANDATORY. No exceptions.

**Role:** You are the circuit breaker. Your job is to prevent the sunk cost spiral where each failed fix leads to another, compounding complexity until the codebase is worse than when you started.

---

**Issue being corrected:** $ARGUMENTS

You have hit the correction limit. STOP fixing. STOP patching. The current approach is not working.

## Don't

- Don't attempt a third correction on the same approach — the data says it won't work
- Don't "just try one more thing" — that's the sunk cost fallacy talking
- Don't preserve failing code out of effort invested — effort spent is gone regardless
- Don't blame the tools — if two corrections failed, the APPROACH is wrong

## The Rule

**After 2 failed corrections on the same issue:**

1. **STOP** — No more fixes on this path
2. **REVERT** — Go back to last known good state
3. **RETHINK** — Analyze WHY both corrections failed
4. **RESTART** — New approach from scratch

This is not optional. This is not a suggestion. Two strikes and the approach is out.

## Step 1: Document the Failures

Before reverting, capture what happened:

```
## Correction Log

### Attempt 1
- What was tried: [exact change]
- What happened: [exact failure]
- Why it failed: [root cause if known]

### Attempt 2
- What was tried: [exact change]
- What happened: [exact failure]
- Why it failed: [root cause if known]

### Pattern
- What do both failures have in common?
- What assumption underlies both attempts?
```

## Step 2: Revert to Last Known Good State

- Identify the last commit/state where the code worked
- `git stash` or `git checkout` to restore it
- Verify the good state actually works (run it, don't assume)

## Step 3: Root Cause Analysis

The failures are data. Use them:

- What assumption did both corrections share?
- Is the problem actually where you think it is?
- Are you treating a symptom instead of the cause?
- Is there a deeper architectural issue?
- Would someone unfamiliar with your attempts solve this differently?

## Step 4: Generate Alternative Approaches

List at least 3 fundamentally different approaches:

1. [Approach A] — completely different from failed attempts
2. [Approach B] — attacks the problem from another angle
3. [Approach C] — questions whether the problem is correctly defined

Pick the one that shares the LEAST assumptions with the failed approach.

## Step 5: Restart with Fresh Approach

- Start implementation from scratch using the new approach
- Reset your correction counter to 0
- If THIS approach also hits 2 failed corrections — escalate to user

## Output Format

```
## Correction Stop Triggered

### Failed Approach
[What was tried and why it failed twice]

### Shared Assumption
[The flawed assumption both corrections relied on]

### New Approach
[Fundamentally different approach chosen]

### Why This Is Different
[What assumption this approach does NOT share with the failed one]
```

## Success Criteria

- Failed attempts are documented with root causes
- Code is reverted to known good state
- New approach shares no assumptions with failed approach
- Correction counter is reset
