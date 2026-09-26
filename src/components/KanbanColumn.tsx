import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import type { TaskTicket, Status, ColumnDefinition } from '../types/task';
import { TaskCard } from './TaskCard';
import { soundEffects } from '../utils/audio';

interface KanbanColumnProps {
  column: ColumnDefinition;
  tasks: TaskTicket[];
  onEditTask: (task: TaskTicket) => void;
  onDeleteTask: (id: string) => void;
  onStatusChange: (id: string, newStatus: Status) => void;
  onAddTaskToColumn: (status: Status) => void;
  onCardDrop: (taskId: string, targetStatus: Status) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  column,
  tasks,
  onEditTask,
  onDeleteTask,
  onStatusChange,
  onAddTaskToColumn,
  onCardDrop,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      soundEffects.playDropClick();
      onCardDrop(taskId, column.id);
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setIsDragOver(false);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        flex: '1 1 300px',
        minWidth: 280,
        maxWidth: 360,
        background: isDragOver ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-surface)',
        border: `1px solid ${isDragOver ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 120px)',
        minHeight: 520,
        transition: 'all 0.15s ease',
        boxShadow: isDragOver ? '0 0 20px rgba(99, 102, 241, 0.2)' : 'none',
      }}
    >
      {/* Column Header */}
      <div style={{
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: column.color,
            boxShadow: `0 0 8px ${column.color}`,
          }} />
          <h3 style={{ fontSize: 13, fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>
            {column.title}
          </h3>
          <span 
            className="font-mono"
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: '1px 6px',
              borderRadius: 'var(--radius-full)',
              background: column.badgeBg,
              color: column.color,
            }}
          >
            {tasks.length}
          </span>
        </div>

        {/* Quick Add Button */}
        <button
          onClick={() => onAddTaskToColumn(column.id)}
          title={`Add task to ${column.title}`}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            width: 24,
            height: 24,
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--text-primary)';
            e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-muted)';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <Plus size={15} />
        </button>
      </div>

      {/* Cards Scroll Container */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px 10px',
      }}>
        {tasks.length === 0 ? (
          <div style={{
            height: 120,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            fontSize: 12,
            border: '1px dashed var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            margin: '8px 0',
            textAlign: 'center',
            padding: 10,
          }}>
            <span>No tasks in this lane</span>
            <span style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 4 }}>Drag cards here or click +</span>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
              onStatusChange={onStatusChange}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            />
          ))
        )}
      </div>
    </div>
  );
};
