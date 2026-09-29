export type Priority = 'urgent' | 'high' | 'medium' | 'low';

export type Status = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Actor {
  type: 'human' | 'agent';
  name: string;
  id?: string;
  email?: string;
  role?: string;
  avatar?: string;
}

export interface TaskHistoryItem {
  id: string;
  taskId: string;
  actorType: 'human' | 'agent';
  actorName: string;
  action: string;
  details: Record<string, any>;
  createdAt: string;
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
  dueDate?: string;        // YYYY-MM-DD
  createdBy?: Actor;
  updatedByName?: string;
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
  creatorType: 'all' | 'human' | 'agent';
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

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
  avatar?: string;
}

export interface AgentApiKey {
  id: string;
  agent_name: string;
  prefix: string;
  status: 'active' | 'revoked';
  created_at: string;
}
