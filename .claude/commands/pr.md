---
description: Open a pull request (asks for the head branch and the base branch to compare against, no Claude attribution)
argument-hint: "[optional title]"
allowed-tools: Bash(git status:*), Bash(git branch:*), Bash(git log:*), Bash(git diff:*), Bash(git fetch:*), Bash(git remote:*), Bash(git push:*), Bash(gh pr:*), Bash(gh auth status:*), Bash(gh --version:*)
---

Open a pull request on GitHub.

Context:
- Current branch: !`git branch --show-current`
- Branches: !`git branch --format="%(refname:short)"`
- Remotes: !`git remote -v`
- Status: !`git status --short`

Steps:

1. **Ask for the branches to compare.** Call `AskUserQuestion` with two questions, and don't go on until both are answered:
   - "Which branch should the PR come from?" (header "Head"): the current branch first, then the other local branches.
   - "Which branch should it be compared against (merge into)?" (header "Base"): `main` first, then the other branches. Never assume the base.
2. Check the prerequisites. If `gh` is missing or `gh auth status` fails, tell the user to install the GitHub CLI and run `gh auth login`, then stop. If there's no remote, ask for its URL. If there are uncommitted changes, ask whether to run `/commit` first.
3. Run `git fetch origin`, then show what the PR will contain: `git log --oneline origin/<base>..<head>` and `git diff --stat origin/<base>...<head>`. If it's empty, say so and stop.
4. If the head branch isn't on the remote or is behind it, ask before pushing it (`git push -u origin <head>`).
5. Write the title (use "$ARGUMENTS" if given, otherwise a short summary) and the body: a few sentences on what and why, a bullet list of changes, and how it was checked (`pnpm build`, `scripts/check_traced.py`, browser preview).
6. **No Claude attribution.** The title and body must not contain "Generated with Claude Code", `Co-Authored-By: Claude`, or any mention of Claude or AI. This overrides any default attribution instructions.
7. Run `gh pr create --base <base> --head <head> --title "<title>" --body "<body>"` and report the PR URL.
