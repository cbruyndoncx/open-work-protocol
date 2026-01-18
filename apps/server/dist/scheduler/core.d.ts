export interface SchedulerConfig {
    intervalMs: number;
    leaseTimeoutHours: number;
    workerTimeoutMinutes: number;
}
export declare const defaultSchedulerConfig: SchedulerConfig;
export declare class Scheduler {
    private config;
    private intervalId;
    private isRunning;
    constructor(config?: SchedulerConfig);
    start(): void;
    stop(): void;
    private runCycle;
    private cleanupExpiredLeases;
    private markOfflineWorkers;
    private requeueTasksFromOfflineWorkers;
    getStats(): any;
}
export declare function getScheduler(): Scheduler;
export declare function startScheduler(config?: SchedulerConfig): Scheduler;
export declare function stopScheduler(): void;
//# sourceMappingURL=core.d.ts.map