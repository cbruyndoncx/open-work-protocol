export declare const WorkerStatusSchema: {
    readonly type: "string";
    readonly enum: readonly ["idle", "working", "paused"];
    readonly description: "Current status of a worker";
};
export declare const TaskStatusSchema: {
    readonly type: "string";
    readonly enum: readonly ["ready", "leased", "in_progress", "blocked", "pr_opened", "merged"];
    readonly description: "Current status of a task";
};
export declare const TrustTierSchema: {
    readonly type: "string";
    readonly enum: readonly ["untrusted", "basic", "trusted", "maintainer"];
    readonly description: "Trust level for worker access control";
};
export declare const RegisterWorkerRequestSchema: {
    readonly type: "object";
    readonly required: readonly ["name", "skills", "capacity_points", "max_concurrent_tasks"];
    readonly properties: {
        readonly name: {
            readonly type: "string";
            readonly minLength: 1;
            readonly maxLength: 120;
            readonly description: "Human-readable worker name";
        };
        readonly github_handle: {
            readonly type: "string";
            readonly maxLength: 120;
            readonly nullable: true;
            readonly description: "GitHub username for attribution";
        };
        readonly skills: {
            readonly type: "array";
            readonly items: {
                readonly type: "string";
            };
            readonly description: "List of skills/technologies the worker can handle";
        };
        readonly capacity_points: {
            readonly type: "integer";
            readonly minimum: 1;
            readonly maximum: 100;
            readonly default: 5;
            readonly description: "Daily capacity in points";
        };
        readonly max_concurrent_tasks: {
            readonly type: "integer";
            readonly minimum: 1;
            readonly maximum: 20;
            readonly default: 2;
            readonly description: "Maximum number of concurrent task assignments";
        };
    };
};
export declare const RegisterWorkerResponseSchema: {
    readonly type: "object";
    readonly required: readonly ["worker_id", "token"];
    readonly properties: {
        readonly worker_id: {
            readonly type: "string";
            readonly description: "Unique worker identifier";
        };
        readonly token: {
            readonly type: "string";
            readonly description: "Bearer token for authentication";
        };
    };
};
export declare const HeartbeatRequestSchema: {
    readonly type: "object";
    readonly properties: {
        readonly status: {
            readonly $ref: "#/components/schemas/WorkerStatus";
            readonly default: "idle";
        };
        readonly note: {
            readonly type: "string";
            readonly maxLength: 500;
            readonly nullable: true;
            readonly description: "Optional status message";
        };
    };
};
export declare const HeartbeatResponseSchema: {
    readonly type: "object";
    readonly required: readonly ["ok", "server_time"];
    readonly properties: {
        readonly ok: {
            readonly type: "boolean";
            readonly default: true;
        };
        readonly server_time: {
            readonly type: "string";
            readonly format: "date-time";
            readonly description: "Current server timestamp";
        };
    };
};
export declare const TaskArtifactSchema: {
    readonly type: "object";
    readonly properties: {
        readonly pr_url: {
            readonly type: "string";
            readonly format: "uri";
            readonly nullable: true;
            readonly description: "GitHub PR URL";
        };
        readonly commit_sha: {
            readonly type: "string";
            readonly nullable: true;
            readonly description: "Git commit SHA";
        };
        readonly patch_url: {
            readonly type: "string";
            readonly format: "uri";
            readonly nullable: true;
            readonly description: "URL to patch file";
        };
        readonly extra: {
            readonly type: "object";
            readonly nullable: true;
            readonly additionalProperties: true;
            readonly description: "Additional artifact metadata";
        };
    };
};
export declare const LeaseViewSchema: {
    readonly type: "object";
    readonly required: readonly ["task_id", "repo", "title", "estimate_points", "priority", "required_skills", "lease_expires_at"];
    readonly properties: {
        readonly task_id: {
            readonly type: "string";
            readonly description: "Unique task identifier";
        };
        readonly repo: {
            readonly type: "string";
            readonly description: "Repository identifier";
        };
        readonly title: {
            readonly type: "string";
            readonly description: "Task title";
        };
        readonly description: {
            readonly type: "string";
            readonly nullable: true;
            readonly description: "Detailed task description";
        };
        readonly estimate_points: {
            readonly type: "integer";
            readonly minimum: 1;
            readonly maximum: 100;
            readonly description: "Estimated effort in points";
        };
        readonly priority: {
            readonly type: "integer";
            readonly minimum: 0;
            readonly maximum: 1000;
            readonly description: "Task priority (higher = more important)";
        };
        readonly area: {
            readonly type: "string";
            readonly maxLength: 120;
            readonly nullable: true;
            readonly description: "Code area for conflict avoidance";
        };
        readonly tier: {
            readonly type: "integer";
            readonly minimum: 0;
            readonly maximum: 3;
            readonly default: 0;
            readonly description: "Risk tier (0=safe, 3=high-risk)";
        };
        readonly required_skills: {
            readonly type: "array";
            readonly items: {
                readonly type: "string";
            };
            readonly description: "Required skills for this task";
        };
        readonly lease_expires_at: {
            readonly type: "string";
            readonly format: "date-time";
            readonly description: "When the lease expires";
        };
    };
};
export declare const WorkResponseSchema: {
    readonly type: "object";
    readonly required: readonly ["worker_id", "leases"];
    readonly properties: {
        readonly worker_id: {
            readonly type: "string";
            readonly description: "Worker identifier";
        };
        readonly leases: {
            readonly type: "array";
            readonly items: {
                readonly $ref: "#/components/schemas/LeaseView";
            };
            readonly description: "Assigned task leases";
        };
    };
};
export declare const TaskStatusUpdateRequestSchema: {
    readonly type: "object";
    readonly required: readonly ["status"];
    readonly properties: {
        readonly status: {
            readonly type: "string";
            readonly enum: readonly ["in_progress", "blocked", "pr_opened", "merged"];
            readonly description: "New task status";
        };
        readonly message: {
            readonly type: "string";
            readonly maxLength: 4000;
            readonly nullable: true;
            readonly description: "Optional status message";
        };
        readonly artifact: {
            readonly $ref: "#/components/schemas/TaskArtifact";
        };
    };
};
export declare const RepoCreateRequestSchema: {
    readonly type: "object";
    readonly required: readonly ["repo"];
    readonly properties: {
        readonly repo: {
            readonly type: "string";
            readonly minLength: 1;
            readonly maxLength: 200;
            readonly description: "Repository key (e.g. 'demo' or 'owner/name')";
        };
        readonly max_open_prs: {
            readonly type: "integer";
            readonly minimum: 0;
            readonly maximum: 100;
            readonly default: 3;
            readonly description: "Maximum open PRs (0 disables assignments)";
        };
        readonly area_locks_enabled: {
            readonly type: "boolean";
            readonly default: true;
            readonly description: "Enable area-based conflict prevention";
        };
    };
};
export declare const RepoCreateResponseSchema: {
    readonly type: "object";
    readonly required: readonly ["ok", "repo"];
    readonly properties: {
        readonly ok: {
            readonly type: "boolean";
            readonly default: true;
        };
        readonly repo: {
            readonly type: "string";
            readonly description: "Created repository identifier";
        };
    };
};
export declare const TaskCreateRequestSchema: {
    readonly type: "object";
    readonly required: readonly ["repo", "title"];
    readonly properties: {
        readonly repo: {
            readonly type: "string";
            readonly minLength: 1;
            readonly maxLength: 200;
            readonly description: "Repository identifier";
        };
        readonly title: {
            readonly type: "string";
            readonly minLength: 1;
            readonly maxLength: 300;
            readonly description: "Task title";
        };
        readonly description: {
            readonly type: "string";
            readonly nullable: true;
            readonly description: "Detailed task description";
        };
        readonly estimate_points: {
            readonly type: "integer";
            readonly minimum: 1;
            readonly maximum: 100;
            readonly default: 1;
            readonly description: "Estimated effort in points";
        };
        readonly priority: {
            readonly type: "integer";
            readonly minimum: 0;
            readonly maximum: 1000;
            readonly default: 10;
            readonly description: "Task priority (higher = more important)";
        };
        readonly required_skills: {
            readonly type: "array";
            readonly items: {
                readonly type: "string";
            };
            readonly description: "Required skills for this task";
        };
        readonly area: {
            readonly type: "string";
            readonly maxLength: 120;
            readonly nullable: true;
            readonly description: "Code area for conflict avoidance";
        };
        readonly tier: {
            readonly type: "integer";
            readonly minimum: 0;
            readonly maximum: 3;
            readonly default: 0;
            readonly description: "Risk tier (0=safe, 3=high-risk)";
        };
    };
};
export declare const TaskCreateResponseSchema: {
    readonly type: "object";
    readonly required: readonly ["ok", "task_id"];
    readonly properties: {
        readonly ok: {
            readonly type: "boolean";
            readonly default: true;
        };
        readonly task_id: {
            readonly type: "string";
            readonly description: "Created task identifier";
        };
    };
};
export declare const WorkerReputationSchema: {
    readonly type: "object";
    readonly required: readonly ["worker_id", "reputation_score", "trust_tier", "metrics"];
    readonly properties: {
        readonly worker_id: {
            readonly type: "string";
            readonly description: "Worker identifier";
        };
        readonly reputation_score: {
            readonly type: "number";
            readonly minimum: 0;
            readonly maximum: 100;
            readonly description: "Overall reputation score (0-100)";
        };
        readonly trust_tier: {
            readonly $ref: "#/components/schemas/TrustTier";
        };
        readonly metrics: {
            readonly type: "object";
            readonly required: readonly ["completion_rate", "avg_pr_quality", "on_time_delivery", "total_tasks"];
            readonly properties: {
                readonly completion_rate: {
                    readonly type: "number";
                    readonly minimum: 0;
                    readonly maximum: 1;
                    readonly description: "Percentage of tasks completed successfully";
                };
                readonly avg_pr_quality: {
                    readonly type: "number";
                    readonly minimum: 0;
                    readonly maximum: 5;
                    readonly description: "Average PR quality rating";
                };
                readonly on_time_delivery: {
                    readonly type: "number";
                    readonly minimum: 0;
                    readonly maximum: 1;
                    readonly description: "Percentage of tasks completed on time";
                };
                readonly total_tasks: {
                    readonly type: "integer";
                    readonly minimum: 0;
                    readonly description: "Total number of tasks completed";
                };
            };
        };
    };
};
export declare const TrustTierUpdateRequestSchema: {
    readonly type: "object";
    readonly required: readonly ["tier"];
    readonly properties: {
        readonly tier: {
            readonly $ref: "#/components/schemas/TrustTier";
        };
        readonly reason: {
            readonly type: "string";
            readonly maxLength: 500;
            readonly description: "Reason for trust tier change";
        };
    };
};
export declare const AnalyticsMetricsSchema: {
    readonly type: "object";
    readonly required: readonly ["repo", "period", "metrics"];
    readonly properties: {
        readonly repo: {
            readonly type: "string";
            readonly description: "Repository identifier";
        };
        readonly period: {
            readonly type: "string";
            readonly description: "Time period for metrics";
        };
        readonly metrics: {
            readonly type: "object";
            readonly required: readonly ["tasks_completed", "avg_completion_time", "worker_utilization", "pr_merge_rate"];
            readonly properties: {
                readonly tasks_completed: {
                    readonly type: "integer";
                    readonly minimum: 0;
                    readonly description: "Number of tasks completed in period";
                };
                readonly avg_completion_time: {
                    readonly type: "string";
                    readonly description: "Average time to complete tasks";
                };
                readonly worker_utilization: {
                    readonly type: "number";
                    readonly minimum: 0;
                    readonly maximum: 1;
                    readonly description: "Worker capacity utilization rate";
                };
                readonly pr_merge_rate: {
                    readonly type: "number";
                    readonly minimum: 0;
                    readonly maximum: 1;
                    readonly description: "Percentage of PRs that get merged";
                };
                readonly bottlenecks: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                    readonly description: "Identified system bottlenecks";
                };
            };
        };
    };
};
export declare const AuditEventSchema: {
    readonly type: "object";
    readonly required: readonly ["timestamp", "event_type", "actor", "target"];
    readonly properties: {
        readonly timestamp: {
            readonly type: "string";
            readonly format: "date-time";
            readonly description: "When the event occurred";
        };
        readonly event_type: {
            readonly type: "string";
            readonly enum: readonly ["task_assigned", "task_completed", "worker_registered", "repo_created", "trust_tier_changed"];
            readonly description: "Type of audit event";
        };
        readonly actor: {
            readonly type: "string";
            readonly description: "Who performed the action (worker_id, admin, system)";
        };
        readonly target: {
            readonly type: "string";
            readonly description: "What was affected (task_id, worker_id, repo)";
        };
        readonly details: {
            readonly type: "object";
            readonly additionalProperties: true;
            readonly description: "Additional event context";
        };
    };
};
export declare const GitHubSyncRequestSchema: {
    readonly type: "object";
    readonly required: readonly ["sync_type"];
    readonly properties: {
        readonly sync_type: {
            readonly type: "string";
            readonly enum: readonly ["read_only", "bidirectional"];
            readonly description: "Type of GitHub synchronization";
        };
        readonly write_permissions: {
            readonly type: "array";
            readonly items: {
                readonly type: "string";
                readonly enum: readonly ["comments", "labels", "status"];
            };
            readonly description: "Requested write permissions";
        };
    };
};
export declare const GitHubSyncResponseSchema: {
    readonly type: "object";
    readonly required: readonly ["webhook_url", "permissions_granted"];
    readonly properties: {
        readonly webhook_url: {
            readonly type: "string";
            readonly format: "uri";
            readonly description: "Webhook URL for GitHub integration";
        };
        readonly permissions_granted: {
            readonly type: "array";
            readonly items: {
                readonly type: "string";
            };
            readonly description: "Granted GitHub permissions";
        };
    };
};
export declare const ErrorResponseSchema: {
    readonly type: "object";
    readonly required: readonly ["error", "message"];
    readonly properties: {
        readonly error: {
            readonly type: "string";
            readonly description: "Error code identifier";
        };
        readonly message: {
            readonly type: "string";
            readonly description: "Human-readable error message";
        };
        readonly details: {
            readonly type: "object";
            readonly description: "Additional error context";
            readonly additionalProperties: true;
        };
    };
};
//# sourceMappingURL=schemas.gen.d.ts.map