---
description: Push a branch to the remote (asks which branch first)
argument-hint: "[optional branch]"
allowed-tools: Bash(git status:*), Bash(git branch:*), Bash(git log:*), Bash(git remote:*), Bash(git push:*), Bash(git fetch:*)
---

Push work to the remote.

Context:
- Current branch: !`git branch --show-current`
- Branches: !`git branch -vv`
- Remotes: !`git remote -v`
- Status: !`git status --short`

Steps:

1. **Ask for the branch.** Call `AskUserQuestion` (header "Branch"). Offer the current branch, `main` and any other local branches (at most 4 options). If the user passed one in "$ARGUMENTS", put it first, but still confirm it. Don't push until they answer.
2. If there's no remote, ask the user for the URL and run `git remote add origin <url>`. Don't invent a URL.
3. If there are uncommitted changes, say so and ask whether to run `/commit` first.
4. Show what will go up: `git log --oneline origin/<branch>..<branch>`, or the whole branch on a first push.
5. Push with `git push -u origin <branch>` on the first push and `git push` afterwards. Never force-push or push to `main` without the user saying so explicitly in this conversation.
6. Report the result, and any PR link the remote prints.
