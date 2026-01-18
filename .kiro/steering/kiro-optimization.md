# Kiro CLI Optimization for Hackathon

## Quick Reference: Scoring Impact

**Kiro CLI Usage = 20% of hackathon score (20 points)**

This is your second-largest scoring category. Every Kiro feature you use and document increases your score.

## Current Setup

### ✅ Prompt Created
- **@update-devlog** - Automatically maintain DEVLOG.md after work sessions

### ✅ Hook Configured
- **postToolUse** - Reminds you to update DEVLOG after file writes

### ✅ Features Currently Used
1. `code` tool - Symbol search, document analysis
2. `execute_bash` - Testing and validation
3. `fs_read`/`fs_write` - File operations
4. `grep` - Pattern searching

## How to Maximize Kiro CLI Score (20 pts)

### Effective Use of Features (10 pts)
**Current**: 6/10 - Using 5 basic features

**To reach 10/10**:
- [ ] Initialize LSP: `/code init` (semantic understanding)
- [ ] Add context: `/context add` (essential files)
- [ ] Use subagents: `use_subagent` (parallel tasks)
- [ ] Switch models: `/model` (different tasks)
- [ ] Create checkpoints: `/checkpoint` (progress tracking)

**Action**: Try `/code init` in project root to enable LSP

### Custom Commands Quality (7 pts)
**Current**: 3/7 - Created @update-devlog

**To reach 7/7**:
- [ ] @code-review - Code quality analysis
- [ ] @system-review - Compare implementation vs plan
- [ ] @rca - Root cause analysis for bugs
- [ ] @plan-phase-2 - Phase 2 planning
- [ ] @execute-phase-2 - Phase 2 execution

**Action**: Create 2-3 more prompts in `.kiro/prompts/`

### Workflow Innovation (3 pts)
**Current**: 1/3 - Basic hook setup

**To reach 3/3**:
- [ ] Use hooks for automation (already set up)
- [ ] Create custom agent for specialized tasks
- [ ] Use subagents for parallel work
- [ ] Implement checkpoint-based workflow

**Action**: Document your workflow innovations in DEVLOG.md

## Usage Workflow

### Every Work Session
1. Start with `/context show` to see what's loaded
2. Use `@prime` to load project context
3. Work on features
4. After file changes, run `@update-devlog`
5. Use `/code` tools for semantic understanding
6. Document Kiro features used in DEVLOG

### Every Phase Completion
1. Run `@code-review` on your code
2. Run `@system-review` to compare vs plan
3. Update DEVLOG with phase summary
4. Document all Kiro features used

### Before Submission
1. Count all Kiro features used (target: 10+)
2. List all custom prompts created (target: 5+)
3. Document workflow innovations
4. Ensure DEVLOG shows Kiro usage throughout

## Scoring Checklist

- [ ] Using 5+ Kiro features (document each)
- [ ] Created 3+ custom prompts
- [ ] Set up hooks for automation
- [ ] DEVLOG updated after each session
- [ ] Documented all Kiro usage in DEVLOG
- [ ] Created custom agent (optional, +1 pt)
- [ ] Used subagents for parallel tasks (optional, +1 pt)

## Quick Commands

```bash
# Initialize LSP for semantic code understanding
/code init

# View current context
/context show

# Add files to context
/context add README.md
/context add src/**/*.ts

# List available prompts
/prompts list

# Use a prompt
@update-devlog
@code-review
@system-review

# Switch models
/model

# View available tools
/tools

# Get help
/help
```

## Remember

**Documentation is 40% of your score** (20 pts for Kiro usage + 20 pts for documentation).

Every Kiro feature you use and document in DEVLOG.md is worth points. Make it visible!
