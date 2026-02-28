# Setup Hooks

**When to use:** Setting up or updating Claude Code hooks for automated verification. When you want deterministic quality gates that fire every time, not advisory instructions that AI can ignore.

**Role:** You are a verification infrastructure engineer. Your job is to wire up hooks that make quality automatic, so the developer can focus on judgment instead of remembering checklists.

---

**Hook setup for:** $ARGUMENTS

Hooks are the most important tool in the paranoid developer's arsenal. They are deterministic: they fire every time, regardless of context pressure, model mood, or conversation length. Configure them once, verify forever.

## Don't

- Don't rely on CLAUDE.md instructions for things that MUST happen (use hooks instead)
- Don't use `--dangerously-skip-permissions` as a shortcut (configure specific permissions)
- Don't forget the `stop_hook_active` check in Stop hooks (causes infinite loops)
- Don't add hooks without testing them manually first
- Don't use agent hooks for simple tasks (command hooks are faster and cheaper)

## Step 1: Assess What Needs Automation

Review the project and determine which verification steps should be hooks:

**Always automate (PostToolUse):**
- Code formatting (Prettier, Black, gofmt)
- Linting (ESLint, Pylint, Clippy)

**Strongly recommend (Stop):**
- Test suite execution
- Type checking (TypeScript, mypy)

**Project-specific (PreToolUse):**
- Protect sensitive files (.env, credentials, lock files)
- Block writes to generated files

**Context management (SessionStart):**
- Re-inject critical reminders after compaction

## Step 2: Configure PostToolUse Hooks (Format + Lint)

Create or update `.claude/settings.json` (project-level) or `~/.claude/settings.json` (user-level):

For JavaScript/TypeScript projects:
```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Edit|Write",
      "hooks": [{
        "type": "command",
        "command": "jq -r '.tool_input.file_path' | xargs npx prettier --write 2>/dev/null; exit 0"
      }]
    }]
  }
}
```

For Python projects:
```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Edit|Write",
      "hooks": [{
        "type": "command",
        "command": "jq -r '.tool_input.file_path' | xargs python -m black 2>/dev/null; exit 0"
      }]
    }]
  }
}
```

Adapt for the project's actual formatter and linter.

## Step 3: Configure Stop Hooks (Test Gate)

The Stop hook prevents Claude from calling a task "done" until tests pass.

**Command type (simple, fast):**
```json
{
  "hooks": {
    "Stop": [{
      "hooks": [{
        "type": "command",
        "command": "INPUT=$(cat); if [ \"$(echo $INPUT | jq -r '.stop_hook_active')\" = \"true\" ]; then exit 0; fi; npm test 2>&1 | tail -5; if [ $? -ne 0 ]; then echo '{\"decision\": \"block\", \"reason\": \"Tests are failing. Fix them before finishing.\"}'; exit 2; fi"
      }]
    }]
  }
}
```

**Agent type (comprehensive, self-fixing):**
```json
{
  "hooks": {
    "Stop": [{
      "hooks": [{
        "type": "agent",
        "prompt": "Run the test suite. If any test fails, fix the issue and re-run until all pass.",
        "timeout": 120
      }]
    }]
  }
}
```

CRITICAL: Always check `stop_hook_active` in command hooks to prevent infinite loops. Agent hooks handle this automatically.

## Step 4: Configure PreToolUse Hooks (File Protection)

Block AI from modifying sensitive files:

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Edit|Write",
      "hooks": [{
        "type": "command",
        "command": "INPUT=$(cat); FILE=$(echo $INPUT | jq -r '.tool_input.file_path // empty'); for p in .env .env.local credentials secrets package-lock.json; do if echo \"$FILE\" | grep -q \"$p\"; then echo \"BLOCKED: Cannot modify $FILE (protected file)\" >&2; exit 2; fi; done; exit 0"
      }]
    }]
  }
}
```

## Step 5: Configure SessionStart Hooks (Context Re-injection)

Re-inject critical reminders after context compaction:

```json
{
  "hooks": {
    "SessionStart": [{
      "matcher": "compact",
      "hooks": [{
        "type": "command",
        "command": "echo 'REMINDER: [Your critical project rules here]. Run tests before committing. Follow the patterns in CLAUDE.md.'"
      }]
    }]
  }
}
```

## Step 6: Test Every Hook

Manually trigger each hook and verify:
- PostToolUse: Edit a file, confirm formatting runs
- Stop: Complete a task, confirm tests run
- PreToolUse: Try to edit a protected file, confirm it's blocked
- SessionStart: Run `/clear`, confirm reminder appears

Fix any issues before relying on the hooks.

## Step 7: Configure Permissions

Set up permissions to pre-approve safe commands:

```
/permissions
```

Add wildcards for common safe operations:
- `Bash(npm run *)` or `Bash(bun run *)`
- `Bash(git log *)`, `Bash(git diff *)`, `Bash(git status *)`
- `Bash(npx prettier *)`, `Bash(npx eslint *)`

Never blanket-approve `Bash(*)`.

## Output Format

```
## Hook Configuration Report

### Hooks Configured
- PostToolUse (Edit|Write): [formatter/linter command]
- Stop: [test command or agent prompt]
- PreToolUse (Edit|Write): [protected files list]
- SessionStart (compact): [re-injection message]

### Configuration Location
- File: [path to settings.json]
- Scope: [project / user]

### Verification Results
- [ ] PostToolUse fires on edit: PASS/FAIL
- [ ] Stop runs tests on completion: PASS/FAIL
- [ ] PreToolUse blocks protected files: PASS/FAIL
- [ ] SessionStart re-injects after compact: PASS/FAIL

### Permissions Configured
[List of pre-approved commands]

### Notes
[Any project-specific considerations or gotchas]
```

## Success Criteria

- All configured hooks fire correctly when triggered
- Protected files are blocked from AI modification
- Tests run automatically before task completion
- Code is formatted automatically after every edit
- No infinite loops in Stop hooks
- Permissions allow safe commands without blanket approval
