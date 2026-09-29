# VocalFlow — World-Class Voice-Controlled Task Tracker & Multi-Agent Collaboration Hub
## Technical Architecture & Design Specification (v2: Multi-User & MCP Agent Integration)

---

## 1. Executive Summary & Understanding Lock
* **System**: **VocalFlow**, an ultra-fast task management platform combining Linear/Raycast design velocity, 100% local voice control, full multi-user authentication for team members, and a dedicated **Model Context Protocol (MCP) Server** for external AI agents.
* **Core Value Proposition**:
  * **Zero Friction**: Hands-free voice ticket creation, drag-and-drop Kanban, and executive daily standup audio briefings.
  * **Team Collaboration**: Centralized backend API deployable to Hostinger or any cloud server with email/password authentication and role control.
  * **AI Agent Co-Workers via MCP**: External AI agents (Claude Desktop, Cursor, Antigravity, custom autonomous bots) connect over MCP using secure API keys to create, inspect, update, and manage tasks.
  * **Clear Attribution & Audit History**: Visual badges immediately distinguish human teammates (`👤 Shivanand`) from AI agents (`🤖 Claude Desktop`), backed by a granular chronological audit history on every ticket.

---

## 2. Decision Log

| # | Decision | Chosen Alternative | Alternatives Considered | Rationale |
|---|---|---|---|---|
| **1** | **Backend Platform** | Node.js + Express + SQLite / Postgres | Pure client localStorage, Firebase | Shared server access allows remote employees and external MCP agents to read/write the same database; works natively on Hostinger Node.js hosting or VPS. |
| **2** | **AI Agent Protocol** | Official Model Context Protocol (MCP) | Custom Webhooks, ad-hoc REST only | MCP is the open industry standard supported by Claude Desktop, Cursor, and modern LLM agent ecosystems. |
| **3** | **Employee Auth** | JWT-based Email/Password Auth | Shared password, No auth | Secure, role-based (Admin vs Member), enables personalized attribution for who made changes. |
| **4** | **Agent Auth** | Hashed API Keys (`vf_agent_...`) with Agent Registry | OAuth 2.0, Open endpoints | Frictionless for agent configuration files (`claude_desktop_config.json`); ties each key to an explicit Agent Name. |
| **5** | **Attribution Model**| Dedicated Actor Object (`type: 'agent'|'human'`, `name`, `id`) + `task_history` table | Text prefix only, No attribution | Provides rich UI pills (robot vs human avatar) and chronological audit trails. |
| **6** | **Offline Resilience** | Backend API primary + LocalStorage Cache | Backend only | Smooth degraded offline viewing with automatic synchronization upon reconnect. |

---

## 3. Database Schema Specification

```sql
-- Users (Team Members)
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member', -- 'admin' | 'member'
  avatar TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Agent API Keys
CREATE TABLE api_keys (
  id TEXT PRIMARY KEY,
  agent_name TEXT NOT NULL,            -- e.g. 'Claude Desktop', 'Cursor Bot'
  key_hash TEXT NOT NULL,
  prefix TEXT NOT NULL,                -- e.g. 'vf_agent_4a8b...'
  status TEXT NOT NULL DEFAULT 'active', -- 'active' | 'revoked'
  created_by_user_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Task Tickets
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,                 -- e.g. 'TK-101'
  order_index INTEGER DEFAULT 0,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo', -- 'backlog', 'todo', 'in_progress', 'in_review', 'done'
  priority TEXT NOT NULL DEFAULT 'medium', -- 'urgent', 'high', 'medium', 'low'
  tags TEXT,                           -- JSON array of strings
  subtasks TEXT,                       -- JSON array of {id, title, completed}
  due_date TEXT,                       -- YYYY-MM-DD
  created_by_type TEXT NOT NULL,       -- 'human' | 'agent'
  created_by_name TEXT NOT NULL,       -- e.g. 'Shivanand', 'Claude Desktop'
  created_by_id TEXT,
  updated_by_name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Audit History Log
CREATE TABLE task_history (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  actor_type TEXT NOT NULL,            -- 'human' | 'agent'
  actor_name TEXT NOT NULL,
  action TEXT NOT NULL,                -- 'created', 'status_changed', 'priority_changed', 'edited', 'subtask_toggled'
  details TEXT,                        -- JSON details of what changed
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);
```

---

## 4. MCP Server & Tool Definitions

The MCP server connects external AI agents using STDIO or HTTP/SSE:

### 1. `vocalflow_create_task`
* **Input Schema**:
  ```json
  {
    "title": "string (required)",
    "description": "string (optional)",
    "priority": "urgent | high | medium | low",
    "status": "backlog | todo | in_progress | in_review | done",
    "tags": ["array", "of", "strings"],
    "dueDate": "YYYY-MM-DD",
    "subtasks": ["string subtask 1", "string subtask 2"]
  }
  ```
* **Execution**: Automatically stamps `created_by_type: 'agent'`, `created_by_name: <Registered Agent Name>`, generates ID (e.g. `TK-108`), records entry in `task_history`.

### 2. `vocalflow_list_tasks`
* **Input Schema**:
  ```json
  {
    "status": "string (optional)",
    "priority": "string (optional)",
    "tag": "string (optional)",
    "search": "string (optional)",
    "creatorType": "human | agent (optional)"
  }
  ```

### 3. `vocalflow_get_task`
* **Input Schema**: `{ "taskId": "string (required, e.g. TK-101)" }`
* **Output**: Returns full ticket metadata, checklist status, and complete chronological audit history.

### 4. `vocalflow_update_task`
* **Input Schema**:
  ```json
  {
    "taskId": "string (required)",
    "status": "backlog | todo | in_progress | in_review | done (optional)",
    "priority": "urgent | high | medium | low (optional)",
    "title": "string (optional)",
    "description": "string (optional)",
    "subtasks": "array of {id, title, completed} (optional)"
  }
  ```
* **Execution**: Updates task and logs audit entry: `"[Agent Name] changed status to [status]"`.

### 5. `vocalflow_delete_task`
* **Input Schema**: `{ "taskId": "string (required)" }`

### 6. `vocalflow_get_daily_briefing`
* **Output**: Returns executive summary of active, overdue, and urgent tickets.

---

## 5. Hostinger Deployment Plan

Hostinger Node.js hosting runs standard Node apps via `package.json`:
1. **Unified Entry Point (`server/index.js`)**: Serves REST API on `/api/*`, MCP on `/mcp/*`, and the compiled Vite frontend from `dist/`.
2. **Production Build**: `npm run build` compiles Vite frontend into `dist/`.
3. **Start Command**: `node server/index.js` boots the server and creates the SQLite database file if it doesn't already exist.
4. **Environment Variables**: `PORT`, `JWT_SECRET`, `NODE_ENV`.
