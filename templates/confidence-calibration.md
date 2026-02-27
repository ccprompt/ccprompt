# Confidence Calibration

**When to use:** After any verification or significant implementation. Track your predicted confidence against actual outcomes to improve calibration over time. Based on Tetlock's superforecasting research — the gap between confidence and reality is where bugs hide.

**Role:** You are a calibration scientist. Your job is to measure the gap between how confident you FEEL and how correct you actually ARE, then use that data to improve future estimates.

---

**What to calibrate:** $ARGUMENTS

Rate your confidence BEFORE verification, then record actual results AFTER. Track the gap.

## Don't

- Don't skip the pre-verification rating — hindsight bias will corrupt it
- Don't round confidence to nice numbers (50%, 75%, 90%) — use precise estimates
- Don't only track successes — failures are the most valuable data points
- Don't ignore systematic patterns — if you're consistently overconfident at 85%, adjust

## Step 1: Pre-Verification Confidence Rating

BEFORE running any verification, rate your confidence:

```
## Pre-Verification Assessment

### Claim: [What you believe to be true]
**Confidence:** [X]% (0-100)

### Reasoning:
- Evidence FOR: [what supports this confidence]
- Evidence AGAINST: [what undermines it]
- Unknowns: [what you don't know that could change the answer]

### What would change my mind:
- [Specific evidence that would lower confidence]
- [Specific evidence that would raise confidence]
```

## Step 2: Verify (Run the Tests)

Now actually verify. Use `/verify-thorough` for important claims or standard testing for routine ones.

Document what you find — exact results, not summaries.

## Step 3: Post-Verification Reality Check

```
## Post-Verification Result

### Actual outcome: [CORRECT / PARTIALLY CORRECT / INCORRECT]
**Details:** [What actually happened]

### Confidence gap: [Pre-confidence]% → [Actual result]
- If CORRECT at 85%+ → Good calibration
- If CORRECT at <70% → You were under-confident (rare but real)
- If INCORRECT at 80%+ → OVERCONFIDENCE — this is the danger zone
- If INCORRECT at <50% → Expected, but why did you proceed without verifying?
```

## Step 4: Update Calibration Log

Append to your session's calibration tracking:

```
## Calibration Log

| # | Claim | Pre-Confidence | Actual | Gap | Category |
|---|-------|---------------|--------|-----|----------|
| 1 | [claim] | [X]% | pass/fail | [+/-Y]% | [type] |
| 2 | [claim] | [X]% | pass/fail | [+/-Y]% | [type] |

### Session Calibration Score
- Predictions made: [N]
- Correct: [X] / Incorrect: [Y]
- Average confidence on correct: [Z]%
- Average confidence on incorrect: [W]%
- Overconfidence incidents (wrong at 80%+): [count]
```

## Step 5: Identify Patterns

After 3+ calibration entries, look for systematic bias:

- **Consistently overconfident?** → Reduce all estimates by your average gap
- **Overconfident in specific areas?** → Flag those areas for deeper verification
- **Well-calibrated?** → Your confidence ratings can be trusted for future decisions
- **Under-confident?** → You're being too cautious, can move faster on these

Common overconfidence triggers:
- "The code looks right" (visual inspection without running)
- "I've done this before" (pattern matching without verifying context)
- "It's a simple change" (underestimating blast radius)
- "The tests pass" (tests may not cover the actual risk)

## Output Format

```
## Confidence Calibration: [What Was Calibrated]

**Pre-confidence:** [X]%
**Actual result:** [CORRECT/INCORRECT]
**Gap:** [analysis]

**Pattern update:** [What this teaches about your calibration in this domain]
**Adjustment:** [How to improve future estimates]
```

## Success Criteria

- Confidence was rated BEFORE verification (no hindsight bias)
- Gap between prediction and reality is measured
- Patterns are identified after 3+ data points
- Future confidence estimates are adjusted based on tracked patterns
