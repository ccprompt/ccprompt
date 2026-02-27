# Context Budget Plan

**When to use:** At session start or before any complex task. Estimate complexity vs remaining context, plan subagent usage and checkpoints upfront. Prevention beats emergency handover.

**Role:** You are a resource planner. Context is your budget. Every token spent is gone. Plan spending before you start, not after you're broke.

---

**Session focus:** $ARGUMENTS

Before diving in, plan how you'll spend your context budget. Running out mid-task is the #1 cause of quality degradation.

## Don't

- Don't start a large task without estimating context cost
- Don't assume "I'll have enough" — measure, don't guess
- Don't wait until emergency to think about context
- Don't treat subagents as optional — they're your scaling strategy

## Step 1: Estimate Task Complexity

Rate the session's work:

| Factor | Low | Medium | High |
|--------|-----|--------|------|
| Files to read | 1-3 | 4-10 | 10+ |
| Files to modify | 1-2 | 3-5 | 6+ |
| Research needed | Minimal | Some exploration | Deep dive |
| Decision complexity | Obvious | 2-3 options | Architectural |
| Verification depth | Quick check | Standard | Full 5-layer |

**Complexity score:** [Low / Medium / High / Multi-session]

## Step 2: Plan Context Allocation

Based on complexity, allocate your context budget:

```
## Context Budget

| Phase | % Budget | What |
|-------|----------|------|
| Understanding | 15-20% | Read files, understand state |
| Planning | 5-10% | Design approach, confirm with user |
| Implementation | 40-50% | Write code, make changes |
| Verification | 15-20% | Test, verify, fix issues |
| Reserve | 15% | MANDATORY — handover buffer |
| TOTAL | 100% | |
```

Adjust percentages based on task type:
- Research-heavy: increase Understanding to 30%, reduce Implementation
- Complex implementation: increase Implementation to 50%, use subagents for research
- Bug fix: increase Understanding to 25% (find root cause), reduce Planning

## Step 3: Plan Subagent Usage

Subagents preserve main context. Plan their use:

- **Exploration agents** — for reading large files, searching codebases
- **Translation agents** — for repetitive tasks across files/languages
- **Verification agents** — for running tests, checking outputs
- **Research agents** — for understanding unfamiliar code or APIs

```
## Planned Subagent Delegations
1. [Task] → [Agent type] — saves ~[X]% main context
2. [Task] → [Agent type] — saves ~[X]% main context
```

## Step 4: Set Checkpoint Schedule

Plan when to check context health:

| Checkpoint | Context Remaining | Action |
|------------|-------------------|--------|
| Green | 60%+ | Continue normally |
| Yellow | 40-60% | Compress conversation, assess remaining work |
| Orange | 25-40% | Finish current task only, prepare handover |
| Red | <25% | STOP — `/low-context-handover` immediately |

## Step 5: Define Session Success Criteria

What MUST be done this session vs what's nice-to-have:

```
## Must Complete (non-negotiable)
1. [Critical deliverable]
2. [Critical deliverable]

## Should Complete (if context allows)
3. [Important but deferrable]
4. [Important but deferrable]

## Nice to Have (stretch goals)
5. [Only if everything else done]
```

## Output Format

```
## Context Plan: [Session Focus]

**Complexity:** [Low/Medium/High/Multi-session]
**Estimated phases:** [list with % allocations]
**Subagents planned:** [count and purposes]
**Checkpoint schedule:** [Green/Yellow/Orange/Red thresholds]

### Must Complete
[Numbered list]

### Handover Trigger
[Specific condition that triggers handover protocol]
```

## Success Criteria

- Context budget is allocated before work begins
- Subagent usage is planned, not reactive
- Checkpoints are defined with clear actions
- Session goals are prioritized (must/should/nice-to-have)
- Reserve buffer is non-negotiable 15%
