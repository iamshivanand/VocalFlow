export type Priority = 'urgent' | 'high' | 'medium' | 'low';

export type Status = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface TaskTicket {
  id: string;              // e.g., "TK-101"
  order: number;           // Index within column for drag-and-drop
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  tags: string[];
  subtasks: Subtask[];
  dueDate?: string;        // YYYY-MM-DD or ISO string
  createdAt: string;
  updatedAt: string;
}

export interface ColumnDefinition {
  id: Status;
  title: string;
  color: string;
  badgeBg: string;
  icon: string;
}

export type ViewMode = 'kanban' | 'list';

export interface FilterState {
  search: string;
  priority: Priority | 'all';
  status: Status | 'all';
  tag: string | 'all';
  sortBy: 'order' | 'priority' | 'dueDate' | 'title' | 'id';
  sortDirection: 'asc' | 'desc';
}

export interface VoiceCommandResult {
  rawTranscript: string;
  intent: 'create' | 'update_status' | 'set_priority' | 'delete' | 'briefing' | 'filter' | 'unknown';
  taskData?: Partial<TaskTicket>;
  targetTaskId?: string;
  targetTaskTitle?: string;
  targetStatus?: Status;
  targetPriority?: Priority;
  filterQuery?: string;
  feedbackMessage: string;
}
