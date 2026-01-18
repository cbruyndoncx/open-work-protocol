import { FastifyRequest, FastifyReply } from 'fastify';
export interface AuthenticatedWorkerRequest extends FastifyRequest {
    worker: {
        id: string;
        name: string;
        skills: string[];
        capacity_points: number;
        max_concurrent_tasks: number;
    };
}
export interface AuthenticatedAdminRequest extends FastifyRequest {
    admin: {
        authenticated: true;
    };
}
export declare function generateToken(): string;
export declare function hashToken(token: string): string;
export declare function authenticateWorker(request: FastifyRequest, reply: FastifyReply): Promise<void>;
export declare function authenticateAdmin(request: FastifyRequest, reply: FastifyReply): Promise<void>;
export declare function optionalWorkerAuth(request: FastifyRequest, reply: FastifyReply): Promise<void>;
export declare function isWorkerOnline(lastHeartbeat: string | null): boolean;
export declare function hasCapacity(workerId: string, maxConcurrentTasks: number): boolean;
//# sourceMappingURL=middleware.d.ts.map