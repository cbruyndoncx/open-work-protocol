import { z } from 'zod';

export const WorkerRegisterRequestSchema = z.object({
  name: z.string().min(1, 'Worker name is required'),
  github_handle: z.string().optional(),
  skills: z.array(z.string()).min(1, 'At least one skill is required'),
  capacity_points: z.number().int().min(1, 'Capacity must be at least 1').default(5),
  max_concurrent_tasks: z.number().int().min(1, 'Max concurrent tasks must be at least 1').default(2),
});

export const WorkerRegisterResponseSchema = z.object({
  worker_id: z.string(),
  token: z.string(),
});

export const WorkerHeartbeatRequestSchema = z.object({
  status: z.enum(['idle', 'working', 'offline']).default('idle'),
  current_capacity: z.number().int().min(0).optional(),
});

export const WorkerHeartbeatResponseSchema = z.object({
  ok: z.boolean(),
  server_time: z.string().datetime(),
});

export const TaskStatusUpdateRequestSchema = z.object({
  status: z.enum(['in_progress', 'completed', 'failed']),
  message: z.string().optional(),
  pr_url: z.string().url().refine(
    (url) => url.includes('github.com') || url.includes('gitlab.com'),
    { message: 'Must be a valid GitHub or GitLab PR URL' }
  ).optional(),
});

export const TaskStatusUpdateResponseSchema = z.object({
  ok: z.boolean(),
});

export const AdminRepoCreateRequestSchema = z.object({
  repo: z.string().min(1, 'Repository name is required'),
  max_open_prs: z.number().int().min(1, 'Max open PRs must be at least 1').default(3),
  area_locks_enabled: z.boolean().default(true),
});

export const AdminRepoCreateResponseSchema = z.object({
  ok: z.boolean(),
  repo: z.string(),
});

export const AdminTaskCreateRequestSchema = z.object({
  repo: z.string().min(1, 'Repository is required'),
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional(),
  required_skills: z.array(z.string()).min(1, 'At least one required skill'),
  estimate_points: z.number().int().min(1, 'Estimate must be at least 1').default(2),
  priority: z.number().int().min(0).max(10).default(5),
  area: z.string().optional(),
  tier: z.number().int().min(0).max(3).default(0),
});

export const AdminTaskCreateResponseSchema = z.object({
  ok: z.boolean(),
  task_id: z.string(),
});

export const WorkLeaseSchema = z.object({
  task_id: z.string(),
  repo: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  estimate_points: z.number(),
  priority: z.number(),
  area: z.string().nullable(),
  tier: z.number(),
  required_skills: z.array(z.string()),
  lease_expires_at: z.string().datetime(),
});

export const WorkFetchResponseSchema = z.object({
  worker_id: z.string(),
  leases: z.array(WorkLeaseSchema),
});

export const RepositoryStateSchema = z.object({
  repo: z.string(),
  max_open_prs: z.number(),
  current_open_prs: z.number(),
});

export const AdminStateResponseSchema = z.object({
  workers_online: z.number(),
  tasks_queued: z.number(),
  tasks_in_progress: z.number(),
  repositories: z.array(RepositoryStateSchema),
});

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
