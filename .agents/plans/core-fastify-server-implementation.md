# Feature: Core Fastify Server Implementation

## Feature Description

Implement the core OWP Pool scheduler server using Fastify framework with SQLite database. This server will provide all API endpoints defined in the OpenAPI specification, implement the scheduling logic with lease management, and serve as the foundation for the entire system.

## User Story

As a system administrator
I want a production-ready API server with database persistence
So that workers can register, receive tasks, and maintainers can manage repositories

## Problem Statement

The OpenAPI specification and types are complete, but there's no actual server implementation to handle requests, manage the database, or run the scheduling logic. Without a working server, the protocol remains theoretical.

## Solution Statement

Create a Fastify-based server that implements all API endpoints, uses SQLite for persistence, includes proper authentication, and runs the core scheduling loop with lease management and heartbeat monitoring.

## Feature Metadata

**Feature Type**: New Capability
**Estimated Complexity**: High
**Primary Systems Affected**: Server, Database, Authentication
**Dependencies**: @owp/protocol, Fastify, SQLite, Zod

---

## CONTEXT REFERENCES

### Relevant Codebase Files IMPORTANT: YOU MUST READ THESE FILES BEFORE IMPLEMENTING!

- `packages/protocol/openapi.yaml` - Why: Complete API specification to implement
- `packages/protocol/src/types.gen.ts` - Why: TypeScript types for all endpoints
- `deep-research/src/pool/server.py` (lines 1-50) - Why: Reference implementation patterns
- `deep-research/src/pool/models.py` - Why: Database schema patterns
- `PRD.md` (lines 200-350) - Why: API endpoint specifications and examples
- `.kiro/steering/tech.md` - Why: Technology choices and architecture decisions

### New Files to Create

- `apps/server/package.json` - Server package configuration
- `apps/server/src/main.ts` - Server entry point
- `apps/server/src/database/schema.sql` - Database schema
- `apps/server/src/database/connection.ts` - Database connection and setup
- `apps/server/src/routes/workers.ts` - Worker endpoints
- `apps/server/src/routes/tasks.ts` - Task management endpoints
- `apps/server/src/routes/admin.ts` - Admin endpoints
- `apps/server/src/routes/advanced.ts` - Advanced feature endpoints
- `apps/server/src/auth/middleware.ts` - Authentication middleware
- `apps/server/src/scheduler/core.ts` - Scheduling logic
- `apps/server/src/scheduler/leases.ts` - Lease management
- `apps/server/Dockerfile` - Container configuration

### Relevant Documentation YOU SHOULD READ THESE BEFORE IMPLEMENTING!

- [Fastify Documentation](https://fastify.dev/docs/latest/)
  - Specific section: TypeScript support and plugins
  - Why: Required for proper server setup with types
- [SQLite Node.js](https://github.com/WiseLibs/better-sqlite3)
  - Specific section: Synchronous API and transactions
  - Why: Database operations and schema management
- [Zod Validation](https://zod.dev/)
  - Specific section: Runtime validation with TypeScript
  - Why: Request/response validation using protocol schemas

### Patterns to Follow

**Fastify Route Patterns:**
```typescript
// Route with validation and types
app.post<{
  Body: RegisterWorkerRequest;
  Reply: RegisterWorkerResponse;
}>('/v1/workers/register', {
  schema: {
    body: RegisterWorkerRequestSchema,
    response: {
      201: RegisterWorkerResponseSchema
    }
  }
}, async (request, reply) => {
  // Implementation
});
```

**Database Patterns:**
```typescript
// Transaction-based operations
const result = db.transaction(() => {
  // Multiple operations
  return db.prepare('INSERT INTO ...').run(data);
})();
```

**Authentication Patterns:**
```typescript
// Bearer token middleware
const authenticateWorker = async (request: FastifyRequest) => {
  const token = request.headers.authorization?.replace('Bearer ', '');
  if (!token) throw new Error('Missing token');
  // Validate token
};
```

---

## IMPLEMENTATION PLAN

### Phase 1: Server Foundation

Set up Fastify server with TypeScript, database connection, and basic middleware.

**Tasks:**
- Create server package with dependencies
- Set up Fastify with TypeScript support
- Configure SQLite database connection
- Implement authentication middleware

### Phase 2: Database Schema & Operations

Create database schema and data access layer for all entities.

**Tasks:**
- Design SQLite schema for workers, tasks, repos, leases
- Implement database connection and migration system
- Create data access objects for each entity
- Add transaction support for complex operations

### Phase 3: Core API Endpoints

Implement all API endpoints defined in the OpenAPI specification.

**Tasks:**
- Worker registration and heartbeat endpoints
- Task status update endpoints
- Admin repository and task management
- Advanced features (reputation, analytics, audit)

### Phase 4: Scheduling Logic

Implement the core scheduling loop with lease management.

**Tasks:**
- Task assignment algorithm with skill matching
- Lease management with TTL and automatic requeue
- Heartbeat monitoring and worker status tracking
- Review budget enforcement and area locks

---

## STEP-BY-STEP TASKS

### CREATE apps/server/package.json

- **IMPLEMENT**: Server package configuration with Fastify and SQLite
- **PATTERN**: Node.js server package with TypeScript and production dependencies
- **IMPORTS**: @owp/protocol, fastify, better-sqlite3, zod
- **GOTCHA**: Use exact versions and include both runtime and dev dependencies
- **VALIDATE**: `cd apps/server && npm install`

### CREATE apps/server/tsconfig.json

- **IMPLEMENT**: TypeScript configuration extending protocol package
- **PATTERN**: Server-specific TypeScript config with strict mode
- **IMPORTS**: Extend base config with server-specific paths
- **GOTCHA**: Configure path mapping for protocol package imports
- **VALIDATE**: `cd apps/server && npx tsc --noEmit`

### CREATE apps/server/src/database/schema.sql

- **IMPLEMENT**: Complete SQLite schema for all entities
- **PATTERN**: Normalized database design with proper indexes
- **IMPORTS**: Reference Python models for field types and constraints
- **GOTCHA**: Use SQLite-specific syntax and proper foreign key constraints
- **VALIDATE**: `sqlite3 test.db < src/database/schema.sql`

### CREATE apps/server/src/database/connection.ts

- **IMPLEMENT**: Database connection setup with migrations
- **PATTERN**: Singleton connection with transaction support
- **IMPORTS**: better-sqlite3 with TypeScript types
- **GOTCHA**: Handle database file creation and schema initialization
- **VALIDATE**: Database connection and schema creation works

### CREATE apps/server/src/auth/middleware.ts

- **IMPLEMENT**: Authentication middleware for Bearer and Admin tokens
- **PATTERN**: Fastify preHandler hooks with token validation
- **IMPORTS**: Fastify types and crypto for token validation
- **GOTCHA**: Separate worker and admin authentication flows
- **VALIDATE**: Middleware correctly validates and rejects invalid tokens

### CREATE apps/server/src/routes/workers.ts

- **IMPLEMENT**: Worker registration, heartbeat, and work fetching endpoints
- **PATTERN**: Fastify route handlers with schema validation
- **IMPORTS**: Protocol types and schemas for validation
- **GOTCHA**: Generate secure tokens and handle concurrent requests
- **VALIDATE**: All worker endpoints respond with correct types

### CREATE apps/server/src/routes/tasks.ts

- **IMPLEMENT**: Task status update and management endpoints
- **PATTERN**: RESTful endpoints with proper HTTP status codes
- **IMPORTS**: Task-related types from protocol package
- **GOTCHA**: Validate task ownership and state transitions
- **VALIDATE**: Task updates work correctly with lease validation

### CREATE apps/server/src/routes/admin.ts

- **IMPLEMENT**: Repository and task creation endpoints
- **PATTERN**: Admin-only endpoints with proper authorization
- **IMPORTS**: Admin types and authentication middleware
- **GOTCHA**: Validate admin permissions and input data
- **VALIDATE**: Admin operations work with proper authentication

### CREATE apps/server/src/scheduler/core.ts

- **IMPLEMENT**: Core scheduling logic with skill matching and capacity
- **PATTERN**: Interval-based scheduler with transaction safety
- **IMPORTS**: Database connection and scheduling algorithms
- **GOTCHA**: Handle concurrent scheduling and avoid race conditions
- **VALIDATE**: Scheduler assigns tasks correctly based on skills and capacity

### CREATE apps/server/src/scheduler/leases.ts

- **IMPLEMENT**: Lease management with TTL and automatic requeue
- **PATTERN**: Time-based lease expiry with cleanup processes
- **IMPORTS**: Database operations and date/time utilities
- **GOTCHA**: Handle timezone issues and ensure atomic operations
- **VALIDATE**: Leases expire correctly and tasks are requeued

### CREATE apps/server/src/main.ts

- **IMPLEMENT**: Server entry point with all routes and middleware
- **PATTERN**: Fastify server setup with graceful shutdown
- **IMPORTS**: All route modules and configuration
- **GOTCHA**: Proper error handling and process signal management
- **VALIDATE**: `cd apps/server && npm start`

### CREATE apps/server/Dockerfile

- **IMPLEMENT**: Production Docker container configuration
- **PATTERN**: Multi-stage build with Node.js Alpine
- **IMPORTS**: Standard Node.js Docker patterns
- **GOTCHA**: Non-root user and proper volume mounting for SQLite
- **VALIDATE**: `docker build -t owp-server apps/server`

---

## TESTING STRATEGY

### Unit Testing
Test individual components like authentication, database operations, and scheduling logic using Jest with proper mocking.

### Integration Testing
Test complete API endpoints with real database operations and validate request/response cycles.

### Load Testing
Verify the server can handle multiple concurrent workers and task assignments without race conditions.

---

## VALIDATION COMMANDS

### Level 1: Syntax & Build
```bash
cd apps/server
npm install
npx tsc --noEmit
npm run build
```

### Level 2: Database & Schema
```bash
cd apps/server
sqlite3 test.db < src/database/schema.sql
npm run test:db
```

### Level 3: API Endpoints
```bash
cd apps/server
npm start &
curl -X POST http://localhost:8787/v1/workers/register -d '{"name":"test"}'
npm run test:api
```

### Level 4: Integration
```bash
cd apps/server
npm run test:integration
docker build -t owp-server .
docker run -p 8787:8787 owp-server
```

---

## ACCEPTANCE CRITERIA

- [ ] All API endpoints from OpenAPI spec implemented
- [ ] SQLite database with proper schema and indexes
- [ ] Authentication middleware for worker and admin tokens
- [ ] Scheduling logic with lease management and heartbeats
- [ ] Docker container builds and runs successfully
- [ ] All validation commands pass without errors
- [ ] Integration tests verify end-to-end workflows
- [ ] Server handles concurrent requests safely
- [ ] Proper error handling and logging throughout
- [ ] Production-ready configuration and deployment

---

## COMPLETION CHECKLIST

- [ ] Server package created with all dependencies
- [ ] Database schema implemented with migrations
- [ ] All API endpoints working with proper validation
- [ ] Authentication and authorization implemented
- [ ] Scheduling logic operational with lease management
- [ ] Docker container configured for deployment
- [ ] Tests passing for all components
- [ ] Documentation updated with server setup
- [ ] Integration with protocol package verified
- [ ] Production deployment configuration ready

---

## NOTES

**Design Decisions:**
- Using Fastify for performance and TypeScript support
- SQLite for simplicity and file-based persistence
- better-sqlite3 for synchronous operations and performance
- Zod schemas from protocol package for validation

**Architecture Considerations:**
- Stateless server design for horizontal scaling
- Transaction-based operations for data consistency
- Separate authentication flows for workers vs admins
- Interval-based scheduling with proper cleanup
