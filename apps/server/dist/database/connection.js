import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
class DatabaseConnection {
    db = null;
    config;
    constructor(config) {
        this.config = config;
    }
    connect() {
        if (this.db) {
            return this.db;
        }
        this.db = new Database(this.config.path, {
            readonly: this.config.readonly || false,
            verbose: this.config.verbose ? console.log : undefined,
        });
        // Enable foreign key constraints
        this.db.pragma('foreign_keys = ON');
        // Initialize schema if needed
        this.initializeSchema();
        return this.db;
    }
    initializeSchema() {
        if (!this.db)
            throw new Error('Database not connected');
        try {
            // Check if tables exist
            const tables = this.db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='workers'
      `).all();
            if (tables.length === 0) {
                console.log('Initializing database schema...');
                const schemaSQL = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
                this.db.exec(schemaSQL);
                console.log('Database schema initialized successfully');
            }
        }
        catch (error) {
            console.error('Failed to initialize database schema:', error);
            throw error;
        }
    }
    getDatabase() {
        if (!this.db) {
            throw new Error('Database not connected. Call connect() first.');
        }
        return this.db;
    }
    close() {
        if (this.db) {
            this.db.close();
            this.db = null;
        }
    }
    // Transaction helper
    transaction(fn) {
        const db = this.getDatabase();
        const transaction = db.transaction(fn);
        return transaction(db);
    }
}
// Singleton instance
let dbConnection = null;
export function initializeDatabase(config) {
    if (dbConnection) {
        dbConnection.close();
    }
    dbConnection = new DatabaseConnection(config);
    dbConnection.connect();
    return dbConnection;
}
export function getDatabase() {
    if (!dbConnection) {
        throw new Error('Database not initialized. Call initializeDatabase() first.');
    }
    return dbConnection.getDatabase();
}
export function closeDatabase() {
    if (dbConnection) {
        dbConnection.close();
        dbConnection = null;
    }
}
export function runTransaction(fn) {
    if (!dbConnection) {
        throw new Error('Database not initialized. Call initializeDatabase() first.');
    }
    return dbConnection.transaction(fn);
}
// Default configuration
export const defaultDatabaseConfig = {
    path: process.env.OWP_DB_PATH || './pool.db',
    readonly: false,
    verbose: process.env.NODE_ENV === 'development',
};
//# sourceMappingURL=connection.js.map