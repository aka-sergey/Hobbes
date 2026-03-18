#!/usr/bin/env python3
import json
import os
import subprocess
import sys
import tempfile
import urllib.error
import urllib.request


BASE_URL = os.environ.get("HOBBES_CONTROL_BASE_URL", "https://hobbes-dashboard-web-production.up.railway.app")
TOKEN = os.environ.get("HOBBES_CONTROL_TOKEN", "")


def request_json(method: str, path: str, payload: dict | None = None):
    url = f"{BASE_URL}{path}"
    headers = {"Authorization": f"Bearer {TOKEN}"}
    data = None

    if payload is not None:
      headers["Content-Type"] = "application/json"
      data = json.dumps(payload).encode("utf-8")

    req = urllib.request.Request(url, data=data, headers=headers, method=method)

    with urllib.request.urlopen(req, timeout=30) as response:
      return json.loads(response.read().decode("utf-8"))


def complete(job_id: int, status: str, last_error: str | None = None):
    request_json(
        "POST",
        "/api/control/runtime-sync/complete",
        {"id": job_id, "status": status, "lastError": last_error},
    )


def apply_job(job: dict):
    remote_path = job["remote_path"]
    content = job["content"]

    remote_dir = os.path.dirname(remote_path)
    os.makedirs(remote_dir, exist_ok=True)

    with tempfile.NamedTemporaryFile("w", delete=False, encoding="utf-8", dir=remote_dir) as handle:
        handle.write(content)
        temp_path = handle.name

    os.chmod(temp_path, 0o644)
    subprocess.run(["chown", "hobbes:hobbes", temp_path], check=True)
    os.replace(temp_path, remote_path)
    subprocess.run(["chown", "hobbes:hobbes", remote_path], check=True)
    subprocess.run(["chmod", "644", remote_path], check=True)

    runtime_dir = f"/run/user/{subprocess.check_output(['id', '-u', 'hobbes'], text=True).strip()}"
    subprocess.run(
        [
            "runuser",
            "-u",
            "hobbes",
            "--",
            "env",
            f"XDG_RUNTIME_DIR={runtime_dir}",
            "systemctl",
            "--user",
            "restart",
            "openclaw-gateway.service",
        ],
        check=True,
    )
    subprocess.run(
        [
            "runuser",
            "-u",
            "hobbes",
            "--",
            "env",
            f"XDG_RUNTIME_DIR={runtime_dir}",
            "systemctl",
            "--user",
            "is-active",
            "openclaw-gateway.service",
        ],
        check=True,
    )

    # `systemctl --user is-active` is the authoritative success gate here.
    # On this VPS the HTTP health endpoint and listening ports may appear much later
    # than the service reaches the active state, which would create false negatives.


def main():
    if not TOKEN:
        print("HOBBES_CONTROL_TOKEN is not configured", file=sys.stderr)
        return 1

    try:
        claimed = request_json("POST", "/api/control/runtime-sync/claim")
    except urllib.error.HTTPError as error:
        print(f"claim_failed_http:{error.code}", file=sys.stderr)
        return 1
    except Exception as error:
        print(f"claim_failed:{error}", file=sys.stderr)
        return 1

    job = claimed.get("job")
    if not job:
        return 0

    job_id = int(job["id"])

    try:
        apply_job(job)
        complete(job_id, "applied")
        return 0
    except Exception as error:
        try:
            complete(job_id, "failed", str(error))
        except Exception:
            pass
        print(f"apply_failed:{error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
