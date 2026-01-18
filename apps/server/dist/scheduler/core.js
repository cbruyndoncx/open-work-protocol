import { getDatabase, runTransaction } from '../database/connection.js';
import { nanoid } from 'nanoid';
export const defaultSchedulerConfig = {
    intervalMs: 30 * 1000, // 30 seconds
    leaseTimeoutHours: 4,
    workerTimeoutMinutes: 5,
};
export class Scheduler {
    config;
    intervalId = null;
    isRunning = false;
    constructor(config = defaultSchedulerConfig) {
        this.config = config;
    }
    start() {
        if (this.isRunning) {
            console.log('Scheduler is already running');
            return;
        }
        console.log('Starting OWP Pool scheduler...');
        this.isRunning = true;
        // Run initial cycle
        this.runCycle();
        // Schedule recurring cycles
        this.intervalId = setInterval(() => {
            this.runCycle();
        }, this.config.intervalMs);
        console.log(`Scheduler started with ${this.config.intervalMs}ms interval`);
    }
    stop() {
        if (!this.isRunning) {
            return;
        }
        console.log('Stopping OWP Pool scheduler...');
        this.isRunning = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        console.log('Scheduler stopped');
    }
    runCycle() {
        try {
            const stats = runTransaction((db) => {
                const cycleStats = {
                    expiredLeases: 0,
                    offlineWorkers: 0,
                    requeuedTasks: 0,
                    timestamp: new Date().toISOString(),
                };
                // 1. Clean up expired leases
                cycleStats.expiredLeases = this.cleanupExpiredLeases(db);
                // 2. Mark offline workers
                cycleStats.offlineWorkers = this.markOfflineWorkers(db);
                // 3. Requeue tasks from offline workers
                cycleStats.requeuedTasks = this.requeueTasksFromOfflineWorkers(db);
                return cycleStats;
            });
            if (stats.expiredLeases > 0 || stats.offlineWorkers > 0 || stats.requeuedTasks > 0) {
                console.log('Scheduler cycle completed:', stats);
            }
        }
        catch (error) {
            console.error('Scheduler cycle failed:', error);
        }
    }
    cleanupExpiredLeases(db) {
        // Find expired leases
        const expiredLeases = db.prepare(`
      SELECT tl.*, t.title
      FROM task_leases tl
      JOIN tasks t ON tl.task_id = t.id
      WHERE tl.lease_expires_at <= CURRENT_TIMESTAMP
    `).all();
        if (expiredLeases.length === 0) {
            return 0;
        }
        // Requeue tasks with expired leases
        for (const lease of expiredLeases) {
            // Update task status back to ready
            db.prepare(`
        UPDATE tasks 
        SET status = 'ready' 
        WHERE id = ? AND status = 'leased'
      `).run(lease.task_id);
            // Delete expired lease
            db.prepare(`
        DELETE FROM task_leases WHERE id = ?
      `).run(lease.id);
            // Log audit event
            db.prepare(`
        INSERT INTO audit_events (id, event_type, actor, target, details)
        VALUES (?, 'lease_expired', 'system', ?, ?)
      `).run(`ae_${nanoid()}`, lease.task_id, JSON.stringify({
                worker_id: lease.worker_id,
                expired_at: lease.lease_expires_at,
                task_title: lease.title
            }));
        }
        return expiredLeases.length;
    }
    markOfflineWorkers(db) {
        const timeoutThreshold = new Date(Date.now() - this.config.workerTimeoutMinutes * 60 * 1000).toISOString();
        // Find workers that haven't sent heartbeat recently
        const offlineWorkers = db.prepare(`
      SELECT id, name
      FROM workers
      WHERE (last_heartbeat IS NULL OR last_heartbeat < ?)
        AND status != 'paused'
    `).all(timeoutThreshold);
        if (offlineWorkers.length === 0) {
            return 0;
        }
        // Mark workers as paused (offline)
        for (const worker of offlineWorkers) {
            db.prepare(`
        UPDATE workers 
        SET status = 'paused' 
        WHERE id = ?
      `).run(worker.id);
            console.log(`Marked worker ${worker.name} (${worker.id}) as offline`);
        }
        return offlineWorkers.length;
    }
    requeueTasksFromOfflineWorkers(db) {
        // Find tasks assigned to offline/paused workers
        const tasksToRequeue = db.prepare(`
      SELECT tl.*, t.title, w.name as worker_name
      FROM task_leases tl
      JOIN tasks t ON tl.task_id = t.id
      JOIN workers w ON tl.worker_id = w.id
      WHERE w.status = 'paused'
        AND t.status IN ('leased', 'in_progress')
    `).all();
        if (tasksToRequeue.length === 0) {
            return 0;
        }
        // Requeue tasks
        for (const lease of tasksToRequeue) {
            // Update task status back to ready
            db.prepare(`
        UPDATE tasks 
        SET status = 'ready' 
        WHERE id = ?
      `).run(lease.task_id);
            // Delete lease
            db.prepare(`
        DELETE FROM task_leases WHERE id = ?
      `).run(lease.id);
            // Log audit event
            db.prepare(`
        INSERT INTO audit_events (id, event_type, actor, target, details)
        VALUES (?, 'task_requeued', 'system', ?, ?)
      `).run(`ae_${nanoid()}`, lease.task_id, JSON.stringify({
                reason: 'worker_offline',
                worker_id: lease.worker_id,
                worker_name: lease.worker_name,
                task_title: lease.title
            }));
            console.log(`Requeued task "${lease.title}" from offline worker ${lease.worker_name}`);
        }
        return tasksToRequeue.length;
    }
    // Get scheduler statistics
    getStats() {
        try {
            const db = getDatabase();
            const stats = db.prepare(`
        SELECT 
          (SELECT COUNT(*) FROM workers WHERE status != 'paused') as active_workers,
          (SELECT COUNT(*) FROM workers WHERE last_heartbeat > datetime('now', '-5 minutes')) as online_workers,
          (SELECT COUNT(*) FROM tasks WHERE status = 'ready') as ready_tasks,
          (SELECT COUNT(*) FROM tasks WHERE status = 'leased') as leased_tasks,
          (SELECT COUNT(*) FROM tasks WHERE status = 'in_progress') as in_progress_tasks,
          (SELECT COUNT(*) FROM task_leases WHERE lease_expires_at > CURRENT_TIMESTAMP) as active_leases
      `).get();
            return Object.assign({}, stats, {
                is_running: this.isRunning,
                config: this.config,
                last_cycle: new Date().toISOString()
            });
        }
        catch (error) {
            console.error('Failed to get scheduler stats:', error);
            return {
                error: 'Failed to get stats',
                is_running: this.isRunning
            };
        }
    }
}
// Global scheduler instance
let schedulerInstance = null;
export function getScheduler() {
    if (!schedulerInstance) {
        schedulerInstance = new Scheduler();
    }
    return schedulerInstance;
}
export function startScheduler(config) {
    const scheduler = getScheduler();
    if (config) {
        scheduler.stop();
        schedulerInstance = new Scheduler(config);
    }
    schedulerInstance.start();
    return schedulerInstance;
}
export function stopScheduler() {
    if (schedulerInstance) {
        schedulerInstance.stop();
    }
}
//# sourceMappingURL=core.js.map