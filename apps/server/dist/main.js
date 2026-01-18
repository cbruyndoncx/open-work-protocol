import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { initializeDatabase, closeDatabase, defaultDatabaseConfig } from './database/connection.js';
import { startScheduler, stopScheduler, getScheduler } from './scheduler/core.js';
import { workerRoutes } from './routes/workers.js';
import { taskRoutes } from './routes/tasks.js';
import { adminRoutes } from './routes/admin.js';
// Configuration
const config = {
    port: parseInt(process.env.OWP_PORT || '8787'),
    host: process.env.OWP_HOST || '0.0.0.0',
    database: {
        ...defaultDatabaseConfig,
        path: process.env.OWP_DB_PATH || './pool.db',
    },
    adminToken: process.env.OWP_ADMIN_TOKEN || 'dev-admin-token',
};
// Create Fastify instance
const fastify = Fastify({
    logger: {
        level: process.env.LOG_LEVEL || 'info'
    }
});
// Register plugins
await fastify.register(helmet, {
    contentSecurityPolicy: false,
});
await fastify.register(cors, {
    origin: true,
    credentials: true,
});
// Register route modules
await fastify.register(workerRoutes);
await fastify.register(taskRoutes);
await fastify.register(adminRoutes);
// Health check endpoint
fastify.get('/health', async () => {
    const scheduler = getScheduler();
    const stats = scheduler.getStats();
    return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '0.1.0',
        scheduler: {
            running: stats.is_running || false,
            active_workers: stats.active_workers || 0,
            ready_tasks: stats.ready_tasks || 0,
        }
    };
});
// API info endpoint
fastify.get('/v1', async () => {
    return {
        name: 'OWP Pool API',
        version: '0.1.0',
        description: 'Open Work Protocol scheduler and worker coordination API',
        endpoints: {
            workers: '/v1/workers/*',
            tasks: '/v1/tasks/*',
            admin: '/v1/admin/*',
        }
    };
});
// Error handler
fastify.setErrorHandler(async (error, request, reply) => {
    request.log.error(String(error));
    reply.status(500).send({
        error: 'internal_error',
        message: 'Internal server error',
        timestamp: new Date().toISOString(),
    });
});
// Graceful shutdown handler
async function gracefulShutdown(signal) {
    console.log(`\nReceived ${signal}, shutting down gracefully...`);
    try {
        stopScheduler();
        closeDatabase();
        await fastify.close();
        console.log('Server shut down successfully');
        process.exit(0);
    }
    catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
    }
}
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
// Start server
async function start() {
    try {
        console.log('Initializing database...');
        initializeDatabase(config.database);
        console.log('Database initialized successfully');
        console.log('Starting scheduler...');
        startScheduler();
        console.log('Scheduler started successfully');
        console.log(`Starting server on ${config.host}:${config.port}...`);
        await fastify.listen({
            port: config.port,
            host: config.host
        });
        console.log(`🚀 OWP Pool server running on http://${config.host}:${config.port}`);
        console.log(`📊 Health check: http://${config.host}:${config.port}/health`);
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}
start();
//# sourceMappingURL=main.js.map