---
name: personal-memory
description: Use when Hobbes needs to maintain durable user memory such as preferences, important people, recurring facts, decisions, and long-lived context while keeping memory scoped, deduplicated, and auditable.
---

# Personal Memory

Use this skill for durable personal context.

## What it is for

- user preferences
- important people
- recurring constraints
- durable facts
- decisions worth remembering

## Core workflow

1. Classify the memory:
   - person
   - preference
   - project
   - decision
   - temporary note
2. Write only durable facts by default.
3. Add timestamp and source context.
4. Deduplicate against existing memory.
5. Keep temporary notes out of durable memory unless promoted.

## Output pattern

- `memory_class`
- `proposed_fact`
- `why_it_is_durable`
- `write_decision`

## Guardrails

- do not store private or regulated facts casually
- do not mix guesses with durable memory
- prefer explicit user-approved memory writes for sensitive facts
