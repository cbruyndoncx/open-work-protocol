import Database from 'better-sqlite3';
export interface DatabaseConfig {
    path: string;
    readonly?: boolean;
    verbose?: boolean;
}
declare class DatabaseConnection {
    private db;
    private config;
    constructor(config: DatabaseConfig);
    connect(): Database.Database;
    private initializeSchema;
    getDatabase(): Database.Database;
    close(): void;
    transaction<T>(fn: (db: Database.Database) => T): T;
}
export declare function initializeDatabase(config: DatabaseConfig): DatabaseConnection;
export declare function getDatabase(): Database.Database;
export declare function closeDatabase(): void;
export declare function runTransaction<T>(fn: (db: Database.Database) => T): T;
export declare const defaultDatabaseConfig: DatabaseConfig;
export {};
//# sourceMappingURL=connection.d.ts.map