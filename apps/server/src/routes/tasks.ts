import { FastifyInstance } from 'fastify';
import { nanoid } from 'nanoid';
import { createHash } from 'crypto';
import { getDatabase } from '../database/connection.js';
import { TaskStatusUpdateRequestSchema } from '../validation/schemas.js';
import { handleError, formatError } from '../errors/handler.js';

export async function taskRoutes(fastify: FastifyInstance) {
  fastify.post('/v1/tasks/:task_id/status', async (request, reply) => {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return reply.status(401).send(formatError(new Error('Missing bearer token')));
      }

      const validated = TaskStatusUpdateRequestSchema.parse(request.body);
      const token = authHeader.substring(7);
      const tokenHash = createHash('sha256').update(token).digest('hex');
      const { task_id } = request.params as any;
      const db = getDatabase();
      
      const worker = db.prepare('SELECT id FROM workers WHERE token_hash = ?').get(tokenHash) as any;
      if (!worker) {
        return reply.status(401).send(formatError(new Error('Invalid token')));
      }

      const lease = db.prepare(`
        SELECT * FROM task_leases 
        WHERE task_id = ? AND worker_id = ? AND lease_expires_at > CURRENT_TIMESTAMP
      `).get(task_id, worker.id);

      if (!lease) {
        return reply.status(403).send(formatError(new Error('No active lease for this task')));
      }

      db.prepare('UPDATE tasks SET status = ? WHERE id = ?').run(validated.status, task_id);

      if (validated.pr_url) {
        db.prepare(`
          INSERT OR REPLACE INTO task_artifacts (
            id, task_id, pr_url, extra
          ) VALUES (?, ?, ?, ?)
        `).run(
          `ta_${nanoid()}`,
          task_id,
          validated.pr_url,
          JSON.stringify({ message: validated.message })
        );
      }

      if (validated.status === 'completed' || validated.status === 'failed') {
        db.prepare('DELETE FROM task_leases WHERE task_id = ?').run(task_id);
      }

      reply.send({ ok: true });

    } catch (error) {
      const appError = handleError(error);
      request.log.error({ error: String(error) }, appError.message);
      reply.status(400).send(formatError(appError));
    }
  });
}
