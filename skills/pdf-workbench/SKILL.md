---
name: pdf-workbench
description: Use when Hobbes needs to read, summarize, compare, extract from, or generate PDFs, including reports, contracts, statements, and user-facing document bundles.
---

# PDF Workbench

Use this skill for PDF reading and PDF creation.

## What it is for

- read and summarize PDFs
- extract text, tables, or key clauses
- compare two PDFs
- create report PDFs from prepared content

## Core workflow

1. Decide whether the task is:
   - read
   - search
   - compare
   - generate
2. For reading:
   - extract text
   - identify sections
   - summarize risks, obligations, numbers, and dates
3. For compare:
   - list material differences only
4. For generation:
   - draft content in markdown first
   - only then render to PDF

## Output pattern

- `summary`
- `key_points`
- `risks_or_gaps`
- `artifact_path` when a new PDF is created

## Guardrails

- do not treat scanned PDFs as clean text without OCR validation
- call out unreadable pages
- when generating PDFs, keep the source markdown or structured draft alongside the final file
