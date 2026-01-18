# Hackathon Review — Distributed AI Coding Worker Pool (OWP)

## One-liner
**“BOINC / SETI@home for open-source PRs”**: volunteers bring their own AI coding tools (Claude Code, Copilot, Cursor, Aider), and a scheduler turns that *distributed spare capacity* into a safe, capacity-aware PR pipeline for GitHub repos.

## What’s genuinely novel here (and why judges should care)
- **BYO seat / BYO tokens**: unlike “agent in the org” approaches, the system doesn’t require central LLM spend or shared accounts.
- **Human-capacity aware scheduling**: classic leases/heartbeats + explicit capacity/skills is a missing layer in most agent tooling.
- **Maintainer-first guardrails** (the underrated killer feature): “review budget” throttles (ex: `max_open_prs`) prevents PR floods, which is the #1 adoption blocker for any automation.
- **Protocol play**: you can pitch this as a *standard* (Open Work Protocol) with multiple tool clients, not just a one-off app.

## The hard truth (critical risks)
### 1) PR spam / review overload (existential risk)
If maintainers feel flooded, they uninstall. This is the single biggest product risk.

**Make it a headline feature**:
- Per-repo `max_open_prs` “review budget” (already in the MVP).
- Add “PR quality gates” before a PR is counted as “open” (ex: tests ran, lint clean, basic checklist).
- Add “safe lanes”: start with docs/tests-only pools; expand trust gradually.

### 2) Trust, security, and supply-chain risk
An open volunteer pool + AI assistance will trigger security alarms (rightfully).

Mitigations to pitch:
- **Least privilege**: scheduler never touches worker machines; workers use their own GitHub identity.
- **Tiered tasks**: tag tasks by risk (`tier 0..3`) and only route higher tiers to trusted workers.
- **Provenance**: optional signed artifacts (commit signing, SBOM/provenance via Sigstore in later versions).
- **Audit log**: event log of assignments/status updates (already in the MVP DB).

### 3) Merge conflicts and duplicated work
More workers → more collisions.

Mitigations to pitch:
- “Area locks” (already in MVP): only one active task per `area` (component) at a time.
- Add file/path locks later (or automatic “area inference” from touched paths).

### 4) Incentives / “why would volunteers do this?”
Open source needs motivation. “Donate spare AI time” is not enough long-term.

Make it tangible:
- Attribution automation: credit workers in issue comments/PR templates.
- Reputation and trust progression: unlock higher-tier tasks.
- Lightweight leaderboard for hackathon demo (opt-in, not gamifying maintainers’ pain).

## Product framing that wins
### For maintainers
- “I want help, but I can’t review 30 PRs/day.”
- Your answer: **review-budget throttles + safety tiers + auditability**.

### For volunteers
- “Give me something small that fits my time + skills.”
- Your answer: **capacity points + skills matching + quick ‘join pool’ CLI**.

### For orgs (optional market)
- Internal “AI volunteer” pool across teams: allocate spare Copilot/Claude capacity safely across repos.

## Protocol/standard suggestions (to make OWP feel real, not hand-wavy)
If you want “new protocol” points, emphasize these:
- **Capability negotiation**: worker advertises `capabilities` (can_run_tests, can_open_prs, supports_tool=claude-code).
- **Idempotency**: every mutating request supports an idempotency key.
- **Lease identity**: include `lease_id` + explicit `ack` / `nack` so assignments are traceable and cancellable.
- **State machine**: define allowed transitions (`ready → leased → in_progress → pr_opened → merged|blocked`).
- **Extensions**: reserve `x_*` fields so clients can innovate without breaking spec.
- **Conformance tests**: a tiny test suite that any implementation can run to claim “OWP compatible”.

## “Blow their socks off” demo beats (5–7 minutes)
1) Show dashboard with a repo full of ready tasks.
2) Start 2–3 workers with different skills/capacity.
3) Live-watch:
   - leases appear,
   - “area lock” prevents collisions,
   - `max_open_prs` throttles new assignments as PRs open.
4) Kill a worker (no heartbeats) and show **lease expiry → requeue**.
5) Wrap with: “this is OWP v0.1; anyone can write a worker client for their tool.”

## What to build next (highest ROI)
1) **GitHub write-back (comment-only)**: when a task is leased / PR opened, post a comment on the issue (low permissions, high perceived integration).
2) **Worker offers / accept**: avoid wasting time leasing to someone who’s AFK; workers must accept within N seconds.
3) **Repo “contract” file**: maintainers specify `setup`, `test`, `lint`, branch naming, PR template; worker CLI follows it.
4) **Policy-as-code**: YAML rules like “only docs/ tests tasks for untrusted workers”.
5) **Metrics**: utilization, lead time, requeue rate, PR acceptance rate (great judge candy).

## Second-opinion snapshots (different lenses)
- **OSS maintainer**: “I’ll only try this if it proves it won’t flood me and it respects my repo’s workflow.”
- **Security engineer**: “Default-deny on risky scopes; add provenance + strict audit logging; don’t centralize GitHub write permissions unless necessary.”
- **Distributed-systems engineer**: “Leases + heartbeats are right; add idempotency and acks; plan for partial failure and duplicate delivery.”
- **Hackathon judge**: “Show a live multi-worker demo + a crisp protocol spec; I’ll reward the ‘standard + reference implementation’ framing.”

