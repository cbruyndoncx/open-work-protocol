# Feature: Protocol-First OpenAPI Specification

The following plan should be complete, but its important that you validate documentation and codebase patterns and task sanity before you start implementing.

Pay special attention to naming of existing utils types and models. Import from the right files etc.

## Feature Description

Create a comprehensive OpenAPI 3.1 specification that serves as the single source of truth for the Open Work Protocol (OWP) Pool system. This specification will define all API endpoints, request/response schemas, authentication mechanisms, and data models. The spec will enable automatic TypeScript type generation, client SDK creation, and serve as the foundation for all system components including the server, web dashboard, Obsidian plugin, and CLI tools.

## User Story

As a developer implementing OWP Pool components
I want a complete OpenAPI specification with generated TypeScript types
So that I can build type-safe applications with consistent API contracts and automatic client generation

## Problem Statement

The current system has informal API definitions scattered across Python models and documentation. This creates inconsistency, makes client development difficult, and prevents automatic type generation. Without a formal specification, different components may implement incompatible API contracts, leading to integration failures and maintenance overhead.

## Solution Statement

Create a comprehensive OpenAPI 3.1 specification that defines the complete OWP Pool API surface, including all endpoints from basic worker operations to advanced features like reputation scoring and GitHub integration. Generate TypeScript types and client libraries from this specification to ensure type safety across all components.

## Feature Metadata

**Feature Type**: New Capability
**Estimated Complexity**: High
**Primary Systems Affected**: All (Server, Web, Plugin, CLI)
**Dependencies**: OpenAPI 3.1, @hey-api/openapi-ts, TypeScript 5+

---

## CONTEXT REFERENCES

### Relevant Codebase Files IMPORTANT: YOU MUST READ THESE FILES BEFORE IMPLEMENTING!

- `deep-research/docs/owp-spec.md` - Why: Contains the informal protocol specification to formalize
- `deep-research/src/pool/models.py` (lines 1-100) - Why: Existing Pydantic models show data structure patterns
- `PRD.md` (lines 200-350) - Why: Contains detailed API endpoint specifications with examples
- `.kiro/steering/tech.md` - Why: Defines TypeScript monorepo structure and technology choices
- `.kiro/steering/structure.md` - Why: Shows target directory layout for packages/protocol

### New Files to Create

- `packages/protocol/openapi.yaml` - Complete OpenAPI 3.1 specification
- `packages/protocol/package.json` - Package configuration for type generation
- `packages/protocol/tsconfig.json` - TypeScript configuration
- `packages/protocol/src/types.ts` - Generated TypeScript types (auto-generated)
- `packages/protocol/src/client.ts` - Generated API client (auto-generated)
- `packages/protocol/src/index.ts` - Package exports
- `packages/protocol/scripts/generate.js` - Code generation script
- `packages/protocol/README.md` - Package documentation

### Relevant Documentation YOU SHOULD READ THESE BEFORE IMPLEMENTING!

- [OpenAPI 3.1 Specification](https://spec.openapis.org/oas/v3.1.0)
  - Specific section: Schema Object and Data Types
  - Why: Required for proper schema definitions and validation
- [@hey-api/openapi-ts Documentation](https://github.com/hey-api/openapi-ts)
  - Specific section: Configuration and TypeScript Generation
  - Why: Shows how to generate type-safe clients from OpenAPI specs
- [OpenAPI TypeScript Best Practices](https://blog.api-fiddle.com/posts/best-ways-to-generate-ts-client)
  - Specific section: Monorepo Integration Patterns
  - Why: Shows proper setup for shared type packages in monorepos

### Patterns to Follow

**OpenAPI Schema Patterns:**
```yaml
# Component schema with validation
components:
  schemas:
    WorkerRegistration:
      type: object
      required: [name, skills, capacity_points]
      properties:
        name:
          type: string
          minLength: 1
          maxLength: 120
          description: "Human-readable worker name"
```

**Authentication Patterns:**
```yaml
# Bearer token and admin token patterns
components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
    AdminToken:
      type: apiKey
      in: header
      name: X-Admin-Token
```

**Error Response Patterns:**
```yaml
# Consistent error response structure
components:
  schemas:
    ErrorResponse:
      type: object
      required: [error, message]
      properties:
        error:
          type: string
          description: "Error code"
        message:
          type: string
          description: "Human-readable error message"
```

**TypeScript Generation Patterns:**
```json
// Package.json script pattern
{
  "scripts": {
    "generate": "node scripts/generate.js",
    "build": "npm run generate && tsc",
    "dev": "npm run generate && tsc --watch"
  }
}
```

---

## IMPLEMENTATION PLAN

### Phase 1: Foundation Setup

Set up the protocol package structure and basic OpenAPI specification framework.

**Tasks:**
- Create monorepo package structure for protocol definitions
- Set up TypeScript configuration and build tooling
- Initialize OpenAPI specification with basic metadata
- Configure code generation toolchain

### Phase 2: Core API Specification

Define all API endpoints, request/response schemas, and authentication mechanisms.

**Tasks:**
- Define worker lifecycle endpoints (register, heartbeat, work fetching)
- Specify task management endpoints (status updates, assignment)
- Create admin endpoints for repository and task management
- Add authentication and authorization specifications

### Phase 3: Advanced Features Specification

Extend the specification with advanced features like reputation, analytics, and GitHub integration.

**Tasks:**
- Define reputation and trust tier management endpoints
- Specify analytics and metrics endpoints
- Add audit logging and compliance endpoints
- Create GitHub integration webhook specifications

### Phase 4: Type Generation & Validation

Generate TypeScript types and validate the complete specification.

**Tasks:**
- Configure and run TypeScript type generation
- Create API client generation
- Validate specification completeness and consistency
- Set up automated regeneration workflows

---

## STEP-BY-STEP TASKS

IMPORTANT: Execute every task in order, top to bottom. Each task is atomic and independently testable.

### CREATE packages/protocol/package.json

- **IMPLEMENT**: Package configuration for OpenAPI type generation
- **PATTERN**: Standard TypeScript package with generation scripts
- **IMPORTS**: @hey-api/openapi-ts, typescript, yaml dependencies
- **GOTCHA**: Use exact versions to ensure consistent generation
- **VALIDATE**: `cd packages/protocol && npm install`

### CREATE packages/protocol/tsconfig.json

- **IMPLEMENT**: TypeScript configuration for generated types
- **PATTERN**: Strict TypeScript configuration with proper module resolution
- **IMPORTS**: Standard TypeScript compiler options
- **GOTCHA**: Enable strict mode and proper ESM module resolution
- **VALIDATE**: `cd packages/protocol && npx tsc --noEmit`

### CREATE packages/protocol/openapi.yaml

- **IMPLEMENT**: Complete OpenAPI 3.1 specification with all endpoints
- **PATTERN**: Follow OpenAPI 3.1 structure with components, paths, and security
- **IMPORTS**: Reference existing Python models for schema structure
- **GOTCHA**: Use proper OpenAPI 3.1 syntax (not 3.0) for better type generation
- **VALIDATE**: `cd packages/protocol && npx swagger-codegen validate -i openapi.yaml`

### ADD packages/protocol/openapi.yaml - Info and Servers

- **IMPLEMENT**: API metadata, version, and server configuration
- **PATTERN**: Standard OpenAPI info block with proper versioning
- **IMPORTS**: Version from package.json, server URLs for different environments
- **GOTCHA**: Use semantic versioning and environment-specific server URLs
- **VALIDATE**: `yaml-lint openapi.yaml`

### ADD packages/protocol/openapi.yaml - Security Schemes

- **IMPLEMENT**: Bearer token and admin token authentication definitions
- **PATTERN**: HTTP bearer scheme and API key header scheme
- **IMPORTS**: Reference existing auth patterns from Python implementation
- **GOTCHA**: Properly define both worker and admin authentication methods
- **VALIDATE**: Check security definitions are properly referenced in operations

### ADD packages/protocol/openapi.yaml - Core Data Schemas

- **IMPLEMENT**: Worker, Task, Lease, and basic response schemas
- **PATTERN**: Mirror existing Pydantic models with proper OpenAPI validation
- **IMPORTS**: Use deep-research/src/pool/models.py as reference
- **GOTCHA**: Convert Python types to OpenAPI types (datetime -> string format)
- **VALIDATE**: Ensure all required fields and constraints are properly defined

### ADD packages/protocol/openapi.yaml - Worker Endpoints

- **IMPLEMENT**: POST /v1/workers/register, POST /v1/workers/heartbeat, GET /v1/work
- **PATTERN**: RESTful endpoint design with proper HTTP methods and status codes
- **IMPORTS**: Reference PRD.md API specifications for request/response examples
- **GOTCHA**: Include proper error responses (400, 401, 403, 500)
- **VALIDATE**: Each endpoint has complete request/response schema definitions

### ADD packages/protocol/openapi.yaml - Task Management Endpoints

- **IMPLEMENT**: POST /v1/tasks/{id}/status, task offer/accept/reject endpoints
- **PATTERN**: Resource-based URLs with proper HTTP verbs
- **IMPORTS**: Use task status update patterns from existing models
- **GOTCHA**: Include timeout handling for accept/reject operations
- **VALIDATE**: All task lifecycle states are properly represented

### ADD packages/protocol/openapi.yaml - Admin Endpoints

- **IMPLEMENT**: Repository management, task creation, system state endpoints
- **PATTERN**: Admin-only endpoints with X-Admin-Token security requirement
- **IMPORTS**: Reference admin operations from PRD.md
- **GOTCHA**: Separate admin operations from worker operations clearly
- **VALIDATE**: All admin endpoints require proper authentication

### ADD packages/protocol/openapi.yaml - Advanced Feature Schemas

- **IMPLEMENT**: Reputation, trust tier, analytics, and audit log schemas
- **PATTERN**: Complex nested objects with proper validation rules
- **IMPORTS**: Reference advanced features from PRD.md specifications
- **GOTCHA**: Include proper enum definitions for trust tiers and event types
- **VALIDATE**: Schema complexity doesn't break type generation

### ADD packages/protocol/openapi.yaml - Advanced Feature Endpoints

- **IMPLEMENT**: Reputation management, analytics, audit, GitHub integration endpoints
- **PATTERN**: RESTful design with proper resource hierarchies
- **IMPORTS**: Use PRD.md advanced API specifications
- **GOTCHA**: Include pagination for list endpoints and proper filtering
- **VALIDATE**: All advanced endpoints have complete documentation

### ADD packages/protocol/openapi.yaml - Error Response Schemas

- **IMPLEMENT**: Standardized error response formats for all error conditions
- **PATTERN**: Consistent error structure with error codes and messages
- **IMPORTS**: HTTP status code best practices
- **GOTCHA**: Include specific error schemas for validation failures
- **VALIDATE**: All endpoints reference appropriate error responses

### CREATE packages/protocol/scripts/generate.js

- **IMPLEMENT**: Code generation script using @hey-api/openapi-ts
- **PATTERN**: Node.js script that generates types and client from OpenAPI spec
- **IMPORTS**: @hey-api/openapi-ts configuration and execution
- **GOTCHA**: Configure proper output paths and generation options
- **VALIDATE**: `cd packages/protocol && node scripts/generate.js`

### UPDATE packages/protocol/package.json - Add Generation Scripts

- **IMPLEMENT**: npm scripts for generate, build, and development workflows
- **PATTERN**: Standard package.json scripts with proper dependency order
- **IMPORTS**: Reference TypeScript build patterns
- **GOTCHA**: Ensure generate runs before build and in watch mode
- **VALIDATE**: `cd packages/protocol && npm run build`

### CREATE packages/protocol/src/index.ts

- **IMPLEMENT**: Package exports for generated types and client
- **PATTERN**: Barrel export pattern for clean package interface
- **IMPORTS**: Export all generated types and client functions
- **GOTCHA**: Use proper TypeScript export syntax for both types and values
- **VALIDATE**: `cd packages/protocol && npm run build && node -e "console.log(require('./dist/index.js'))"`

### CREATE packages/protocol/README.md

- **IMPLEMENT**: Package documentation with usage examples and API overview
- **PATTERN**: Standard package README with installation and usage sections
- **IMPORTS**: Include examples of using generated types and client
- **GOTCHA**: Document both type usage and client usage patterns
- **VALIDATE**: Documentation examples are syntactically correct

### CREATE packages/protocol/.gitignore

- **IMPLEMENT**: Ignore generated files and build artifacts
- **PATTERN**: Standard TypeScript package gitignore
- **IMPORTS**: Ignore dist/, node_modules/, generated src files
- **GOTCHA**: Don't ignore the OpenAPI spec itself, only generated code
- **VALIDATE**: `git status` shows only source files, not generated ones

### VALIDATE packages/protocol - Complete Package Validation

- **IMPLEMENT**: Run full validation suite on complete package
- **PATTERN**: Multi-step validation covering spec, generation, and build
- **IMPORTS**: All validation commands from previous tasks
- **GOTCHA**: Ensure generated types are actually usable in TypeScript
- **VALIDATE**: `cd packages/protocol && npm run build && npm run test`

---

## TESTING STRATEGY

### Specification Validation

Validate OpenAPI specification syntax, completeness, and consistency using standard OpenAPI tools.

**Tools**: swagger-codegen validate, openapi-lint, spectral

### Type Generation Testing

Verify that generated TypeScript types are correct, complete, and usable in actual TypeScript code.

**Approach**: Create test files that import and use all generated types to ensure compilation success

### Client Generation Testing

Test that generated API client functions have correct signatures and can be used for actual API calls.

**Approach**: Mock API responses and test client function calls with proper type checking

### Integration Testing

Validate that the specification accurately represents the intended API behavior by comparing with existing Python implementation.

**Approach**: Cross-reference all endpoints and schemas with existing models and server implementation

---

## VALIDATION COMMANDS

Execute every command to ensure zero regressions and 100% feature correctness.

### Level 1: Syntax & Style

```bash
# Validate OpenAPI specification syntax
cd packages/protocol
npx swagger-codegen validate -i openapi.yaml

# Lint YAML syntax
npx yaml-lint openapi.yaml

# Validate TypeScript configuration
npx tsc --noEmit
```

### Level 2: Generation Tests

```bash
# Test type generation
cd packages/protocol
npm run generate

# Verify generated files exist and compile
npm run build

# Test generated types are importable
node -e "const types = require('./dist/index.js'); console.log(Object.keys(types));"
```

### Level 3: Specification Completeness

```bash
# Check all endpoints have proper documentation
npx spectral lint openapi.yaml

# Validate schema completeness
npx openapi-lint openapi.yaml

# Test client generation produces usable code
npm run test:client
```

### Level 4: Manual Validation

```bash
# Generate and inspect TypeScript types
cat packages/protocol/src/types.ts | head -50

# Verify client functions are generated
grep -n "export.*function" packages/protocol/src/client.ts

# Check package exports are correct
node -e "console.log(require('./packages/protocol/dist/index.js'))"
```

### Level 5: Cross-Reference Validation

```bash
# Compare with existing Python models
diff -u <(grep -E "class.*:" deep-research/src/pool/models.py) <(grep -E "export.*interface" packages/protocol/src/types.ts)

# Validate endpoint coverage matches PRD
grep -E "POST|GET|PUT|DELETE" PRD.md | wc -l
grep -E "post:|get:|put:|delete:" packages/protocol/openapi.yaml | wc -l
```

---

## ACCEPTANCE CRITERIA

- [ ] Complete OpenAPI 3.1 specification covers all endpoints from PRD
- [ ] All data schemas match existing Python models with proper validation
- [ ] TypeScript types generate successfully without errors
- [ ] API client generates with proper function signatures
- [ ] Authentication schemes properly defined for worker and admin access
- [ ] Error responses standardized across all endpoints
- [ ] Advanced features (reputation, analytics, GitHub) fully specified
- [ ] Package builds and exports types/client correctly
- [ ] Documentation includes usage examples and API overview
- [ ] Specification validates against OpenAPI 3.1 standards
- [ ] Generated code compiles without TypeScript errors
- [ ] All validation commands pass with zero errors

---

## COMPLETION CHECKLIST

- [ ] OpenAPI specification created with all required endpoints
- [ ] TypeScript package structure established
- [ ] Code generation pipeline configured and working
- [ ] All schemas properly defined with validation rules
- [ ] Authentication and security properly specified
- [ ] Error handling standardized across all endpoints
- [ ] Advanced features completely documented
- [ ] Package exports configured correctly
- [ ] Documentation written with usage examples
- [ ] All validation commands execute successfully
- [ ] Generated types and client are usable
- [ ] Specification completeness verified against PRD

---

## NOTES

**Design Decisions:**
- Using OpenAPI 3.1 for better TypeScript type generation support
- @hey-api/openapi-ts chosen for superior type generation compared to alternatives
- Monorepo package structure enables sharing types across all applications
- Separate authentication schemes for workers vs admins maintains security boundaries

**Trade-offs:**
- Generated code requires build step but ensures type safety
- Comprehensive specification is verbose but prevents integration issues
- Single source of truth approach requires discipline but eliminates inconsistencies

**Future Considerations:**
- Specification can be extended for additional features without breaking existing clients
- Generated client can be published as standalone npm package for third-party integrations
- OpenAPI spec serves as contract for conformance testing of alternative implementations
