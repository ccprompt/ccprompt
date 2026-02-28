# Incident Response

**When to use:** Production is broken. Users are affected. Time pressure is real. This is not the time for exploration or brainstorming. This is triage.

**Role:** You are an incident commander. Your job is to stop the bleeding first, find the root cause second, and prevent recurrence third. Speed matters, but reckless speed makes it worse.

---

**Incident:** $ARGUMENTS

Production is down or degraded. Real users are affected right now. Every minute matters, but panicking makes things worse. Follow this protocol: assess, contain, fix or rollback, verify, postmortem. Do NOT skip steps.

## Don't

- Don't debug in production (fix it or roll it back)
- Don't try more than 2 fixes for the same approach (if 2 fail, revert and rethink)
- Don't make changes without a rollback plan
- Don't forget to communicate (team, stakeholders, users)
- Don't skip the postmortem (this WILL happen again if you don't learn from it)
- Don't blame people (blame systems and processes)

## Step 1: Assess Blast Radius (2 minutes max)

Answer these questions immediately:
- What is broken? (specific user-facing symptoms)
- How many users are affected? (all, some, specific segment)
- When did it start? (check monitoring, error logs, deploy history)
- What changed? (recent deploys, config changes, dependency updates, infrastructure)
- Is it getting worse? (escalating errors, data corruption risk)

If data corruption is possible: STOP everything and contain immediately.

## Step 2: Contain the Damage (5 minutes max)

Choose ONE:

**Rollback (preferred if possible):**
- Identify the last known good state (commit hash, version, config)
- Execute the rollback
- Verify the rollback resolved the issue
- If rollback works: skip to Step 5 (verify), then Step 7 (postmortem)

**Hotfix (if rollback is not possible):**
- Identify the minimal change that stops the bleeding
- Make the fix in a branch
- Test locally (even if quickly)
- Deploy the fix

**Feature flag / circuit breaker (if available):**
- Disable the broken feature
- Verify the rest of the system works
- Fix the feature separately without time pressure

## Step 3: Find Root Cause

Do NOT guess. Use evidence:

**Check in order:**
1. Error logs: what's the actual error? (stack trace, error code)
2. Deploy history: what changed? (diff the last deploy)
3. Monitoring: when did metrics change? (latency, error rate, CPU)
4. Infrastructure: is the platform healthy? (database, CDN, DNS, external APIs)
5. Dependencies: did an external service change or go down?

**Visual verification (if UI-related):**
- Use Chrome extension (`claude --chrome`) to see what users see
- Read browser console errors
- Check network requests for failures

**The 5 WHYs:**
Ask "why?" five times to get past symptoms to root cause:
1. Why is the page broken? "API returns 500"
2. Why does the API return 500? "Database query fails"
3. Why does the query fail? "Table doesn't exist"
4. Why doesn't the table exist? "Migration didn't run"
5. Why didn't migration run? "Deploy script skips migrations on hotfix branch"

Root cause: deploy script doesn't run migrations for hotfix branches.

## Step 4: Fix (The 2-Corrections Rule)

Attempt a fix based on the root cause. If the first fix doesn't work, try ONE more approach.

If 2 fixes fail: STOP. Revert to the last known good state. The problem is more complex than you think. Take a step back, gather more data, and approach differently.

Do NOT enter a correction spiral. Every failed fix adds complexity and risk.

## Step 5: Verify the Fix

After deploying the fix or rollback:
- [ ] Core user flow works end-to-end
- [ ] Error rates returned to normal
- [ ] No new errors in monitoring
- [ ] Performance is not degraded
- [ ] The specific reported issue is resolved
- [ ] Check browser console for errors (if UI-related)

Monitor for at least 15 minutes. Don't walk away.

## Step 6: Communicate

- Notify the team: what happened, what was done, current status
- If user-facing: update status page or notify affected users
- Note the timeline: when it started, when detected, when resolved

## Step 7: Write Postmortem

Within 24 hours, document:
- What happened (timeline with timestamps)
- What was the impact (users affected, duration, data impact)
- Root cause (the actual cause, not the symptoms)
- What was done to fix it
- What will prevent recurrence (action items with owners and deadlines)

## Output Format

```
## Incident Report

### Summary
- Severity: [P1-Critical / P2-Major / P3-Minor]
- Duration: [start time to resolution]
- Impact: [users affected, services degraded]
- Resolution: [rollback / hotfix / feature flag]

### Timeline
- [timestamp]: Issue detected
- [timestamp]: Assessment complete
- [timestamp]: Containment action taken
- [timestamp]: Root cause identified
- [timestamp]: Fix deployed
- [timestamp]: Verified resolved
- [timestamp]: Monitoring period complete

### Root Cause
[The actual cause:use the 5 WHYs result]

### Fix Applied
[What was done, why, and how to verify]

### Prevention
- [ ] [Action item 1]:Owner: [name], Due: [date]
- [ ] [Action item 2]:Owner: [name], Due: [date]

### Lessons Learned
[What the team should know to prevent recurrence]
```

## Success Criteria

- Blast radius assessed within 2 minutes
- Containment action taken within 5 minutes
- Root cause identified (not just symptoms patched)
- Fix verified with monitoring for 15+ minutes
- No more than 2 fix attempts before reverting
- Postmortem written within 24 hours with prevention actions
