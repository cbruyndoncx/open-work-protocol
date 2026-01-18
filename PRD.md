# Product Requirements Document: Open Work Protocol (OWP) Pool

## 1. Executive Summary

Open Work Protocol (OWP) Pool is a capacity-aware task scheduler and worker protocol that coordinates independent contributors using their own local AI coding tools to produce PRs for shared repositories. Unlike traditional "coding agents" that operate as single entities, OWP Pool enables a distributed volunteer model where contributors use their existing AI tool subscriptions (Claude Code, Copilot, Cursor, Aider) without sharing accounts or pooling tokens.

The system addresses the critical coordination problem in open source development: maintainers need help but lack safe throttles to accept many parallel contributors, while volunteers want skill-matched tasks that fit their time windows. OWP Pool provides explicit guardrails through review budget management, risk tiers, and area locks to prevent PR floods while enabling scalable contribution.

The MVP targets hackathon demonstration with a production-ready TypeScript implementation featuring an Obsidian plugin as the primary interface, 24/7 Docker deployment, and a working protocol specification that others can implement.

## 2. Mission

**Mission Statement:** Enable scalable, safe, and coordinated AI-assisted development across distributed teams without compromising maintainer control or contributor autonomy.

**Core Principles:**
- **BYO Seat Model:** Contributors use their own tools and accounts, no shared resources
- **Maintainer-First Safety:** Explicit throttles and guardrails prevent overwhelming review capacity
- **Least Privilege:** Scheduler never needs access to worker machines or code execution
- **Protocol-First Design:** Implementable specification that enables ecosystem growth
- **Tool Agnostic:** Works with any local AI coding tool or development workflow

## 3. Target Users

### Primary Personas

**Open Source Maintainer (Sarah)**
- Technical Level: Expert developer, repository owner
- Pain Points: Limited review bandwidth, fear of PR floods, need for predictable workflows
- Goals: Scale contribution without losing quality control, maintain repository safety
- Needs: Review budget controls, task quality assurance, contributor coordination

**Volunteer Contributor (Alex)**
- Technical Level: Intermediate to advanced developer with AI tool subscription
- Pain Points: Finding appropriate-sized tasks, unclear contribution guidelines, wasted effort
- Goals: Contribute meaningfully in available time windows, gain recognition
- Needs: Skill-matched tasks, clear instructions, credit/attribution system

**Engineering Lead (Morgan)**
- Technical Level: Senior technical leader managing multiple repositories
- Pain Points: Bottlenecks across projects, underutilized team capacity, coordination overhead
- Goals: Optimize resource allocation, enable cross-team contribution, maintain auditability
- Needs: Policy controls, utilization metrics, compliance tracking

## 4. MVP Scope

### ✅ In Scope: Core Functionality
- ✅ Lease-based task assignment with TTL and automatic requeue
- ✅ Worker registration with skills and capacity declaration
- ✅ Heartbeat monitoring for worker online/offline status
- ✅ Review budget throttling via `max_open_prs` per repository
- ✅ Area locks to prevent conflicts in same code regions
- ✅ Task status tracking (ready → leased → in_progress → pr_opened → merged)
- ✅ Basic GitHub issue import by labels (read-only)

### ✅ In Scope: Technical Implementation
- ✅ TypeScript monorepo with OpenAPI-first design
- ✅ Fastify/Hono server with SQLite persistence
- ✅ Docker containers with volume-mounted database
- ✅ Real-time web dashboard with Server-Sent Events
- ✅ Obsidian plugin as primary user interface
- ✅ Bearer token authentication for workers and admin tokens

### ✅ In Scope: Integration & Deployment
- ✅ Docker Compose for 24/7 deployment
- ✅ Environment variable configuration
- ✅ Demo mode with simulated workers
- ✅ Basic task import from YAML files
- ✅ Health monitoring endpoints

### ✅ In Scope: Advanced Features
- ✅ GitHub write-back (PR comments, status updates)
- ✅ Worker accept/reject with timeout mechanisms
- ✅ Reputation scoring and trust tiers
- ✅ Advanced policy engines and complex routing
- ✅ Detailed analytics and reporting dashboards
- ✅ Audit logging and compliance features
- ✅ Rate limiting and DDoS protection
- ✅ Advanced observability and metrics

### ❌ Out of Scope: Enterprise & Federation
- ❌ SSO integration and enterprise authentication
- ❌ Multi-scheduler federation
- ❌ Multi-tenant isolation
- ❌ Advanced compliance frameworks (SOC2, GDPR automation)
- ❌ Enterprise billing and usage tracking

## 5. User Stories

**US1: Repository Setup**
As a maintainer, I want to register my repository with capacity limits, so that I can control the maximum number of open PRs and prevent review overload.
*Example: Sarah sets `max_open_prs: 3` for her authentication library to ensure manageable review load.*

**US2: Task Creation**
As a maintainer, I want to import GitHub issues as tasks with skill requirements, so that contributors can work on appropriate items without manual coordination.
*Example: Import issues labeled `pool:ready` with automatic skill extraction from `skills:python,docs` labels.*

**US3: Worker Registration**
As a contributor, I want to register as a worker with my skills and capacity, so that I receive appropriate tasks that match my expertise and availability.
*Example: Alex registers with skills `["typescript", "react"]` and capacity `5 points` for evening contribution sessions.*

**US4: Task Assignment**
As a contributor, I want to receive leased tasks that match my skills, so that I can work on items I'm qualified to complete successfully.
*Example: Alex receives a 2-point React component task with 4-hour lease duration and clear requirements.*

**US5: Progress Tracking**
As a contributor, I want to update task status as I work, so that maintainers can track progress and I can report completion with PR links.
*Example: Alex updates task from `in_progress` to `pr_opened` with GitHub PR URL as artifact.*

**US6: System Monitoring**
As a maintainer, I want to see real-time worker activity and task progress, so that I can understand system utilization and identify bottlenecks.
*Example: Sarah views dashboard showing 3 active workers, 2 open PRs (of 3 max), and 5 queued tasks.*

**US7: Demo Experience**
As a hackathon judge, I want to see a compelling demonstration of distributed coordination, so that I can understand the protocol's value and implementation quality.
*Example: One-click demo sets up repository, registers simulated workers, and shows automatic task progression.*

**US9: Task Accept/Reject**
As a contributor, I want to accept or reject offered tasks within a timeout window, so that I can choose work that fits my current availability and interests.
*Example: Alex receives a task offer, has 5 minutes to accept/reject, and can decline if the scope is unclear.*

**US10: Reputation System**
As a maintainer, I want to see contributor reputation scores, so that I can prioritize reliable contributors for important tasks.
*Example: Sarah sees Alex has 95% completion rate and assigns critical security tasks preferentially.*

**US11: Trust Tiers**
As a maintainer, I want to restrict sensitive tasks to trusted contributors, so that I can maintain security while enabling broad participation.
*Example: Database migration tasks only go to contributors with "trusted" tier status.*

**US12: Analytics Dashboard**
As an engineering lead, I want detailed metrics on pool performance, so that I can optimize resource allocation and identify bottlenecks.
*Example: Morgan views completion rates, average task duration, and worker utilization across multiple repositories.*

**US13: Audit Trail**
As a compliance officer, I want complete audit logs of all pool activities, so that I can ensure proper governance and track contributor actions.
*Example: Audit log shows who assigned tasks, when PRs were opened, and all administrative changes.*

## 6. Core Architecture & Patterns

### High-Level Architecture
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Obsidian       │    │   Web Dashboard  │    │   CLI Tools     │
│  Plugin         │◄───┤                  │◄───┤   (Optional)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌──────────────────┐
                    │   Scheduler API  │
                    │   (Fastify/Hono) │
                    └──────────────────┘
                                 │
                    ┌──────────────────┐
                    │   SQLite DB      │
                    │   (Volume Mount) │
                    └──────────────────┘
```

### Monorepo Structure
```
open-work-protocol/
├── packages/
│   └── protocol/           # OpenAPI spec + generated types
├── apps/
│   ├── server/            # Scheduler implementation
│   ├── web/               # Real-time dashboard
│   ├── obsidian-plugin/   # Primary UI
│   └── cli/               # Optional tools
├── docs/                  # Protocol documentation
└── docker-compose.yml     # Production deployment
```

### Key Design Patterns
- **Protocol-First:** OpenAPI specification as single source of truth
- **Lease-Based Coordination:** TTL assignments with automatic requeue
- **Event-Driven Updates:** Server-Sent Events for real-time synchronization
- **Capacity-Aware Scheduling:** Points-based workload distribution
- **Stateless Workers:** No persistent state on worker machines

## 7. Tools/Features

### Scheduler Core
**Purpose:** Coordinate task assignment and worker management
**Operations:**
- Lease management with TTL expiration and requeue
- Heartbeat monitoring for worker availability
- Skill-based task routing with capacity constraints
- Review budget enforcement per repository

**Key Features:**
- Configurable lease duration (default: 4 hours)
- Automatic requeue on lease expiry or worker disconnect
- Concurrent task limits per worker
- Area-based conflict prevention

### Obsidian Plugin
**Purpose:** Primary user interface for pool management
**Operations:**
- Repository configuration and task import
- Worker registration and status monitoring
- Real-time activity feed and system metrics
- Demo environment setup and management

**Key Features:**
- Settings panel for scheduler connection
- Task filtering by repository, status, and skills
- One-click demo with simulated workers
- Integration with Obsidian's note-taking workflow

### Advanced Features & Analytics

**Purpose:** Comprehensive system for trust, reputation, and performance optimization
**Operations:**
- Worker accept/reject with configurable timeout windows
- Reputation scoring based on completion rates and quality metrics
- Trust tier management with access controls
- Advanced analytics and performance dashboards
- Comprehensive audit logging and compliance tracking

### Web Dashboard
**Purpose:** Real-time monitoring and comprehensive analytics
**Operations:**
- Live worker status and task progress display
- Repository configuration and metrics
- Advanced analytics with performance trends
- Event stream with Server-Sent Events
- Audit log viewing and filtering

**Key Features:**
- Responsive design for mobile and desktop
- Real-time updates without page refresh
- Advanced filtering and search capabilities
- Performance metrics and utilization charts
- Audit trail visualization and export
- Rate limiting status and security monitoring

## 8. Technology Stack

### Backend
- **Node.js 20+** (Alpine Linux in Docker)
- **TypeScript 5+** with strict mode
- **Fastify 4+** or **Hono 3+** for API server
- **SQLite 3** with volume persistence
- **Zod 3+** for runtime validation

### Frontend (Web Dashboard)
- **React 18+** or **Svelte 4+**
- **TypeScript** with generated API client
- **Server-Sent Events** for real-time updates
- **Tailwind CSS** or similar for styling

### Obsidian Plugin
- **TypeScript** with Obsidian API
- **Generated API client** from OpenAPI spec
- **Obsidian Plugin API 1.0+**
- **Shared protocol types** from monorepo

### Development & Deployment
- **Turborepo** or **Nx** for monorepo management
- **OpenAPI Generator** for TypeScript client
- **Docker** with multi-stage builds
- **Docker Compose** for orchestration
- **Jest** or **Vitest** for testing

### Optional Dependencies
- **GitHub API** for issue import (read-only)
- **YAML parser** for task file import
- **Rich terminal output** for CLI tools

## 9. Security & Configuration

### Authentication & Authorization
- **Worker Authentication:** Bearer tokens generated on registration
- **Admin Authentication:** `X-Admin-Token` header for management operations
- **Token Storage:** Secure generation with sufficient entropy
- **No Shared Accounts:** Each worker uses individual tokens

### Configuration Management
```bash
# Environment Variables
OWP_ADMIN_TOKEN=secure-admin-token
OWP_DB_PATH=/data/pool.db
OWP_PORT=8787
OWP_HOST=0.0.0.0

# Optional GitHub Integration
GITHUB_TOKEN=ghp_readonly_token_for_issues
```

### Security Scope
**✅ In Scope:**
- Bearer token authentication
- Environment variable secrets
- Non-root Docker containers
- Input validation and sanitization

**❌ Out of Scope:**
- TLS/SSL termination (handled by reverse proxy)
- Rate limiting (basic implementation only)
- Advanced threat detection
- Audit logging (basic events only)

### Deployment Considerations
- Volume-mounted SQLite database for persistence
- Health check endpoints for container orchestration
- Graceful shutdown handling
- Environment-based configuration

## 10. API Specification

### Core Endpoints

#### Worker Registration
```http
POST /v1/workers/register
Content-Type: application/json

{
  "name": "Alice",
  "github_handle": "alice-dev",
  "skills": ["python", "docs"],
  "capacity_points": 5,
  "max_concurrent_tasks": 2
}

Response: 201 Created
{
  "worker_id": "w_abc123",
  "token": "bearer_token_xyz"
}
```

#### Heartbeat
```http
POST /v1/workers/heartbeat
Authorization: Bearer bearer_token_xyz

{
  "status": "idle|working|paused",
  "note": "Optional status message"
}

Response: 200 OK
{
  "ok": true,
  "server_time": "2026-01-18T01:00:00Z"
}
```

#### Fetch Work
```http
GET /v1/work
Authorization: Bearer bearer_token_xyz

Response: 200 OK
{
  "leases": [
    {
      "task_id": "t_def456",
      "repo": "owner/repo",
      "title": "Add unit tests for auth module",
      "estimate_points": 3,
      "required_skills": ["python", "testing"],
      "area": "auth",
      "lease_expires_at": "2026-01-18T05:00:00Z"
    }
  ]
}
```

#### Task Status Update
```http
POST /v1/tasks/t_def456/status
Authorization: Bearer bearer_token_xyz

{
  "status": "pr_opened",
  "message": "Completed with comprehensive test coverage",
  "artifact": {
    "pr_url": "https://github.com/owner/repo/pull/123"
  }
}

Response: 200 OK
```

#### Task Offer & Accept/Reject
```http
POST /v1/work/offers
Authorization: Bearer bearer_token_xyz

Response: 200 OK
{
  "offers": [
    {
      "offer_id": "o_abc123",
      "task_id": "t_def456",
      "repo": "owner/repo",
      "title": "Add unit tests for auth module",
      "estimate_points": 3,
      "required_skills": ["python", "testing"],
      "area": "auth",
      "expires_at": "2026-01-18T01:20:00Z"
    }
  ]
}

POST /v1/work/offers/o_abc123/accept
Authorization: Bearer bearer_token_xyz

Response: 201 Created
{
  "lease_id": "l_ghi789",
  "lease_expires_at": "2026-01-18T05:00:00Z"
}

POST /v1/work/offers/o_abc123/reject
Authorization: Bearer bearer_token_xyz

{
  "reason": "insufficient_time|unclear_requirements|skill_mismatch"
}
```

#### Reputation & Trust Management
```http
GET /v1/workers/w_abc123/reputation
X-Admin-Token: secure-admin-token

Response: 200 OK
{
  "worker_id": "w_abc123",
  "reputation_score": 95.5,
  "trust_tier": "trusted",
  "metrics": {
    "completion_rate": 0.96,
    "avg_pr_quality": 4.2,
    "on_time_delivery": 0.94,
    "total_tasks": 47
  }
}

POST /v1/workers/w_abc123/trust-tier
X-Admin-Token: secure-admin-token

{
  "tier": "trusted|basic|untrusted",
  "reason": "Consistent high-quality contributions"
}
```

#### Analytics & Metrics
```http
GET /v1/analytics/repositories/owner/repo
X-Admin-Token: secure-admin-token

Response: 200 OK
{
  "repo": "owner/repo",
  "period": "last_30_days",
  "metrics": {
    "tasks_completed": 23,
    "avg_completion_time": "2.3 days",
    "worker_utilization": 0.78,
    "pr_merge_rate": 0.91,
    "bottlenecks": ["code_review"]
  }
}

GET /v1/audit/events
X-Admin-Token: secure-admin-token

Response: 200 OK
{
  "events": [
    {
      "timestamp": "2026-01-18T01:00:00Z",
      "event_type": "task_assigned",
      "actor": "system",
      "target": "t_def456",
      "details": {
        "worker_id": "w_abc123",
        "lease_duration": "4h"
      }
    }
  ]
}
```

#### GitHub Integration (Write-back)
```http
POST /v1/github/repos/owner/repo/sync
X-Admin-Token: secure-admin-token

{
  "sync_type": "bidirectional",
  "write_permissions": ["comments", "labels", "status"]
}

Response: 200 OK
{
  "webhook_url": "https://scheduler.example.com/webhooks/github",
  "permissions_granted": ["issues:read", "pull_requests:write"]
}
```

## 11. Success Criteria

### MVP Success Definition
A working demonstration of distributed AI-assisted development coordination that showcases protocol viability and implementation quality for hackathon evaluation.

### ✅ Functional Requirements
- ✅ Workers can register and receive skill-matched tasks
- ✅ Tasks are assigned via leases with automatic requeue on expiry
- ✅ Review budget prevents PR floods via `max_open_prs` limits
- ✅ Real-time dashboard shows system status and activity
- ✅ Obsidian plugin provides complete pool management interface
- ✅ Demo mode showcases full workflow with simulated workers
- ✅ Docker deployment runs 24/7 with persistent data
- ✅ GitHub issues can be imported as tasks with write-back capabilities
- ✅ Worker accept/reject system with configurable timeouts
- ✅ Reputation scoring affects task assignment priority
- ✅ Trust tiers control access to sensitive repositories
- ✅ Advanced analytics dashboard with performance metrics
- ✅ Audit logging for all administrative and worker actions
- ✅ Rate limiting protects against abuse and overload

### Quality Indicators
- **Task Completion Rate:** >80% of leased tasks reach `pr_opened` status
- **Lease Efficiency:** <10% of leases expire without progress
- **Response Time:** <500ms for task assignment API calls
- **Uptime:** 99%+ availability during demonstration period
- **User Experience:** Intuitive Obsidian plugin workflow

### User Experience Goals
- One-click demo setup from Obsidian plugin
- Clear visual feedback for all system states
- Responsive real-time updates across all interfaces
- Comprehensive error messages and recovery guidance

## 12. Implementation Phases

### Phase 1: Protocol Foundation (Week 1)
**Goal:** Establish core protocol and server implementation

**✅ Deliverables:**
- ✅ OpenAPI specification with all core endpoints
- ✅ TypeScript type generation from OpenAPI
- ✅ Fastify server with SQLite database
- ✅ Basic authentication (bearer tokens + admin tokens)
- ✅ Core scheduler loop (leases, heartbeats, requeue)
- ✅ Docker container with volume persistence

**Validation:** API endpoints respond correctly, scheduler assigns and requeues tasks

### Phase 2: Web Interface (Week 2)
**Goal:** Create monitoring dashboard and basic UI

**✅ Deliverables:**
- ✅ Real-time web dashboard with SSE
- ✅ Worker status and task progress tables
- ✅ Repository configuration interface
- ✅ Basic task import from YAML files
- ✅ Docker Compose for complete deployment

**Validation:** Dashboard shows live updates, admin can configure repositories and import tasks

### Phase 3: Advanced Features (Week 2-3)
**Goal:** Implement reputation, trust, and analytics systems

**✅ Deliverables:**
- ✅ Worker accept/reject system with timeout handling
- ✅ Reputation scoring engine with multiple metrics
- ✅ Trust tier management and access controls
- ✅ Advanced analytics dashboard with historical data
- ✅ Comprehensive audit logging system
- ✅ Rate limiting and abuse prevention

**Validation:** Trust tiers restrict task access, reputation affects assignment priority, analytics show meaningful insights

### Phase 4: Obsidian Plugin (Week 3)
**Goal:** Build primary user interface in Obsidian

**✅ Deliverables:**
- ✅ Obsidian plugin with settings panel
- ✅ Pool status and task management views
- ✅ Worker registration and heartbeat controls
- ✅ Advanced analytics integration
- ✅ Trust management and reputation display
- ✅ One-click demo setup functionality

**Validation:** Complete pool management possible from Obsidian, advanced features accessible, demo runs successfully

### Phase 5: GitHub Integration & Polish (Week 3-4)
**Goal:** Complete GitHub integration and hackathon preparation

**✅ Deliverables:**
- ✅ Bidirectional GitHub integration (read/write)
- ✅ PR comment automation and status updates
- ✅ Webhook handling for GitHub events
- ✅ Simulated workers for reliable demo
- ✅ Performance optimization and error handling
- ✅ Comprehensive documentation and setup guides

**Validation:** GitHub integration works end-to-end, compelling demo ready, all advanced features functional

## 13. Future Considerations

### Post-MVP Enhancements (V2+)
- **Multi-Scheduler Federation:** Cross-organization task sharing and coordination
- **Advanced Compliance:** SOC2, GDPR automation, and enterprise audit requirements
- **SSO Integration:** Enterprise authentication with SAML, OIDC, and directory services
- **Multi-Tenant Architecture:** Isolated environments for different organizations
- **Advanced AI Integration:** LLM-powered task analysis and automatic skill detection

### Integration Opportunities
- **CI/CD Integration:** Automatic task creation from failed builds or test results
- **Issue Tracking:** Bidirectional sync with Jira, Linear, or GitHub Projects
- **Code Review Tools:** Integration with review assignment and approval workflows
- **Monitoring Systems:** Integration with Datadog, New Relic, or Prometheus
- **Communication Platforms:** Slack, Discord, or Teams notifications and controls

### Protocol Evolution
- **Federated Networks:** Multi-scheduler coordination protocols
- **Plugin Ecosystem:** Third-party scheduler implementations and extensions
- **Advanced Governance:** Complex routing rules, policy engines, and compliance frameworks
- **Blockchain Integration:** Immutable audit trails and decentralized reputation systems

## 14. Risks & Mitigations

### Risk 1: Obsidian Plugin Complexity
**Impact:** Primary interface may be difficult to implement or use
**Mitigation:** Start with web dashboard as fallback, prototype plugin early, leverage Obsidian community resources and documentation

### Risk 2: Demo Reliability
**Impact:** Live demonstration failures could undermine hackathon presentation
**Mitigation:** Implement robust simulated worker mode, extensive testing of demo scenarios, backup presentation materials

### Risk 3: Protocol Adoption
**Impact:** Complex protocol may limit real-world implementation by others
**Mitigation:** Prioritize simplicity in core protocol, comprehensive documentation, reference implementation quality

### Risk 4: Scalability Bottlenecks
**Impact:** SQLite and single-server architecture may not handle high load
**Mitigation:** Optimize database queries, implement connection pooling, document scaling considerations for future versions

### Risk 5: Time Constraints
**Impact:** Hackathon timeline may force scope reduction
**Mitigation:** Prioritize core functionality over polish, maintain clear MVP boundaries, prepare scope reduction plan

## 15. Appendix

### Related Documents
- [Open Work Protocol Specification](deep-research/docs/owp-spec.md)
- [Technical Stack Review](deep-research/docs/tech-stack-review.md)
- [Hackathon Assessment](deep-research/docs/hackathon-review.md)
- [Implementation TODO](deep-research/TODO.md)

### Key Dependencies
- **Obsidian API:** [Obsidian Plugin Developer Docs](https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin)
- **OpenAPI Generator:** [TypeScript Client Generation](https://openapi-generator.tech/docs/generators/typescript-fetch)
- **Fastify Documentation:** [Fastify Framework](https://www.fastify.io/docs/latest/)
- **Docker Best Practices:** [Node.js Docker Guide](https://nodejs.org/en/docs/guides/nodejs-docker-webapp)

### Repository Structure
```
open-work-protocol/
├── packages/protocol/      # Shared types and OpenAPI spec
├── apps/server/           # Scheduler API implementation
├── apps/web/              # Real-time dashboard
├── apps/obsidian-plugin/  # Primary UI interface
├── apps/cli/              # Optional command-line tools
├── docs/                  # Protocol and API documentation
├── docker-compose.yml     # Production deployment configuration
├── .env.example          # Environment variable template
└── README.md             # Project overview and setup guide
```

### Success Metrics Tracking
- **Development Progress:** GitHub issues and PR completion rates
- **Code Quality:** Test coverage, TypeScript strict mode compliance
- **Performance:** API response times, concurrent worker capacity
- **User Experience:** Plugin usability testing, demo success rate
- **Documentation:** Completeness of setup guides and API references
