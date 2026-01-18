# Stack Recommendation + Migration Plan (OWP Pool)

## TL;DR recommendation
### Given your constraints (plugin UI + 24/7 in Docker + novelty/UX)
- Build the **scheduler/API in TypeScript** (containerized), ship an **Obsidian plugin UI** (TypeScript), and keep everything **spec-first** (OpenAPI/JSON Schema).
- Treat the current Python implementation as a reference prototype and a behavior oracle, not the final stack.

### If you want the best “real world” install story (post-hackathon)
- Keep the protocol (OWP) stable.
- Re-implement the daemon + CLI in **Rust** as a single-binary distribution (`owpd`, `owp`).
- Keep the Obsidian plugin + dashboard in TypeScript (front-end stays JS/TS anyway).

## Why this split is the sweet spot
- Obsidian plugin work is **unavoidably TS/JS**, so TS is required somewhere.
- The part that benefits most from Rust is the always-on **daemon/CLI**: packaging, robustness, predictable ops.
- The part that benefits most from TS is the **UI/control plane**: fast iteration, web tooling, Obsidian-native UX.

## Two viable architectures
### Architecture A (Hackathon-first): TypeScript monorepo
- `owp-server` (Node/Fastify or Hono)
- `owp-cli` (Node commander/oclif)
- `owp-web` (Vite/React or minimal HTML)
- `owp-obsidian` (Obsidian plugin)

Best for: polished demo, rapid iteration, cohesive UX.

### Architecture B (Production-first): Rust daemon + TS UI
- `owpd` (Rust Axum/Actix) — scheduler + API + serves static dashboard
- `owp` (Rust clap) — worker/admin CLI
- `owp-obsidian` (TypeScript) — UI client to configure/view state

Best for: easiest installs, strong typing, “this could be real” credibility.

## Migration plan (from prototype to “real”)
### Step 0 — Spec-first lock-in (immediately)
- Publish OWP as **OpenAPI + JSON Schema** (source of truth).
- Generate TS client types and (optionally) Rust client/server types.
- Add a minimal **conformance test suite** for:
  - leases + TTL requeue
  - heartbeat online/offline
  - area locks
  - repo throttle (`max_open_prs`)

### Step 1 — Implement chosen stack behind the same API
- Keep endpoint shapes stable; only add versioned extensions (`/v1`, `/v2`).
- Preserve the task state machine to avoid client divergence.

### Step 2 — Obsidian plugin as “control plane”
Minimum plugin UX:
- Configure scheduler URL + tokens.
- Show dashboard-like tables (workers online, tasks ready/leased/PR-opened).
- One-click actions for admin (import tasks, set repo throttle).

### Step 3 — GitHub integration without risky permissions
For early adoption, prefer:
- **Read-only ingest** (issues → tasks) using a GitHub App or PAT.
- **Comment-only write-back** (assignment + PR URL) to minimize required scopes.

## Concrete tech choices (if you go TypeScript for the hackathon)
This fits your “24/7 in Docker” requirement well.

- Server: Node 20+ + Fastify (or Hono) + OpenAPI + `zod` validation
- DB: SQLite (volume-mounted) + Drizzle (or Kysely) + migrations
- Realtime UI: SSE (simpler than WS) for plugin/dashboard live updates
- CLI: commander + typed client (generated from OpenAPI)
- Dashboard: Vite + React (or Svelte) reusing the same API client/types as the plugin
- Packaging: Docker image + `docker compose` for one-command deploy

## Concrete tech choices (if you go Rust for the daemon)
- Web: Axum
- DB: SQLx (SQLite)
- CLI: clap
- Static assets: build dashboard in TS and embed/serve from Rust

## Decision questions (to finalize quickly)
Answered:
1) Yes: plugin UI on-screen.
2) Preferably 24/7 in Docker.
3) UX/polish + innovation novelty > single-binary install.
