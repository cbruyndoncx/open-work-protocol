# Open Work Protocol (OWP) — v0.1 (Draft)

OWP is a minimal protocol for coordinating **independent workers** (humans using their own local tools: Claude Code, Copilot, Cursor, Aider, etc.) against a shared task queue.

Design goals:
- **BYO seat** (no shared accounts, no centralized token pooling)
- **Least privilege** (scheduler never needs worker machine access)
- **Capacity-aware** (points + concurrency limits)
- **Resilient** (leases + heartbeats + requeue)
- **Tool-agnostic** (workers run anything locally; scheduler only tracks status + artifacts)

This repository ships a reference implementation (`poold` + `pool`).

## Concepts

### Worker
An independently operated client that polls for work and reports progress.

Key fields:
- `skills[]` (tags)
- `capacity_points` (per day or per session)
- `max_concurrent_tasks`

### Task
Unit of work to be completed. Task sources can be:
- local YAML/JSON
- Beads
- GitHub Issues (labels)

Key fields:
- `estimate_points` (1–5 in v0.1)
- `priority` (integer)
- `required_skills[]`
- `area` (conflict-avoidance lock)
- `tier` (risk level)

### Lease
Assignments are **leases** with TTL, not permanent ownership.
- Worker must heartbeat to keep the lease alive.
- Expired leases are requeued automatically.

### Artifact
Proof-of-work metadata:
- PR URL, commit SHA, patch URL, etc.

## API (v0.1)

All endpoints are JSON over HTTP.

Authentication:
- Worker uses `Authorization: Bearer <token>`
- Admin uses `X-Admin-Token: <token>`

### Worker Registration
`POST /v1/workers/register`

Request:
```json
{
  "name": "Alice",
  "github_handle": "alice",
  "skills": ["python","docs"],
  "capacity_points": 5,
  "max_concurrent_tasks": 2
}
```

Response:
```json
{
  "worker_id": "w_...",
  "token": "…"
}
```

### Heartbeat
`POST /v1/workers/heartbeat`

Request:
```json
{
  "status": "idle|working|paused",
  "note": "optional human-readable"
}
```

### Fetch Work
`GET /v1/work`

Response:
```json
{
  "worker_id": "w_...",
  "leases": [
    {
      "task_id": "t_...",
      "repo": "demo",
      "title": "Add tests for …",
      "estimate_points": 2,
      "priority": 10,
      "area": "auth",
      "required_skills": ["python"],
      "lease_expires_at": "2026-01-17T12:34:56Z"
    }
  ]
}
```

### Task Status Update
`POST /v1/tasks/{task_id}/status`

Request:
```json
{
  "status": "in_progress|blocked|pr_opened|merged",
  "message": "optional",
  "artifact": {
    "pr_url": "https://github.com/org/repo/pull/123"
  }
}
```

## Non-goals (v0.1)
- Remote execution on worker machines
- Centralized LLM calling
- “Perfect” global optimization (greedy scheduling is fine)
