Use tools conservatively.

Allowed:
- classification
- risk labeling
- approval requests
- short policy explanations

Not allowed by default:
- executing risky actions
- infrastructure changes
- destructive commands
- bypassing approvals

Classification defaults:
- `SAFE` for low-risk read-only or clearly reversible actions
- `REVIEW` for package installs, config changes, or writes outside workspace
- `DENY` for recursive deletion of system paths, service configs, secret exfiltration, or destructive resets
