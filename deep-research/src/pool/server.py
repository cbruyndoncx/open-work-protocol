from __future__ import annotations

import argparse
import threading
import time
import uuid
from datetime import datetime, timezone
from typing import Any

import uvicorn
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.responses import HTMLResponse, JSONResponse

from . import db
from .auth import generate_token, hash_token, require_admin, require_bearer_token
from .envfile import load_env
from .models import (
    AdminState,
    HeartbeatRequest,
    HeartbeatResponse,
    RegisterWorkerRequest,
    RegisterWorkerResponse,
    RepoCreateRequest,
    RepoCreateResponse,
    TaskCreateRequest,
    TaskCreateResponse,
    TaskStatusUpdateRequest,
    WorkResponse,
)
from .scheduler import SchedulerConfig, run_scheduling_cycle


class PoolService:
    def __init__(self, db_path: str, *, scheduler_config: SchedulerConfig) -> None:
        self.db_path = db_path
        self.scheduler_config = scheduler_config
        self._lock = threading.Lock()

        with self._lock:
            conn = db.connect(self.db_path)
            db.init_db(conn)
            conn.close()

    def run_cycle(self) -> dict[str, int]:
        with self._lock:
            conn = db.connect(self.db_path)
            try:
                return run_scheduling_cycle(conn, config=self.scheduler_config)
            finally:
                conn.close()

    def create_repo(self, repo: str, max_open_prs: int, area_locks_enabled: bool) -> None:
        with self._lock:
            conn = db.connect(self.db_path)
            try:
                db.upsert_repo(conn, repo=repo, max_open_prs=max_open_prs, area_locks_enabled=area_locks_enabled)
                db.log_event(conn, event_type="repo.upsert", repo=repo, details={"max_open_prs": max_open_prs, "area_locks_enabled": area_locks_enabled})
            finally:
                conn.close()

    def register_worker(self, req: RegisterWorkerRequest) -> RegisterWorkerResponse:
        token = generate_token()
        token_h = hash_token(token)
        worker_id = f"w_{uuid.uuid4().hex[:12]}"

        with self._lock:
            conn = db.connect(self.db_path)
            try:
                db.insert_worker(
                    conn,
                    worker_id=worker_id,
                    name=req.name,
                    github_handle=req.github_handle,
                    skills=req.skills,
                    capacity_points=req.capacity_points,
                    max_concurrent_tasks=req.max_concurrent_tasks,
                    status="idle",
                    token_hash=token_h,
                )
                db.log_event(
                    conn,
                    event_type="worker.register",
                    actor_worker_id=worker_id,
                    details={"name": req.name, "github_handle": req.github_handle, "skills": req.skills},
                )
            finally:
                conn.close()

        return RegisterWorkerResponse(worker_id=worker_id, token=token)

    def authenticate_worker(self, bearer_token: str) -> str:
        token_h = hash_token(bearer_token)
        with self._lock:
            conn = db.connect(self.db_path)
            try:
                row = db.worker_by_token_hash(conn, token_h)
                if not row:
                    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid worker token")
                return str(row["worker_id"])
            finally:
                conn.close()

    def heartbeat(self, worker_id: str, req: HeartbeatRequest) -> None:
        with self._lock:
            conn = db.connect(self.db_path)
            try:
                if not db.worker_by_id(conn, worker_id):
                    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unknown worker")
                db.update_worker_heartbeat(conn, worker_id=worker_id, status=req.status.value, note=req.note)
            finally:
                conn.close()

    def work_for(self, worker_id: str) -> WorkResponse:
        with self._lock:
            conn = db.connect(self.db_path)
            try:
                tasks = db.list_tasks_for_worker(conn, worker_id)
                leases = []
                for t in tasks:
                    lease_expires = db.from_iso(t["lease_expires_at"])
                    if not lease_expires:
                        # Shouldn't happen, but keep UI stable
                        lease_expires = db.utc_now()
                    leases.append(
                        {
                            "task_id": t["task_id"],
                            "repo": t["repo"],
                            "title": t["title"],
                            "description": t["description"],
                            "estimate_points": int(t["estimate_points"]),
                            "priority": int(t["priority"]),
                            "area": t["area"],
                            "tier": int(t["tier"]),
                            "required_skills": db.json_loads(t["required_skills_json"]) or [],
                            "lease_expires_at": lease_expires,
                        }
                    )
                return WorkResponse(worker_id=worker_id, leases=leases)
            finally:
                conn.close()

    def add_task(self, req: TaskCreateRequest) -> TaskCreateResponse:
        task_id = f"t_{uuid.uuid4().hex[:12]}"
        with self._lock:
            conn = db.connect(self.db_path)
            try:
                if not db.repo_row(conn, req.repo):
                    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unknown repo: {req.repo}")
                db.insert_task(
                    conn,
                    task_id=task_id,
                    repo=req.repo,
                    title=req.title,
                    description=req.description,
                    estimate_points=req.estimate_points,
                    priority=req.priority,
                    required_skills=req.required_skills,
                    area=req.area,
                    tier=req.tier,
                )
                db.log_event(conn, event_type="task.create", repo=req.repo, task_id=task_id, details=req.model_dump())
            finally:
                conn.close()
        return TaskCreateResponse(task_id=task_id)

    def update_task_status(self, *, worker_id: str, task_id: str, req: TaskStatusUpdateRequest) -> None:
        with self._lock:
            conn = db.connect(self.db_path)
            try:
                row = conn.execute("SELECT * FROM tasks WHERE task_id=?", (task_id,)).fetchone()
                if not row:
                    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
                if row["assigned_worker_id"] != worker_id:
                    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Task not assigned to this worker")

                # Allow limited transitions
                new_status = req.status
                if new_status not in {"in_progress", "blocked", "pr_opened", "merged"}:
                    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid status")

                db.update_task_status(
                    conn,
                    task_id=task_id,
                    actor_worker_id=worker_id,
                    status=new_status,
                    message=req.message,
                    artifact=(req.artifact.model_dump() if req.artifact else None),
                )
            finally:
                conn.close()

    def admin_state(self) -> AdminState:
        with self._lock:
            conn = db.connect(self.db_path)
            try:
                counts = db.counts_by_status(conn)
                workers = db.list_workers(conn)
                now = db.utc_now()
                online = 0
                for w in workers:
                    hb = w["last_heartbeat"]
                    if not hb:
                        continue
                    try:
                        ts = datetime.fromisoformat(hb)
                        if ts.tzinfo is None:
                            ts = ts.replace(tzinfo=timezone.utc)
                    except ValueError:
                        continue
                    if (now - ts).total_seconds() <= self.scheduler_config.heartbeat_ttl_seconds:
                        online += 1
                return AdminState(
                    workers_online=online,
                    tasks_ready=counts.get("ready", 0),
                    tasks_leased=counts.get("leased", 0),
                    tasks_in_progress=counts.get("in_progress", 0),
                    tasks_pr_opened=counts.get("pr_opened", 0),
                    tasks_blocked=counts.get("blocked", 0),
                    tasks_merged=counts.get("merged", 0),
                )
            finally:
                conn.close()

    def dashboard_html(self) -> str:
        with self._lock:
            conn = db.connect(self.db_path)
            try:
                counts = db.counts_by_status(conn)
                repos = conn.execute("SELECT * FROM repos ORDER BY repo").fetchall()
                workers = conn.execute("SELECT * FROM workers ORDER BY created_at").fetchall()
                tasks = conn.execute("SELECT * FROM tasks ORDER BY updated_at DESC LIMIT 50").fetchall()
                events = conn.execute("SELECT * FROM events ORDER BY id DESC LIMIT 50").fetchall()
                open_prs = {r["repo"]: db.count_open_prs(conn, r["repo"]) for r in repos}
            finally:
                conn.close()

        def esc(s: Any) -> str:
            return (str(s) if s is not None else "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

        now = datetime.now(timezone.utc).isoformat()
        parts = []
        parts.append("<html><head><meta charset='utf-8'/>")
        parts.append("<meta http-equiv='refresh' content='2'/>")
        parts.append(
            "<style>"
            "body{font-family:ui-sans-serif,system-ui,Segoe UI,Roboto,Arial;padding:16px}"
            "table{border-collapse:collapse}"
            "td,th{border:1px solid #ddd;padding:6px 8px}"
            "th{background:#f6f6f6}"
            "code{background:#f2f2f2;padding:2px 4px;border-radius:4px}"
            "tr.offline{opacity:0.55}"
            "tr.throttled{background:#fff4cc}"
            "</style>"
        )
        parts.append(f"<title>OWP Pool Dashboard</title></head><body>")
        parts.append(f"<h1>OWP Pool Dashboard</h1><p><b>Server time</b>: <code>{esc(now)}</code></p>")
        parts.append("<h2>Counts</h2><table><tr><th>Status</th><th>Count</th></tr>")
        for k in ["ready", "leased", "in_progress", "blocked", "pr_opened", "merged"]:
            parts.append(f"<tr><td>{esc(k)}</td><td>{esc(counts.get(k,0))}</td></tr>")
        parts.append("</table>")

        parts.append("<h2>Repos</h2><table><tr><th>Repo</th><th>max_open_prs</th><th>area_locks</th><th>open_prs</th><th>throttled</th></tr>")
        for r in repos:
            repo = str(r["repo"])
            max_open = int(r["max_open_prs"])
            open_pr = int(open_prs.get(repo, 0))
            throttled = max_open == 0 or open_pr >= max_open
            row_class = " class='throttled'" if throttled else ""
            parts.append(
                f"<tr{row_class}>"
                f"<td>{esc(repo)}</td>"
                f"<td>{esc(max_open)}</td>"
                f"<td>{'on' if int(r['area_locks_enabled']) else 'off'}</td>"
                f"<td>{esc(open_pr)}</td>"
                f"<td>{'yes' if throttled else 'no'}</td>"
                "</tr>"
            )
        parts.append("</table>")

        parts.append("<h2>Workers</h2><table><tr><th>worker_id</th><th>name</th><th>online</th><th>skills</th><th>capacity</th><th>max_conc</th><th>status</th><th>last_heartbeat</th><th>load(pts/tasks)</th></tr>")
        conn2 = db.connect(self.db_path)
        try:
            now_dt = db.utc_now()
            for w in workers:
                pts, n = db.worker_load(conn2, w["worker_id"])
                hb = w["last_heartbeat"]
                online = False
                if hb:
                    try:
                        ts = datetime.fromisoformat(hb)
                        if ts.tzinfo is None:
                            ts = ts.replace(tzinfo=timezone.utc)
                        online = (now_dt - ts).total_seconds() <= self.scheduler_config.heartbeat_ttl_seconds
                    except ValueError:
                        online = False
                row_class = "" if online else " class='offline'"
                parts.append(
                    f"<tr{row_class}>"
                    f"<td><code>{esc(w['worker_id'])}</code></td>"
                    f"<td>{esc(w['name'])}</td>"
                    f"<td>{'yes' if online else 'no'}</td>"
                    f"<td>{esc(','.join(db.json_loads(w['skills_json']) or []))}</td>"
                    f"<td>{esc(w['capacity_points'])}</td>"
                    f"<td>{esc(w['max_concurrent_tasks'])}</td>"
                    f"<td>{esc(w['status'])}</td>"
                    f"<td>{esc(w['last_heartbeat'])}</td>"
                    f"<td>{esc(pts)}/{esc(n)}</td>"
                    "</tr>"
                )
        finally:
            conn2.close()
        parts.append("</table>")

        parts.append("<h2>Recent Tasks</h2><table><tr><th>task_id</th><th>repo</th><th>status</th><th>title</th><th>assignee</th><th>updated</th><th>area</th><th>artifact</th></tr>")
        for t in tasks:
            art = db.json_loads(t["artifact_json"]) or {}
            parts.append(
                "<tr>"
                f"<td><code>{esc(t['task_id'])}</code></td>"
                f"<td>{esc(t['repo'])}</td>"
                f"<td>{esc(t['status'])}</td>"
                f"<td>{esc(t['title'])}</td>"
                f"<td><code>{esc(t['assigned_worker_id'])}</code></td>"
                f"<td>{esc(t['updated_at'])}</td>"
                f"<td>{esc(t['area'])}</td>"
                f"<td>{esc(art.get('pr_url') or art.get('commit_sha') or '')}</td>"
                "</tr>"
            )
        parts.append("</table>")

        parts.append("<h2>Recent Events</h2><table><tr><th>ts</th><th>type</th><th>actor</th><th>task</th><th>details</th></tr>")
        for e in events:
            parts.append(
                "<tr>"
                f"<td>{esc(e['ts'])}</td>"
                f"<td>{esc(e['type'])}</td>"
                f"<td><code>{esc(e['actor_worker_id'])}</code></td>"
                f"<td><code>{esc(e['task_id'])}</code></td>"
                f"<td><code>{esc(e['details_json'])}</code></td>"
                "</tr>"
            )
        parts.append("</table>")

        parts.append("</body></html>")
        return "".join(parts)


def create_app(service: PoolService) -> FastAPI:
    app = FastAPI(title="OWP Pool", version="0.1.0")

    @app.get("/", response_class=HTMLResponse)
    def dashboard() -> str:
        return service.dashboard_html()

    @app.get("/healthz")
    def healthz() -> dict[str, Any]:
        return {"ok": True}

    @app.post("/v1/workers/register", response_model=RegisterWorkerResponse)
    def register_worker(req: RegisterWorkerRequest) -> RegisterWorkerResponse:
        return service.register_worker(req)

    @app.post("/v1/workers/heartbeat", response_model=HeartbeatResponse)
    def heartbeat(req: HeartbeatRequest, token: str = Depends(require_bearer_token)) -> HeartbeatResponse:
        worker_id = service.authenticate_worker(token)
        service.heartbeat(worker_id, req)
        service.run_cycle()
        return HeartbeatResponse(server_time=datetime.now(timezone.utc))

    @app.get("/v1/work", response_model=WorkResponse)
    def work(token: str = Depends(require_bearer_token)) -> WorkResponse:
        worker_id = service.authenticate_worker(token)
        service.run_cycle()
        return service.work_for(worker_id)

    @app.post("/v1/tasks/{task_id}/status")
    def task_status(task_id: str, req: TaskStatusUpdateRequest, token: str = Depends(require_bearer_token)) -> JSONResponse:
        worker_id = service.authenticate_worker(token)
        service.update_task_status(worker_id=worker_id, task_id=task_id, req=req)
        service.run_cycle()
        return JSONResponse({"ok": True})

    @app.post("/v1/admin/repos", dependencies=[Depends(require_admin)], response_model=RepoCreateResponse)
    def admin_create_repo(req: RepoCreateRequest) -> RepoCreateResponse:
        service.create_repo(req.repo, req.max_open_prs, req.area_locks_enabled)
        return RepoCreateResponse(repo=req.repo)

    @app.post("/v1/admin/tasks", dependencies=[Depends(require_admin)], response_model=TaskCreateResponse)
    def admin_create_task(req: TaskCreateRequest) -> TaskCreateResponse:
        return service.add_task(req)

    @app.get("/v1/admin/state", dependencies=[Depends(require_admin)], response_model=AdminState)
    def admin_state() -> AdminState:
        return service.admin_state()

    return app


def _scheduler_loop(service: PoolService, *, interval_seconds: int, stop_event: threading.Event) -> None:
    while not stop_event.is_set():
        try:
            service.run_cycle()
        except Exception:
            # Keep the loop alive; details are visible in logs when running uvicorn
            pass
        stop_event.wait(interval_seconds)


def main() -> None:
    load_env()
    parser = argparse.ArgumentParser(prog="poold")
    parser.add_argument("--db", required=True, help="SQLite DB path")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", default=8787, type=int)
    parser.add_argument("--lease-ttl", default=30 * 60, type=int, help="Lease TTL seconds")
    parser.add_argument("--heartbeat-ttl", default=90, type=int, help="Worker online TTL seconds")
    parser.add_argument("--cycle", default=5, type=int, help="Scheduler cycle seconds")
    args = parser.parse_args()

    service = PoolService(args.db, scheduler_config=SchedulerConfig(lease_ttl_seconds=args.lease_ttl, heartbeat_ttl_seconds=args.heartbeat_ttl))
    app = create_app(service)

    stop_event = threading.Event()
    t = threading.Thread(target=_scheduler_loop, args=(service,), kwargs={"interval_seconds": args.cycle, "stop_event": stop_event}, daemon=True)
    t.start()

    uvicorn.run(app, host=args.host, port=args.port, log_level="info")


if __name__ == "__main__":
    main()
