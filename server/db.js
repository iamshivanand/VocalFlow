import pg from 'pg';
import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isPostgres = !!process.env.DATABASE_URL;

let pgPool = null;
let sqliteDb = null;

if (isPostgres) {
  console.log('🐘 Initializing PostgreSQL connection from DATABASE_URL...');
  pgPool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });
} else {
  console.log('📦 No DATABASE_URL provided. Using local SQLite database (server/vocalflow.db)...');
  const dbPath = path.join(__dirname, 'vocalflow.db');
  sqliteDb = new sqlite3.Database(dbPath);
}

// Unified query wrapper
export async function query(sql, params = []) {
  if (isPostgres) {
    // Postgres uses $1, $2 instead of ?
    let paramIndex = 1;
    const pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
    const res = await pgPool.query(pgSql, params);
    return res.rows;
  } else {
    // SQLite
    return new Promise((resolve, reject) => {
      const trimmed = sql.trim().toUpperCase();
      if (trimmed.startsWith('SELECT') || trimmed.startsWith('PRAGMA')) {
        sqliteDb.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        });
      } else {
        sqliteDb.run(sql, params, function (err) {
          if (err) reject(err);
          else resolve([{ lastID: this.lastID, changes: this.changes }]);
        });
      }
    });
  }
}

// Database Initialization & Migrations
export async function initDatabase() {
  console.log(`⚡ Initializing database schema on ${isPostgres ? 'PostgreSQL' : 'SQLite'}...`);

  if (isPostgres) {
    // PostgreSQL Tables
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(128) NOT NULL,
        email VARCHAR(128) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(32) NOT NULL DEFAULT 'member',
        avatar VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS api_keys (
        id VARCHAR(64) PRIMARY KEY,
        agent_name VARCHAR(128) NOT NULL,
        key_hash VARCHAR(255) NOT NULL,
        prefix VARCHAR(64) NOT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'active',
        created_by_user_id VARCHAR(64),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id VARCHAR(64) PRIMARY KEY,
        order_index INT DEFAULT 0,
        title TEXT NOT NULL,
        description TEXT,
        status VARCHAR(32) NOT NULL DEFAULT 'todo',
        priority VARCHAR(32) NOT NULL DEFAULT 'medium',
        tags JSONB DEFAULT '[]',
        subtasks JSONB DEFAULT '[]',
        due_date VARCHAR(32),
        created_by_type VARCHAR(32) NOT NULL,
        created_by_name VARCHAR(128) NOT NULL,
        created_by_id VARCHAR(64),
        updated_by_name VARCHAR(128),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS task_history (
        id VARCHAR(64) PRIMARY KEY,
        task_id VARCHAR(64) NOT NULL,
        actor_type VARCHAR(32) NOT NULL,
        actor_name VARCHAR(128) NOT NULL,
        action VARCHAR(64) NOT NULL,
        details JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } else {
    // SQLite Tables
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'member',
        avatar TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS api_keys (
        id TEXT PRIMARY KEY,
        agent_name TEXT NOT NULL,
        key_hash TEXT NOT NULL,
        prefix TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        created_by_user_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        order_index INTEGER DEFAULT 0,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'todo',
        priority TEXT NOT NULL DEFAULT 'medium',
        tags TEXT DEFAULT '[]',
        subtasks TEXT DEFAULT '[]',
        due_date TEXT,
        created_by_type TEXT NOT NULL,
        created_by_name TEXT NOT NULL,
        created_by_id TEXT,
        updated_by_name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS task_history (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL,
        actor_type TEXT NOT NULL,
        actor_name TEXT NOT NULL,
        action TEXT NOT NULL,
        details TEXT DEFAULT '{}',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
      );
    `);
  }

  // Seed Default Admin User if empty
  const existingUsers = await query(`SELECT id FROM users LIMIT 1`);
  if (!existingUsers || existingUsers.length === 0) {
    const defaultPassword = 'admin123';
    const hash = await bcrypt.hash(defaultPassword, 10);
    const adminId = 'usr_admin_' + Date.now();
    await query(
      `INSERT INTO users (id, name, email, password_hash, role, avatar) VALUES (?, ?, ?, ?, ?, ?)`,
      [adminId, 'Shivanand (Admin)', 'admin@vocalflow.local', hash, 'admin', 'https://api.dicebear.com/7.x/bottts/svg?seed=Admin']
    );
    console.log('👤 Created default admin user: admin@vocalflow.local (password: admin123)');
  }

  // Seed Demo Agent API Key if empty
  const existingKeys = await query(`SELECT id FROM api_keys LIMIT 1`);
  if (!existingKeys || existingKeys.length === 0) {
    const demoKeyRaw = 'vf_agent_demo_claude_12345';
    const keyHash = await bcrypt.hash(demoKeyRaw, 10);
    await query(
      `INSERT INTO api_keys (id, agent_name, key_hash, prefix, status) VALUES (?, ?, ?, ?, ?)`,
      ['key_demo_1', 'Claude Desktop', keyHash, 'vf_agent_demo...', 'active']
    );
    console.log('🤖 Created demo Agent API Key for Claude Desktop: vf_agent_demo_claude_12345');
  }

  // Seed Initial Tasks if empty
  const existingTasks = await query(`SELECT id FROM tasks LIMIT 1`);
  if (!existingTasks || existingTasks.length === 0) {
    const seedTasks = [
      {
        id: 'TK-101',
        title: 'Implement Webhook Security Signature Verification',
        description: 'Ensure all incoming Stripe webhook payloads have cryptographic HMAC SHA-256 signatures validated against webhook secrets.',
        status: 'in_progress',
        priority: 'urgent',
        tags: JSON.stringify(['backend', 'security', 'stripe']),
        subtasks: JSON.stringify([
          { id: 'sub-1', title: 'Parse raw request body buffer', completed: true },
          { id: 'sub-2', title: 'Verify signature against Stripe-Signature header', completed: true },
          { id: 'sub-3', title: 'Add test suite for replay attacks', completed: false },
        ]),
        dueDate: new Date().toISOString().split('T')[0],
        created_by_type: 'human',
        created_by_name: 'Shivanand (Admin)',
        updated_by_name: 'Shivanand (Admin)',
      },
      {
        id: 'TK-102',
        title: 'Audit Audio Context Latency on Chromium',
        description: 'Verify oscillator node cleanup upon completion to prevent audio buffer memory leaks.',
        status: 'in_review',
        priority: 'high',
        tags: JSON.stringify(['audio', 'qa', 'chromium']),
        subtasks: JSON.stringify([
          { id: 'sub-4', title: 'Check Chrome DevTools Memory tab', completed: true },
          { id: 'sub-5', title: 'Verify on Microsoft Edge', completed: true },
        ]),
        dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        created_by_type: 'agent',
        created_by_name: 'Claude Desktop',
        updated_by_name: 'Claude Desktop',
      },
      {
        id: 'TK-103',
        title: 'Optimize Database Query Indexes for Multi-Tenant Tasks',
        description: 'Add composite B-Tree indexes on (status, priority, due_date) to keep list view queries under 4ms.',
        status: 'todo',
        priority: 'medium',
        tags: JSON.stringify(['database', 'postgres', 'perf']),
        subtasks: JSON.stringify([]),
        dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
        created_by_type: 'agent',
        created_by_name: 'Cursor AI',
        updated_by_name: 'Cursor AI',
      },
      {
        id: 'TK-104',
        title: 'Research PGlite WASM Offline DB Integration',
        description: 'Investigate if full Postgres WASM adds value over IndexedDB for single-user offline workflows.',
        status: 'backlog',
        priority: 'low',
        tags: JSON.stringify(['research', 'database']),
        subtasks: JSON.stringify([]),
        dueDate: null,
        created_by_type: 'human',
        created_by_name: 'Rahul (Dev)',
        updated_by_name: 'Rahul (Dev)',
      }
    ];

    for (const t of seedTasks) {
      await query(
        `INSERT INTO tasks (id, title, description, status, priority, tags, subtasks, due_date, created_by_type, created_by_name, updated_by_name)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [t.id, t.title, t.description, t.status, t.priority, t.tags, t.subtasks, t.dueDate, t.created_by_type, t.created_by_name, t.updated_by_name]
      );

      // Seed history entry
      await query(
        `INSERT INTO task_history (id, task_id, actor_type, actor_name, action, details)
         VALUES (?, ?, ?, ?, ?, ?)`,
        ['hist_' + Math.random().toString(36).substr(2, 9), t.id, t.created_by_type, t.created_by_name, 'created', JSON.stringify({ priority: t.priority, status: t.status })]
      );
    }
    console.log(`📋 Seeded initial demonstration tasks with human & agent attribution.`);
  }

  console.log('✅ Database initialization complete.');
}
