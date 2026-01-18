import { nanoid } from 'nanoid';
import { getDatabase } from '../database/connection.js';
import { AdminRepoCreateRequestSchema, AdminTaskCreateRequestSchema } from '../validation/schemas.js';
import { handleError, formatError } from '../errors/handler.js';
export async function adminRoutes(fastify) {
    fastify.post('/v1/admin/repos', async (request, reply) => {
        try {
            const adminToken = request.headers['x-admin-token'];
            const expectedToken = process.env.OWP_ADMIN_TOKEN || 'dev-admin-token';
            if (!adminToken || adminToken !== expectedToken) {
                return reply.status(401).send(formatError(new Error('Invalid admin token')));
            }
            const validated = AdminRepoCreateRequestSchema.parse(request.body);
            const db = getDatabase();
            const repoId = `r_${nanoid()}`;
            db.prepare(`
        INSERT OR REPLACE INTO repositories (
          id, repo, max_open_prs, area_locks_enabled
        ) VALUES (?, ?, ?, ?)
      `).run(repoId, validated.repo, validated.max_open_prs, validated.area_locks_enabled ? 1 : 0);
            reply.status(201).send({
                ok: true,
                repo: validated.repo
            });
        }
        catch (error) {
            const appError = handleError(error);
            request.log.error({ error: String(error) }, appError.message);
            reply.status(400).send(formatError(appError));
        }
    });
    fastify.post('/v1/admin/tasks', async (request, reply) => {
        try {
            const adminToken = request.headers['x-admin-token'];
            const expectedToken = process.env.OWP_ADMIN_TOKEN || 'dev-admin-token';
            if (!adminToken || adminToken !== expectedToken) {
                return reply.status(401).send(formatError(new Error('Invalid admin token')));
            }
            const validated = AdminTaskCreateRequestSchema.parse(request.body);
            const db = getDatabase();
            const repository = db.prepare('SELECT id FROM repositories WHERE repo = ?').get(validated.repo);
            if (!repository) {
                throw new Error(`Repository '${validated.repo}' not found`);
            }
            const taskId = `t_${nanoid()}`;
            db.prepare(`
        INSERT INTO tasks (
          id, repo_id, title, description, estimate_points,
          priority, required_skills, area, tier, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ready')
      `).run(taskId, repository.id, validated.title, validated.description || null, validated.estimate_points, validated.priority, JSON.stringify(validated.required_skills), validated.area || null, validated.tier);
            reply.status(201).send({
                ok: true,
                task_id: taskId
            });
        }
        catch (error) {
            const appError = handleError(error);
            request.log.error({ error: String(error) }, appError.message);
            reply.status(400).send(formatError(appError));
        }
    });
    // Get system state
    fastify.get('/v1/admin/state', async (request, reply) => {
        try {
            const adminToken = request.headers['x-admin-token'];
            const expectedToken = process.env.OWP_ADMIN_TOKEN || 'dev-admin-token';
            if (!adminToken || adminToken !== expectedToken) {
                return reply.status(401).send(formatError(new Error('Invalid admin token')));
            }
            const db = getDatabase();
            const workersOnline = db.prepare(`
        SELECT COUNT(*) as count FROM workers
        WHERE last_heartbeat > datetime('now', '-5 minutes') AND status != 'paused'
      `).get();
            const tasksQueued = db.prepare(`
        SELECT COUNT(*) as count FROM tasks WHERE status = 'ready'
      `).get();
            const tasksInProgress = db.prepare(`
        SELECT COUNT(*) as count FROM tasks WHERE status IN ('leased', 'in_progress')
      `).get();
            const repositories = db.prepare(`
        SELECT r.repo, r.max_open_prs, COUNT(t.id) as current_open_prs
        FROM repositories r
        LEFT JOIN tasks t ON r.id = t.repo_id AND t.status = 'pr_opened'
        GROUP BY r.id, r.repo, r.max_open_prs
        ORDER BY r.repo
      `).all();
            reply.send({
                workers_online: workersOnline.count,
                tasks_queued: tasksQueued.count,
                tasks_in_progress: tasksInProgress.count,
                repositories: repositories.map((r) => ({
                    repo: r.repo,
                    max_open_prs: r.max_open_prs,
                    current_open_prs: r.current_open_prs
                }))
            });
        }
        catch (error) {
            const appError = handleError(error);
            request.log.error({ error: String(error) }, appError.message);
            reply.status(400).send(formatError(appError));
        }
    });
    // SSE endpoint for real-time state updates
    fastify.get('/v1/admin/state/stream', async (request, reply) => {
        const query = request.query;
        const adminToken = query.token || request.headers['x-admin-token'];
        const expectedToken = process.env.OWP_ADMIN_TOKEN || 'dev-admin-token';
        if (!adminToken || adminToken !== expectedToken) {
            return reply.status(401).send(formatError(new Error('Invalid admin token')));
        }
        reply.raw.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no'
        });
        const getState = () => {
            const db = getDatabase();
            const workersOnline = db.prepare(`
        SELECT COUNT(*) as count FROM workers
        WHERE last_heartbeat > datetime('now', '-5 minutes') AND status != 'paused'
      `).get();
            const tasksQueued = db.prepare(`
        SELECT COUNT(*) as count FROM tasks WHERE status = 'ready'
      `).get();
            const tasksInProgress = db.prepare(`
        SELECT COUNT(*) as count FROM tasks WHERE status IN ('leased', 'in_progress')
      `).get();
            const repositories = db.prepare(`
        SELECT r.repo, r.max_open_prs, COUNT(t.id) as current_open_prs
        FROM repositories r
        LEFT JOIN tasks t ON r.id = t.repo_id AND t.status = 'pr_opened'
        GROUP BY r.id, r.repo, r.max_open_prs
        ORDER BY r.repo
      `).all();
            return {
                workers_online: workersOnline.count,
                tasks_queued: tasksQueued.count,
                tasks_in_progress: tasksInProgress.count,
                repositories: repositories.map((r) => ({
                    repo: r.repo,
                    max_open_prs: r.max_open_prs,
                    current_open_prs: r.current_open_prs
                }))
            };
        };
        const sendState = () => {
            try {
                const state = getState();
                reply.raw.write(`data: ${JSON.stringify(state)}\n\n`);
            }
            catch (error) {
                request.log.error({ error: String(error) }, 'Error sending SSE state');
            }
        };
        // Send initial state
        sendState();
        // Send updates every 2 seconds
        const interval = setInterval(sendState, 2000);
        // Cleanup on disconnect
        request.raw.on('close', () => {
            clearInterval(interval);
            request.log.info('SSE client disconnected');
        });
    });
}
//# sourceMappingURL=admin.js.map