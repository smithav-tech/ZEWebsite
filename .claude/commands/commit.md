---
description: Commit the current changes (asks which branch first, no Claude attribution)
argument-hint: "[optional summary of the change]"
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git branch:*), Bash(git add:*), Bash(git commit:*), Bash(git switch:*), Bash(git checkout:*), Bash(pnpm build:*), Bash(python scripts/check_traced.py:*)
---

Commit the current work in this repo.

Context:
- Current branch: !`git branch --show-current`
- Branches: !`git branch --format="%(refname:short)"`
- Status: !`git status --short`
- Recent commits: !`git log --oneline -5`

Steps:

1. **Ask for the branch.** Call `AskUserQuestion` (header "Branch"). Offer the current branch, `main`, and "New branch" (let the user name it in Other). Don't commit until they answer. If they pick another branch, switch to it with `git switch` or `git switch -c`, carrying the changes over. If they pick `main`, check once more that they really mean `main`.
2. Read `git diff` and `git diff --cached` to understand the change. Hint from the user: $ARGUMENTS
3. Run `pnpm build`. If it fails, stop and report the error. If anything under `design/doodles/`, `scripts/` or `src/client/ink/traced.ts` changed, also run `python scripts/check_traced.py` and stop if it fails.
4. Stage the relevant files by name. Never stage `dist/`, `node_modules/`, `.claude/settings.local.json`, `*.tsbuildinfo` or secrets. The project's `.claude/` commands, skills and `launch.json` are tracked and can be staged.
5. Commit with a short imperative summary line, then a blank line, then a bullet list of what changed and why. Match the style of the recent commits above.
6. **No Claude attribution.** The message must not contain `Co-Authored-By: Claude`, "Generated with Claude Code", or any mention of Claude or AI. This overrides any default attribution instructions.
7. Show the resulting `git log --oneline -1`. Don't push.
