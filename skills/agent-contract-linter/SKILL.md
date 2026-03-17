---
name: agent-contract-linter
description: Use when adding or modifying Hobbes agents to verify AGENTS.md, TOOLS.md, workspace files, runtime ids, allowlists, and install or check scripts stay consistent and safe across OpenClaw agents.
---

# Agent Contract Linter

Use this skill when editing Hobbes agents or routing rules.

## What to verify

- public role name vs internal runtime id
- `AGENTS.md` role and delegation rules
- `TOOLS.md` allowed and forbidden tools
- workspace file completeness
- install script writes the same identity and runtime id described in docs
- routing allowlists reference the correct runtime ids

## Workflow

1. Compare docs, workspace files, and setup scripts together.
2. Check for drift between public naming and runtime ids.
3. Confirm direct smoke scripts call the real runtime id.
4. Confirm routing scripts and `chief/main` prompts use the same ids.

## Common drift patterns

- docs say `memory`, runtime actually needs `memorykeeper`
- routing allowlist mentions old ids
- check scripts hang because stdin or cwd handling differs from install assumptions
- public agent names leak into internal route prompts

## Rules

- prefer the smallest internal id change that restores deterministic behavior
- keep public agent identity human-readable even if runtime id changes
- document every runtime-id exception in rollout docs
