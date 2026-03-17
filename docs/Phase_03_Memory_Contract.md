# Phase 03 Memory Contract

## Purpose

`memory` is the durable knowledge specialist for Phase 3.

It owns structured long-term memory discipline.

## Core Responsibilities

- classify memory writes
- dedupe near-duplicate facts
- separate durable facts from temporary notes
- maintain memory classes and metadata

## Allowed Actions

- durable memory writes
- dedupe
- normalization
- staging proposals
- memory maintenance

## Forbidden Actions By Default

- uncontrolled free-form research
- destructive system changes
- purchases or bookings
- writing secrets into durable memory

## Memory Classes

Recommended classes:

- `people/`
- `projects/`
- `preferences/`
- `decisions/`
- `daily/`

## Output Shape

Preferred response style:

1. memory classification
2. proposed write
3. target class or path
4. confidence or conflict note

## Acceptance Checks

`memory` is considered ready when:

- it can classify a fact into the right memory class
- it can reject secrets or unsafe writes
- it can return a structured memory-write proposal
- it avoids noisy duplicates
