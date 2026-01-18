# Technical Architecture

## Technology Stack
**Current (Python MVP):**
- **Backend**: FastAPI + SQLite + Typer CLI
- **Frontend**: Basic HTML dashboard
- **Deployment**: Docker + docker-compose

**Target (TypeScript Rewrite):**
- **Backend**: Fastify/Hono + SQLite + OpenAPI spec
- **Frontend**: Modern web dashboard with SSE
- **CLI**: TypeScript CLI (optional, may be replaced by plugin)
- **Plugin**: Obsidian plugin for UI/UX
- **Deployment**: Docker containers with volume persistence
- **Validation**: Zod for runtime type checking
- **Code Generation**: OpenAPI → TypeScript types + client

## Architecture Overview
**Monorepo Structure:**
- `packages/protocol/` - OWP spec + generated types
- `apps/server/` - Scheduler API + DB + scheduler loop
- `apps/web/` - Dashboard with real-time updates
- `apps/obsidian-plugin/` - Primary UI interface
- `apps/cli/` - Command-line tools (optional)

**Core Components:**
- **Scheduler Loop**: Lease management, heartbeat monitoring, task assignment
- **API Layer**: RESTful endpoints with OpenAPI specification
- **Database**: SQLite with volume mounting for persistence
- **Authentication**: Bearer tokens for workers, admin tokens for management
- **Real-time Updates**: Server-Sent Events (SSE) for live dashboard

## Development Environment
**Prerequisites:**
- Node.js 20+ (Alpine in Docker)
- TypeScript 5+
- SQLite 3
- Docker & docker-compose

**Package Management:**
- npm/yarn for dependencies
- Monorepo tooling (Lerna/Nx/Turborepo)

**Development Tools:**
- OpenAPI code generation
- TypeScript strict mode
- ESLint + Prettier
- Zod for runtime validation

## Code Standards
**TypeScript Standards:**
- Strict mode enabled
- Explicit return types for public APIs
- Interface-first design with OpenAPI spec
- Functional programming patterns where appropriate

**API Design:**
- RESTful endpoints with consistent naming
- OpenAPI 3.0 specification as source of truth
- JSON request/response bodies
- Proper HTTP status codes and error handling

**Database:**
- SQLite with proper indexing
- Migration scripts for schema changes
- Transactional operations for consistency

## Testing Strategy
**Unit Testing:**
- Jest/Vitest for TypeScript components
- Mock external dependencies
- High coverage for scheduler logic

**Integration Testing:**
- API endpoint testing with test database
- Docker container testing
- End-to-end worker registration and task flow

**Conformance Testing:**
- Protocol compliance verification
- Lease expiry and requeue behavior
- Concurrency and capacity constraints

## Deployment Process
**Docker Deployment:**
- Multi-stage builds for optimization
- Non-root user for security
- Volume-mounted SQLite database
- Environment variable configuration

**CI/CD Pipeline:**
- Automated testing on PR
- Docker image building and publishing
- Deployment to staging/production environments

**Configuration Management:**
- Environment variables for secrets
- Config files for non-sensitive settings
- Support for `.env` and `env.local` files

## Performance Requirements
**Scalability Targets:**
- Support 100+ concurrent workers
- Sub-second task assignment latency
- Real-time dashboard updates via SSE
- Efficient SQLite queries with proper indexing

**Resource Constraints:**
- Lightweight Docker containers
- Minimal memory footprint
- Efficient polling and heartbeat mechanisms

## Security Considerations
**Authentication & Authorization:**
- Bearer token authentication for workers
- Admin token for management operations
- No shared accounts or centralized credentials

**Data Protection:**
- Minimal data collection (no code execution on worker machines)
- Secure token generation and validation
- Audit logging for administrative actions

**Deployment Security:**
- Non-root Docker containers
- Environment variable secrets management
- Network isolation and proper port exposure
