import React from 'react';
import type { 
  TaskTicket, 
  Status, 
  Priority, 
  FilterState 
} from '../types/task';
import { 
  Trash2, 
  Edit3, 
  Flame, 
  AlertTriangle, 
  Calendar,
  ArrowUpDown,
  Bot,
  User
} from 'lucide-react';

interface ListViewProps {
  tasks: TaskTicket[];
  filters: FilterState;
  onEditTask: (task: TaskTicket) => void;
  onDeleteTask: (id: string) => void;
  onStatusChange: (id: string, newStatus: Status) => void;
  onSortChange: (sortBy: FilterState['sortBy']) => void;
}

export const ListView: React.FC<ListViewProps> = ({
  tasks,
  filters,
  onEditTask,
  onDeleteTask,
  onStatusChange,
  onSortChange,
}) => {
  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchId = task.id.toLowerCase().includes(q);
      const matchDesc = task.description?.toLowerCase().includes(q);
      const matchTag = task.tags?.some(t => t.toLowerCase().includes(q));
      if (!matchTitle && !matchId && !matchDesc && !matchTag) return false;
    }
    if (filters.priority !== 'all' && task.priority !== filters.priority) return false;
    if (filters.status !== 'all' && task.status !== filters.status) return false;
    if (filters.tag !== 'all' && !task.tags?.includes(filters.tag)) return false;
    if (filters.creatorType && filters.creatorType !== 'all') {
      if (task.createdBy?.type !== filters.creatorType) return false;
    }
    return true;
  });

  const getPriorityBadge = (priority: Priority) => {
    switch (priority) {
      case 'urgent':
        return (
          <span style={{ color: 'var(--color-urgent)', display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 700 }}>
            <Flame size={12} /> Urgent
          </span>
        );
      case 'high':
        return (
          <span style={{ color: 'var(--color-high)', display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 700 }}>
            <AlertTriangle size={12} /> High
          </span>
        );
      case 'medium':
        return (
          <span style={{ color: 'var(--color-medium)', fontSize: 11, fontWeight: 600 }}>Medium</span>
        );
      case 'low':
        return (
          <span style={{ color: 'var(--color-low)', fontSize: 11, fontWeight: 600 }}>Low</span>
        );
    }
  };

  return (
    <div style={{
      maxWidth: 1680,
      margin: '0 auto',
      padding: '24px 24px 100px 24px',
    }}>
      <div 
        className="glass-panel"
        style={{
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
          <thead>
            <tr style={{
              background: 'var(--bg-surface)',
              borderBottom: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              <th style={{ padding: '12px 16px', width: 90 }}>
                <button 
                  onClick={() => onSortChange('id')}
                  style={{ background: 'none', border: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: 4, font: 'inherit', cursor: 'pointer' }}
                >
                  <span>Key</span>
                  <ArrowUpDown size={11} />
                </button>
              </th>
              <th style={{ padding: '12px 16px', width: 140 }}>Status</th>
              <th style={{ padding: '12px 16px' }}>
                <button 
                  onClick={() => onSortChange('title')}
                  style={{ background: 'none', border: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: 4, font: 'inherit', cursor: 'pointer' }}
                >
                  <span>Title</span>
                  <ArrowUpDown size={11} />
                </button>
              </th>
              <th style={{ padding: '12px 16px', width: 160 }}>Creator / Agent</th>
              <th style={{ padding: '12px 16px', width: 110 }}>
                <button 
                  onClick={() => onSortChange('priority')}
                  style={{ background: 'none', border: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: 4, font: 'inherit', cursor: 'pointer' }}
                >
                  <span>Priority</span>
                  <ArrowUpDown size={11} />
                </button>
              </th>
              <th style={{ padding: '12px 16px', width: 140 }}>Tags</th>
              <th style={{ padding: '12px 16px', width: 130 }}>
                <button 
                  onClick={() => onSortChange('dueDate')}
                  style={{ background: 'none', border: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: 4, font: 'inherit', cursor: 'pointer' }}
                >
                  <span>Due Date</span>
                  <ArrowUpDown size={11} />
                </button>
              </th>
              <th style={{ padding: '12px 16px', width: 90, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No tasks found matching your filter criteria.
                </td>
              </tr>
            ) : (
              filteredTasks.map((task) => {
                const isAgent = task.createdBy?.type === 'agent';
                const creatorName = task.createdBy?.name || 'Team Member';

                return (
                  <tr
                    key={task.id}
                    onClick={() => onEditTask(task)}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      transition: 'background-color 0.12s ease',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    {/* Task Key */}
                    <td style={{ padding: '12px 16px' }}>
                      <span 
                        className="font-mono"
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: 'var(--text-secondary)',
                          padding: '2px 5px',
                          borderRadius: 4,
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        {task.id}
                      </span>
                    </td>

                    {/* Status Dropdown */}
                    <td style={{ padding: '12px 16px' }} onClick={(e) => e.stopPropagation()}>
                      <select
                        value={task.status}
                        onChange={(e) => onStatusChange(task.id, e.target.value as Status)}
                        style={{
                          padding: '3px 8px',
                          fontSize: 11,
                          fontWeight: 600,
                          borderRadius: 'var(--radius-full)',
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-primary)',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="backlog">Backlog</option>
                        <option value="todo">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="in_review">In Review</option>
                        <option value="done">Done</option>
                      </select>
                    </td>

                    {/* Title & Subtasks snippet */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          fontWeight: 600,
                          color: task.status === 'done' ? 'var(--text-muted)' : 'var(--text-primary)',
                          textDecoration: task.status === 'done' ? 'line-through' : 'none',
                        }}>
                          {task.title}
                        </span>
                        {task.subtasks?.length > 0 && (
                          <span 
                            className="font-mono"
                            style={{
                              fontSize: 10,
                              padding: '1px 5px',
                              borderRadius: 4,
                              background: 'var(--bg-surface)',
                              color: 'var(--text-muted)',
                              border: '1px solid var(--border-subtle)',
                            }}
                          >
                            {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Creator / Agent Attribution */}
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 11,
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        background: isAgent ? 'rgba(168, 85, 247, 0.15)' : 'rgba(56, 189, 248, 0.12)',
                        color: isAgent ? '#C084FC' : '#38BDF8',
                        border: `1px solid ${isAgent ? 'rgba(168, 85, 247, 0.35)' : 'rgba(56, 189, 248, 0.25)'}`,
                      }}>
                        {isAgent ? <Bot size={12} /> : <User size={12} />}
                        <span>{isAgent ? `Agent: ${creatorName}` : creatorName}</span>
                      </span>
                    </td>

                    {/* Priority */}
                    <td style={{ padding: '12px 16px' }}>
                      {getPriorityBadge(task.priority)}
                    </td>

                    {/* Tags */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {task.tags?.slice(0, 2).map((t, idx) => (
                          <span
                            key={idx}
                            style={{
                              fontSize: 10,
                              padding: '1px 5px',
                              borderRadius: 4,
                              background: 'var(--bg-surface)',
                              color: 'var(--text-secondary)',
                              border: '1px solid var(--border-subtle)',
                            }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Due Date */}
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: 12 }}>
                      {task.dueDate ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Calendar size={12} color="var(--text-muted)" />
                          <span>{task.dueDate}</span>
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-faint)' }}>—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '12px 16px', textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                        <button
                          onClick={() => onEditTask(task)}
                          title="Edit Task"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-muted)',
                            padding: 4,
                            borderRadius: 4,
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => onDeleteTask(task.id)}
                          title="Delete Task"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-muted)',
                            padding: 4,
                            borderRadius: 4,
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.color = '#EF4444'}
                          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
