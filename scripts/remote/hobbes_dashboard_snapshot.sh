#!/usr/bin/env bash
set -euo pipefail

OPENCLAW_HOME="${OPENCLAW_HOME:-/home/hobbes/.openclaw}"
OPENCLAW_USER="${OPENCLAW_USER:-hobbes}"
HOST_LABEL="${HOST_LABEL:-72.56.112.63}"
DASHBOARD_URL="${DASHBOARD_URL:?DASHBOARD_URL is required}"
INGEST_TOKEN="${INGEST_TOKEN:?INGEST_TOKEN is required}"

workdir="$(mktemp -d)"
trap 'rm -rf "$workdir"' EXIT

uid="$(id -u "$OPENCLAW_USER")"
runtime_dir="/run/user/$uid"
config_path="$OPENCLAW_HOME/openclaw.json"
log_path="$workdir/openclaw-gateway.log"
payload_path="$workdir/snapshot.json"

service_state="$(
  runuser -u "$OPENCLAW_USER" -- env XDG_RUNTIME_DIR="$runtime_dir" \
    systemctl --user is-active openclaw-gateway.service 2>/dev/null || true
)"

health_state="failed"
if curl -fsS --max-time 3 http://127.0.0.1:18792/ >/dev/null 2>&1; then
  health_state="healthy"
fi

runuser -u "$OPENCLAW_USER" -- env XDG_RUNTIME_DIR="$runtime_dir" \
  journalctl --user -u openclaw-gateway.service -n 200 --no-pager -o short-iso >"$log_path" 2>/dev/null || true

python3 - "$config_path" "$OPENCLAW_HOME" "$HOST_LABEL" "$service_state" "$health_state" "$log_path" >"$payload_path" <<'PY'
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

config_path = Path(sys.argv[1])
openclaw_home = Path(sys.argv[2])
host_label = sys.argv[3]
service_state = sys.argv[4] or "unknown"
health_state = sys.argv[5] or "failed"
log_path = Path(sys.argv[6])
now = datetime.now(timezone.utc)

display_names = {
    "main": "Main",
    "chief": "Chief",
    "comms": "Comms",
    "guard": "Guard",
    "research": "Research",
    "memorykeeper": "Memory",
    "bookingprep": "Booking",
}

roles = {
    "main": "Telegram front door",
    "chief": "Planner and coordinator",
    "comms": "Final answer polisher",
    "guard": "Risk gate",
    "research": "Source-grounded work",
    "memorykeeper": "Durable memory governance",
    "bookingprep": "Approval-aware booking prep",
}

def humanize_age(delta_seconds: float) -> str:
    seconds = int(max(delta_seconds, 0))
    if seconds < 60:
        return f"{seconds}s ago"
    minutes = seconds // 60
    if minutes < 60:
        return f"{minutes}m ago"
    hours = minutes // 60
    if hours < 24:
        return f"{hours}h ago"
    days = hours // 24
    return f"{days}d ago"

def line_has_operational_signal(line: str) -> bool:
    lowered = line.lower()
    explicit_error_tokens = [
        " error:",
        " error ",
        "error=",
        " failed",
        "failure",
        "timeout",
        "timed out",
        "rate limit",
        "warn",
        "exception",
        "stale-socket",
        "und_err",
        "econn",
    ]
    explicit_info_tokens = [
        "health endpoint",
        "sendmessage ok",
        "listening on",
        " gateway healthy",
        " provider started",
    ]
    return any(token in lowered for token in explicit_error_tokens + explicit_info_tokens)

def load_agent_ids():
    default_agents = ["main", "chief", "comms", "guard", "research", "memorykeeper", "bookingprep"]

    if not config_path.exists():
        return default_agents

    try:
        data = json.loads(config_path.read_text())
    except Exception:
        return default_agents

    raw = data.get("agents", {}).get("list")
    if isinstance(raw, list):
        agent_ids = []
        for item in raw:
            if isinstance(item, str):
                agent_ids.append(item)
            elif isinstance(item, dict):
                agent_ids.append(item.get("id") or item.get("name") or item.get("agentId"))
        cleaned = [item for item in agent_ids if item]
        return cleaned or default_agents

    if isinstance(raw, dict):
        cleaned = [key for key in raw.keys() if key]
        return cleaned or default_agents

    return default_agents

def extract_domain(url: str) -> str:
    try:
        return urlparse(url).netloc.replace("www.", "")
    except Exception:
        return ""

def parse_logs():
    if not log_path.exists():
        return []

    lines = [line.strip() for line in log_path.read_text().splitlines() if line.strip()]
    return lines[-60:]

def parse_iso(ts: str):
    try:
        return datetime.fromisoformat(ts.replace("Z", "+00:00"))
    except Exception:
        return None

def load_searches():
    searches = []
    session_specs = [
        ("research", openclaw_home / "agents" / "research" / "sessions"),
        ("bookingprep", openclaw_home / "agents" / "bookingprep" / "sessions"),
    ]
    session_files = []
    for agent_id, sessions_dir in session_specs:
        if not sessions_dir.exists():
            continue
        for path in sessions_dir.glob("*.jsonl"):
            session_files.append((agent_id, path))

    session_files = sorted(
        session_files,
        key=lambda item: item[1].stat().st_mtime,
        reverse=True,
    )[:6]

    for agent_id, path in session_files:
        try:
            lines = [json.loads(line) for line in path.read_text().splitlines() if line.strip()]
        except Exception:
            continue

        query = None
        backend = "unknown"
        status = "ok"
        summary = None
        sources = []
        saw_fetch = False
        saw_tavily = False
        had_exec_error = False
        route_type = None
        preferred_backend = None
        preferred_agent = None
        last_ts = None

        for entry in lines:
            ts = entry.get("timestamp")
            if isinstance(ts, str):
                parsed = parse_iso(ts)
                if parsed:
                    last_ts = parsed

            if entry.get("type") != "message":
                continue

            message = entry.get("message", {})
            role = message.get("role")
            content = message.get("content", [])

            if role == "user":
                for block in content:
                    if block.get("type") != "text":
                        continue
                    text = block.get("text", "")
                    match = re.search(r"\[Subagent Task\]:\s*(.+)", text, re.S)
                    if match:
                        query = match.group(1).strip()

            if role == "assistant":
                for block in content:
                    if block.get("type") == "toolCall":
                        name = block.get("name")
                        arguments = block.get("arguments", {})
                        if name == "exec":
                            command = arguments.get("command", "")
                            if "hobbes-tavily-search" in command:
                                saw_tavily = True
                                backend = "tavily"
                        elif name == "web_fetch":
                            saw_fetch = True
                    elif block.get("type") == "text":
                        text = block.get("text", "").strip()
                        if text and "Ссылки на источники" in text:
                            summary = text[:260]
                        elif text and summary is None and len(text) > 40:
                            summary = text[:260]

            if role == "toolResult":
                tool_name = message.get("toolName")
                details = message.get("details", {})
                payload_text = "\n".join(
                    block.get("text", "")
                    for block in content
                    if block.get("type") == "text"
                )
                if tool_name == "exec":
                    if isinstance(details, dict) and details.get("exitCode") not in (None, 0):
                        had_exec_error = True
                    try:
                        payload_json = json.loads(payload_text)
                    except Exception:
                        payload_json = None
                    if isinstance(payload_json, dict) and payload_json.get("ok") is True and payload_json.get("detected_type"):
                        route_type = payload_json.get("detected_type")
                        preferred_backend = payload_json.get("preferred_backend")
                        preferred_agent = payload_json.get("preferred_agent")
                        if payload_json.get("query"):
                            query = payload_json["query"]
                    elif isinstance(payload_json, dict) and payload_json.get("ok") is True:
                        backend = "tavily"
                        if payload_json.get("query"):
                            query = payload_json["query"]
                        results = payload_json.get("results", [])
                        for item in results[:4]:
                            url = item.get("url")
                            title = item.get("title")
                            if not url or not title:
                                continue
                            sources.append({
                                "title": title[:120],
                                "url": url,
                                "domain": extract_domain(url),
                            })
                    elif "unrecognized arguments" in payload_text or "missing_tavily_api_key" in payload_text:
                        had_exec_error = True
                elif tool_name == "web_fetch":
                    saw_fetch = True
                    if "status" in payload_text and "\"error\"" in payload_text:
                        status = "fallback"

        if not query:
            continue

        if saw_tavily and saw_fetch:
            backend = "tavily+fetch"
        elif saw_fetch and backend == "unknown":
            backend = "fetch"

        lowered_summary = (summary or "").lower()
        if any(token in lowered_summary for token in ["смеш", "mixed", "conflict", "противореч"]):
            status = "mixed"
        elif saw_fetch and status != "mixed":
            status = "fallback"
        elif had_exec_error and backend == "unknown":
            status = "error"

        if not summary:
            summary = "Search activity captured, but no final digest was extracted from the session."

        if last_ts is None:
            when = "recently"
        else:
            when = humanize_age((now - last_ts).total_seconds())

        searches.append({
            "id": path.stem,
            "agentId": agent_id,
            "backend": backend,
            "routeType": route_type or "unknown",
            "preferredBackend": preferred_backend or backend,
            "preferredAgent": preferred_agent or agent_id,
            "status": status,
            "when": when,
            "query": query[:180],
            "summary": summary[:260],
            "sources": sources[:4],
        })

    return searches[:5]

def event_from_line(idx: int, line: str):
    severity = "info"
    lowered = line.lower()
    if any(token in lowered for token in [" error:", " error ", "error=", "failed", "exception", "stale-socket", "und_err", "econn"]):
        severity = "error"
    elif any(token in lowered for token in ["warn", "timeout", "retry", "rate limit"]):
        severity = "warn"

    timestamp_match = re.match(r"^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:[+-]\d{2}:\d{2}|Z))", line)
    when = "recently"
    detail = line
    if timestamp_match:
        raw_ts = timestamp_match.group(1)
        detail = line[len(raw_ts):].strip()
        try:
            event_dt = datetime.fromisoformat(raw_ts.replace("Z", "+00:00"))
            when = humanize_age((now - event_dt).total_seconds())
        except ValueError:
            pass

    detail = detail[:220]
    title = detail[:78] + ("..." if len(detail) > 78 else "")
    return {
        "id": f"evt_{idx}",
        "severity": severity,
        "title": title or "OpenClaw event",
        "when": when,
        "detail": detail or "OpenClaw emitted an empty log line."
    }

log_lines = parse_logs()
agent_ids = load_agent_ids()
searches = load_searches()

recent_lines = list(reversed(log_lines))
events = []
seen_details = set()

for idx, line in enumerate(recent_lines, start=1):
    if not line_has_operational_signal(line):
        continue
    event = event_from_line(idx, line)
    if event["detail"] in seen_details:
        continue
    seen_details.add(event["detail"])
    events.append(event)
    if len(events) >= 6:
        break

events.append({
    "id": "evt_gateway_status",
    "severity": "info" if health_state == "healthy" else "error",
    "title": f"Gateway {health_state}",
    "when": "just now",
    "detail": f"openclaw-gateway.service is {service_state} and the local health endpoint is {health_state}."
})

events = events[:8]

agents = []
run_candidates = []

for agent_id in agent_ids:
    sessions_dir = openclaw_home / "agents" / agent_id / "sessions"
    session_files = sorted(sessions_dir.glob("*.jsonl"), key=lambda item: item.stat().st_mtime, reverse=True) if sessions_dir.exists() else []
    active_runs = 0
    last_error = None
    latest_ts = None

    for path in session_files:
        try:
            mtime = datetime.fromtimestamp(path.stat().st_mtime, tz=timezone.utc)
        except FileNotFoundError:
            continue

        if latest_ts is None:
            latest_ts = mtime
        age_seconds = (now - mtime).total_seconds()
        if age_seconds <= 300:
            active_runs += 1

    for line in recent_lines:
        lowered = line.lower()
        if agent_id.lower() in lowered and line_has_operational_signal(line) and any(token in lowered for token in [" error:", " error ", "error=", "failed", "timeout", "warn", "rate limit", "stale-socket", "und_err", "econn"]):
            last_error = line[:140]
            break

    agent_health = "healthy"
    if health_state != "healthy" or service_state != "active":
        agent_health = "failed"
    elif last_error:
        agent_health = "degraded"

    agents.append({
        "id": agent_id,
        "displayName": display_names.get(agent_id, agent_id.replace("-", " ").title()),
        "role": roles.get(agent_id, "OpenClaw agent"),
        "health": agent_health,
        "lastLatencyMs": 0,
        "activeRuns": active_runs,
        **({"lastError": last_error} if last_error else {})
    })

    if latest_ts is not None:
        age_seconds = (now - latest_ts).total_seconds()
        run_candidates.append({
            "id": f"{agent_id}_{int(latest_ts.timestamp())}",
            "chain": agent_id,
            "status": "running" if age_seconds <= 180 else "completed",
            "ageLabel": f"updated {humanize_age(age_seconds)}",
            "tokenLabel": "n/a",
            "costLabel": "n/a",
            "_sort_ts": latest_ts.timestamp()
        })

runs = sorted(run_candidates, key=lambda item: item["_sort_ts"], reverse=True)[:6]
for run in runs:
    run.pop("_sort_ts", None)

healthy_agents = sum(1 for item in agents if item["health"] == "healthy")
active_runs = sum(item["activeRuns"] for item in agents)

payload = {
    "snapshotType": "overview_snapshot",
    "source": f"vps:{host_label}",
    "timestamp": now.isoformat(),
    "summary": {
        "healthyAgents": healthy_agents,
        "activeRuns": active_runs,
        "pendingApprovals": 0,
        "estimatedSpendUsd": "n/a"
    },
    "agents": agents,
    "runs": runs,
    "events": events,
    "searches": searches
}

print(json.dumps(payload))
PY

curl -fsS --max-time 15 \
  -H "content-type: application/json" \
  -H "x-ingest-token: $INGEST_TOKEN" \
  --data @"$payload_path" \
  "${DASHBOARD_URL%/}/api/ingest"
