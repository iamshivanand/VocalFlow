import React from 'react';
import { 
  Flame, 
  AlertTriangle, 
  CheckSquare, 
  Tag as TagIcon, 
  MoreHorizontal, 
  Trash2,
  Calendar,
  Bot,
  User
} from 'lucide-react';
import type { TaskTicket, Priority, Status } from '../types/task';
import { soundEffects } from '../utils/audio';

interface TaskCardProps {
  task: TaskTicket;
  onEdit: (task: TaskTicket) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, newStatus: Status) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnd: (e: React.DragEvent) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onEdit,
  onDelete,
  onStatusChange,
  onDragStart,
  onDragEnd,
}) => {
  const [showMenu, setShowMenu] = React.useState(false);

  const getPriorityBadge = (priority: Priority) => {
    switch (priority) {
      case 'urgent':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
            fontSize: 10,
            fontWeight: 700,
            textTransform: 'uppercase',
            padding: '2px 6px',
            borderRadius: 4,
            background: 'var(--color-urgent-bg)',
            color: 'var(--color-urgent)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
          }}>
            <Flame size={11} />
            <span>Urgent</span>
          </span>
        );
      case 'high':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
            fontSize: 10,
            fontWeight: 700,
            textTransform: 'uppercase',
            padding: '2px 6px',
            borderRadius: 4,
            background: 'var(--color-high-bg)',
            color: 'var(--color-high)',
            border: '1px solid rgba(249, 115, 22, 0.3)',
          }}>
            <AlertTriangle size={11} />
            <span>High</span>
          </span>
        );
      case 'medium':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
            fontSize: 10,
            fontWeight: 600,
            padding: '2px 6px',
            borderRadius: 4,
            background: 'var(--color-medium-bg)',
            color: 'var(--color-medium)',
            border: '1px solid rgba(234, 179, 8, 0.3)',
          }}>
            <span>Med</span>
          </span>
        );
      case 'low':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
            fontSize: 10,
            fontWeight: 600,
            padding: '2px 6px',
            borderRadius: 4,
            background: 'var(--color-low-bg)',
            color: 'var(--color-low)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
          }}>
            <span>Low</span>
          </span>
        );
    }
  };

  const getDueDateInfo = (dueDate?: string) => {
    if (!dueDate) return null;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const isToday = dueDate === todayStr;
    const isOverdue = dueDate < todayStr && task.status !== 'done';

    return {
      text: isToday ? 'Today' : dueDate,
      isToday,
      isOverdue,
    };
  };

  const dueInfo = getDueDateInfo(task.dueDate);
  const totalSubtasks = task.subtasks?.length || 0;
  const completedSubtasks = task.subtasks?.filter(s => s.completed).length || 0;

  // Actor attribution
  const isAgent = task.createdBy?.type === 'agent';
  const creatorName = task.createdBy?.name || 'Team Member';

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      onDragEnd={onDragEnd}
      onClick={() => onEdit(task)}
      style={{
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
        padding: '12px 14px',
        marginBottom: '10px',
        cursor: 'grab',
        transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
        boxShadow: 'var(--shadow-sm)',
        position: 'relative',
        userSelect: 'none',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.borderColor = 'var(--border-focus)';
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = 'var(--border-subtle)';
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
      }}
    >
      {/* Top Header: ID, Priority, and Quick Menu */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span 
            className="font-mono"
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--text-muted)',
              padding: '1px 5px',
              borderRadius: 4,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            {task.id}
          </span>
          {getPriorityBadge(task.priority)}
        </div>

        {/* Quick Menu Button */}
        <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              padding: '2px 4px',
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <MoreHorizontal size={14} />
          </button>

          {showMenu && (
            <div 
              className="animate-slide-down"
              style={{
                position: 'absolute',
                right: 0,
                top: '100%',
                width: 150,
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                boxShadow: 'var(--shadow-lg)',
                padding: 4,
                zIndex: 20,
              }}
            >
              <div style={{ fontSize: 10, color: 'var(--text-muted)', padding: '4px 6px', fontWeight: 600 }}>MOVE STATUS</div>
              {(['backlog', 'todo', 'in_progress', 'in_review', 'done'] as Status[]).map((st) => (
                <button
                  key={st}
                  onClick={() => {
                    onStatusChange(task.id, st);
                    soundEffects.playDropClick();
                    setShowMenu(false);
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '4px 8px',
                    fontSize: 11,
                    textAlign: 'left',
                    background: task.status === st ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                    color: task.status === st ? '#818CF8' : 'var(--text-secondary)',
                    border: 'none',
                    borderRadius: 3,
                  }}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
              <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 0' }} />
              <button
                onClick={() => {
                  onDelete(task.id);
                  setShowMenu(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  width: '100%',
                  padding: '4px 8px',
                  fontSize: 11,
                  textAlign: 'left',
                  background: 'transparent',
                  color: '#EF4444',
                  border: 'none',
                  borderRadius: 3,
                }}
              >
                <Trash2 size={11} />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Task Title */}
      <h4 style={{
        fontSize: 13,
        fontWeight: 600,
        lineHeight: 1.4,
        color: task.status === 'done' ? 'var(--text-muted)' : 'var(--text-primary)',
        textDecoration: task.status === 'done' ? 'line-through' : 'none',
        marginBottom: '6px',
      }}>
        {task.title}
      </h4>

      {/* Description Snippet */}
      {task.description && (
        <p style={{
          fontSize: 12,
          color: 'var(--text-secondary)',
          lineHeight: 1.35,
          marginBottom: '10px',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {task.description}
        </p>
      )}

      {/* Subtasks Progress Bar */}
      {totalSubtasks > 0 && (
        <div style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <CheckSquare size={12} />
              <span>Subtasks</span>
            </span>
            <span className="font-mono">{completedSubtasks}/{totalSubtasks}</span>
          </div>
          <div style={{
            width: '100%',
            height: 4,
            borderRadius: 2,
            background: 'var(--bg-surface)',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${(completedSubtasks / totalSubtasks) * 100}%`,
              height: '100%',
              background: completedSubtasks === totalSubtasks ? '#10B981' : '#6366F1',
              transition: 'width 0.2s',
            }} />
          </div>
        </div>
      )}

      {/* Creator Attribution Pill (Agent vs Human) */}
      <div style={{ marginBottom: '10px' }}>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 10,
          fontWeight: 600,
          padding: '2px 7px',
          borderRadius: 'var(--radius-full)',
          background: isAgent ? 'rgba(168, 85, 247, 0.15)' : 'rgba(56, 189, 248, 0.12)',
          color: isAgent ? '#C084FC' : '#38BDF8',
          border: `1px solid ${isAgent ? 'rgba(168, 85, 247, 0.35)' : 'rgba(56, 189, 248, 0.25)'}`,
          boxShadow: isAgent ? '0 0 10px rgba(168, 85, 247, 0.15)' : 'none',
        }}>
          {isAgent ? <Bot size={11} /> : <User size={11} />}
          <span>{isAgent ? `Agent: ${creatorName}` : creatorName}</span>
        </span>
      </div>

      {/* Footer: Tags and Due Date Badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
          {task.tags?.slice(0, 3).map((tag, idx) => (
            <span
              key={idx}
              style={{
                fontSize: 10,
                padding: '1px 6px',
                borderRadius: 4,
                background: 'var(--bg-surface)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <TagIcon size={9} />
              <span>{tag}</span>
            </span>
          ))}
          {task.tags?.length > 3 && (
            <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>+{task.tags.length - 3}</span>
          )}
        </div>

        {dueInfo && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 10,
            fontWeight: 600,
            padding: '2px 6px',
            borderRadius: 4,
            background: dueInfo.isOverdue 
              ? 'rgba(239, 68, 68, 0.15)' 
              : dueInfo.isToday 
                ? 'rgba(234, 179, 8, 0.15)' 
                : 'var(--bg-surface)',
            color: dueInfo.isOverdue 
              ? '#EF4444' 
              : dueInfo.isToday 
                ? '#EAB308' 
                : 'var(--text-muted)',
            border: `1px solid ${dueInfo.isOverdue ? 'rgba(239, 68, 68, 0.3)' : dueInfo.isToday ? 'rgba(234, 179, 8, 0.3)' : 'var(--border-subtle)'}`,
          }}>
            <Calendar size={10} />
            <span>{dueInfo.text}</span>
          </div>
        )}
      </div>
    </div>
  );
};
