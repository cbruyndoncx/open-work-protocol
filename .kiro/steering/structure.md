# Project Structure

## Directory Layout
**Current Python MVP:**
```
deep-research/
├── src/pool/           # Core scheduler and CLI implementation
├── web/                # Basic HTML dashboard
├── docs/               # Protocol spec and documentation
├── demo/               # Demo tasks and scripts
├── scripts/            # Automation and setup scripts
├── pool.db             # SQLite database
├── pyproject.toml      # Python dependencies
└── .env.example        # Environment configuration template
```

**Target TypeScript Monorepo:**
```
open-work-protocol/
├── packages/
│   └── protocol/       # OWP spec + generated TypeScript types
├── apps/
│   ├── server/         # Scheduler API + database + scheduler loop
│   ├── web/            # Dashboard with real-time updates
│   ├── obsidian-plugin/# Primary UI interface
│   └── cli/            # Command-line tools (optional)
├── docs/               # Protocol documentation and guides
├── docker-compose.yml  # Container orchestration
└── .env.example        # Environment configuration
```

## File Naming Conventions
**TypeScript/JavaScript:**
- `kebab-case` for files and directories
- `PascalCase` for TypeScript interfaces and classes
- `camelCase` for variables and functions
- `.ts` for TypeScript source files
- `.spec.ts` for test files

**Configuration Files:**
- `package.json` for Node.js dependencies
- `tsconfig.json` for TypeScript configuration
- `docker-compose.yml` for container setup
- `env.local` for local environment (Obsidian-friendly, not hidden)

## Module Organization
**Monorepo Structure:**
- **packages/protocol/**: Shared types and OpenAPI specification
- **apps/server/**: Backend scheduler with API endpoints and database
- **apps/web/**: Frontend dashboard with real-time monitoring
- **apps/obsidian-plugin/**: Primary user interface as Obsidian plugin
- **apps/cli/**: Optional command-line interface

**API Organization:**
- RESTful endpoints under `/v1/` namespace
- Separate modules for workers, tasks, admin, and events
- OpenAPI specification as single source of truth

## Configuration Files
**Environment Configuration:**
- `.env.example` - Template with all required variables
- `env.local` - Local development (not hidden, Obsidian-friendly)
- `.env` - Standard environment file (gitignored)

**Application Configuration:**
- `docker-compose.yml` - Container orchestration
- `tsconfig.json` - TypeScript compiler settings
- `package.json` - Dependencies and scripts
- OpenAPI spec files for API definition

## Documentation Structure
```
docs/
├── owp-spec.md         # Open Work Protocol specification
├── prd.md              # Product Requirements Document
├── tech-stack-review.md # Technology evaluation
├── stack-recommendation.md # Architecture decisions
└── hackathon-review.md # Project assessment and roadmap
```

## Asset Organization
**Web Dashboard:**
- Static assets served from `/static/`
- CSS and JavaScript bundled appropriately
- Real-time updates via Server-Sent Events

**Obsidian Plugin:**
- Plugin manifest and assets in standard Obsidian structure
- UI components organized by feature area
- Settings and configuration panels

## Build Artifacts
**TypeScript Compilation:**
- Compiled JavaScript in `dist/` directories
- Source maps for debugging
- Type declaration files (`.d.ts`)

**Docker Images:**
- Multi-stage builds for optimization
- Separate images for server and web components
- Volume-mounted database for persistence

## Environment-Specific Files
**Development:**
- `env.local` for local development settings
- Docker Compose for local container orchestration
- Hot reload and development servers

**Production:**
- Environment variables for secrets
- Docker containers with proper security
- Volume persistence for SQLite database
- Health checks and monitoring endpoints
