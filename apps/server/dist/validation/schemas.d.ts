import { z } from 'zod';
export declare const WorkerRegisterRequestSchema: z.ZodObject<{
    name: z.ZodString;
    github_handle: z.ZodOptional<z.ZodString>;
    skills: z.ZodArray<z.ZodString, "many">;
    capacity_points: z.ZodDefault<z.ZodNumber>;
    max_concurrent_tasks: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name: string;
    skills: string[];
    capacity_points: number;
    max_concurrent_tasks: number;
    github_handle?: string | undefined;
}, {
    name: string;
    skills: string[];
    github_handle?: string | undefined;
    capacity_points?: number | undefined;
    max_concurrent_tasks?: number | undefined;
}>;
export declare const WorkerRegisterResponseSchema: z.ZodObject<{
    worker_id: z.ZodString;
    token: z.ZodString;
}, "strip", z.ZodTypeAny, {
    worker_id: string;
    token: string;
}, {
    worker_id: string;
    token: string;
}>;
export declare const WorkerHeartbeatRequestSchema: z.ZodObject<{
    status: z.ZodDefault<z.ZodEnum<["idle", "working", "offline"]>>;
    current_capacity: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    status: "idle" | "working" | "offline";
    current_capacity?: number | undefined;
}, {
    status?: "idle" | "working" | "offline" | undefined;
    current_capacity?: number | undefined;
}>;
export declare const WorkerHeartbeatResponseSchema: z.ZodObject<{
    ok: z.ZodBoolean;
    server_time: z.ZodString;
}, "strip", z.ZodTypeAny, {
    ok: boolean;
    server_time: string;
}, {
    ok: boolean;
    server_time: string;
}>;
export declare const TaskStatusUpdateRequestSchema: z.ZodObject<{
    status: z.ZodEnum<["in_progress", "completed", "failed"]>;
    message: z.ZodOptional<z.ZodString>;
    pr_url: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
}, "strip", z.ZodTypeAny, {
    status: "in_progress" | "completed" | "failed";
    message?: string | undefined;
    pr_url?: string | undefined;
}, {
    status: "in_progress" | "completed" | "failed";
    message?: string | undefined;
    pr_url?: string | undefined;
}>;
export declare const TaskStatusUpdateResponseSchema: z.ZodObject<{
    ok: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    ok: boolean;
}, {
    ok: boolean;
}>;
export declare const AdminRepoCreateRequestSchema: z.ZodObject<{
    repo: z.ZodString;
    max_open_prs: z.ZodDefault<z.ZodNumber>;
    area_locks_enabled: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    repo: string;
    max_open_prs: number;
    area_locks_enabled: boolean;
}, {
    repo: string;
    max_open_prs?: number | undefined;
    area_locks_enabled?: boolean | undefined;
}>;
export declare const AdminRepoCreateResponseSchema: z.ZodObject<{
    ok: z.ZodBoolean;
    repo: z.ZodString;
}, "strip", z.ZodTypeAny, {
    ok: boolean;
    repo: string;
}, {
    ok: boolean;
    repo: string;
}>;
export declare const AdminTaskCreateRequestSchema: z.ZodObject<{
    repo: z.ZodString;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    required_skills: z.ZodArray<z.ZodString, "many">;
    estimate_points: z.ZodDefault<z.ZodNumber>;
    priority: z.ZodDefault<z.ZodNumber>;
    area: z.ZodOptional<z.ZodString>;
    tier: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    repo: string;
    title: string;
    required_skills: string[];
    estimate_points: number;
    priority: number;
    tier: number;
    description?: string | undefined;
    area?: string | undefined;
}, {
    repo: string;
    title: string;
    required_skills: string[];
    description?: string | undefined;
    estimate_points?: number | undefined;
    priority?: number | undefined;
    area?: string | undefined;
    tier?: number | undefined;
}>;
export declare const AdminTaskCreateResponseSchema: z.ZodObject<{
    ok: z.ZodBoolean;
    task_id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    ok: boolean;
    task_id: string;
}, {
    ok: boolean;
    task_id: string;
}>;
export declare const WorkLeaseSchema: z.ZodObject<{
    task_id: z.ZodString;
    repo: z.ZodString;
    title: z.ZodString;
    description: z.ZodNullable<z.ZodString>;
    estimate_points: z.ZodNumber;
    priority: z.ZodNumber;
    area: z.ZodNullable<z.ZodString>;
    tier: z.ZodNumber;
    required_skills: z.ZodArray<z.ZodString, "many">;
    lease_expires_at: z.ZodString;
}, "strip", z.ZodTypeAny, {
    repo: string;
    title: string;
    description: string | null;
    required_skills: string[];
    estimate_points: number;
    priority: number;
    area: string | null;
    tier: number;
    task_id: string;
    lease_expires_at: string;
}, {
    repo: string;
    title: string;
    description: string | null;
    required_skills: string[];
    estimate_points: number;
    priority: number;
    area: string | null;
    tier: number;
    task_id: string;
    lease_expires_at: string;
}>;
export declare const WorkFetchResponseSchema: z.ZodObject<{
    worker_id: z.ZodString;
    leases: z.ZodArray<z.ZodObject<{
        task_id: z.ZodString;
        repo: z.ZodString;
        title: z.ZodString;
        description: z.ZodNullable<z.ZodString>;
        estimate_points: z.ZodNumber;
        priority: z.ZodNumber;
        area: z.ZodNullable<z.ZodString>;
        tier: z.ZodNumber;
        required_skills: z.ZodArray<z.ZodString, "many">;
        lease_expires_at: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        repo: string;
        title: string;
        description: string | null;
        required_skills: string[];
        estimate_points: number;
        priority: number;
        area: string | null;
        tier: number;
        task_id: string;
        lease_expires_at: string;
    }, {
        repo: string;
        title: string;
        description: string | null;
        required_skills: string[];
        estimate_points: number;
        priority: number;
        area: string | null;
        tier: number;
        task_id: string;
        lease_expires_at: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    worker_id: string;
    leases: {
        repo: string;
        title: string;
        description: string | null;
        required_skills: string[];
        estimate_points: number;
        priority: number;
        area: string | null;
        tier: number;
        task_id: string;
        lease_expires_at: string;
    }[];
}, {
    worker_id: string;
    leases: {
        repo: string;
        title: string;
        description: string | null;
        required_skills: string[];
        estimate_points: number;
        priority: number;
        area: string | null;
        tier: number;
        task_id: string;
        lease_expires_at: string;
    }[];
}>;
export declare const RepositoryStateSchema: z.ZodObject<{
    repo: z.ZodString;
    max_open_prs: z.ZodNumber;
    current_open_prs: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    repo: string;
    max_open_prs: number;
    current_open_prs: number;
}, {
    repo: string;
    max_open_prs: number;
    current_open_prs: number;
}>;
export declare const AdminStateResponseSchema: z.ZodObject<{
    workers_online: z.ZodNumber;
    tasks_queued: z.ZodNumber;
    tasks_in_progress: z.ZodNumber;
    repositories: z.ZodArray<z.ZodObject<{
        repo: z.ZodString;
        max_open_prs: z.ZodNumber;
        current_open_prs: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        repo: string;
        max_open_prs: number;
        current_open_prs: number;
    }, {
        repo: string;
        max_open_prs: number;
        current_open_prs: number;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    workers_online: number;
    tasks_queued: number;
    tasks_in_progress: number;
    repositories: {
        repo: string;
        max_open_prs: number;
        current_open_prs: number;
    }[];
}, {
    workers_online: number;
    tasks_queued: number;
    tasks_in_progress: number;
    repositories: {
        repo: string;
        max_open_prs: number;
        current_open_prs: number;
    }[];
}>;
export type WorkerRegisterRequest = z.infer<typeof WorkerRegisterRequestSchema>;
export type WorkerRegisterResponse = z.infer<typeof WorkerRegisterResponseSchema>;
export type WorkerHeartbeatRequest = z.infer<typeof WorkerHeartbeatRequestSchema>;
export type WorkerHeartbeatResponse = z.infer<typeof WorkerHeartbeatResponseSchema>;
export type TaskStatusUpdateRequest = z.infer<typeof TaskStatusUpdateRequestSchema>;
export type TaskStatusUpdateResponse = z.infer<typeof TaskStatusUpdateResponseSchema>;
export type AdminRepoCreateRequest = z.infer<typeof AdminRepoCreateRequestSchema>;
export type AdminRepoCreateResponse = z.infer<typeof AdminRepoCreateResponseSchema>;
export type AdminTaskCreateRequest = z.infer<typeof AdminTaskCreateRequestSchema>;
export type AdminTaskCreateResponse = z.infer<typeof AdminTaskCreateResponseSchema>;
export type WorkLease = z.infer<typeof WorkLeaseSchema>;
export type WorkFetchResponse = z.infer<typeof WorkFetchResponseSchema>;
export type RepositoryState = z.infer<typeof RepositoryStateSchema>;
export type AdminStateResponse = z.infer<typeof AdminStateResponseSchema>;
//# sourceMappingURL=schemas.d.ts.map