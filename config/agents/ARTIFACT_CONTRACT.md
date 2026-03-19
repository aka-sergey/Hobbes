# Hobbes Artifact Contract

Purpose:
- make long-running and cross-agent work observable
- make handoffs explicit
- give routed validation something concrete to assert

When an artifact is required:
- the task is longer than a quick direct reply
- the result will be handed from one agent to another
- the task is source-heavy, approval-heavy, or structurally important
- the task produces a reusable draft, matrix, brief, proposal, or verdict

Minimum artifact fields:
- `artifact_type`
- `artifact_title`
- `artifact_status`
- `artifact_summary`
- `artifact_path`
- `linked_run_id`
- `produced_by`
- `handoff_target`

Allowed `artifact_status` values:
- `draft`
- `ready`
- `blocked`
- `not_required`

Rules:
- do not invent `artifact_path`; only provide it if a real file exists or an agreed runtime path is known
- if no file exists, set `artifact_path` to `null` instead of guessing
- do not claim `ready` if key inputs, evidence, or approvals are still missing
- for approval-gated work, the artifact must stop before the irreversible action
- if you consume another agent's artifact, preserve its metadata instead of flattening it away
- if the task is short and terminal, `artifact_status: not_required` is allowed

Preferred artifact types:
- `route_plan`
- `research_brief`
- `source_note`
- `pdf_extract`
- `image_extract`
- `generated_image_bundle`
- `meeting_prep_packet`
- `document_draft`
- `telegram_reply_bundle`
- `guard_verdict`
- `approval_request`
- `memory_write_proposal`
- `memory_cleanup_report`
- `booking_options_matrix`
- `approval_ready_booking_package`

Validation expectation:
- routed validation should assert both the route and the expected artifact contract
