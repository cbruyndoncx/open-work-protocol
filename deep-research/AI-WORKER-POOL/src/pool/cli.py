from __future__ import annotations

import os
import re
import time
from typing import Any

import httpx
import typer
import yaml
from rich.console import Console
from rich.table import Table

from .config import config_path, load_config, save_config
from .envfile import load_env


app = typer.Typer(help="OWP Pool CLI (worker + admin)")
worker_app = typer.Typer(help="Worker commands")
admin_app = typer.Typer(help="Admin commands")
app.add_typer(worker_app, name="worker")
app.add_typer(admin_app, name="admin")

console = Console()

load_env()


def _server_url(server: str | None) -> str:
    if server:
        return server.rstrip("/")
    cfg = load_config()
    if cfg.server:
        return cfg.server.rstrip("/")
    raise typer.BadParameter("Missing --server and no saved config found")


def _worker_token(token: str | None) -> str:
    if token:
        return token
    cfg = load_config()
    if cfg.token:
        return cfg.token
    raise typer.BadParameter("Missing --token and no saved worker token found; run `pool worker register` first")


def _admin_token() -> str:
    return os.environ.get("OWP_ADMIN_TOKEN", "dev-admin")


def _request(
    method: str,
    url: str,
    *,
    json_body: dict[str, Any] | None = None,
    params: dict[str, Any] | None = None,
    headers: dict[str, str] | None = None,
    timeout: float = 20.0,
) -> httpx.Response:
    with httpx.Client(timeout=timeout) as client:
        return client.request(method, url, json=json_body, params=params, headers=headers)


def _die_for_status(resp: httpx.Response) -> None:
    if resp.status_code < 400:
        return
    try:
        detail = resp.json()
    except Exception:
        detail = resp.text
    console.print(f"[red]HTTP {resp.status_code}[/red] {detail}")
    raise typer.Exit(code=1)


@worker_app.command("register")
def worker_register(
    name: str = typer.Option(..., "--name"),
    skills: str = typer.Option("", "--skills", help="Comma-separated skill tags"),
    capacity: int = typer.Option(5, "--capacity", min=1),
    max_concurrent: int = typer.Option(2, "--max-concurrent", min=1),
    github_handle: str | None = typer.Option(None, "--github-handle"),
    server: str | None = typer.Option(None, "--server"),
    save: bool = typer.Option(True, "--save/--no-save", help="Save token to local config"),
) -> None:
    base = _server_url(server)
    body = {
        "name": name,
        "github_handle": github_handle,
        "skills": [s.strip() for s in skills.split(",") if s.strip()],
        "capacity_points": capacity,
        "max_concurrent_tasks": max_concurrent,
    }
    resp = _request("POST", f"{base}/v1/workers/register", json_body=body)
    _die_for_status(resp)
    data = resp.json()

    console.print(f"[green]Registered[/green] worker_id={data['worker_id']}")
    console.print(f"[yellow]Token[/yellow]: {data['token']}")

    if save:
        cfg = load_config()
        cfg.server = base
        cfg.worker_id = data["worker_id"]
        cfg.token = data["token"]
        save_config(cfg)
        console.print(f"Saved config to [cyan]{str(config_path())}[/cyan]")


@worker_app.command("run")
def worker_run(
    server: str | None = typer.Option(None, "--server"),
    token: str | None = typer.Option(None, "--token", help="Bearer token (optional if saved)"),
    heartbeat_every: int = typer.Option(10, "--heartbeat-every", help="Seconds"),
    poll_every: int = typer.Option(10, "--poll-every", help="Seconds"),
) -> None:
    base = _server_url(server)
    tok = _worker_token(token)

    headers = {"Authorization": f"Bearer {tok}"}
    last_poll = 0.0
    last_heartbeat = 0.0

    console.print(f"Worker loop started. Server={base}")
    while True:
        now = time.time()
        if now - last_heartbeat >= heartbeat_every:
            resp = _request("POST", f"{base}/v1/workers/heartbeat", json_body={"status": "working"}, headers=headers)
            _die_for_status(resp)
            last_heartbeat = now

        if now - last_poll >= poll_every:
            resp = _request("GET", f"{base}/v1/work", headers=headers)
            _die_for_status(resp)
            data = resp.json()
            leases = data.get("leases", [])

            table = Table(title="Assigned Leases")
            table.add_column("task_id", style="cyan")
            table.add_column("repo")
            table.add_column("points", justify="right")
            table.add_column("priority", justify="right")
            table.add_column("area")
            table.add_column("skills")
            table.add_column("expires")
            table.add_column("title")

            for l in leases:
                table.add_row(
                    l["task_id"],
                    l["repo"],
                    str(l["estimate_points"]),
                    str(l["priority"]),
                    l.get("area") or "",
                    ",".join(l.get("required_skills") or []),
                    l["lease_expires_at"],
                    (l.get("title") or "")[:60],
                )
            console.print(table)
            last_poll = now

        time.sleep(1)


@worker_app.command("simulate")
def worker_simulate(
    server: str | None = typer.Option(None, "--server"),
    token: str | None = typer.Option(None, "--token", help="Bearer token (optional if saved)"),
    register: bool = typer.Option(False, "--register/--no-register", help="Register a new worker first"),
    name: str = typer.Option("SimWorker", "--name"),
    skills: str = typer.Option("", "--skills", help="Comma-separated skill tags"),
    capacity: int = typer.Option(5, "--capacity", min=1),
    max_concurrent: int = typer.Option(2, "--max-concurrent", min=1),
    heartbeat_every: int = typer.Option(5, "--heartbeat-every", help="Seconds"),
    poll_every: int = typer.Option(3, "--poll-every", help="Seconds"),
    open_delay: int = typer.Option(2, "--open-delay", help="Seconds before marking pr_opened"),
    merge: bool = typer.Option(False, "--merge/--no-merge", help="Also mark tasks merged (demo only)"),
    merge_delay: int = typer.Option(2, "--merge-delay", help="Seconds before marking merged"),
    pr_base_url: str = typer.Option("https://example.com/pr", "--pr-base-url"),
    once: bool = typer.Option(False, "--once", help="Process current leases once, then exit"),
) -> None:
    """
    Demo helper: simulates a worker by auto-updating lease status.

    Useful for hackathon demos when you want the full lease → PR flow without running a real AI tool.
    """
    base = _server_url(server)

    if register:
        body = {
            "name": name,
            "github_handle": None,
            "skills": [s.strip() for s in skills.split(",") if s.strip()],
            "capacity_points": capacity,
            "max_concurrent_tasks": max_concurrent,
        }
        resp = _request("POST", f"{base}/v1/workers/register", json_body=body)
        _die_for_status(resp)
        data = resp.json()
        cfg = load_config()
        cfg.server = base
        cfg.worker_id = data["worker_id"]
        cfg.token = data["token"]
        save_config(cfg)
        console.print(f"[green]Registered[/green] worker_id={data['worker_id']} (saved to {str(config_path())})")

    tok = _worker_token(token)
    headers = {"Authorization": f"Bearer {tok}"}

    processed: set[str] = set()
    last_poll = 0.0
    last_heartbeat = 0.0

    console.print(f"Sim worker loop started. Server={base} once={once}")
    while True:
        now = time.time()
        if now - last_heartbeat >= heartbeat_every:
            resp = _request("POST", f"{base}/v1/workers/heartbeat", json_body={"status": "working"}, headers=headers)
            _die_for_status(resp)
            last_heartbeat = now

        if now - last_poll >= poll_every:
            resp = _request("GET", f"{base}/v1/work", headers=headers)
            _die_for_status(resp)
            data = resp.json()
            leases = data.get("leases", [])

            for l in leases:
                task_id = l["task_id"]
                if task_id in processed:
                    continue

                console.print(f"[cyan]Processing[/cyan] {task_id}: {l.get('title','')}")
                resp2 = _request(
                    "POST",
                    f"{base}/v1/tasks/{task_id}/status",
                    json_body={"status": "in_progress", "message": "simulated work started"},
                    headers=headers,
                )
                _die_for_status(resp2)

                time.sleep(max(0, open_delay))
                pr_url = f"{pr_base_url}/{task_id}"
                resp3 = _request(
                    "POST",
                    f"{base}/v1/tasks/{task_id}/status",
                    json_body={"status": "pr_opened", "message": "simulated PR opened", "artifact": {"pr_url": pr_url}},
                    headers=headers,
                )
                _die_for_status(resp3)

                if merge:
                    time.sleep(max(0, merge_delay))
                    resp4 = _request(
                        "POST",
                        f"{base}/v1/tasks/{task_id}/status",
                        json_body={"status": "merged", "message": "simulated merge", "artifact": {"pr_url": pr_url}},
                        headers=headers,
                    )
                    _die_for_status(resp4)

                processed.add(task_id)

            last_poll = now
            if once and not leases:
                break

            if once and all(l["task_id"] in processed for l in leases):
                break

        time.sleep(0.2)

    console.print("[green]Sim worker done[/green]")


@worker_app.command("status")
def worker_status_update(
    task_id: str = typer.Argument(...),
    status: str = typer.Option(..., "--status", help="in_progress|blocked|pr_opened|merged"),
    message: str | None = typer.Option(None, "--message"),
    pr_url: str | None = typer.Option(None, "--pr"),
    server: str | None = typer.Option(None, "--server"),
    token: str | None = typer.Option(None, "--token"),
) -> None:
    base = _server_url(server)
    tok = _worker_token(token)
    headers = {"Authorization": f"Bearer {tok}"}

    body: dict[str, Any] = {"status": status, "message": message}
    artifact: dict[str, Any] = {}
    if pr_url:
        artifact["pr_url"] = pr_url
    if artifact:
        body["artifact"] = artifact

    resp = _request("POST", f"{base}/v1/tasks/{task_id}/status", json_body=body, headers=headers)
    _die_for_status(resp)
    console.print("[green]Updated[/green]")


@admin_app.command("init-repo")
def admin_init_repo(
    repo: str = typer.Argument(..., help="Repo key, e.g. demo or owner/name"),
    max_open_prs: int = typer.Option(2, "--max-open-prs", min=0),
    area_locks: bool = typer.Option(True, "--area-locks/--no-area-locks"),
    server: str | None = typer.Option(None, "--server"),
) -> None:
    base = _server_url(server)
    headers = {"X-Admin-Token": _admin_token()}
    body = {"repo": repo, "max_open_prs": max_open_prs, "area_locks_enabled": area_locks}
    resp = _request("POST", f"{base}/v1/admin/repos", json_body=body, headers=headers)
    _die_for_status(resp)
    console.print(f"[green]Repo upserted[/green] {repo}")


@admin_app.command("add-task")
def admin_add_task(
    repo: str = typer.Option(..., "--repo"),
    title: str = typer.Option(..., "--title"),
    estimate: int = typer.Option(1, "--estimate", min=1),
    priority: int = typer.Option(10, "--priority", min=0),
    required_skills: str = typer.Option("", "--required-skills", help="Comma-separated"),
    area: str | None = typer.Option(None, "--area"),
    tier: int = typer.Option(0, "--tier", min=0, max=3),
    description: str | None = typer.Option(None, "--description"),
    server: str | None = typer.Option(None, "--server"),
) -> None:
    base = _server_url(server)
    headers = {"X-Admin-Token": _admin_token()}
    body = {
        "repo": repo,
        "title": title,
        "description": description,
        "estimate_points": estimate,
        "priority": priority,
        "required_skills": [s.strip() for s in required_skills.split(",") if s.strip()],
        "area": area,
        "tier": tier,
    }
    resp = _request("POST", f"{base}/v1/admin/tasks", json_body=body, headers=headers)
    _die_for_status(resp)
    data = resp.json()
    console.print(f"[green]Task created[/green] {data['task_id']}")


@admin_app.command("import-tasks")
def admin_import_tasks(
    path: str = typer.Argument(...),
    repo: str = typer.Option(..., "--repo"),
    server: str | None = typer.Option(None, "--server"),
) -> None:
    base = _server_url(server)
    headers = {"X-Admin-Token": _admin_token()}
    tasks = yaml.safe_load(open(path, "r", encoding="utf-8"))
    if not isinstance(tasks, list):
        raise typer.BadParameter("Expected YAML list of tasks")

    created = 0
    for t in tasks:
        body = {
            "repo": repo,
            "title": t.get("title"),
            "description": t.get("description"),
            "estimate_points": int(t.get("estimate_points", 1)),
            "priority": int(t.get("priority", 10)),
            "required_skills": t.get("required_skills") or [],
            "area": t.get("area"),
            "tier": int(t.get("tier", 0)),
        }
        resp = _request("POST", f"{base}/v1/admin/tasks", json_body=body, headers=headers)
        _die_for_status(resp)
        created += 1

    console.print(f"[green]Imported[/green] {created} tasks into repo {repo}")


def _gh_priority_from_labels(labels: list[str]) -> int:
    # Higher = more important
    mapping = {"priority:critical": 100, "priority:high": 80, "priority:medium": 50, "priority:low": 20}
    for lab in labels:
        key = lab.strip().lower()
        if key in mapping:
            return mapping[key]
    for lab in labels:
        m = re.match(r"^priority:(\\d+)$", lab.strip().lower())
        if m:
            return int(m.group(1))
    return 50


def _gh_estimate_from_labels(labels: list[str]) -> int:
    for lab in labels:
        m = re.match(r"^(estimate|size):(\\d+)$", lab.strip().lower())
        if m:
            return max(1, min(100, int(m.group(2))))
    return 1


def _gh_field_from_labels(prefix: str, labels: list[str]) -> list[str]:
    out: list[str] = []
    for lab in labels:
        lab = lab.strip()
        if lab.lower().startswith(prefix.lower() + ":"):
            out.append(lab.split(":", 1)[1].strip())
    return [x for x in out if x]


@admin_app.command("import-github-issues")
def admin_import_github_issues(
    repo: str = typer.Argument(..., help="GitHub repo, e.g. owner/name"),
    label: str = typer.Option("pool:ready", "--label", help="Only import issues with this label"),
    server: str | None = typer.Option(None, "--server"),
    github_token: str | None = typer.Option(None, "--github-token", envvar="GITHUB_TOKEN"),
    limit: int = typer.Option(50, "--limit", min=1, max=200),
) -> None:
    """
    Imports GitHub issues (open) into the scheduler as tasks.

    Label parsing (optional):
    - estimate:3 or size:3
    - priority:high|medium|low or priority:80
    - skills:python (can repeat)
    - area:auth
    """
    if not github_token:
        raise typer.BadParameter("Missing --github-token (or set GITHUB_TOKEN)")

    base = _server_url(server)
    headers = {"X-Admin-Token": _admin_token()}

    owner, name = repo.split("/", 1)
    gh_headers = {
        "Accept": "application/vnd.github+json",
        "Authorization": f"Bearer {github_token}",
        "X-GitHub-Api-Version": "2022-11-28",
    }

    params = {"state": "open", "per_page": str(min(limit, 100)), "labels": label}
    resp = _request(
        "GET",
        f"https://api.github.com/repos/{owner}/{name}/issues",
        params=params,
        headers=gh_headers,
        timeout=30.0,
    )
    if resp.status_code >= 400:
        console.print(f"[red]GitHub API error[/red] HTTP {resp.status_code}: {resp.text}")
        raise typer.Exit(code=1)

    issues = resp.json()
    if not isinstance(issues, list):
        console.print(f"[red]Unexpected GitHub response[/red]: {issues}")
        raise typer.Exit(code=1)

    created = 0
    for it in issues[:limit]:
        # Skip PRs returned in issues list
        if isinstance(it, dict) and it.get("pull_request"):
            continue

        labels = []
        for lab in it.get("labels", []):
            if isinstance(lab, dict) and "name" in lab:
                labels.append(str(lab["name"]))
            elif isinstance(lab, str):
                labels.append(lab)

        estimate = _gh_estimate_from_labels(labels)
        priority = _gh_priority_from_labels(labels)
        skills = _gh_field_from_labels("skills", labels)
        area_vals = _gh_field_from_labels("area", labels)
        area_val = area_vals[0] if area_vals else None

        title = it.get("title") or "(untitled)"
        url = it.get("html_url") or ""
        body_txt = (it.get("body") or "").strip()
        description = f"Imported from GitHub issue: {url}\n\n{body_txt}".strip()

        body = {
            "repo": repo,
            "title": title,
            "description": description,
            "estimate_points": estimate,
            "priority": priority,
            "required_skills": skills,
            "area": area_val,
            "tier": 0,
        }
        resp2 = _request("POST", f"{base}/v1/admin/tasks", json_body=body, headers=headers)
        _die_for_status(resp2)
        created += 1

    console.print(f"[green]Imported[/green] {created} GitHub issues into repo {repo}")


@admin_app.command("state")
def admin_state(server: str | None = typer.Option(None, "--server")) -> None:
    base = _server_url(server)
    headers = {"X-Admin-Token": _admin_token()}
    resp = _request("GET", f"{base}/v1/admin/state", headers=headers)
    _die_for_status(resp)
    data = resp.json()
    table = Table(title="OWP Pool State")
    for k in [
        "workers_online",
        "tasks_ready",
        "tasks_leased",
        "tasks_in_progress",
        "tasks_pr_opened",
        "tasks_blocked",
        "tasks_merged",
    ]:
        table.add_row(k, str(data.get(k, "")))
    console.print(table)
