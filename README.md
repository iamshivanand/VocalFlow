# 🎙️ VocalFlow — Voice-Controlled Task Tracker

> A world-class, ultra-fast task management system with client-side voice control, Linear-grade drag-and-drop Kanban, high-density tabular list view, and an Executive Daily Audio Standup Briefing.

---

## ✨ Features

- **🎙️ 100% Free & Local Voice Command System**:
  - Powered by browser-native **Web Speech Recognition** + custom client-side token NLP parser (`VoiceIntentParser`).
  - Zero third-party API keys or recurring subscription costs.
  - Push-to-talk (`Alt + V` or floating HUD button) and hands-free voice control.
  - **Procedural Synthesizer Chimes**: Web Audio API chords for mic activation, task creation, and errors.
  - **Spoken Confirmations**: Browser SpeechSynthesis confirms ticket movements and actions aloud.

- **📊 Dual View System**:
  - **Kanban Drag-and-Drop Board**: 5 interactive lanes (`Backlog` ➔ `To Do` ➔ `In Progress` ➔ `In Review` ➔ `Done`) with smooth HTML5 drag-and-drop and column dropzone glow.
  - **Dense Tabular List View**: Rapid-triage table with sortable columns (`Key`, `Status`, `Title`, `Priority`, `Tags`, `Due Date`).

- **📢 Executive Daily Audio Standup**:
  - Automatically synthesizes an executive voice briefing summarizing your active tasks, overdue deadlines, and urgent focus items.
  - Interactive transcript card and recommended top tasks to crush today.

- **⚡ Pro Keyboard Shortcuts & Command Palette**:
  - `Ctrl + K` / `Cmd + K`: Spotlight-style Quick Command Palette
  - `C`: Create new task
  - `B`: Daily Standup Briefing
  - `Alt + V`: Toggle voice listening
  - `?`: Voice commands and keyboard shortcut cheat sheet

- **💾 Local Persistence & Data Portability**:
  - Reactive instant persistence to `localStorage` with zero latency.
  - One-click JSON backup export (`vocalflow-tasks-backup-YYYY-MM-DD.json`).
  - One-click JSON backup import and restore.
  - Reset to demonstration dataset anytime.

---

- **🤖 Model Context Protocol (MCP) Server**:
  - Connect AI agents (Claude Desktop, Cursor, Custom LLM agents) directly to VocalFlow.
  - Full CRUD operations via native MCP tools (`vocalflow_create_task`, `vocalflow_list_tasks`, etc.).
  - Automatic actor attribution (`🤖 Agent: Claude Desktop` vs `👤 Employee: Alice`) tagged on every ticket and change history.

- **🗄️ PostgreSQL & SQLite Dual Engine**:
  - Out-of-the-box local SQLite database for zero-config local testing.
  - Direct PostgreSQL support via `DATABASE_URL` (compatible with free cloud providers like **Neon**, **Supabase**, **Render**, or Hostinger PostgreSQL).
  - Centralized multi-employee access and live team collaboration.

---

## 🗣️ Supported Voice Commands

| Voice Command | Action |
|---|---|
| `"Add urgent task fix stripe webhook due today"` | Creates ticket with **Urgent** priority in `To Do` due today |
| `"Create high priority ticket redesign header due tomorrow tag frontend"` | Creates ticket with **High** priority, tomorrow's date, and `frontend` tag |
| `"Move task 101 to in progress"` | Transitions ticket `TK-101` to `In Progress` |
| `"Mark task 102 as completed"` | Moves ticket `TK-102` to `Done` with audio chord & celebratory confetti |
| `"Set task 103 priority to urgent"` | Updates priority to **Urgent** |
| `"Delete task 106"` | Removes ticket from board |
| `"Brief me on today's tasks"` / `"Daily standup"` | Opens and plays the **Executive Daily Standup Briefing** |
| `"Search frontend"` | Filters tasks matching query |
| `"Clear filters"` | Resets all active filters |

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Google Chrome, Microsoft Edge, Brave, or any Chromium browser with microphone support

### Installation

```bash
# Clone the repository
git clone https://github.com/iamshivanand/VocalFlow.git
cd VocalFlow

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env
```

### Local Development

1. **Start Backend Server (Port 3001)**:
   ```bash
   node server/index.js
   ```
   *Note: If `DATABASE_URL` is not set, VocalFlow automatically initializes a local SQLite database at `server/vocalflow.db`.*

2. **Start Frontend Dev Server (Port 5173)**:
   ```bash
   npm run dev
   ```

Open [http://localhost:5173](http://localhost:5173) in your browser.

Default Admin Login:
- **Email**: `admin@vocalflow.local`
- **Password**: `admin123`

---

## ☁️ Connecting Free Cloud PostgreSQL (Neon / Supabase / Render / Hostinger)

Whenever you are ready to switch from local SQLite to PostgreSQL:

1. Create a free PostgreSQL database on any provider:
   - **Neon** ([neon.tech](https://neon.tech)) - Free serverless Postgres with instant setup.
   - **Supabase** ([supabase.com](https://supabase.com)) - Free managed Postgres tier.
   - **Render** / **Aiven** / **Hostinger** Database.
2. Copy your PostgreSQL connection URI.
3. Paste it into your `.env` file:
   ```env
   DATABASE_URL=postgresql://user:password@ep-cool-db.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. Restart `node server/index.js`. Tables (`users`, `tasks`, `task_history`, `api_keys`) and initial seed data will auto-generate in your Postgres database!

---

## 🤖 Connecting AI Agents via MCP (Claude Desktop / Cursor)

VocalFlow comes with a production Model Context Protocol (MCP) server.

1. Open the VocalFlow UI, click **"AI Agents"** in the top navigation, and click **"Generate Agent Key"** (e.g. for `Claude Desktop`).
2. Add the MCP server configuration to your `claude_desktop_config.json`:
   ```json
   {
     "mcpServers": {
       "vocalflow": {
         "command": "node",
         "args": ["E:\\projectai\\Tracker\\server\\mcp-runner.js"],
         "env": {
           "VOCALFLOW_API_URL": "http://localhost:3001",
           "VOCALFLOW_API_KEY": "vf_agent_live_your_generated_key"
         }
       }
     }
   }
   ```
3. Restart Claude Desktop. You can now prompt Claude:
   - *"List all urgent tasks in VocalFlow"*
   - *"Create a ticket for updating auth tokens with high priority due tomorrow"*
   - *"Move TK-104 to In Review"*

All agent actions will be tagged in VocalFlow with `🤖 Agent: Claude Desktop` and recorded in the audit history timeline!

---

## 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Vanilla CSS Design Tokens (Linear/Obsidian dark theme `#080A0E`)
- **Backend**: Express 5 + Dual Database Engine (`pg` PostgreSQL + SQLite fallback)
- **AI Protocol**: Model Context Protocol (`@modelcontextprotocol/sdk`) STDIO & REST
- **Audio & Voice**: Web Speech Recognition API, SpeechSynthesis, procedural Web Audio API synthesizer
- **Animations**: Canvas Confetti, CSS hardware-accelerated transforms

---

## 📄 License

MIT
