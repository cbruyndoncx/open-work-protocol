# Product Overview

## Product Purpose
OWP Pool is a capacity-aware task scheduler and worker protocol that coordinates independent contributors (each using their own local AI coding tools and GitHub identity) to produce PRs for shared repositories without shared accounts or centralized LLM token pooling. It implements the Open Work Protocol (OWP) - a lightweight, distributed system that lets many developers contribute to shared GitHub projects while maintaining safety and coordination.

## Target Users
**Primary Users:**
- **Open Source Maintainers**: Need help but cannot review unlimited PRs; want predictable workflows and repo safety with explicit guardrails
- **Volunteer Contributors**: Have local AI tool subscriptions (Claude Code, Copilot, Cursor, Aider) and want small, skill-matched tasks that fit their time window
- **Engineering Leads**: Want to route spare capacity across repos, prevent bottlenecks, and need auditability with policy controls

**User Needs:**
- Safe throttles and coordination for parallel contributors
- Skill-matched small tasks with clear instructions
- Credit/attribution and transparent workflows
- Review budget management and risk tier controls

## Key Features
- **BYO Seat Model**: Contributors use their own tools/seats without sharing accounts
- **Capacity-Aware Scheduling**: Points-based system with concurrency limits and skill matching
- **Maintainer Safety Controls**: Review budget throttling, risk tiers, area locks, and audit logging
- **Resilient Task Management**: Leases with TTL, heartbeats, and automatic requeue on failure
- **Multi-Interface Access**: Web dashboard, Obsidian plugin, and CLI tools
- **GitHub Integration**: Import issues by label, track PR status, minimal write-back permissions
- **Real-time Monitoring**: Live dashboard with SSE updates, worker status, and task progress

## Business Objectives
- **Protocol Adoption**: Establish OWP as a credible open-source standard for distributed coding work
- **Community Growth**: Enable scalable open-source contribution without overwhelming maintainers
- **Tool Ecosystem**: Create reference implementation that others can build upon
- **Hackathon Impact**: Demonstrate novel approach to AI-assisted collaborative development

## User Journey
**Maintainer Journey:**
1. Install scheduler (self-host) or run locally for a repo
2. Register repo and set policy (review budget, allowed tiers, area mapping)
3. Import tasks from GitHub issues or YAML files
4. Monitor dashboard for worker activity and PR progress

**Worker Journey:**
1. Register with scheduler declaring skills and capacity
2. Start worker process to poll for skill-matched tasks
3. Receive leased tasks with clear requirements and context
4. Complete work using preferred local AI tools
5. Submit PR and update task status with artifacts

**Admin Journey:**
1. Configure scheduler with repos and policies
2. Monitor system health and worker utilization
3. Adjust throttling and capacity based on review bandwidth

## Success Criteria
- **Technical**: Successful task completion rate >80%, minimal lease expiry/requeue
- **Adoption**: Multiple repos using the system, active worker pool
- **Safety**: Zero PR floods, maintainer satisfaction with review load
- **Performance**: Sub-second task assignment, real-time dashboard updates
- **Hackathon**: Compelling demo with Obsidian plugin integration and 24/7 Docker deployment
