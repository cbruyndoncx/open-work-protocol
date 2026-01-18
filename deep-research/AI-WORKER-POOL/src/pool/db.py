from __future__ import annotations

import json
import sqlite3
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def to_iso(dt: datetime | None) -> str | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc).isoformat()


def from_iso(value: str | None) -> datetime | None:
    if value is None:
        return None
    return datetime.fromisoformat(value)


def json_dumps(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))


def json_loads(value: str | None) -> Any:
    if value is None or value == "":
        return None
    return json.loads(value)


def connect(db_path: str) -> sqlite3.Connection:
    Path(db_path).parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(db_path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def init_db(conn: sqlite3.Connection) -> None:
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS repos (
          repo TEXT PRIMARY KEY,
          max_open_prs INTEGER NOT NULL,
          area_locks_enabled INTEGER NOT NULL,
          created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS workers (
          worker_id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          github_handle TEXT,
          skills_json TEXT NOT NULL,
          capacity_points INTEGER NOT NULL,
          max_concurrent_tasks INTEGER NOT NULL,
          status TEXT NOT NULL,
          last_heartbeat TEXT,
          token_hash TEXT NOT NULL,
          reputation REAL NOT NULL DEFAULT 0.0,
          created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS tasks (
          task_id TEXT PRIMARY KEY,
          repo TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          estimate_points INTEGER NOT NULL,
          priority INTEGER NOT NULL,
          required_skills_json TEXT NOT NULL,
          area TEXT,
          tier INTEGER NOT NULL,
          status TEXT NOT NULL,
          assigned_worker_id TEXT,
          leased_at TEXT,
          lease_expires_at TEXT,
          updated_at TEXT NOT NULL,
          message TEXT,
          artifact_json TEXT,
          attempt INTEGER NOT NULL DEFAULT 0,
          FOREIGN KEY(repo) REFERENCES repos(repo) ON DELETE CASCADE,
          FOREIGN KEY(assigned_worker_id) REFERENCES workers(worker_id) ON DELETE SET NULL
        );

        CREATE INDEX IF NOT EXISTS idx_tasks_repo_status ON tasks(repo, status);
        CREATE INDEX IF NOT EXISTS idx_tasks_status_priority ON tasks(status, priority);

        CREATE TABLE IF NOT EXISTS events (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          ts TEXT NOT NULL,
          type TEXT NOT NULL,
          actor_worker_id TEXT,
          repo TEXT,
          task_id TEXT,
          details_json TEXT,
          FOREIGN KEY(actor_worker_id) REFERENCES workers(worker_id) ON DELETE SET NULL
        );
        """
    )
    conn.commit()


def log_event(
    conn: sqlite3.Connection,
    *,
    event_type: str,
    actor_worker_id: str | None = None,
    repo: str | None = None,
    task_id: str | None = None,
    details: dict[str, Any] | None = None,
) -> None:
    conn.execute(
        "INSERT INTO events(ts,type,actor_worker_id,repo,task_id,details_json) VALUES (?,?,?,?,?,?)",
        (to_iso(utc_now()), event_type, actor_worker_id, repo, task_id, json_dumps(details or {})),
    )
    conn.commit()


def upsert_repo(conn: sqlite3.Connection, *, repo: str, max_open_prs: int, area_locks_enabled: bool) -> None:
    conn.execute(
        """
        INSERT INTO repos(repo,max_open_prs,area_locks_enabled,created_at)
        VALUES (?,?,?,?)
        ON CONFLICT(repo) DO UPDATE SET
          max_open_prs=excluded.max_open_prs,
          area_locks_enabled=excluded.area_locks_enabled
        """,
        (repo, max_open_prs, 1 if area_locks_enabled else 0, to_iso(utc_now())),
    )
    conn.commit()


def repo_row(conn: sqlite3.Connection, repo: str) -> sqlite3.Row | None:
    cur = conn.execute("SELECT * FROM repos WHERE repo = ?", (repo,))
    return cur.fetchone()


def list_repos(conn: sqlite3.Connection) -> list[str]:
    cur = conn.execute("SELECT repo FROM repos ORDER BY repo ASC")
    return [r["repo"] for r in cur.fetchall()]


def insert_worker(
    conn: sqlite3.Connection,
    *,
    worker_id: str,
    name: str,
    github_handle: str | None,
    skills: list[str],
    capacity_points: int,
    max_concurrent_tasks: int,
    status: str,
    token_hash: str,
) -> None:
    conn.execute(
        """
        INSERT INTO workers(worker_id,name,github_handle,skills_json,capacity_points,max_concurrent_tasks,status,last_heartbeat,token_hash,created_at)
        VALUES (?,?,?,?,?,?,?,?,?,?)
        """,
        (
            worker_id,
            name,
            github_handle,
            json_dumps(skills),
            capacity_points,
            max_concurrent_tasks,
            status,
            None,
            token_hash,
            to_iso(utc_now()),
        ),
    )
    conn.commit()


def worker_by_token_hash(conn: sqlite3.Connection, token_hash: str) -> sqlite3.Row | None:
    cur = conn.execute("SELECT * FROM workers WHERE token_hash = ?", (token_hash,))
    return cur.fetchone()


def worker_by_id(conn: sqlite3.Connection, worker_id: str) -> sqlite3.Row | None:
    cur = conn.execute("SELECT * FROM workers WHERE worker_id = ?", (worker_id,))
    return cur.fetchone()


def update_worker_heartbeat(
    conn: sqlite3.Connection,
    *,
    worker_id: str,
    status: str,
    note: str | None,
) -> None:
    conn.execute(
        "UPDATE workers SET status=?, last_heartbeat=? WHERE worker_id=?",
        (status, to_iso(utc_now()), worker_id),
    )
    log_event(conn, event_type="worker.heartbeat", actor_worker_id=worker_id, details={"status": status, "note": note})
    conn.commit()


def insert_task(
    conn: sqlite3.Connection,
    *,
    task_id: str,
    repo: str,
    title: str,
    description: str | None,
    estimate_points: int,
    priority: int,
    required_skills: list[str],
    area: str | None,
    tier: int,
) -> None:
    conn.execute(
        """
        INSERT INTO tasks(
          task_id, repo, title, description, estimate_points, priority, required_skills_json, area, tier,
          status, assigned_worker_id, leased_at, lease_expires_at, updated_at, message, artifact_json, attempt
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        """,
        (
            task_id,
            repo,
            title,
            description,
            estimate_points,
            priority,
            json_dumps(required_skills),
            area,
            tier,
            "ready",
            None,
            None,
            None,
            to_iso(utc_now()),
            None,
            None,
            0,
        ),
    )
    conn.commit()


def list_tasks_for_worker(conn: sqlite3.Connection, worker_id: str) -> list[sqlite3.Row]:
    cur = conn.execute(
        """
        SELECT * FROM tasks
        WHERE assigned_worker_id = ?
          AND status IN ('leased','in_progress','blocked','pr_opened')
        ORDER BY priority DESC, estimate_points ASC
        """,
        (worker_id,),
    )
    return cur.fetchall()


def update_task_status(
    conn: sqlite3.Connection,
    *,
    task_id: str,
    actor_worker_id: str,
    status: str,
    message: str | None,
    artifact: dict[str, Any] | None,
) -> None:
    conn.execute(
        """
        UPDATE tasks
        SET status = ?, message = ?, artifact_json = ?, updated_at = ?
        WHERE task_id = ?
        """,
        (status, message, json_dumps(artifact or {}), to_iso(utc_now()), task_id),
    )
    log_event(
        conn,
        event_type="task.status",
        actor_worker_id=actor_worker_id,
        task_id=task_id,
        details={"status": status, "message": message, "artifact": artifact},
    )
    conn.commit()


def lease_task(
    conn: sqlite3.Connection,
    *,
    task_id: str,
    worker_id: str,
    lease_expires_at: datetime,
) -> None:
    conn.execute(
        """
        UPDATE tasks
        SET status='leased', assigned_worker_id=?, leased_at=?, lease_expires_at=?, updated_at=?
        WHERE task_id=?
        """,
        (worker_id, to_iso(utc_now()), to_iso(lease_expires_at), to_iso(utc_now()), task_id),
    )
    log_event(conn, event_type="task.leased", actor_worker_id=worker_id, task_id=task_id, details={"lease_expires_at": to_iso(lease_expires_at)})
    conn.commit()


def requeue_expired_leases(conn: sqlite3.Connection) -> int:
    now = utc_now()
    cur = conn.execute(
        """
        SELECT task_id FROM tasks
        WHERE status IN ('leased','in_progress')
          AND lease_expires_at IS NOT NULL
          AND lease_expires_at < ?
        """,
        (to_iso(now),),
    )
    task_ids = [r["task_id"] for r in cur.fetchall()]
    for task_id in task_ids:
        conn.execute(
            """
            UPDATE tasks
            SET status='ready',
                assigned_worker_id=NULL,
                leased_at=NULL,
                lease_expires_at=NULL,
                message='requeued (lease expired)',
                updated_at=?,
                attempt=attempt+1
            WHERE task_id=?
            """,
            (to_iso(utc_now()), task_id),
        )
        log_event(conn, event_type="task.requeued", task_id=task_id, details={"reason": "lease_expired"})
    conn.commit()
    return len(task_ids)


def counts_by_status(conn: sqlite3.Connection) -> dict[str, int]:
    cur = conn.execute("SELECT status, COUNT(*) AS n FROM tasks GROUP BY status")
    return {r["status"]: int(r["n"]) for r in cur.fetchall()}


def count_open_prs(conn: sqlite3.Connection, repo: str) -> int:
    cur = conn.execute("SELECT COUNT(*) AS n FROM tasks WHERE repo=? AND status='pr_opened'", (repo,))
    row = cur.fetchone()
    return int(row["n"]) if row else 0


def locked_areas(conn: sqlite3.Connection, repo: str) -> set[str]:
    cur = conn.execute(
        """
        SELECT DISTINCT area FROM tasks
        WHERE repo=?
          AND area IS NOT NULL
          AND area != ''
          AND status IN ('leased','in_progress')
        """,
        (repo,),
    )
    return {r["area"] for r in cur.fetchall()}


def list_ready_tasks(conn: sqlite3.Connection) -> list[sqlite3.Row]:
    cur = conn.execute(
        """
        SELECT * FROM tasks
        WHERE status='ready'
        ORDER BY priority DESC, estimate_points ASC, task_id ASC
        """
    )
    return cur.fetchall()


def list_workers(conn: sqlite3.Connection) -> list[sqlite3.Row]:
    cur = conn.execute("SELECT * FROM workers ORDER BY created_at ASC")
    return cur.fetchall()


def worker_load(conn: sqlite3.Connection, worker_id: str) -> tuple[int, int]:
    cur = conn.execute(
        """
        SELECT
          COALESCE(SUM(estimate_points), 0) AS pts,
          COUNT(*) AS n
        FROM tasks
        WHERE assigned_worker_id = ?
          AND status IN ('leased','in_progress')
        """,
        (worker_id,),
    )
    row = cur.fetchone()
    return int(row["pts"]), int(row["n"])

