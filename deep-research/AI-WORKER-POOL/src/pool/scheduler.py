from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Iterable

from . import db


@dataclass(frozen=True)
class SchedulerConfig:
    lease_ttl_seconds: int = 30 * 60
    heartbeat_ttl_seconds: int = 90


def _is_online(last_heartbeat_iso: str | None, *, now: datetime, ttl_seconds: int) -> bool:
    if not last_heartbeat_iso:
        return False
    try:
        ts = datetime.fromisoformat(last_heartbeat_iso)
    except ValueError:
        return False
    if ts.tzinfo is None:
        ts = ts.replace(tzinfo=timezone.utc)
    return (now - ts).total_seconds() <= ttl_seconds


def _parse_json_list(value: str) -> list[str]:
    data = db.json_loads(value)
    if not data:
        return []
    return [str(x) for x in data]


def _skills_match(worker_skills: set[str], required_skills: Iterable[str]) -> bool:
    required = {s.strip().lower() for s in required_skills if s.strip()}
    if not required:
        return True
    return required.issubset({s.strip().lower() for s in worker_skills if s.strip()})


def run_scheduling_cycle(conn, *, config: SchedulerConfig) -> dict[str, int]:
    """
    Runs a single scheduling cycle:
    - Requeues expired leases
    - Assigns ready tasks to eligible workers using greedy matching
    """
    now = db.utc_now()
    requeued = db.requeue_expired_leases(conn)

    repos = db.list_repos(conn)
    repo_cfg = {}
    for r in repos:
        row = db.repo_row(conn, r)
        if row:
            repo_cfg[r] = {
                "max_open_prs": int(row["max_open_prs"]),
                "area_locks_enabled": bool(int(row["area_locks_enabled"])),
            }

    workers = db.list_workers(conn)
    worker_state = {}
    for w in workers:
        online = _is_online(w["last_heartbeat"], now=now, ttl_seconds=config.heartbeat_ttl_seconds)
        skills = set(_parse_json_list(w["skills_json"]))
        used_pts, used_n = db.worker_load(conn, w["worker_id"])
        worker_state[w["worker_id"]] = {
            "online": online,
            "status": w["status"],
            "skills": skills,
            "capacity_points": int(w["capacity_points"]),
            "max_concurrent_tasks": int(w["max_concurrent_tasks"]),
            "used_points": used_pts,
            "used_tasks": used_n,
            "reputation": float(w["reputation"]),
            "last_heartbeat": w["last_heartbeat"],
        }

    area_locks = {r: db.locked_areas(conn, r) for r in repos}
    open_prs = {r: db.count_open_prs(conn, r) for r in repos}

    assigned = 0
    skipped_throttle = 0
    skipped_area_lock = 0
    skipped_no_worker = 0

    ready_tasks = db.list_ready_tasks(conn)
    for task in ready_tasks:
        repo = task["repo"]
        cfg = repo_cfg.get(repo)
        if not cfg:
            continue

        max_open = int(cfg["max_open_prs"])
        if max_open == 0 or open_prs.get(repo, 0) >= max_open:
            skipped_throttle += 1
            continue

        if cfg["area_locks_enabled"]:
            area = (task["area"] or "").strip()
            if area and area in area_locks.get(repo, set()):
                skipped_area_lock += 1
                continue

        required_skills = _parse_json_list(task["required_skills_json"])
        estimate_points = int(task["estimate_points"])

        candidates: list[tuple[tuple[int, int, float, str], str]] = []
        for worker_id, ws in worker_state.items():
            if not ws["online"]:
                continue
            if ws["status"] == "paused":
                continue
            if not _skills_match(ws["skills"], required_skills):
                continue
            if ws["used_points"] + estimate_points > ws["capacity_points"]:
                continue
            if ws["used_tasks"] + 1 > ws["max_concurrent_tasks"]:
                continue

            # Rank: lowest load points, then lowest concurrent tasks, then highest reputation, then most recent heartbeat
            # Use tuple that sorts ascending; for reputation, negate to prefer higher.
            key = (
                ws["used_points"],
                ws["used_tasks"],
                -ws["reputation"],
                ws["last_heartbeat"] or "",
            )
            candidates.append((key, worker_id))

        if not candidates:
            skipped_no_worker += 1
            continue

        candidates.sort(key=lambda x: x[0])
        _, best_worker = candidates[0]

        lease_expires = now + timedelta(seconds=config.lease_ttl_seconds)
        db.lease_task(conn, task_id=task["task_id"], worker_id=best_worker, lease_expires_at=lease_expires)
        assigned += 1

        # Update in-memory state for subsequent tasks in this cycle
        worker_state[best_worker]["used_points"] += estimate_points
        worker_state[best_worker]["used_tasks"] += 1
        if cfg["area_locks_enabled"]:
            area = (task["area"] or "").strip()
            if area:
                area_locks.setdefault(repo, set()).add(area)

    return {
        "requeued": requeued,
        "assigned": assigned,
        "skipped_throttle": skipped_throttle,
        "skipped_area_lock": skipped_area_lock,
        "skipped_no_worker": skipped_no_worker,
    }
