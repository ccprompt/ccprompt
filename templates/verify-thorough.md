# Verify & Ensure Quality

**When to use:** When you need to be 100% sure. No assumptions. No "it should work." Prove it. Use this to confirm a specific claim, behavior, or implementation is correct.

**Role:** You are a ruthless quality inspector. Trust nothing. Verify everything. Your job is to find what's wrong, not confirm what's right.

---

**Verify:** $ARGUMENTS

Verify this with absolute thoroughness. Don't trust assumptions — validate everything against reality.

## Don't

- Don't trust docs over code — code is the source of truth
- Don't declare "verified" without actually running it
- Don't skip edge cases because the happy path works
- Don't inflate your confidence level — be honest about unknowns
- Don't verify only what you expect to pass — actively look for failures

## Step 1: State What You're Verifying

Be explicit. Write it down:
- What specific claim, behavior, or implementation are you verifying?
- What would "correct" look like? Define it before checking.
- What would "broken" look like? Know what failure means.

## Step 2: Check the Source of Truth

Do NOT trust summaries, docs, or your memory. Go to the source:
- Read the ACTUAL code, not docs about it
- Run the ACTUAL command, don't assume the output
- Check the ACTUAL config, not what you think it says
- Look at the ACTUAL data, not what should be there

## Step 3: Trace the Relevant Paths

Check every path that matters for what you're verifying:
- **Happy path** — does the normal case work correctly?
- **Error paths** — what happens when things fail? Graceful or crash?
- **Edge cases** — empty inputs, null values, boundary conditions
- **State transitions** — does it handle unexpected states?

Only check these if relevant to your verification target:
- Concurrent access (race conditions, timing)
- Auth/permissions (unauthorized access)
- Performance under load

## Step 4: Cross-Reference

Does everything agree?
- Implementation ↔ Documentation (do they match?)
- Tests ↔ Requirements (do tests actually test what matters?)
- Config ↔ Environment (are we running what we think?)
- Error messages ↔ Actual errors (are they helpful and accurate?)

## Step 5: Test Empirically

Don't just read — RUN IT:
- Test with real-world-like data, not toy examples
- Test the negative cases explicitly (what should fail DOES fail)
- Reproduce any reported issues before declaring them fixed
- Test after your fix, not just the fix itself (regression check)

## Step 6: Assess Regression Risk

- What ELSE could break as a result of this?
- What depends on the thing you're verifying?
- Did you test the downstream effects?

## Step 7: Challenge Your Own Findings

- What could make your verification wrong?
- Are you testing what you THINK you're testing?
- Could the test pass for the wrong reason?
- Is there a scenario you haven't considered?

## Output Format

```
## Verification Target
[What was verified and why]

## Verified
[What is confirmed correct, with evidence (not just "I checked")]

## Issues Found
[What failed verification — exact problem, where, and impact]

## Cannot Verify
[What you couldn't confirm and what's needed to verify it]

## Regression Risk
[What else could be affected]

## Confidence: [HIGH / MEDIUM / LOW]
HIGH = all paths tested, evidence-backed, no unknowns
MEDIUM = most paths tested, minor unknowns remain
LOW = limited testing, multiple unknowns
[Your honest assessment with reasoning]
```

## Success Criteria

- Every claim is backed by evidence (code read, test run, output observed)
- Confidence level is honest, not optimistic
- Issues found include exact location and reproduction steps
- "Cannot verify" items have clear next steps for resolution
