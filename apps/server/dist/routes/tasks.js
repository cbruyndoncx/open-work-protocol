import { nanoid } from 'nanoid';
import { createHash } from 'crypto';
import { getDatabase } from '../database/connection.js';
export async function taskRoutes(fastify) {
    // Update task status
    fastify.post('/v1/tasks/:task_id/status', async (request, reply) => {
        const authHeader = request.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return reply.status(401).send({ error: 'unauthorized', message: 'Missing bearer token' });
        }
        const token = authHeader.substring(7);
        const tokenHash = createHash('sha256').update(token).digest('hex');
        const { task_id } = request.params;
        const body = request.body;
        try {
            const db = getDatabase();
            // Find worker by token
            const worker = db.prepare('SELECT id FROM workers WHERE token_hash = ?').get(tokenHash);
            if (!worker) {
                return reply.status(401).send({ error: 'unauthorized', message: 'Invalid token' });
            }
            // Verify worker has lease for this task
            const lease = db.prepare(`
        SELECT * FROM task_leases 
        WHERE task_id = ? AND worker_id = ? AND lease_expires_at > CURRENT_TIMESTAMP
      `).get(task_id, worker.id);
            if (!lease) {
                return reply.status(403).send({ error: 'forbidden', message: 'No active lease for this task' });
            }
            // Update task status
            db.prepare('UPDATE tasks SET status = ? WHERE id = ?').run(body.status, task_id);
            // Store artifact if provided
            if (body.artifact) {
                db.prepare(`
          INSERT OR REPLACE INTO task_artifacts (
            id, task_id, pr_url, commit_sha, patch_url, extra
          ) VALUES (?, ?, ?, ?, ?, ?)
        `).run(`ta_${nanoid()}`, task_id, body.artifact.pr_url || null, body.artifact.commit_sha || null, body.artifact.patch_url || null, body.artifact.extra ? JSON.stringify(body.artifact.extra) : null);
            }
            // Clean up lease if task is completed
            if (body.status === 'pr_opened' || body.status === 'merged') {
                db.prepare('DELETE FROM task_leases WHERE task_id = ?').run(task_id);
            }
            reply.send({ ok: true });
        }
        catch (error) {
            request.log.error({ error: String(error) }, 'Task status update failed');
            reply.status(500).send({ error: 'status_update_failed', message: 'Failed to update task status' });
        }
    });
}
//# sourceMappingURL=tasks.js.map