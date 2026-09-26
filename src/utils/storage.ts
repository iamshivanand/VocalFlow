import type { TaskTicket } from '../types/task';

const STORAGE_KEY = 'vocalflow_tasks_v1';
const NEXT_ID_KEY = 'vocalflow_next_id';

export const INITIAL_SEED_TASKS: TaskTicket[] = [
  {
    id: 'TK-101',
    order: 0,
    title: 'Implement Webhook Security Signature Verification',
    description: 'Ensure all incoming Stripe webhook payloads have cryptographic HMAC SHA-256 signatures validated against webhook secrets.',
    status: 'in_progress',
    priority: 'urgent',
    tags: ['backend', 'security', 'stripe'],
    dueDate: new Date().toISOString().split('T')[0], // Due today
    subtasks: [
      { id: 'sub-1', title: 'Parse raw request body buffer', completed: true },
      { id: 'sub-2', title: 'Verify signature against Stripe-Signature header', completed: true },
      { id: 'sub-3', title: 'Add test suite for replay attacks', completed: false },
    ],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'TK-102',
    order: 1,
    title: 'Refactor Kanban Board Drag-and-Drop Dropzones',
    description: 'Optimize HTML5 drag over listener throttling to prevent frame drops during rapid card movements.',
    status: 'in_progress',
    priority: 'high',
    tags: ['frontend', 'performance'],
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
    subtasks: [
      { id: 'sub-4', title: 'Debounce dragOver calculations', completed: true },
      { id: 'sub-5', title: 'Add CSS transform hardware acceleration', completed: false },
    ],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'TK-103',
    order: 0,
    title: 'Audit Audio Context Latency on Chromium',
    description: 'Verify oscillator node cleanup upon completion to prevent audio buffer memory leaks.',
    status: 'in_review',
    priority: 'medium',
    tags: ['audio', 'qa'],
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    subtasks: [
      { id: 'sub-6', title: 'Check Chrome DevTools Memory tab', completed: true },
      { id: 'sub-7', title: 'Verify on Microsoft Edge', completed: true },
    ],
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'TK-104',
    order: 0,
    title: 'Design Dark-Mode Bento Analytics Widget',
    description: 'Create compact visual telemetry cards displaying task velocity and completion rate percentages.',
    status: 'todo',
    priority: 'high',
    tags: ['ui', 'design'],
    dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    subtasks: [
      { id: 'sub-8', title: 'Figma tokens export', completed: false },
      { id: 'sub-9', title: 'CSS Glassmorphism gradients', completed: false },
    ],
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'TK-105',
    order: 1,
    title: 'Add Keyboard Shortcut Hotkey Cheat Sheet Modal',
    description: 'Implement modal triggered by `?` or `Ctrl+/` showcasing all voice commands and keyboard shortcuts.',
    status: 'todo',
    priority: 'low',
    tags: ['dx', 'accessibility'],
    subtasks: [],
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'TK-106',
    order: 0,
    title: 'Setup Production Bundle Minification & Tree-Shaking',
    description: 'Configured Terser and rollup options in Vite to keep initial bundle size under 85kB compressed.',
    status: 'done',
    priority: 'medium',
    tags: ['infra', 'vite'],
    subtasks: [
      { id: 'sub-10', title: 'Analyze bundle with visualizer', completed: true },
      { id: 'sub-11', title: 'Purge unused icon exports', completed: true },
    ],
    createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'TK-107',
    order: 0,
    title: 'Research PGlite WASM Offline DB Integration',
    description: 'Investigate if full Postgres WASM adds value over IndexedDB for single-user offline workflows.',
    status: 'backlog',
    priority: 'low',
    tags: ['research', 'database'],
    subtasks: [],
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export class StorageService {
  static loadTasks(): TaskTicket[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load tasks from localStorage', e);
    }
    this.saveTasks(INITIAL_SEED_TASKS);
    return INITIAL_SEED_TASKS;
  }

  static saveTasks(tasks: TaskTicket[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {
      console.error('Failed to save tasks to localStorage', e);
    }
  }

  static getNextTaskId(existingTasks: TaskTicket[]): string {
    let highestNum = 100;
    existingTasks.forEach(task => {
      const match = task.id.match(/^TK-(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > highestNum) highestNum = num;
      }
    });

    const storedNext = localStorage.getItem(NEXT_ID_KEY);
    if (storedNext) {
      const nextNum = parseInt(storedNext, 10);
      if (nextNum > highestNum) highestNum = nextNum;
    }

    const nextIdNum = highestNum + 1;
    localStorage.setItem(NEXT_ID_KEY, (nextIdNum + 1).toString());
    return `TK-${nextIdNum}`;
  }

  static exportToJson(tasks: TaskTicket[]): void {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tasks, null, 2));
    const downloadAnchor = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `vocalflow-tasks-backup-${dateStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  static importFromJson(file: File): Promise<TaskTicket[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed)) {
            const valid = parsed.every(item => item.id && item.title && item.status);
            if (valid) {
              this.saveTasks(parsed);
              resolve(parsed);
              return;
            }
          }
          reject(new Error('Invalid task schema in uploaded JSON file.'));
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file.'));
      reader.readAsText(file);
    });
  }

  static resetToDefault(): TaskTicket[] {
    this.saveTasks(INITIAL_SEED_TASKS);
    localStorage.removeItem(NEXT_ID_KEY);
    return INITIAL_SEED_TASKS;
  }
}
