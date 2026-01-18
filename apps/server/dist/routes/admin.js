import { nanoid } from 'nanoid';
import { getDatabase, runTransaction } from '../database/connection.js';
export async function adminRoutes(fastify) {
    // Create repository
    fastify.post('/v1/admin/repos', async (request, reply) => {
        const adminToken = request.headers['x-admin-token'];
        const expectedToken = process.env.OWP_ADMIN_TOKEN || 'dev-admin-token';
        if (!adminToken || adminToken !== expectedToken) {
            return reply.status(401).send({ error: 'unauthorized', message: 'Invalid admin token' });
        }
        const body = request.body;
        const { repo, max_open_prs, area_locks_enabled } = body;
        try {
            const result = runTransaction((db) => {
                const repoId = `r_${nanoid()}`;
                db.prepare(`
          INSERT OR REPLACE INTO repositories (
            id, repo, max_open_prs, area_locks_enabled
          ) VALUES (?, ?, ?, ?)
        `).run(repoId, repo, max_open_prs || 3, area_locks_enabled !== false ? 1 : 0);
                return { repoId, repo };
            });
            reply.status(201).send({
                ok: true,
                repo: result.repo
            });
        }
        catch (error) {
            request.log.error({ error: String(error) }, 'Repository creation failed');
            reply.status(500).send({
                error: 'repo_creation_failed',
                message: 'Failed to create repository'
            });
        }
    });
    // Create task
    fastify.post('/v1/admin/tasks', async (request, reply) => {
        const adminToken = request.headers['x-admin-token'];
        const expectedToken = process.env.OWP_ADMIN_TOKEN || 'dev-admin-token';
        if (!adminToken || adminToken !== expectedToken) {
            return reply.status(401).send({ error: 'unauthorized', message: 'Invalid admin token' });
        }
        const body = request.body;
        const { repo, title, description, estimate_points, priority, required_skills, area, tier } = body;
        try {
            const result = runTransaction((db) => {
                // Find repository
                const repository = db.prepare('SELECT id FROM repositories WHERE repo = ?').get(repo);
                if (!repository) {
                    throw new Error(`Repository '${repo}' not found`);
                }
                const taskId = `t_${nanoid()}`;
                db.prepare(`
          INSERT INTO tasks (
            id, repo_id, title, description, estimate_points,
            priority, required_skills, area, tier, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ready')
        `).run(taskId, repository.id, title, description || null, estimate_points || 1, priority || 10, JSON.stringify(required_skills || []), area || null, tier || 0);
                return { taskId };
            });
            reply.status(201).send({
                ok: true,
                task_id: result.taskId
            });
        }
        catch (error) {
            request.log.error({ error: String(error) }, 'Task creation failed');
            if (error instanceof Error && error.message.includes('not found')) {
                return reply.status(400).send({
                    error: 'invalid_repo',
                    message: error.message
                });
            }
            reply.status(500).send({
                error: 'task_creation_failed',
                message: 'Failed to create task'
            });
        }
    });
    // Get system state
    fastify.get('/v1/admin/state', async (request, reply) => {
        const adminToken = request.headers['x-admin-token'];
        const expectedToken = process.env.OWP_ADMIN_TOKEN || 'dev-admin-token';
        if (!adminToken || adminToken !== expectedToken) {
            return reply.status(401).send({ error: 'unauthorized', message: 'Invalid admin token' });
        }
        try {
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
            request.log.error({ error: String(error) }, 'System state fetch failed');
            reply.status(500).send({
                error: 'state_fetch_failed',
                message: 'Failed to fetch system state'
            });
        }
    });
}
//# sourceMappingURL=admin.js.map