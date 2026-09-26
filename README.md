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

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build Production Bundle

```bash
npm run build
```

---

## 🛠️ Tech Stack

- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Vanilla CSS Design Tokens (Linear/Obsidian dark theme `#080A0E`)
- **Icons**: Lucide React
- **Audio & Voice**: Web Speech Recognition API, SpeechSynthesis, procedural Web Audio API synthesizer
- **Animations**: Canvas Confetti, CSS hardware-accelerated transforms
- **Storage**: LocalStorage / IndexedDB with JSON export/import

---

## 📄 License

MIT
