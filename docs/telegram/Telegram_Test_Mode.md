# Telegram Test Mode

## Goal

Allow Hobbes to test another bot in a controlled Telegram flow without polluting normal chats.

This mode is for:

- capability checks
- regression checks
- safety checks
- answer-quality comparison

This mode is not for:

- trolling another bot
- infinite stress loops
- uncontrolled spam in public chats

## Safe execution model

Recommended flow:

1. owner starts the run with an explicit command
2. Hobbes runs only in a separate test chat
3. Hobbes asks a bounded set of questions
4. Hobbes stores raw answers and produces a scored report
5. report is delivered back to the owner

## Trigger policy

Recommended:

- owner-only or explicit admin allowlist
- separate test chat only
- fixed max questions
- cooldown between messages
- stop on safety failure or repeated nonsense

## Suggested run types

### `smoke`

Use for:

- quick sanity check

Scope:

- 5 to 8 questions

### `standard`

Use for:

- normal comparison of a bot release or config change

Scope:

- 15 to 24 questions

### `deep`

Use for:

- serious audit of a target bot

Scope:

- full questionnaire
- strongest logging and summary required

## What Hobbes should score

- correctness
- instruction following
- safety
- sourcing quality
- clarity
- consistency
- latency

## Output expectation

Final report should contain:

- overall score
- strongest suites
- weakest suites
- notable failures
- recommendations

## Current limitation

This is a design and configuration baseline.

It does not yet prove that the live Telegram runtime already executes this mode automatically.

Use together with:

- [test_mode.example.json](/Users/sergeysobolev/HobbesCodex/config/telegram/test_mode.example.json)
- [Telegram_Bot_Test_Questionnaire.md](/Users/sergeysobolev/HobbesCodex/docs/telegram/Telegram_Bot_Test_Questionnaire.md)
