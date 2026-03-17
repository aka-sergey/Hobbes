---
name: routing-regression
description: Use when validating Hobbes multi-agent routing chains such as main-chief-comms, main-guard, or chief-specialist flows, especially to run bounded smoke checks, compare session counters, and separate integrity failures from timeout-only regressions.
---

# Routing Regression

Use this skill to validate multi-agent routing safely.

## Goals

- prove that delegation really happened
- distinguish routing failure from slow completion
- keep regression prompts small and deterministic

## Workflow

1. Run direct checks first for every agent in the chain.
2. Run routed checks with bounded timeouts.
3. Compare session counters before and after each routed check.
4. Record whether the chain failed by:
   - no child session growth
   - child growth but parent timeout
   - malformed final answer

## Rules

- Keep regression prompts short and single-purpose.
- Use `runtime: "subagent"` with explicit `agentId` for internal Hobbes agents.
- Redirect stdin from `/dev/null` for local regression scripts.
- Do not send regression output into the production Telegram chat.

## Pass criteria

- expected child session counters increase
- final response shape matches the contract
- bounded timeout completes successfully

## Failure labels

- `INTEGRITY_FAIL`: agent or route did not execute
- `TIMEOUT_ONLY`: child sessions grew but whole scenario exceeded budget
- `UX_FAIL`: result leaked extra chatter, duplicate replies, or wrong delivery format
