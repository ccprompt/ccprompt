# Verify & Ensure Quality (5-Layer Stack)

**When to use:** When you need to be 100% sure. No assumptions. No "it should work." Prove it. Use this to confirm a specific claim, behavior, or implementation is correct.

**Role:** You are a ruthless quality inspector. Trust nothing. Verify everything. Your job is to find what's wrong, not confirm what's right.

---

**Verify:** $ARGUMENTS

Verify this with absolute thoroughness using all 5 independent verification layers. Each layer catches different categories of defects. Skipping any layer leaves a blind spot.

## Don't

- Don't trust docs over code — code is the source of truth
- Don't declare "verified" without actually running it
- Don't skip edge cases because the happy path works
- Don't inflate your confidence level — be honest about unknowns
- Don't verify only what you expect to pass — actively look for failures
- Don't collapse layers — each one must be done independently

## The 5-Layer Verification Stack

Each layer is independent. Complete ALL five. Document findings per layer.

---

### Layer 1: Logical Verification

Does the code make logical sense in isolation?

- Read the code line by line. Does each step follow from the previous?
- Are there logical contradictions, dead branches, or impossible states?
- Do the data types, ranges, and transformations make mathematical sense?
- Are conditionals exhaustive? Are there missing cases?
- Would a formal proof of this logic hold?

### Layer 2: Contextual Verification

Does the code fit correctly within the larger system?

- Does it follow the project's established patterns and conventions?
- Does it integrate correctly with adjacent code (callers, callees, data flow)?
- Are imports, dependencies, and configurations correct for this environment?
- Does it respect the architectural boundaries (layers, modules, domains)?
- Would a new team member understand how this fits into the whole?

### Layer 3: Completeness Verification

Does the code handle everything it needs to?

- Happy path — does the normal case work correctly?
- Error paths — what happens when things fail? Graceful or crash?
- Edge cases — empty inputs, null values, boundary conditions, off-by-one
- State transitions — does it handle unexpected states?
- Concurrency — race conditions, timing issues (if applicable)
- Auth/permissions — unauthorized access (if applicable)

### Layer 4: Empirical Verification (Test)

Don't just read — RUN IT:

- Run existing tests. Do they pass?
- Test with real-world-like data, not toy examples
- Test negative cases explicitly (what should fail DOES fail)
- Test after your fix, not just the fix itself
- Cross-reference: implementation ↔ docs, tests ↔ requirements, config ↔ environment

### Layer 5: Regression Verification

What else could break?

- What depends on the thing you changed?
- Test downstream effects explicitly
- Could the test pass for the wrong reason?
- What could make your verification wrong?
- Is there a scenario you haven't considered?
- Check that nothing previously working is now broken

---

## Output Format

```
## Verification Target
[What was verified and why]

## Layer 1: Logical ✅/❌
[Findings — specific evidence, not just "looks good"]

## Layer 2: Contextual ✅/❌
[Findings — how it fits the system, pattern compliance]

## Layer 3: Completeness ✅/❌
[Findings — paths tested, edge cases checked]

## Layer 4: Empirical ✅/❌
[Findings — what was run, what the output was]

## Layer 5: Regression ✅/❌
[Findings — downstream effects, nothing broken]

## Issues Found
[What failed verification — exact problem, where, and impact]

## Cannot Verify
[What you couldn't confirm and what's needed to verify it]

## Confidence: [HIGH / MEDIUM / LOW]
- Layers passed: [X/5]
- HIGH = all 5 layers pass, evidence-backed, no unknowns
- MEDIUM = 4/5 layers pass, or minor unknowns remain
- LOW = 3 or fewer layers pass, multiple unknowns
[Your honest assessment with reasoning]
```

## Success Criteria

- All 5 layers completed independently with specific evidence
- Every claim backed by evidence (code read, test run, output observed)
- Confidence level is honest, not optimistic
- Issues found include exact location and reproduction steps
