# VocalFlow — World-Class Voice-Controlled Task Tracker
## Technical Architecture & Design Specification

---

## 1. Executive Summary & Understanding Lock
* **System**: **VocalFlow**, a solo-developer task management system combining the speed of Linear/Raycast with an intelligent, 100% free & local voice command interface.
* **Core Value Proposition**: Hands-free ticket creation and status updating via natural speech, coupled with a tactile Drag-and-Drop Kanban & List UI, and a daily audio standup briefing that reads active and urgent tasks aloud.
* **Audience**: Solo power-user requiring zero friction, instantaneous responsiveness, offline-readiness, and no API subscriptions.
* **Constraints**:
  * 100% free and client-side (Web Speech Recognition + SpeechSynthesis).
  * Web App (React 19 + Vite + TypeScript + Tailwind CSS / Vanilla CSS modules + Lucide Icons).
  * Zero remote server dependence; local IndexedDB & LocalStorage persistence with JSON backup.

---

## 2. Decision Log

| # | Decision | Chosen Alternative | Alternatives Considered | Rationale |
|---|---|---|---|---|
| **1** | **Platform / Form Factor** | Web App (React + Vite) | Electron, Fullstack Node/Postgres | Instant setup, zero install friction, 60+ FPS performance, native browser speech APIs |
| **2** | **Voice Engine** | Local Web Speech API + Rule/Token NLP Parser | Cloud LLM (OpenAI/Gemini), Local Whisper | 100% free, private, instant latency (<5ms parse time), no API keys needed |
| **3** | **Daily Reminder** | Interactive Audio Standup Briefing (`SpeechSynthesis`) | Native OS notification spam, background audio timers | Executive-assistant experience that briefs the user on active, overdue, and priority tasks |
| **4** | **UI & Layout** | Dual Mode (Kanban Drag & Drop + List/Table View) + `Ctrl+K` Palette | Pure Kanban, Table only | Combines tactile spatial organization with high-density triage and keyboard navigation |
| **5** | **Storage & Persistence**| IndexedDB + LocalStorage with JSON Export/Import | PGlite WASM, Cloud DB | Instant reactive writes, offline resilience, and easy one-click portable JSON backups |
| **6** | **Audio Feedback** | Web Audio API Synthesized Chimes | Pre-rendered MP3 assets | Zero asset load delay, customizable pitch/tone, clean studio-grade tactile feedback |

---

## 3. System Architecture & Components

```
┌────────────────────────────────────────────────────────────────────────┐
│                        User Interface (React + Vite)                   │
├───────────────────────┬──────────────────────┬─────────────────────────┤
│     Top Navigation    │     Kanban Board     │      List / Table       │
│  - Stats & Badge HUD  │  - 5 Columns         │  - Sortable columns     │
│  - Daily Standup Btn  │  - Drag & Drop Cards │  - Quick status chips   │
│  - Voice Record HUD   │  - Checklist badges  │  - Multi-select actions │
│  - Ctrl+K Palette     │  - Priority pills    │                         │
└───────────┬───────────┴──────────┬───────────┴────────────┬────────────┘
            │                      │                        │
            ▼                      ▼                        ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        State & Persistence Layer                       │
│    useTaskStore (Zustand) <───> LocalStorage / IndexedDB Adapter       │
│    - Actions: addTask, updateTask, moveTask, deleteTask, bulkUpdate   │
│    - Selectors: activeTasks, dueToday, overdue, priorityBuckets        │
│    - One-Click JSON Backup & Restore Engine                            │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
            ┌──────────────────────┴──────────────────────┐
            ▼                                             ▼
┌───────────────────────────────┐             ┌───────────────────────────┐
│     Voice Input Pipeline      │             │   Audio Output Pipeline   │
│  - webkitSpeechRecognition    │             │  - SpeechSynthesis (TTS)  │
│  - VoiceIntentParser (NLP)    │             │  - Daily Standup Briefing │
│  - Fuzzy Title Matcher        │             │  - Web Audio API Chimes   │
│  - Disambiguation Handler     │             │  - Voice Confirmation     │
└───────────────────────────────┘             └───────────────────────────┘
```

---

## 4. Voice Intent Parser Specification

The voice engine matches spoken input against intent rules:
1. **Creation Intent**:
   * Patterns: `create (task|ticket)`, `add (task|ticket)`, `new (task|ticket)`
   * Keyword Extractors:
     * Priority: `urgent`, `high`, `medium`, `low`
     * Status: defaults to `todo` or `backlog`
     * Tags: preceded by `tag <word>` or `tagged <word>`
     * Due Date: `due today`, `due tomorrow`, `due monday`, `due next week`
   * Example: *"Add high priority ticket fix payment webhook due tomorrow"* ➔ creates `TK-101` in `Todo` with `high` priority and tomorrow's due date.

2. **Status Shifting Intent**:
   * Patterns: `move task <id|title> to <status>`, `mark <id|title> as <status>`, `set <id|title> to <status>`
   * Status aliases:
     * `backlog`: "backlog", "icebox"
     * `todo`: "to do", "todo", "ready"
     * `in_progress`: "in progress", "active", "doing", "started"
     * `in_review`: "in review", "review", "testing"
     * `done`: "done", "completed", "finished"
   * Example: *"Move task 101 to in progress"* ➔ shifts card to `in_progress` column and speaks: *"Moved task TK-101 to In Progress"*.

3. **Priority Update Intent**:
   * Patterns: `set task <id> priority to <priority>`, `mark task <id> as <priority>`

4. **Daily Briefing Trigger**:
   * Patterns: `brief me`, `daily standup`, `what are my tasks`, `read my tasks`, `today's briefing`
   * Synthesizes audio report of active and high priority tasks.

---

## 5. Data Model Schema

```typescript
export type Priority = 'urgent' | 'high' | 'medium' | 'low';
export type Status = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface TaskTicket {
  id: string;              // e.g. "TK-101"
  order: number;           // For drag-and-drop sequencing
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  tags: string[];
  subtasks: Subtask[];
  dueDate?: string;        // ISO 8601 string
  createdAt: string;
  updatedAt: string;
}
```

---

## 6. Daily Audio Briefing Logic

When triggered (manually via button or voice command `"brief me"`):
1. Compute active tasks: `status in ['todo', 'in_progress']`.
2. Compute overdue tasks: `dueDate < today && status !== 'done'`.
3. Compute urgent tasks: `priority === 'urgent' && status !== 'done'`.
4. Compose natural speech string:
   > *"Good day! You have [N] active tasks. [X] are in progress and [Y] are waiting in to-do. You have [Z] urgent items: [Task titles]. Let's crush today's goals!"*
5. Speak via `window.speechSynthesis` with speech cancellation safeguard.

---

## 7. Edge Cases & Resilience
* **Microphone Access**: Detailed instructions banner if microphone permissions are denied.
* **Speech Recognition Interruption**: Auto-restart on continuous mode or clean push-to-talk release.
* **Browser Compatibility**: Polyfilled speech recognition hook supporting Chrome, Edge, Brave, and other Chromium browsers, with fallback manual quick-add modal.
* **Duplicate / Ambiguous Search**: If multiple tasks match spoken title, UI presents quick selection chips.
