# @owp/protocol

TypeScript types and client for the Open Work Protocol (OWP) Pool API.

## Overview

This package provides:
- **Complete TypeScript types** generated from OpenAPI 3.1 specification
- **Runtime validation schemas** for request/response data
- **Type-safe API contracts** for all OWP Pool endpoints
- **Shared types** for use across server, web, plugin, and CLI applications

## Installation

```bash
npm install @owp/protocol
```

## Usage

### Import Types

```typescript
import type {
  WorkerStatus,
  TaskStatus,
  RegisterWorkerRequest,
  RegisterWorkerResponse,
  LeaseView,
  WorkResponse,
  TaskStatusUpdateRequest,
  ErrorResponse,
} from '@owp/protocol';

// Use types in your application
const worker: RegisterWorkerRequest = {
  name: 'Alice',
  github_handle: 'alice-dev',
  skills: ['typescript', 'react'],
  capacity_points: 5,
  max_concurrent_tasks: 2,
};
```

### Runtime Validation

```typescript
import { RegisterWorkerRequestSchema } from '@owp/protocol';

// Validate request data at runtime
const result = RegisterWorkerRequestSchema.safeParse(requestData);
if (result.success) {
  // Data is valid and typed
  const validData = result.data;
} else {
  // Handle validation errors
  console.error(result.error);
}
```

### API Endpoints Reference

The types correspond to these API endpoints:

#### Worker Operations
- `POST /v1/workers/register` - Register a new worker
- `POST /v1/workers/heartbeat` - Send worker heartbeat
- `GET /v1/work` - Fetch available work assignments

#### Task Management
- `POST /v1/tasks/{id}/status` - Update task status

#### Admin Operations
- `POST /v1/admin/repos` - Create/configure repository
- `POST /v1/admin/tasks` - Create new task
- `GET /v1/admin/state` - Get system state

#### Advanced Features
- `GET /v1/workers/{id}/reputation` - Get worker reputation
- `POST /v1/workers/{id}/trust-tier` - Update trust tier
- `GET /v1/analytics/repositories/{repo}` - Repository analytics
- `GET /v1/audit/events` - Audit log events
- `POST /v1/github/repos/{owner}/{repo}/sync` - GitHub integration

## Type Categories

### Core Enums
- `WorkerStatus`: `idle | working | paused`
- `TaskStatus`: `ready | leased | in_progress | blocked | pr_opened | merged`
- `TrustTier`: `untrusted | basic | trusted | maintainer`

### Request/Response Types
- Worker registration and authentication
- Task assignment and status updates
- Repository and admin management
- Advanced features (reputation, analytics, audit)

### Error Handling
- `ErrorResponse`: Standardized error format
- Validation error schemas
- HTTP status code mappings

## Development

### Regenerate Types

```bash
npm run generate
```

This reads `openapi.yaml` and regenerates all TypeScript types and schemas.

### Build Package

```bash
npm run build
```

Generates types and compiles to `dist/` directory.

### Validate Specification

```bash
npm run validate
```

Validates the OpenAPI specification syntax and completeness.

## OpenAPI Specification

The complete API specification is available in `openapi.yaml`. This serves as the single source of truth for:

- API endpoint definitions
- Request/response schemas
- Authentication requirements
- Error response formats
- Advanced feature specifications

## Integration Examples

### Server Implementation

```typescript
import type { RegisterWorkerRequest, RegisterWorkerResponse } from '@owp/protocol';

app.post('/v1/workers/register', async (req, res) => {
  const workerData: RegisterWorkerRequest = req.body;
  
  // Implementation logic here
  
  const response: RegisterWorkerResponse = {
    worker_id: 'w_abc123',
    token: 'bearer_token_xyz',
  };
  
  res.json(response);
});
```

### Client Usage

```typescript
import type { WorkResponse, TaskStatusUpdateRequest } from '@owp/protocol';

// Fetch work assignments
const workResponse: WorkResponse = await fetch('/v1/work', {
  headers: { Authorization: `Bearer ${token}` },
}).then(r => r.json());

// Update task status
const statusUpdate: TaskStatusUpdateRequest = {
  status: 'pr_opened',
  message: 'PR created successfully',
  artifact: {
    pr_url: 'https://github.com/owner/repo/pull/123',
  },
};
```

## License

MIT
