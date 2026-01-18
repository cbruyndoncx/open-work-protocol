import { createHash, randomBytes } from 'crypto';
import { getDatabase } from '../database/connection.js';
// Generate secure token
export function generateToken() {
    return randomBytes(32).toString('hex');
}
// Hash token for storage
export function hashToken(token) {
    return createHash('sha256').update(token).digest('hex');
}
// Worker authentication middleware
export async function authenticateWorker(request, reply) {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return reply.status(401).send({
            error: 'unauthorized',
            message: 'Missing or invalid authorization header'
        });
    }
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const tokenHash = hashToken(token);
    try {
        const db = getDatabase();
        const worker = db.prepare(`
      SELECT id, name, skills, capacity_points, max_concurrent_tasks
      FROM workers 
      WHERE token_hash = ? AND status != 'paused'
    `).get(tokenHash);
        if (!worker) {
            return reply.status(401).send({
                error: 'unauthorized',
                message: 'Invalid or expired token'
            });
        }
        // Parse skills JSON
        worker.skills = JSON.parse(worker.skills);
        // Attach worker info to request
        request.worker = worker;
        // Update last heartbeat
        db.prepare(`
      UPDATE workers 
      SET last_heartbeat = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(worker.id);
    }
    catch (error) {
        request.log.error('Authentication error:', String(error));
        return reply.status(500).send({
            error: 'internal_error',
            message: 'Authentication failed'
        });
    }
}
// Admin authentication middleware
export async function authenticateAdmin(request, reply) {
    const adminToken = request.headers['x-admin-token'];
    const expectedToken = process.env.OWP_ADMIN_TOKEN;
    if (!expectedToken) {
        request.log.error('OWP_ADMIN_TOKEN environment variable not set');
        return reply.status(500).send({
            error: 'configuration_error',
            message: 'Admin authentication not configured'
        });
    }
    if (!adminToken) {
        return reply.status(401).send({
            error: 'unauthorized',
            message: 'Missing X-Admin-Token header'
        });
    }
    if (adminToken !== expectedToken) {
        return reply.status(401).send({
            error: 'unauthorized',
            message: 'Invalid admin token'
        });
    }
    // Attach admin info to request
    request.admin = { authenticated: true };
}
// Optional worker authentication (for endpoints that work with or without auth)
export async function optionalWorkerAuth(request, reply) {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // No authentication provided, continue without worker info
        return;
    }
    try {
        await authenticateWorker(request, reply);
    }
    catch (error) {
        // Authentication failed, but it's optional, so continue
        request.log.warn('Optional worker authentication failed:', String(error));
    }
}
// Check if worker is online (recent heartbeat)
export function isWorkerOnline(lastHeartbeat) {
    if (!lastHeartbeat)
        return false;
    const heartbeatTime = new Date(lastHeartbeat).getTime();
    const now = Date.now();
    const fiveMinutesAgo = now - (5 * 60 * 1000); // 5 minutes in milliseconds
    return heartbeatTime > fiveMinutesAgo;
}
// Validate worker has capacity for new tasks
export function hasCapacity(workerId, maxConcurrentTasks) {
    try {
        const db = getDatabase();
        const activeLeases = db.prepare(`
      SELECT COUNT(*) as count
      FROM task_leases tl
      JOIN tasks t ON tl.task_id = t.id
      WHERE tl.worker_id = ? 
        AND tl.lease_expires_at > CURRENT_TIMESTAMP
        AND t.status IN ('leased', 'in_progress')
    `).get(workerId);
        return activeLeases.count < maxConcurrentTasks;
    }
    catch (error) {
        console.error('Error checking worker capacity:', error);
        return false;
    }
}
//# sourceMappingURL=middleware.js.map