# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AgentAds is an ad platform for AI coding agents. Users get paid for watching ads in their terminal/CLI while their coding agent (Claude, Codex, etc.) works in the background. The platform consists of a marketing website and a backend server.

## Development Guidelines

1. Spawn parallel sub-agents for website and server work
2. Each sub-agent works on a specific and atomic task
3. Every task should be atomic and committable with tests (or validation if tests don't apply) - always TDD
4. Break comprehensive tasks into sprints and tasks
5. Every sprint results in a demoable piece of software that runs, is tested, and builds on previous work
6. Be exhaustive, clear, technical - focus on small atomic tasks that compose into a sprint goal
7. Plan all tasks/prompts in context of these guidelines
8. After completing a task/sprint, have a sub-agent review work and suggest improvements, then write tasks and sprint plans to an .md file
9. For each independent task/sprint, work in a separate git worktree created in `../worktrees/`
10. After completing implementation on a worktree, never merge directly to `main`. Instead, push to origin and create a pull request with a summary of changes.
11. At the bottom of each PR description, include a "Commits" section which lists the commits made in the PR with its hashes and title.

## Git Worktree Workflow

```bash
# Create worktree for a new task
git worktree add ../worktrees/<branch-name> -b <branch-name>

# List active worktrees
git worktree list

# Remove worktree after merging
git worktree remove ../worktrees/<branch-name>
```

Worktrees live in `../worktrees/` relative to the git root. Each branch maps to one atomic task or sprint. Never merge worktree branches directly to `main` — always go through a PR.
