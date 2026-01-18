# OWP Pool (Hackathon MVP)

OWP Pool is a reference implementation of the **Open Work Protocol (OWP)**: a lightweight, capacity-aware scheduler that lets many independent developers (each with their own local AI coding tool subscriptions) contribute to shared GitHub projects without sharing accounts or pooling tokens.

This repo includes:
- `poold`: scheduler API + dashboard (FastAPI + SQLite)
- `pool`: worker/admin CLI (Typer)

Env files:
- The CLI and server auto-load secrets from `env.local` (recommended for Obsidian, since it’s not hidden) or `.env` in the current working directory.
- See `.env.example`.

## Quick Start (Local Demo)

1) Install deps (recommended: `uv`)

```bash
cd PROJECTS/AI-WORKER-POOL
uv venv
source .venv/bin/activate
uv pip install -e .
```

2) Start scheduler:

```bash
poold --db ./pool.db --host 127.0.0.1 --port 8787
```

3) Load demo tasks:

```bash
pool admin init-repo demo --max-open-prs 2
pool admin import-tasks ./demo/tasks.yaml --repo demo
```

4) Start a couple of workers (in separate terminals):

```bash
pool worker register --server http://127.0.0.1:8787 --name Alice --skills python,docs --capacity 5
pool worker run --server http://127.0.0.1:8787
```

```bash
pool worker register --server http://127.0.0.1:8787 --name Bob --skills typescript --capacity 3
pool worker run --server http://127.0.0.1:8787
```

5) Open dashboard:
- `http://127.0.0.1:8787/`

### Hackathon Demo Mode (No Real AI Tool Needed)

Run a simulated worker that automatically marks tasks as `in_progress` → `pr_opened`:

```bash
pool worker simulate --register --server http://127.0.0.1:8787 --name DemoWorker --skills python,docs --capacity 5
```

## Open Work Protocol

The protocol is documented in `docs/owp-spec.md`.

## GitHub Import (Optional)

1) Initialize the repo key in the scheduler (use the GitHub `owner/name` as the repo key):

```bash
pool admin init-repo owner/name --max-open-prs 3
```

2) Import issues with a label (default: `pool:ready`):

```bash
export GITHUB_TOKEN=ghp_...
pool admin import-github-issues owner/name --label pool:ready
```

This command supports label conventions like `estimate:3`, `priority:high`, `skills:python`, `area:auth`.

## Notes

- This MVP focuses on scheduling correctness and usability: leases, heartbeats, review-budget gating (`max_open_prs`), and conflict-avoidance via `area` locks.
- GitHub integration in this MVP is “import issues as tasks” (no write-back to GitHub yet).
