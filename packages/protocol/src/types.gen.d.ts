/**
 * Current status of a worker
 */
export type WorkerStatus = 'idle' | 'working' | 'paused';
/**
 * Current status of a task
 */
export type TaskStatus = 'ready' | 'leased' | 'in_progress' | 'blocked' | 'pr_opened' | 'merged';
/**
 * Trust level for worker access control
 */
export type TrustTier = 'untrusted' | 'basic' | 'trusted' | 'maintainer';
export type RegisterWorkerRequest = {
    /**
     * Human-readable worker name
     */
    name: string;
    /**
     * GitHub username for attribution
     */
    github_handle?: (string) | null;
    /**
     * List of skills/technologies the worker can handle
     */
    skills: Array<(string)>;
    /**
     * Daily capacity in points
     */
    capacity_points: number;
    /**
     * Maximum number of concurrent task assignments
     */
    max_concurrent_tasks: number;
};
export type RegisterWorkerResponse = {
    /**
     * Unique worker identifier
     */
    worker_id: string;
    /**
     * Bearer token for authentication
     */
    token: string;
};
export type HeartbeatRequest = {
    status?: WorkerStatus;
    /**
     * Optional status message
     */
    note?: (string) | null;
};
export type HeartbeatResponse = {
    ok: boolean;
    /**
     * Current server timestamp
     */
    server_time: string;
};
export type TaskArtifact = {
    /**
     * GitHub PR URL
     */
    pr_url?: (string) | null;
    /**
     * Git commit SHA
     */
    commit_sha?: (string) | null;
    /**
     * URL to patch file
     */
    patch_url?: (string) | null;
    /**
     * Additional artifact metadata
     */
    extra?: {
        [key: string]: unknown;
    } | null;
};
export type LeaseView = {
    /**
     * Unique task identifier
     */
    task_id: string;
    /**
     * Repository identifier
     */
    repo: string;
    /**
     * Task title
     */
    title: string;
    /**
     * Detailed task description
     */
    description?: (string) | null;
    /**
     * Estimated effort in points
     */
    estimate_points: number;
    /**
     * Task priority (higher = more important)
     */
    priority: number;
    /**
     * Code area for conflict avoidance
     */
    area?: (string) | null;
    /**
     * Risk tier (0=safe, 3=high-risk)
     */
    tier?: number;
    /**
     * Required skills for this task
     */
    required_skills: Array<(string)>;
    /**
     * When the lease expires
     */
    lease_expires_at: string;
};
export type WorkResponse = {
    /**
     * Worker identifier
     */
    worker_id: string;
    /**
     * Assigned task leases
     */
    leases: Array<LeaseView>;
};
export type TaskStatusUpdateRequest = {
    /**
     * New task status
     */
    status: 'in_progress' | 'blocked' | 'pr_opened' | 'merged';
    /**
     * Optional status message
     */
    message?: (string) | null;
    artifact?: TaskArtifact;
};
/**
 * New task status
 */
export type status = 'in_progress' | 'blocked' | 'pr_opened' | 'merged';
export type RepoCreateRequest = {
    /**
     * Repository key (e.g. 'demo' or 'owner/name')
     */
    repo: string;
    /**
     * Maximum open PRs (0 disables assignments)
     */
    max_open_prs?: number;
    /**
     * Enable area-based conflict prevention
     */
    area_locks_enabled?: boolean;
};
export type RepoCreateResponse = {
    ok: boolean;
    /**
     * Created repository identifier
     */
    repo: string;
};
export type TaskCreateRequest = {
    /**
     * Repository identifier
     */
    repo: string;
    /**
     * Task title
     */
    title: string;
    /**
     * Detailed task description
     */
    description?: (string) | null;
    /**
     * Estimated effort in points
     */
    estimate_points?: number;
    /**
     * Task priority (higher = more important)
     */
    priority?: number;
    /**
     * Required skills for this task
     */
    required_skills?: Array<(string)>;
    /**
     * Code area for conflict avoidance
     */
    area?: (string) | null;
    /**
     * Risk tier (0=safe, 3=high-risk)
     */
    tier?: number;
};
export type TaskCreateResponse = {
    ok: boolean;
    /**
     * Created task identifier
     */
    task_id: string;
};
export type WorkerReputation = {
    /**
     * Worker identifier
     */
    worker_id: string;
    /**
     * Overall reputation score (0-100)
     */
    reputation_score: number;
    trust_tier: TrustTier;
    metrics: {
        /**
         * Percentage of tasks completed successfully
         */
        completion_rate: number;
        /**
         * Average PR quality rating
         */
        avg_pr_quality: number;
        /**
         * Percentage of tasks completed on time
         */
        on_time_delivery: number;
        /**
         * Total number of tasks completed
         */
        total_tasks: number;
    };
};
export type TrustTierUpdateRequest = {
    tier: TrustTier;
    /**
     * Reason for trust tier change
     */
    reason?: string;
};
export type AnalyticsMetrics = {
    /**
     * Repository identifier
     */
    repo: string;
    /**
     * Time period for metrics
     */
    period: string;
    metrics: {
        /**
         * Number of tasks completed in period
         */
        tasks_completed: number;
        /**
         * Average time to complete tasks
         */
        avg_completion_time: string;
        /**
         * Worker capacity utilization rate
         */
        worker_utilization: number;
        /**
         * Percentage of PRs that get merged
         */
        pr_merge_rate: number;
        /**
         * Identified system bottlenecks
         */
        bottlenecks?: Array<(string)>;
    };
};
export type AuditEvent = {
    /**
     * When the event occurred
     */
    timestamp: string;
    /**
     * Type of audit event
     */
    event_type: 'task_assigned' | 'task_completed' | 'worker_registered' | 'repo_created' | 'trust_tier_changed';
    /**
     * Who performed the action (worker_id, admin, system)
     */
    actor: string;
    /**
     * What was affected (task_id, worker_id, repo)
     */
    target: string;
    /**
     * Additional event context
     */
    details?: {
        [key: string]: unknown;
    };
};
/**
 * Type of audit event
 */
export type event_type = 'task_assigned' | 'task_completed' | 'worker_registered' | 'repo_created' | 'trust_tier_changed';
export type GitHubSyncRequest = {
    /**
     * Type of GitHub synchronization
     */
    sync_type: 'read_only' | 'bidirectional';
    /**
     * Requested write permissions
     */
    write_permissions?: Array<('comments' | 'labels' | 'status')>;
};
/**
 * Type of GitHub synchronization
 */
export type sync_type = 'read_only' | 'bidirectional';
export type GitHubSyncResponse = {
    /**
     * Webhook URL for GitHub integration
     */
    webhook_url: string;
    /**
     * Granted GitHub permissions
     */
    permissions_granted: Array<(string)>;
};
export type ErrorResponse = {
    /**
     * Error code identifier
     */
    error: string;
    /**
     * Human-readable error message
     */
    message: string;
    /**
     * Additional error context
     */
    details?: {
        [key: string]: unknown;
    };
};
export type RegisterWorkerData = {
    body: RegisterWorkerRequest;
};
export type RegisterWorkerResponse2 = (RegisterWorkerResponse);
export type RegisterWorkerError = (ErrorResponse);
export type WorkerHeartbeatData = {
    body: HeartbeatRequest;
};
export type WorkerHeartbeatResponse = (HeartbeatResponse);
export type WorkerHeartbeatError = (ErrorResponse);
export type FetchWorkResponse = (WorkResponse);
export type FetchWorkError = (ErrorResponse);
export type UpdateTaskStatusData = {
    body: TaskStatusUpdateRequest;
    path: {
        /**
         * Task identifier
         */
        task_id: string;
    };
};
export type UpdateTaskStatusResponse = ({
    ok?: boolean;
});
export type UpdateTaskStatusError = (ErrorResponse);
export type CreateRepoData = {
    body: RepoCreateRequest;
};
export type CreateRepoResponse = (RepoCreateResponse);
export type CreateRepoError = (ErrorResponse);
export type CreateTaskData = {
    body: TaskCreateRequest;
};
export type CreateTaskResponse = (TaskCreateResponse);
export type CreateTaskError = (ErrorResponse);
export type GetSystemStateResponse = ({
    /**
     * Number of active workers
     */
    workers_online?: number;
    /**
     * Number of tasks waiting for assignment
     */
    tasks_queued?: number;
    /**
     * Number of tasks currently being worked on
     */
    tasks_in_progress?: number;
    repositories?: Array<{
        repo?: string;
        max_open_prs?: number;
        current_open_prs?: number;
    }>;
});
export type GetSystemStateError = (ErrorResponse);
export type GetWorkerReputationData = {
    path: {
        /**
         * Worker identifier
         */
        worker_id: string;
    };
};
export type GetWorkerReputationResponse = (WorkerReputation);
export type GetWorkerReputationError = (ErrorResponse);
export type UpdateWorkerTrustTierData = {
    body: TrustTierUpdateRequest;
    path: {
        /**
         * Worker identifier
         */
        worker_id: string;
    };
};
export type UpdateWorkerTrustTierResponse = ({
    ok?: boolean;
});
export type UpdateWorkerTrustTierError = (ErrorResponse);
export type GetRepositoryAnalyticsData = {
    path: {
        /**
         * Repository identifier
         */
        repo: string;
    };
    query?: {
        /**
         * Time period for analytics
         */
        period?: 'last_7_days' | 'last_30_days' | 'last_90_days';
    };
};
export type GetRepositoryAnalyticsResponse = (AnalyticsMetrics);
export type GetRepositoryAnalyticsError = (ErrorResponse);
export type GetAuditEventsData = {
    query?: {
        /**
         * Filter by actor
         */
        actor?: string;
        /**
         * Filter by event type
         */
        event_type?: string;
        /**
         * Maximum number of events to return
         */
        limit?: number;
        /**
         * Number of events to skip
         */
        offset?: number;
    };
};
export type GetAuditEventsResponse = ({
    events?: Array<AuditEvent>;
    /**
     * Total number of events matching filter
     */
    total?: number;
});
export type GetAuditEventsError = (ErrorResponse);
export type ConfigureGitHubSyncData = {
    body: GitHubSyncRequest;
    path: {
        /**
         * GitHub repository owner
         */
        owner: string;
        /**
         * GitHub repository name
         */
        repo: string;
    };
};
export type ConfigureGitHubSyncResponse = (GitHubSyncResponse);
export type ConfigureGitHubSyncError = (ErrorResponse);
export type $OpenApiTs = {
    '/v1/workers/register': {
        post: {
            req: RegisterWorkerData;
            res: {
                /**
                 * Worker registered successfully
                 */
                '201': RegisterWorkerResponse;
                /**
                 * Invalid request data
                 */
                '400': ErrorResponse;
                /**
                 * Internal server error
                 */
                '500': ErrorResponse;
            };
        };
    };
    '/v1/workers/heartbeat': {
        post: {
            req: WorkerHeartbeatData;
            res: {
                /**
                 * Heartbeat received successfully
                 */
                '200': HeartbeatResponse;
                /**
                 * Invalid or missing authentication token
                 */
                '401': ErrorResponse;
                /**
                 * Internal server error
                 */
                '500': ErrorResponse;
            };
        };
    };
    '/v1/work': {
        get: {
            res: {
                /**
                 * Available work assignments
                 */
                '200': WorkResponse;
                /**
                 * Invalid or missing authentication token
                 */
                '401': ErrorResponse;
                /**
                 * Internal server error
                 */
                '500': ErrorResponse;
            };
        };
    };
    '/v1/tasks/{task_id}/status': {
        post: {
            req: UpdateTaskStatusData;
            res: {
                /**
                 * Task status updated successfully
                 */
                '200': {
                    ok?: boolean;
                };
                /**
                 * Invalid request data or task state
                 */
                '400': ErrorResponse;
                /**
                 * Invalid or missing authentication token
                 */
                '401': ErrorResponse;
                /**
                 * Not authorized to update this task
                 */
                '403': ErrorResponse;
                /**
                 * Task not found
                 */
                '404': ErrorResponse;
                /**
                 * Internal server error
                 */
                '500': ErrorResponse;
            };
        };
    };
    '/v1/admin/repos': {
        post: {
            req: CreateRepoData;
            res: {
                /**
                 * Repository created successfully
                 */
                '201': RepoCreateResponse;
                /**
                 * Invalid request data
                 */
                '400': ErrorResponse;
                /**
                 * Invalid or missing admin token
                 */
                '401': ErrorResponse;
                /**
                 * Internal server error
                 */
                '500': ErrorResponse;
            };
        };
    };
    '/v1/admin/tasks': {
        post: {
            req: CreateTaskData;
            res: {
                /**
                 * Task created successfully
                 */
                '201': TaskCreateResponse;
                /**
                 * Invalid request data
                 */
                '400': ErrorResponse;
                /**
                 * Invalid or missing admin token
                 */
                '401': ErrorResponse;
                /**
                 * Internal server error
                 */
                '500': ErrorResponse;
            };
        };
    };
    '/v1/admin/state': {
        get: {
            res: {
                /**
                 * System state retrieved successfully
                 */
                '200': {
                    /**
                     * Number of active workers
                     */
                    workers_online?: number;
                    /**
                     * Number of tasks waiting for assignment
                     */
                    tasks_queued?: number;
                    /**
                     * Number of tasks currently being worked on
                     */
                    tasks_in_progress?: number;
                    repositories?: Array<{
                        repo?: string;
                        max_open_prs?: number;
                        current_open_prs?: number;
                    }>;
                };
                /**
                 * Invalid or missing admin token
                 */
                '401': ErrorResponse;
                /**
                 * Internal server error
                 */
                '500': ErrorResponse;
            };
        };
    };
    '/v1/workers/{worker_id}/reputation': {
        get: {
            req: GetWorkerReputationData;
            res: {
                /**
                 * Worker reputation retrieved successfully
                 */
                '200': WorkerReputation;
                /**
                 * Invalid or missing admin token
                 */
                '401': ErrorResponse;
                /**
                 * Worker not found
                 */
                '404': ErrorResponse;
                /**
                 * Internal server error
                 */
                '500': ErrorResponse;
            };
        };
    };
    '/v1/workers/{worker_id}/trust-tier': {
        post: {
            req: UpdateWorkerTrustTierData;
            res: {
                /**
                 * Trust tier updated successfully
                 */
                '200': {
                    ok?: boolean;
                };
                /**
                 * Invalid request data
                 */
                '400': ErrorResponse;
                /**
                 * Invalid or missing admin token
                 */
                '401': ErrorResponse;
                /**
                 * Worker not found
                 */
                '404': ErrorResponse;
                /**
                 * Internal server error
                 */
                '500': ErrorResponse;
            };
        };
    };
    '/v1/analytics/repositories/{repo}': {
        get: {
            req: GetRepositoryAnalyticsData;
            res: {
                /**
                 * Repository analytics retrieved successfully
                 */
                '200': AnalyticsMetrics;
                /**
                 * Invalid or missing admin token
                 */
                '401': ErrorResponse;
                /**
                 * Repository not found
                 */
                '404': ErrorResponse;
                /**
                 * Internal server error
                 */
                '500': ErrorResponse;
            };
        };
    };
    '/v1/audit/events': {
        get: {
            req: GetAuditEventsData;
            res: {
                /**
                 * Audit events retrieved successfully
                 */
                '200': {
                    events?: Array<AuditEvent>;
                    /**
                     * Total number of events matching filter
                     */
                    total?: number;
                };
                /**
                 * Invalid or missing admin token
                 */
                '401': ErrorResponse;
                /**
                 * Internal server error
                 */
                '500': ErrorResponse;
            };
        };
    };
    '/v1/github/repos/{owner}/{repo}/sync': {
        post: {
            req: ConfigureGitHubSyncData;
            res: {
                /**
                 * GitHub integration configured successfully
                 */
                '200': GitHubSyncResponse;
                /**
                 * Invalid request data
                 */
                '400': ErrorResponse;
                /**
                 * Invalid or missing admin token
                 */
                '401': ErrorResponse;
                /**
                 * Internal server error
                 */
                '500': ErrorResponse;
            };
        };
    };
};
//# sourceMappingURL=types.gen.d.ts.map