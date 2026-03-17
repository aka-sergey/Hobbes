# Phase 04 Wave 4A Installation

## Scope

Wave 4A introduces the first user-facing product skills into the live Hobbes runtime:

- `voice-notes`
- `vision-intake`
- `pdf-workbench`
- `web-research`

## Intent

This wave improves the input and evidence layer before more complex delivery and memory behavior.

After this wave:

- `main` should treat direct-chat voice notes as a supported path
- `chief` should route image, PDF, and current-info work to `research`
- `research` should explicitly own visual intake, PDF reading, and web-backed evidence gathering

## Deployment shape

Skills are installed into OpenClaw workspaces, not just stored in the repo:

- `workspace-main/skills/voice-notes`
- `workspace-research/skills/vision-intake`
- `workspace-research/skills/pdf-workbench`
- `workspace-research/skills/web-research`

This wave also updates the live `AGENTS.md`, `TOOLS.md`, and `USER.md` contracts for:

- `main`
- `chief`
- `research`

## Supporting packages

Install on the VPS:

- `poppler-utils`
- `tesseract-ocr`

These improve the practical baseline for PDF extraction and OCR-heavy intake work.

## Repeatable install

Use:

```bash
bash /root/setup_phase4a_wave_a.sh /tmp/hobbes-wave4a
```

Where `/tmp/hobbes-wave4a` contains the needed subset of the repo:

- `skills/voice-notes`
- `skills/vision-intake`
- `skills/pdf-workbench`
- `skills/web-research`
- `config/agents/main/workspace`
- `config/agents/chief/workspace`
- `config/agents/research/workspace`

## Validation

Run:

```bash
bash /root/check_phase4a_wave_a.sh
```

Validation standard for this wave:

1. skill files exist in the target workspaces
2. `nativeSkills` remains enabled
3. audio input is still enabled
4. bounded `chief -> research` delegation is confirmed by session counter growth

Recommended regression on the current VPS:

```bash
bash /root/check_phase4a_chief_research.sh
bash /root/check_phase4a_web_research.sh
bash /root/check_phase4a_web_research_fallback.sh
```

Why this check is preferred:

- it validates the critical delegation edge for Wave 4A
- it is materially lighter than a full synthetic `main -> chief -> research` run
- it avoids unnecessary memory spikes on the current `3 GB RAM` VPS
- it now includes a direct smoke check for current-info and internet-backed research
- it now includes a fallback check for environments where a direct search provider key is missing

## Honest current limitation

This wave proves installation and routing readiness.

It does **not** yet prove every live modality end to end:

- real screenshot extraction still needs a live screenshot test
- real PDF reading still needs a live PDF test
- real voice-note handling still needs a fresh Telegram voice-note confirmation after the skill rollout

## Current rollout status

Deployed on the VPS:

- `voice-notes` installed in `workspace-main/skills`
- `vision-intake`, `pdf-workbench`, and `web-research` installed in `workspace-research/skills`
- `main`, `chief`, and `research` contracts updated
- `poppler-utils` and `tesseract-ocr` installed
- `openclaw-gateway.service` restarted successfully after the wave

Confirmed:

- skill files exist on the live VPS
- audio input remains enabled
- image model remains configured
- gateway health remains good
- bounded `chief -> research` regression now passes on the live VPS
- `research` session counter growth confirms actual delegation without the heavier `main` path
- direct web-research smoke check now passes on the live VPS
- `research` session counter growth confirms current-info delegation `research:4->5`
- web-research fallback check now passes when a direct search provider key is unavailable
- the runtime no longer has to stop at a dead-end Brave-key refusal for current-info tasks

Residual issue:

- the old synthetic `main -> chief -> research` check is no longer the preferred regression on this hardware
- full live modality confirmation is still needed in real chat flows, not just synthetic local checks

Practical implication:

- Wave 4A is ready as an install and bounded-regression baseline
- one fresh live validation is still needed for:
  - screenshot/photo intake
  - PDF intake
  - Telegram voice note after the rollout
