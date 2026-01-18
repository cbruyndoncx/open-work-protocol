import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface DatabaseConfig {
  path: string;
  readonly?: boolean;
  verbose?: boolean;
}

class DatabaseConnection {
  private db: Database.Database | null = null;
  private config: DatabaseConfig;

  constructor(config: DatabaseConfig) {
    this.config = config;
  }

  connect(): Database.Database {
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

  private initializeSchema(): void {
    if (!this.db) throw new Error('Database not connected');

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
    } catch (error) {
      console.error('Failed to initialize database schema:', error);
      throw error;
    }
  }

  getDatabase(): Database.Database {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.db;
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  // Transaction helper
  transaction<T>(fn: (db: Database.Database) => T): T {
    const db = this.getDatabase();
    const transaction = db.transaction(fn);
    return transaction(db);
  }
}

// Singleton instance
let dbConnection: DatabaseConnection | null = null;

export function initializeDatabase(config: DatabaseConfig): DatabaseConnection {
  if (dbConnection) {
    dbConnection.close();
  }
  
  dbConnection = new DatabaseConnection(config);
  dbConnection.connect();
  
  return dbConnection;
}

export function getDatabase(): Database.Database {
  if (!dbConnection) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return dbConnection.getDatabase();
}

export function closeDatabase(): void {
  if (dbConnection) {
    dbConnection.close();
    dbConnection = null;
  }
}

export function runTransaction<T>(fn: (db: Database.Database) => T): T {
  if (!dbConnection) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return dbConnection.transaction(fn);
}

// Default configuration
export const defaultDatabaseConfig: DatabaseConfig = {
  path: process.env.OWP_DB_PATH || './pool.db',
  readonly: false,
  verbose: process.env.NODE_ENV === 'development',
};
