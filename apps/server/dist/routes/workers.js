import { nanoid } from 'nanoid';
import { createHash } from 'crypto';
import { getDatabase } from '../database/connection.js';
import { WorkerRegisterRequestSchema, WorkerHeartbeatRequestSchema } from '../validation/schemas.js';
import { handleError, formatError } from '../errors/handler.js';
export async function workerRoutes(fastify) {
    // Worker registration
    fastify.post('/v1/workers/register', async (request, reply) => {
        try {
            const validated = WorkerRegisterRequestSchema.parse(request.body);
            const db = getDatabase();
            const workerId = `w_${nanoid()}`;
            const token = nanoid(32);
            const tokenHash = createHash('sha256').update(token).digest('hex');
            db.prepare(`
        INSERT INTO workers (
          id, name, github_handle, skills, capacity_points, 
          max_concurrent_tasks, token_hash, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'idle')
      `).run(workerId, validated.name, validated.github_handle || null, JSON.stringify(validated.skills), validated.capacity_points, validated.max_concurrent_tasks, tokenHash);
            reply.status(201).send({
                worker_id: workerId,
                token: token
            });
        }
        catch (error) {
            const appError = handleError(error);
            request.log.error({ error: String(error) }, appError.message);
            reply.status(400).send(formatError(appError));
        }
    });
    // Worker heartbeat
    fastify.post('/v1/workers/heartbeat', async (request, reply) => {
        try {
            const authHeader = request.headers.authorization;
            if (!authHeader?.startsWith('Bearer ')) {
                return reply.status(401).send(formatError(new Error('Missing bearer token')));
            }
            const validated = WorkerHeartbeatRequestSchema.parse(request.body);
            const token = authHeader.substring(7);
            const tokenHash = createHash('sha256').update(token).digest('hex');
            const db = getDatabase();
            const worker = db.prepare('SELECT id FROM workers WHERE token_hash = ?').get(tokenHash);
            if (!worker) {
                return reply.status(401).send(formatError(new Error('Invalid token')));
            }
            db.prepare(`
        UPDATE workers 
        SET status = ?, last_heartbeat = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(validated.status, worker.id);
            reply.send({
                ok: true,
                server_time: new Date().toISOString()
            });
        }
        catch (error) {
            const appError = handleError(error);
            request.log.error({ error: String(error) }, appError.message);
            reply.status(400).send(formatError(appError));
        }
    });
    // Fetch work
    fastify.get('/v1/work', async (request, reply) => {
        try {
            const authHeader = request.headers.authorization;
            if (!authHeader?.startsWith('Bearer ')) {
                return reply.status(401).send(formatError(new Error('Missing bearer token')));
            }
            const token = authHeader.substring(7);
            const tokenHash = createHash('sha256').update(token).digest('hex');
            const db = getDatabase();
            // Find worker by token
            const worker = db.prepare(`
        SELECT id, name, skills, capacity_points, max_concurrent_tasks
        FROM workers WHERE token_hash = ?
      `).get(tokenHash);
            if (!worker) {
                return reply.status(401).send(formatError(new Error('Invalid token')));
            }
            // Find available tasks
            const tasks = db.prepare(`
        SELECT t.*, r.repo
        FROM tasks t
        JOIN repositories r ON t.repo_id = r.id
        LEFT JOIN task_leases tl ON t.id = tl.task_id AND tl.lease_expires_at > CURRENT_TIMESTAMP
        WHERE t.status = 'ready' AND tl.id IS NULL
        ORDER BY t.priority DESC, t.created_at ASC
        LIMIT 1
      `).all();
            const leases = [];
            if (tasks.length > 0) {
                const task = tasks[0];
                const leaseExpiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();
                // Create lease
                const leaseId = `l_${nanoid()}`;
                db.prepare(`
          INSERT INTO task_leases (id, task_id, worker_id, lease_expires_at)
          VALUES (?, ?, ?, ?)
        `).run(leaseId, task.id, worker.id, leaseExpiresAt);
                // Update task status
                db.prepare('UPDATE tasks SET status = ? WHERE id = ?').run('leased', task.id);
                leases.push({
                    task_id: task.id,
                    repo: task.repo,
                    title: task.title,
                    description: task.description,
                    estimate_points: task.estimate_points,
                    priority: task.priority,
                    area: task.area,
                    tier: task.tier,
                    required_skills: JSON.parse(task.required_skills || '[]'),
                    lease_expires_at: leaseExpiresAt
                });
            }
            reply.send({
                worker_id: worker.id,
                leases
            });
        }
        catch (error) {
            const appError = handleError(error);
            request.log.error({ error: String(error) }, appError.message);
            reply.status(400).send(formatError(appError));
        }
    });
}
//# sourceMappingURL=workers.js.map