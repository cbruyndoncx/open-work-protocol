-- OWP Pool Database Schema
-- SQLite schema for Open Work Protocol scheduler

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- Workers table
CREATE TABLE IF NOT EXISTS workers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    github_handle TEXT,
    skills TEXT NOT NULL, -- JSON array of skills
    capacity_points INTEGER NOT NULL DEFAULT 5,
    max_concurrent_tasks INTEGER NOT NULL DEFAULT 2,
    token_hash TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'idle' CHECK (status IN ('idle', 'working', 'paused')),
    last_heartbeat DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Repositories table
CREATE TABLE IF NOT EXISTS repositories (
    id TEXT PRIMARY KEY,
    repo TEXT NOT NULL UNIQUE,
    max_open_prs INTEGER NOT NULL DEFAULT 3,
    area_locks_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    repo_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    estimate_points INTEGER NOT NULL DEFAULT 1,
    priority INTEGER NOT NULL DEFAULT 10,
    required_skills TEXT NOT NULL, -- JSON array of required skills
    area TEXT,
    tier INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'ready' CHECK (status IN ('ready', 'leased', 'in_progress', 'blocked', 'pr_opened', 'merged')),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (repo_id) REFERENCES repositories (id) ON DELETE CASCADE
);

-- Task leases table
CREATE TABLE IF NOT EXISTS task_leases (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    worker_id TEXT NOT NULL,
    lease_expires_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE,
    FOREIGN KEY (worker_id) REFERENCES workers (id) ON DELETE CASCADE,
    UNIQUE (task_id) -- One lease per task
);

-- Task artifacts table (for PR URLs, commits, etc.)
CREATE TABLE IF NOT EXISTS task_artifacts (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    pr_url TEXT,
    commit_sha TEXT,
    patch_url TEXT,
    extra TEXT, -- JSON for additional metadata
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE
);

-- Worker reputation table
CREATE TABLE IF NOT EXISTS worker_reputation (
    worker_id TEXT PRIMARY KEY,
    reputation_score REAL NOT NULL DEFAULT 0.0,
    trust_tier TEXT NOT NULL DEFAULT 'basic' CHECK (trust_tier IN ('untrusted', 'basic', 'trusted', 'maintainer')),
    completion_rate REAL NOT NULL DEFAULT 0.0,
    avg_pr_quality REAL NOT NULL DEFAULT 0.0,
    on_time_delivery REAL NOT NULL DEFAULT 0.0,
    total_tasks INTEGER NOT NULL DEFAULT 0,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (worker_id) REFERENCES workers (id) ON DELETE CASCADE
);

-- Audit events table
CREATE TABLE IF NOT EXISTS audit_events (
    id TEXT PRIMARY KEY,
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    event_type TEXT NOT NULL CHECK (event_type IN ('task_assigned', 'task_completed', 'worker_registered', 'repo_created', 'trust_tier_changed', 'lease_expired', 'task_requeued')),
    actor TEXT NOT NULL,
    target TEXT NOT NULL,
    details TEXT, -- JSON for additional context
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_workers_status ON workers (status);
CREATE INDEX IF NOT EXISTS idx_workers_last_heartbeat ON workers (last_heartbeat);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks (status);
CREATE INDEX IF NOT EXISTS idx_tasks_repo_status ON tasks (repo_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks (priority DESC);
CREATE INDEX IF NOT EXISTS idx_task_leases_expires ON task_leases (lease_expires_at);
CREATE INDEX IF NOT EXISTS idx_audit_events_timestamp ON audit_events (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_type ON audit_events (event_type);

-- Triggers to update updated_at timestamps
CREATE TRIGGER IF NOT EXISTS update_workers_timestamp 
    AFTER UPDATE ON workers
    BEGIN
        UPDATE workers SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_repositories_timestamp 
    AFTER UPDATE ON repositories
    BEGIN
        UPDATE repositories SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_tasks_timestamp 
    AFTER UPDATE ON tasks
    BEGIN
        UPDATE tasks SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
