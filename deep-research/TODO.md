# TODO / Handover — OWP Pool (Hackathon)

## Context
- Goal: “Distributed AI Coding Worker Pool” framed as **OWP (Open Work Protocol)** + working demo.
- Priorities: **Obsidian plugin UI** (wow factor), **24/7 deployable in Docker**, **UX/polish + novelty**.
- Recommended direction: **TypeScript-first, spec-first** (OpenAPI/JSON Schema + generated clients).

## What already exists (reference prototype)
- Python MVP (scheduler + CLI + dashboard): `PROJECTS/AI-WORKER-POOL/src/pool/`
- Protocol draft: `PROJECTS/AI-WORKER-POOL/docs/owp-spec.md`
- Hackathon critique: `PROJECTS/AI-WORKER-POOL/docs/hackathon-review.md`
- PRD: `PROJECTS/AI-WORKER-POOL/docs/prd.md`
- Stack review + recommendation: `PROJECTS/AI-WORKER-POOL/docs/tech-stack-review.md`, `PROJECTS/AI-WORKER-POOL/docs/stack-recommendation.md`
- Demo helpers:
  - `PROJECTS/AI-WORKER-POOL/scripts/demo.sh` (`--auto` runs simulated workers)
  - `pool worker simulate` in `PROJECTS/AI-WORKER-POOL/src/pool/cli.py`

## MVP “Hackathon Deliverable” checklist (TypeScript)
### 0) Repo structure (monorepo)
- [ ] Create `PROJECTS/AI-WORKER-POOL-TS/` (or convert existing) with:
  - [ ] `packages/protocol/` (OWP spec + generated types)
  - [ ] `apps/server/` (scheduler API + DB + scheduler loop)
  - [ ] `apps/web/` (dashboard)
  - [ ] `apps/obsidian-plugin/` (plugin UI)
  - [ ] `apps/cli/` (optional; can be postponed if plugin can register workers/admin)

### 1) Spec-first protocol (source of truth)
- [ ] Write OpenAPI (`/v1/...`) from the existing Python endpoints and PRD:
  - [ ] `POST /v1/workers/register`
  - [ ] `POST /v1/workers/heartbeat`
  - [ ] `GET /v1/work`
  - [ ] `POST /v1/tasks/{task_id}/status`
  - [ ] `POST /v1/admin/repos`
  - [ ] `POST /v1/admin/tasks`
  - [ ] `GET /v1/admin/state`
  - [ ] Optional: `GET /v1/events` (for SSE/dashboard)
- [ ] Generate TS types + client from OpenAPI (single shared client used by web + plugin + CLI).
- [ ] Add runtime validation (`zod`) for request bodies and critical server outputs.

### 2) Server (Docker-ready, 24/7)
- [ ] Implement `apps/server`:
  - [ ] Fastify (or Hono) server + OpenAPI route definitions
  - [ ] SQLite persistence (volume-mounted)
  - [ ] Scheduler loop (interval timer) implementing:
    - [ ] leases with TTL + requeue
    - [ ] heartbeats + online/offline
    - [ ] capacity + concurrency constraints
    - [ ] skill matching
    - [ ] repo review budget throttle (`max_open_prs`)
    - [ ] area locks
  - [ ] Admin auth (`X-Admin-Token`) + worker auth (Bearer token)
- [ ] Docker:
  - [ ] `Dockerfile` (node:20-alpine, non-root)
  - [ ] `docker-compose.yml` with:
    - [ ] server container
    - [ ] mounted DB volume
    - [ ] env var config (`OWP_ADMIN_TOKEN`, etc.)

### 3) Dashboard (web)
- [ ] `apps/web` minimal but polished:
  - [ ] tables: repos (throttle), workers online, tasks by status, recent events
  - [ ] live refresh via SSE (preferred) or polling
  - [ ] copy/paste worker commands (for demo)

### 4) Obsidian plugin UI (hackathon impact)
- [ ] Build `apps/obsidian-plugin`:
  - [ ] Settings tab:
    - [ ] scheduler base URL
    - [ ] admin token (optional)
    - [ ] worker token (optional)
  - [ ] Main views:
    - [ ] “Pool Status” (counts, workers online, throttle)
    - [ ] “Tasks” (filters by repo/status/area)
    - [ ] “Events” stream (SSE/poll)
  - [ ] Actions:
    - [ ] admin: init repo, set `max_open_prs`, import tasks YAML
    - [ ] worker: register + heartbeat on/off (online toggle)
- [ ] Demo UX: a single “Start Demo” button that:
  - [ ] sets up a demo repo + imports tasks
  - [ ] registers a demo worker
  - [ ] starts heartbeating and shows leases

### 5) Hackathon demo reliability features
- [ ] Simulated worker mode (server-side or client-side):
  - [ ] auto transitions `leased → in_progress → pr_opened` with fake PR URL
  - [ ] optional “kill worker” button to show heartbeat expiry + requeue
- [ ] “Review budget” visualization:
  - [ ] show `max_open_prs`, open PR count, and “throttled” state clearly

## V1 (post-hackathon) high-impact improvements
- [ ] GitHub integration:
  - [ ] issue ingestion by label (`pool:ready`)
  - [ ] comment-only write-back on assign + PR opened (minimal permissions)
- [ ] Worker accept/reject:
  - [ ] `lease_id` + `ack/nack` and automatic decline timeout
- [ ] Policy tiers + trust:
  - [ ] route `tier>0` tasks only to trusted workers/allowlists
  - [ ] basic reputation score (opt-in)
- [ ] Conformance tests:
  - [ ] deterministic tests for leases, requeue, throttles, and locks
- [ ] Observability:
  - [ ] metrics endpoint (utilization, lead time, requeue rate)
  - [ ] event stream (SSE)

## Notes / constraints
- Obsidian vault hides dotfiles: prefer `env.local` (non-hidden) if you keep env files inside the vault.
- Keep secrets out of the repo: `.env`, `env.local`, etc. should be gitignored.
- The existing Python MVP remains useful as a behavior reference while building the TS version.

