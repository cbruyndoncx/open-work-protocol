# Tech Stack Review — OWP Pool (Scheduler + Worker + Obsidian)

## Decision drivers (what matters most)
1) **Install friction** for volunteers (ideally zero-to-join).
2) **Type safety + maintainability** (protocol + state machine correctness).
3) **Obsidian integration** path (plugin UI or control-plane).
4) **Cross-platform** distribution (Windows/macOS/Linux).
5) **Security posture** (least privilege; easy-to-audit).
6) **Speed of iteration** (hackathon reality).

## Where Python fits (and why it’s shaky for your goals)
Python is great for prototyping servers quickly, but for this product:
- **Distribution is hard**: packaging a reliable cross-platform CLI/daemon is non-trivial and often ends up as “install Python + venv + deps”.
- **Obsidian plugin alignment is poor**: Obsidian plugins are TypeScript/JS; embedding Python logic is awkward.
- **Typing is opt-in**: mypy/pyright help, but it’s still weaker than TS/Rust for protocol/state-machine guarantees.

Net: Python is fine as an early reference implementation (to validate the protocol), but it’s not the best “primary” stack if Obsidian + typed protocol is a priority.

## TypeScript-first stack (recommended for fastest adoption + Obsidian story)
### Where TS shines
- **Obsidian plugin is TypeScript**: your UI/control plane can live inside Obsidian naturally.
- **Protocol typing**: generate shared types from OpenAPI/JSON Schema; use `zod`/`valibot` for runtime validation.
- **Ecosystem**: GitHub integrations (Octokit), CLIs, web dashboards.
- **Hackathon speed**: fastest path to a polished demo with UI.

### Main TS architecture options
#### Option TS-A: Node server + Node CLI + Web dashboard
- Scheduler: Node (Fastify/Hono/Express)
- DB: SQLite (better-sqlite3) + query layer (Drizzle/Prisma/Kysely)
- CLI: Node (commander/oclif) + typed HTTP client
- Dashboard: React/Vite or simple server-rendered HTML
Pros: straightforward, all TS, good UX velocity.
Cons: requires Node installed; packaging into single binary can be fiddly.

#### Option TS-B: Deno/Bun “single executable” approach
- Use `deno compile` or Bun’s compilation to ship a single artifact
Pros: better distribution story than “install Node”.
Cons: some ecosystem gaps; higher risk under hackathon time constraints.

### Obsidian plugin integration (TS)
Two realistic modes:
1) **Plugin as UI + config**: plugin talks to a local/remote scheduler over HTTP; best for multi-machine pools.
2) **Plugin as local scheduler** (desktop-only): plugin runs scheduler in-process while Obsidian is open; great for demos, less ideal for 24/7 reliability.

For secrets: use plugin settings (non-hidden) or OS keychain (via `keytar`) if allowed; avoid `.env` inside the vault for long-term security.

## Rust-first stack (recommended for “single binary” + reliability)
### Where Rust shines
- **Distribution**: ship `owpd` and `owp` as single binaries per platform (GitHub Releases).
- **Correctness**: strong typing + explicit state machines; fewer runtime surprises.
- **Performance**: not strictly needed for scheduling, but great for always-on daemons.
- **Security posture**: memory safety + clear dependency story.

### Rust architecture options
#### Option R-A: Rust daemon + Rust CLI + static dashboard
- Scheduler: Axum/Actix-web
- DB: SQLite via SQLx or rusqlite
- Dashboard: serve embedded static assets (built in TS) or server-render minimal HTML
Pros: best install experience and robustness.
Cons: slower UI iteration; Obsidian plugin is still TS and will talk over HTTP anyway.

#### Option R-B: Rust core library + TS wrappers
- Implement scheduling + data model in Rust
- Expose via WASM/FFI to a TS server/plugin
Pros: reuse core logic across targets.
Cons: high complexity; not hackathon-friendly.

## “Best of both” (my practical recommendation)
### Hybrid target architecture
- **Rust** for `owpd` (scheduler daemon) + `owp` CLI (worker/admin): best distribution + reliability.
- **TypeScript** for dashboard + **Obsidian plugin**: best UX + integration.
- **OWP protocol** remains stable across implementations.

This lets you say, credibly:
“OWP is a standard; the reference implementation can be written in multiple languages; we provide a robust Rust daemon and a TypeScript Obsidian plugin UI.”

## Tech stack scorecard (quick)
| Criterion | TypeScript | Rust | Python |
|---|---:|---:|---:|
| Obsidian plugin alignment | ★★★★☆ | ★★☆☆☆ (via HTTP) | ★☆☆☆☆ |
| Type safety for protocol/state | ★★★★☆ | ★★★★★ | ★★☆☆☆ |
| Install friction (CLI/daemon) | ★★☆☆☆ (needs runtime) | ★★★★★ (single binary) | ★☆☆☆☆ |
| Hackathon velocity | ★★★★☆ | ★★☆☆☆ | ★★★★★ |
| Long-term ops reliability | ★★★☆☆ | ★★★★★ | ★★★☆☆ |

## Recommendation (for your hackathon)
1) **Pitch**: OWP (protocol) + two clients: CLI (worker) + Obsidian plugin (UI).
2) **Build plan**:
   - Keep the protocol stable and spec-driven (OpenAPI/JSON Schema).
   - Implement the “serious” daemon in **Rust** *or* in **TypeScript** depending on time.
   - Build the Obsidian plugin in **TypeScript** regardless.

If time is tight: do **TypeScript end-to-end** for the hackathon, then “graduate” the daemon to Rust post-hackathon while keeping OWP compatibility.

