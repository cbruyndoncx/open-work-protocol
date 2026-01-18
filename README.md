# OWP Pool - Open Work Protocol Scheduler

> Distributed task scheduler for open-source contributions without shared accounts or centralized token pooling.

## Problem

Open-source maintainers face a critical challenge:
- **Too many PRs**: Unlimited contributions overwhelm review capacity
- **Unknown contributors**: Safety concerns with shared credentials
- **Skill mismatch**: Contributors get tasks they're not equipped for
- **No coordination**: Multiple contributors work on the same issue

Developers with AI tools want to contribute but lack:
- Clear, skill-matched tasks
- Transparent workflows
- Attribution and credit
- Predictable time commitments

## Solution

**OWP Pool** implements the Open Work Protocol - a distributed system that:

✅ **BYO-Seat Model**: Each contributor uses their own tools and GitHub identity  
✅ **Capacity-Aware Scheduling**: Points-based system with skill matching  
✅ **Lease-Based Management**: TTL-based task assignment with auto-requeue  
✅ **Distributed Protocol**: Workers can be anywhere, no centralized control  
✅ **Real-Time Monitoring**: Live dashboard with Server-Sent Events (SSE)  

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    OWP Pool System                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Workers    │  │   Dashboard  │  │   Obsidian   │     │
│  │  (Anywhere)  │  │   (Web UI)   │  │  (Planned)   │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                 │                 │              │
│         └─────────────────┼─────────────────┘              │
│                           │                                │
│                    ┌──────▼──────┐                         │
│                    │  Fastify    │                         │
│                    │   Server    │                         │
│                    │  (REST API) │                         │
│                    └──────┬──────┘                         │
│                           │                                │
│         ┌─────────────────┼─────────────────┐              │
│         │                 │                 │              │
│    ┌────▼────┐    ┌──────▼──────┐   ┌─────▼────┐         │
│    │Scheduler│    │  SQLite DB  │   │  Audit   │         │
│    │  Loop   │    │  (Leases,   │   │  Events  │         │
│    │(Lease   │    │   Tasks,    │   │          │         │
│    │Mgmt)    │    │  Workers)   │   │          │         │
│    └────┬────┘    └─────────────┘   └──────────┘         │
│         │                                                  │
│         └──────────────────────────────────────────────   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites

- Node.js 20+
- Docker (optional)
- Git

### Installation

```bash
# Clone repository
git clone https://github.com/open-work-protocol/pool.git
cd pool

# Install dependencies
npm install

# Build server
cd apps/server
npm run build

# Start server
OWP_PORT=8787 npm start
```

## Environment Variables

### Server Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `OWP_PORT` | Server port | `8787` | No |
| `OWP_HOST` | Server host | `0.0.0.0` | No |
| `OWP_DB_PATH` | SQLite database path | `./pool.db` | No |
| `OWP_ADMIN_TOKEN` | Admin authentication token | `dev-admin-token` | Yes (production) |
| `LOG_LEVEL` | Logging level (info, debug, error) | `info` | No |

### Web Dashboard Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_ADMIN_TOKEN` | Admin token for dashboard | `dev-admin-token` | Yes (production) |

### Example Configuration

**Development (.env.local)**:
```bash
OWP_PORT=8787
OWP_ADMIN_TOKEN=dev-admin-token
VITE_ADMIN_TOKEN=dev-admin-token
```

**Production**:
```bash
OWP_PORT=8787
OWP_HOST=0.0.0.0
OWP_DB_PATH=/data/pool.db
OWP_ADMIN_TOKEN=<secure-random-token>
VITE_ADMIN_TOKEN=<secure-random-token>
LOG_LEVEL=info
```

**Security Note**: Always use strong, randomly generated tokens in production. Never commit tokens to version control.

### Docker

```bash
cd apps/server
docker build -t owp-server .
docker run -p 8787:8787 -v pool.db:/app/pool.db owp-server
```

### Dashboard Setup

```bash
# In a separate terminal
cd apps/web
npm install
npm run dev
# Dashboard available at http://localhost:5173
```

The dashboard provides:
- Real-time worker status monitoring via Server-Sent Events (SSE)
- Task queue and progress tracking
- Admin controls for creating repositories and tasks
- System state overview
- Automatic fallback to polling if SSE unavailable

### Obsidian Plugin (Planned)

The Obsidian plugin structure exists in `apps/obsidian-plugin/` but is not yet built or tested. This is planned for future development. For now, use the web dashboard for all monitoring and administration tasks.

**Planned Features**:
- Worker registration and management
- Task viewing and status updates
- Admin controls for repos and tasks
- Real-time system monitoring

**Current Status**: Structure only, not functional

## API Endpoints

### Worker Endpoints

**Register Worker**
```bash
POST /v1/workers/register
Content-Type: application/json

{
  "name": "Alice",
  "skills": ["python", "javascript"],
  "capacity_points": 10,
  "max_concurrent_tasks": 2
}

Response:
{
  "worker_id": "w_...",
  "token": "..."
}
```

**Worker Heartbeat**
```bash
POST /v1/workers/heartbeat
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "idle",
  "current_capacity": 10
}

Response:
{
  "ok": true,
  "server_time": "2026-01-18T14:00:00Z"
}
```

**Fetch Work**
```bash
GET /v1/work
Authorization: Bearer <token>

Response:
{
  "worker_id": "w_...",
  "leases": [
    {
      "task_id": "t_...",
      "repo": "awesome-project",
      "title": "Add dark mode",
      "required_skills": ["python"],
      "estimate_points": 3,
      "lease_expires_at": "2026-01-18T18:00:00Z"
    }
  ]
}
```

**Update Task Status**
```bash
POST /v1/tasks/<task_id>/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "completed",
  "pr_url": "https://github.com/awesome-project/pull/42"
}

Response:
{
  "ok": true
}
```

### Admin Endpoints

**Create Repository**
```bash
POST /v1/admin/repos
X-Admin-Token: <admin_token>
Content-Type: application/json

{
  "repo": "awesome-project",
  "max_open_prs": 5
}

Response:
{
  "ok": true,
  "repo": "awesome-project"
}
```

**Create Task**
```bash
POST /v1/admin/tasks
X-Admin-Token: <admin_token>
Content-Type: application/json

{
  "repo": "awesome-project",
  "title": "Add dark mode support",
  "required_skills": ["python"],
  "estimate_points": 3,
  "priority": 5
}

Response:
{
  "ok": true,
  "task_id": "t_..."
}
```

**Get System State**
```bash
GET /v1/admin/state
X-Admin-Token: <admin_token>

Response:
{
  "workers_online": 3,
  "tasks_queued": 5,
  "tasks_in_progress": 2,
  "repositories": [
    {
      "repo": "awesome-project",
      "max_open_prs": 5,
      "current_open_prs": 2
    }
  ]
}
```

## Error Handling

All endpoints return structured error responses:

```json
{
  "code": "validation_error",
  "message": "Request validation failed",
  "details": "name: Worker name is required",
  "suggestion": "Check request format and required fields"
}
```

Error codes:
- `validation_error` - Request validation failed
- `auth_error` - Authentication failed
- `not_found` - Resource not found
- `conflict` - Resource conflict
- `internal_error` - Server error

## Features

### Capacity-Aware Scheduling

Workers declare capacity points (e.g., 10 points). Tasks have estimate points (e.g., 3 points). The scheduler only assigns tasks that fit within available capacity.

### Skill Matching

Tasks specify required skills. Workers declare their skills. The scheduler only assigns tasks to workers with matching skills.

### Lease-Based Management

When a task is assigned, a lease is created with a TTL (default 4 hours). If the worker doesn't complete the task within the lease period, it's automatically requeued.

### Heartbeat Monitoring

Workers send periodic heartbeats. If a worker goes offline, their leases are released and tasks are requeued.

### Real-Time Dashboard

Monitor system state in real-time:
- Online workers count
- Queued and in-progress tasks
- Repository status
- PR limits and current usage

## Development

### Project Structure

```
open-work-protocol/
├── packages/
│   └── protocol/          # OpenAPI spec + generated types
├── apps/
│   ├── server/            # Fastify server + scheduler
│   ├── web/               # React dashboard
│   └── obsidian-plugin/   # Obsidian plugin UI
├── docs/                  # Documentation
└── DEVLOG.md             # Development log
```

### Building

```bash
# Build all packages
npm run build

# Build specific package
cd apps/server && npm run build
cd apps/web && npm run build
```

### Testing

```bash
# Run all tests
npm test

# Run specific tests
cd apps/server && npm test
```

## Troubleshooting

### Server won't start

- Check port is available: `lsof -i :8787`
- Check database file permissions: `ls -la pool.db`
- Check environment variables: `echo $OWP_PORT`

### Worker registration fails

- Verify server is running: `curl http://localhost:8787/health`
- Check request format matches schema
- Verify skills array is not empty

### Tasks not assigned

- Check worker has matching skills
- Check worker has available capacity
- Check tasks exist in database
- Check worker heartbeat is recent

### Dashboard not updating

- Check SSE connection: `curl -H "Authorization: Bearer <token>" http://localhost:8787/v1/work`
- Check browser console for errors
- Verify admin token is correct

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT

## Resources

- [OpenAPI Specification](packages/protocol/openapi.yaml)
- [Development Log](DEVLOG.md)
- [Demo Video](DEMO_SCRIPT.md)
- [GitHub Repository](https://github.com/open-work-protocol/pool)

## Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing documentation
- Review the DEVLOG for context

---

**OWP Pool** - Making open-source contribution scalable and sustainable.
