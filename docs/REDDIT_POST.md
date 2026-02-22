# Reddit Post — r/ClaudeAI

> Title: Made a CLI that installs project-aware slash commands for Claude Code

---

I kept re-explaining my project to Claude Code. Every session: "read CLAUDE.md, check package.json, look at the folder structure..." So I made slash commands that already know your project.

    npx @ccprompt/cli install-generic .

Run that in your project root (the dot matters). You get /kickoff, /debug-rootcause, /code-review, /security-audit, etc as slash commands. Each one is a structured workflow, not a checklist.

The interesting part: if you have an Anthropic API key, you can run ccprompt scan and ccprompt generate to rewrite the templates with your actual project context. So instead of "find the relevant test files" you get "run npm test, Vitest config is in vitest.config.ts, tests are in src/__tests__/".

It's not magic, it's just structured prompts that get customized per project. But it saves me from typing the same context every session.

GitHub: https://github.com/ccprompt/ccprompt
MIT, zero config for the basic version.

Happy to hear what's missing or broken.
