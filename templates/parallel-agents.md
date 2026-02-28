# Parallel Agent Orchestration

**When to use:** Large tasks that can be split across multiple agents working simultaneously. When a single session would take too long or consume too much context.

**Role:** You are a team lead coordinating multiple AI agents. Your job is to decompose work, assign ownership, prevent conflicts, and merge results. Think of yourself as a conductor, not a performer.

---

**Parallelize:** $ARGUMENTS

Working in a single session is like having one developer on the whole project. Parallel agents are like having a team. The key: each agent owns different files, works in isolation, and reports back. No conflicts, no wasted context.

## Don't

- Don't let two agents edit the same file (causes overwrites)
- Don't spawn more than 5 agents (coordination overhead kills productivity)
- Don't skip the decomposition step (unclear ownership = conflicts)
- Don't start parallel implementation before research is done (research first, implement second)
- Don't forget to merge and verify results after agents finish

## Step 1: Decompose the Task

Break the work into independent units. Each unit must:
- Touch different files than other units
- Be completable without waiting for other units
- Have clear success criteria
- Fit within a single agent's context window

If tasks have dependencies, identify the order. Dependent tasks run sequentially, independent tasks run in parallel.

## Step 2: Choose the Parallelization Method

**Git Worktrees (separate branches, separate files):**
```bash
claude --worktree task-a
claude --worktree task-b --tmux
claude --worktree task-c --tmux
```
Each worktree gets its own branch and working directory. Best for: feature work, migrations, multi-module changes.

**Custom Subagents (delegated from main session):**
Create `.claude/agents/task-name.md`:
```yaml
---
name: task-name
description: [What this agent does]
tools: Read, Grep, Glob, Edit, Write, Bash
model: sonnet
isolation: worktree
---

[Agent instructions here]
```
Best for: automated delegation where Claude decides when to spawn.

**Agent Teams (multi-agent coordination):**
Requires: `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`
Best for: tasks requiring agents to discuss findings with each other (e.g., debugging, code review from multiple perspectives).

## Step 3: Assign Ownership

Create a clear ownership table:

| Agent | Owns | Files | Goal |
|-------|------|-------|------|
| Agent A | [module/area] | [specific files] | [deliverable] |
| Agent B | [module/area] | [specific files] | [deliverable] |
| Agent C | [module/area] | [specific files] | [deliverable] |

Rules:
- No file appears in more than one agent's column
- Shared utilities: one agent modifies, others read-only
- If two agents need the same file, make one wait for the other

## Step 4: Write Agent Prompts

Each agent gets a detailed spawn prompt including:
- The specific task and expected deliverable
- The files it owns (and which files are read-only)
- Project conventions to follow (CLAUDE.md loads automatically)
- Success criteria for its piece of work
- What to do when done (mark task complete, update task list)

## Step 5: Launch and Monitor

Launch all agents. Monitor progress:
- Check task list for completion status
- Watch for agents that are stuck or spinning
- If an agent hits 2 failed corrections, intervene (revert and reassign)

For Agent Teams, use quality gates:
- `TeammateIdle` hook: if an agent is about to go idle, check if its work is actually done
- `TaskCompleted` hook: if a task is marked complete, verify the deliverable

## Step 6: The Scientific Debate (for Debugging)

When investigating a bug, spawn multiple agents with competing hypotheses:

"Investigate the login timeout bug. Agent A: hypothesis is a session expiry issue. Agent B: hypothesis is a network timeout. Agent C: hypothesis is a race condition. Each agent: investigate your hypothesis thoroughly, then try to DISPROVE the other agents' hypotheses. Report findings."

Theories that survive adversarial challenge from multiple investigators are far more likely to be correct than theories from a single agent that may anchor on its first idea.

## Step 7: Merge and Verify

After all agents complete:
- Review each agent's changes
- Merge worktree branches (resolve any conflicts)
- Run the full test suite on the merged result
- Verify integration (agents tested in isolation, integration may reveal issues)
- Run `/verify-thorough` on the combined changes

## Output Format

```
## Parallel Agent Report

### Task Decomposition
| Agent | Task | Files Owned | Status |
|-------|------|-------------|--------|
| [A]   | [task] | [files] | COMPLETE/IN-PROGRESS/BLOCKED |
| [B]   | [task] | [files] | COMPLETE/IN-PROGRESS/BLOCKED |

### Agent Results
**Agent A:** [summary of what was done, any issues]
**Agent B:** [summary of what was done, any issues]

### Merge Status
- Conflicts: [none / list]
- Integration test: PASS/FAIL
- Full test suite: PASS/FAIL

### Issues Found During Integration
[Problems that emerged when combining agent outputs]

### Time Saved
- Sequential estimate: [hours]
- Parallel actual: [hours]
```

## Success Criteria

- Task cleanly decomposed with no file ownership conflicts
- All agents completed their assigned work
- Merged result passes full test suite
- Integration verified (agents' changes work together)
- No file conflicts during merge
