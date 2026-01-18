# PRD — Open Work Protocol (OWP) Pool

## 1) Summary
OWP Pool is a **capacity-aware task scheduler + worker protocol** that coordinates **independent contributors** (each using their own local AI coding tools and GitHub identity) to produce PRs for shared repositories without shared accounts or centralized LLM token pooling.

This PRD defines the MVP/V1 product for a hackathon-grade demo and a credible path to open-source adoption.

## 2) Problem
Open source and internal org repos have “spare contributor capacity” (including AI-assisted capacity), but:
- Maintainers lack **safe throttles** and **coordination** to accept many parallel contributors.
- Volunteers lack **skill-matched small tasks** that fit their time window.
- Existing “coding agents” are typically **single-entity** (one org agent) rather than a **volunteer pool** model.

Core pain: coordination + review overload + trust.

## 3) Goals (What success looks like)
### G1 — BYO seat
Enable contributors to use their own tools/seats (Claude Code, Copilot, Cursor, Aider) without sharing accounts.

### G2 — Maintainer-first safety
Prevent PR floods via explicit guardrails (review budget, risk tiers, audit log).

### G3 — Simple “join the pool”
One command (or one UI flow) to register a worker with declared skills/capacity and start receiving work.

### G4 — Protocol credibility
Publish a small, implementable spec (OWP v0.x) + reference implementation + conformance behaviors.

## 4) Non-goals
- Running code on worker machines from the scheduler (no remote execution).
- Centralized LLM inference or token pooling.
- “Perfect” global optimization (greedy scheduling is acceptable for v1).

## 5) Personas
### Maintainer (Open Source)
- Needs help but cannot review unlimited PRs.
- Wants predictable workflows and repo safety.

### Volunteer Worker (Contributor)
- Has a local AI tool subscription and wants small, skill-matched tasks.
- Wants credit/attribution and clear instructions.

### Org Engineering Lead (Optional)
- Wants to route spare capacity across repos and prevent bottlenecks.
- Needs auditability and policy controls.

## 6) User journeys
### Maintainer journey
1) Install scheduler (self-host) or run locally for a repo.
2) Register repo and policy (review budget, allowed tiers, “area” mapping).
3) Import tasks (from GitHub issues / Beads / YAML).
4) Observe queue, worker availability, and PR throughput in a dashboard.

### Volunteer journey
1) Register once (name, skills, capacity, concurrency).
2) Poll for work (or get work when online).
3) Do work locally using preferred tools and submit PR using own GitHub identity.
4) Post status + artifact (PR URL) back to scheduler; optionally get credit/rep.

## 7) Requirements
### 7.1 Functional requirements (MVP / Hackathon)
- **Worker registration**: `name`, `skills[]`, `capacity_points`, `max_concurrent_tasks`.
- **Heartbeats**: worker online/offline inferred from heartbeat TTL.
- **Leases (TTL)**: assignments are time-bound; expired leases requeue.
- **Capacity-aware scheduling**: do not exceed worker capacity/concurrency.
- **Skill matching**: tasks can require skills; workers must match.
- **Maintainer throttle**: per-repo `max_open_prs` (review budget) gating.
- **Collision avoidance**: `area` lock (only one active task per area).
- **Dashboard**: show queue, workers online, assignments, throttle status.
- **Admin CRUD**: create repo policy; ingest tasks (YAML) at minimum.

### 7.1.1 Obsidian plugin UI (Hackathon “wow” requirement)
- **Connect to scheduler**: configure base URL + tokens in plugin settings.
- **Live status views**: workers online, tasks by status, recent events.
- **Fast actions** (admin): init repo policy, import tasks, set `max_open_prs`.
- **Fast actions** (worker): register worker, start/stop “online” heartbeat, accept/reject leases (v1).

### 7.2 Functional requirements (V1)
- **GitHub issue ingestion**: import open issues by label and map labels → task fields.
- **GitHub write-back (comment-only)**: post assignment + PR link back to issue.
- **Worker accept/reject**: workers must accept within N seconds; reject with reason.
- **Policy tiers**: route `tier>0` only to trusted workers or allowlists.
- **Reputation/trust**: simple reputation score based on task outcomes (opt-in).

### 7.3 Non-functional requirements
- **Cross-platform**: volunteers should join on macOS/Windows/Linux.
- **Low install friction**: minimal prerequisites; ideally single binary for CLI/daemon.
- **Security**: least privilege; avoid central tokens when possible; audit log.
- **Reliability**: tolerate worker crashes and network partitions; avoid double-assign.
- **Observability**: event log + basic metrics (utilization, requeue rate).

## 8) Core data model
### Worker
- `worker_id`, `name`, `skills[]`, `capacity_points`, `max_concurrent_tasks`
- `status` (`idle|working|paused`), `last_heartbeat`
- `reputation` (v1)

### Task
- `task_id`, `repo`, `title`, `description`
- `estimate_points`, `priority`
- `required_skills[]`, `area`, `tier`
- `status` (`ready|leased|in_progress|blocked|pr_opened|merged`)
- `assigned_worker_id`, `lease_expires_at`
- `artifact` (`pr_url`, `commit_sha`, etc.)

### Repo policy
- `repo`, `max_open_prs`, `area_locks_enabled`
- (v1) allowed tiers, label maps, workflow contract.

## 9) Protocol (OWP)
- OWP is “JSON over HTTP” with worker bearer tokens and an admin token.
- See `docs/owp-spec.md`.
- V1 protocol hardening targets:
  - add `lease_id` + `ack/nack`
  - idempotency keys for status updates
  - capabilities negotiation

## 10) Success metrics (hackathon + early adoption)
- Time-to-first-contribution (new worker joins + gets a task): < 2 minutes.
- Maintainer workload protection: PRs never exceed configured budget.
- Reliability: expired leases requeue automatically; no permanent stuck tasks.
- Demonstrable multi-worker scheduling (skills + area locks + throttles) in live demo.

## 11) Risks and mitigations
- **PR spam** → review budget throttle + quality gates + safe lanes (docs/tests first).
- **Trust/security** → tiered routing + audit log + minimal GitHub write scopes.
- **Collisions** → area locks now; file/path locks later; accept/decline flow.
- **Incentives** → attribution automation + opt-in reputation.

## 12) Open questions
- What is the “task source of truth”: Beads, GitHub Issues, or hybrid?
- How to model “capacity”: points/day vs concurrent tasks vs time windows?
- Should the scheduler be central SaaS, self-hosted, or “repo-local” (in plugin/CI)?
- Best write-back mechanism: GitHub App vs user PATs vs comment-only with minimal scopes?
