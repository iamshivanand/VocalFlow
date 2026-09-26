import React from 'react';
import type { TaskTicket, Status, ColumnDefinition, FilterState } from '../types/task';
import { KanbanColumn } from './KanbanColumn';

interface KanbanBoardProps {
  tasks: TaskTicket[];
  filters: FilterState;
  onEditTask: (task: TaskTicket) => void;
  onDeleteTask: (id: string) => void;
  onStatusChange: (id: string, newStatus: Status) => void;
  onAddTaskToColumn: (status: Status) => void;
  onCardDrop: (taskId: string, targetStatus: Status) => void;
}

export const COLUMNS: ColumnDefinition[] = [
  { id: 'backlog', title: 'Backlog', color: '#64748B', badgeBg: 'rgba(100, 116, 139, 0.15)', icon: 'Archive' },
  { id: 'todo', title: 'To Do', color: '#94A3B8', badgeBg: 'rgba(148, 163, 184, 0.15)', icon: 'Circle' },
  { id: 'in_progress', title: 'In Progress', color: '#38BDF8', badgeBg: 'rgba(56, 189, 248, 0.15)', icon: 'PlayCircle' },
  { id: 'in_review', title: 'In Review', color: '#A855F7', badgeBg: 'rgba(168, 85, 247, 0.15)', icon: 'Eye' },
  { id: 'done', title: 'Done', color: '#10B981', badgeBg: 'rgba(16, 185, 129, 0.15)', icon: 'CheckCircle' },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  filters,
  onEditTask,
  onDeleteTask,
  onStatusChange,
  onAddTaskToColumn,
  onCardDrop,
}) => {
  const filteredTasks = tasks.filter((task) => {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchId = task.id.toLowerCase().includes(q);
      const matchDesc = task.description?.toLowerCase().includes(q);
      const matchTag = task.tags?.some(t => t.toLowerCase().includes(q));
      if (!matchTitle && !matchId && !matchDesc && !matchTag) return false;
    }

    if (filters.priority !== 'all' && task.priority !== filters.priority) {
      return false;
    }

    if (filters.tag !== 'all' && !task.tags?.includes(filters.tag)) {
      return false;
    }

    return true;
  });

  return (
    <div style={{
      display: 'flex',
      gap: '16px',
      overflowX: 'auto',
      padding: '20px 24px 80px 24px',
      minWidth: '100%',
    }}>
      {COLUMNS.map((col) => {
        const columnTasks = filteredTasks.filter(t => t.status === col.id);
        return (
          <KanbanColumn
            key={col.id}
            column={col}
            tasks={columnTasks}
            onEditTask={onEditTask}
            onDeleteTask={onDeleteTask}
            onStatusChange={onStatusChange}
            onAddTaskToColumn={onAddTaskToColumn}
            onCardDrop={onCardDrop}
          />
        );
      })}
    </div>
  );
};
