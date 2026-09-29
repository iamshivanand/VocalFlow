import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import { initDatabase } from './db.js';
import authRoutes from './routes/authRoutes.js';
import apiKeyRoutes from './routes/apiKeyRoutes.js';
import taskRoutes from './routes/taskRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/api-keys', apiKeyRoutes);
app.use('/api/tasks', taskRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'VocalFlow Server & MCP Hub',
    timestamp: new Date().toISOString(),
    database: process.env.DATABASE_URL ? 'PostgreSQL' : 'SQLite (server/vocalflow.db)',
  });
});

// Serve compiled frontend in production (or if dist exists)
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  // SPA Catch-all middleware compatible with Express 5
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/mcp')) {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
  });
}

// Start server
async function startServer() {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`\n🚀 VocalFlow Backend & MCP Hub running on http://localhost:${PORT}`);
      console.log(`   Database Engine: ${process.env.DATABASE_URL ? 'PostgreSQL' : 'SQLite (local fallback)'}`);
      console.log(`   REST API:       http://localhost:${PORT}/api/tasks`);
      console.log(`   Health Check:   http://localhost:${PORT}/api/health`);
      console.log(`   MCP Runner:     node server/mcp-runner.js\n`);
    });
  } catch (err) {
    console.error('Fatal server startup error:', err);
    process.exit(1);
  }
}

startServer();
