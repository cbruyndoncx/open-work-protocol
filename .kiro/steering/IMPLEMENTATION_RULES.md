# 🚨 CRITICAL IMPLEMENTATION RULES

## ⚠️ NEVER CLAIM COMPLETION WITHOUT PROOF

### **MANDATORY RULES - NO EXCEPTIONS**

1. **"COMPLETE" REQUIRES 100% OF REQUIREMENTS MET**
   - If ANY requirement is missing, status is "INCOMPLETE" or "PARTIAL"
   - Reducing scope = changing requirements = NOT completion
   - Must ask permission before reducing scope

2. **EVERY "COMPLETE" CLAIM MUST INCLUDE WORKING VALIDATION**
   - Provide exact curl commands that prove functionality
   - Include test scripts that demonstrate all features work
   - "It compiles" ≠ "it works" ≠ "it's complete"

3. **TECHNICAL ISSUES = BLOCKED STATUS**
   - TypeScript errors = BLOCKED, not "simplified"
   - Cannot move to next phase with unresolved technical debt
   - Must fix issues, not work around them

4. **HONEST PROGRESS REPORTING REQUIRED**
   - Use "BLOCKED" when stuck on technical issues
   - Use "PARTIAL" when only some requirements met
   - Use "IN PROGRESS" when actively working
   - Only use "COMPLETE" when ALL acceptance criteria pass

5. **SCOPE CHANGES MUST BE EXPLICIT**
   - State clearly: "I'm reducing scope because of X issue"
   - Get approval before changing requirements
   - Document what was removed and why

## 📋 CURRENT HONEST STATUS

### Phase 1: Protocol Foundation
**Status**: 🚧 **INCOMPLETE** (30% done)

**Completed**:
- ✅ OpenAPI specification
- ✅ TypeScript type generation

**NOT Completed** (required for Phase 1):
- ❌ Working API server with all endpoints
- ❌ Functional worker registration/heartbeat/work fetching  
- ❌ Admin endpoints working
- ❌ Complete authentication flow
- ❌ TypeScript compilation without errors

**Technical Debt**:
- TypeScript route handler type errors
- Authentication middleware integration issues
- Request/response validation not working

## 🎯 PHASE 1 COMPLETION CRITERIA

**Must have ALL of these working with validation commands:**

- [ ] `POST /v1/workers/register` - creates worker, returns token
- [ ] `POST /v1/workers/heartbeat` - updates worker status  
- [ ] `GET /v1/work` - returns available tasks
- [ ] `POST /v1/tasks/{id}/status` - updates task status
- [ ] `POST /v1/admin/repos` - creates repositories
- [ ] `POST /v1/admin/tasks` - creates tasks
- [ ] `GET /v1/admin/state` - returns system status
- [ ] Complete workflow: register → get task → update status
- [ ] Docker container runs with working API
- [ ] Zero TypeScript compilation errors

**Validation Required**: Working curl commands for every endpoint

## 🚫 WHAT NOT TO DO

- ❌ Claim "complete" when endpoints return 501 errors
- ❌ Say "infrastructure is done" when API doesn't work
- ❌ Move to next phase with TypeScript errors
- ❌ Reduce scope without explicit approval
- ❌ Work around problems instead of fixing them

---

**REMEMBER**: The user is the boss. Lying about completion is unacceptable.
