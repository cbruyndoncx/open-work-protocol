from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Literal

from pydantic import BaseModel, Field


class WorkerStatus(str, Enum):
    idle = "idle"
    working = "working"
    paused = "paused"


class TaskStatus(str, Enum):
    ready = "ready"
    leased = "leased"
    in_progress = "in_progress"
    blocked = "blocked"
    pr_opened = "pr_opened"
    merged = "merged"


class RegisterWorkerRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    github_handle: str | None = Field(default=None, max_length=120)
    skills: list[str] = Field(default_factory=list)
    capacity_points: int = Field(default=5, ge=1, le=100)
    max_concurrent_tasks: int = Field(default=2, ge=1, le=20)


class RegisterWorkerResponse(BaseModel):
    worker_id: str
    token: str


class HeartbeatRequest(BaseModel):
    status: WorkerStatus = WorkerStatus.idle
    note: str | None = Field(default=None, max_length=500)


class HeartbeatResponse(BaseModel):
    ok: bool = True
    server_time: datetime


class LeaseView(BaseModel):
    task_id: str
    repo: str
    title: str
    description: str | None = None
    estimate_points: int
    priority: int
    area: str | None = None
    tier: int = 0
    required_skills: list[str] = Field(default_factory=list)
    lease_expires_at: datetime


class WorkResponse(BaseModel):
    worker_id: str
    leases: list[LeaseView]


class TaskArtifact(BaseModel):
    pr_url: str | None = None
    commit_sha: str | None = None
    patch_url: str | None = None
    extra: dict[str, Any] | None = None


class TaskStatusUpdateRequest(BaseModel):
    status: Literal["in_progress", "blocked", "pr_opened", "merged"]
    message: str | None = Field(default=None, max_length=4000)
    artifact: TaskArtifact | None = None


class RepoCreateRequest(BaseModel):
    repo: str = Field(min_length=1, max_length=200, description="Repo key, e.g. 'demo' or 'owner/name'")
    max_open_prs: int = Field(default=3, ge=0, le=100, description="Throttle PR flood; 0 disables assignments.")
    area_locks_enabled: bool = Field(default=True)


class RepoCreateResponse(BaseModel):
    ok: bool = True
    repo: str


class TaskCreateRequest(BaseModel):
    repo: str = Field(min_length=1, max_length=200)
    title: str = Field(min_length=1, max_length=300)
    description: str | None = None
    estimate_points: int = Field(default=1, ge=1, le=100)
    priority: int = Field(default=10, ge=0, le=1000, description="Higher = more important")
    required_skills: list[str] = Field(default_factory=list)
    area: str | None = Field(default=None, max_length=120)
    tier: int = Field(default=0, ge=0, le=3)


class TaskCreateResponse(BaseModel):
    ok: bool = True
    task_id: str


class AdminState(BaseModel):
    workers_online: int
    tasks_ready: int
    tasks_leased: int
    tasks_in_progress: int
    tasks_pr_opened: int
    tasks_blocked: int
    tasks_merged: int
