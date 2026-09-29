import React, { useState, useEffect } from 'react';
import { 
  X, 
  Trash2, 
  Plus, 
  Tag as TagIcon, 
  Bot, 
  User, 
  History 
} from 'lucide-react';
import type { TaskTicket, Status, Priority, Subtask, TaskHistoryItem } from '../types/task';
import { soundEffects } from '../utils/audio';
import { api } from '../utils/api';

interface TaskDetailModalProps {
  task: TaskTicket | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedTask: TaskTicket) => void;
  onDelete: (id: string) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  if (!isOpen || !task) return null;

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [status, setStatus] = useState<Status>(task.status);
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [dueDate, setDueDate] = useState(task.dueDate || '');
  const [tags, setTags] = useState<string[]>(task.tags || []);
  const [newTagInput, setNewTagInput] = useState('');
  const [subtasks, setSubtasks] = useState<Subtask[]>(task.subtasks || []);
  const [newSubtaskInput, setNewSubtaskInput] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');
  const [historyItems, setHistoryItems] = useState<TaskHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    if (task?.id) {
      setIsLoadingHistory(true);
      api.getTaskHistory(task.id)
        .then(items => setHistoryItems(items))
        .catch(() => setHistoryItems([]))
        .finally(() => setIsLoadingHistory(false));
    }
  }, [task?.id]);

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTagInput.trim()) {
      e.preventDefault();
      const clean = newTagInput.trim().toLowerCase();
      if (!tags.includes(clean)) {
        setTags([...tags, clean]);
      }
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSubtaskInput.trim()) {
      const newSub: Subtask = {
        id: `sub-${Date.now()}`,
        title: newSubtaskInput.trim(),
        completed: false,
      };
      setSubtasks([...subtasks, newSub]);
      setNewSubtaskInput('');
      soundEffects.playDropClick();
    }
  };

  const handleToggleSubtask = (id: string) => {
    setSubtasks(subtasks.map(s => s.id === id ? { ...s, completed: !s.completed } : s));
    soundEffects.playDropClick();
  };

  const handleDeleteSubtask = (id: string) => {
    setSubtasks(subtasks.filter(s => s.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const updated: TaskTicket = {
      ...task,
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      dueDate: dueDate || undefined,
      tags,
      subtasks,
      updatedAt: new Date().toISOString(),
    };

    onSave(updated);
    soundEffects.playSuccessChord();
    onClose();
  };

  const isAgent = task.createdBy?.type === 'agent';
  const creatorName = task.createdBy?.name || 'Team Member';

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      zIndex: 60,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
    }}>
      <div 
        className="glass-panel animate-slide-down"
        style={{
          width: '100%',
          maxWidth: 680,
          maxHeight: '90vh',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span 
              className="font-mono"
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--text-secondary)',
                padding: '2px 8px',
                borderRadius: 4,
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              {task.id}
            </span>

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
              <span>{isAgent ? `Created by Agent: ${creatorName}` : `Created by: ${creatorName}`}</span>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => {
                if (confirm(`Delete task ${task.id}?`)) {
                  onDelete(task.id);
                  onClose();
                }
              }}
              title="Delete ticket"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                padding: 6,
                borderRadius: 4,
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#EF4444'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              <Trash2 size={16} />
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                padding: 6,
                borderRadius: 4,
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-card)',
          padding: '0 20px',
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            style={{
              padding: '10px 16px',
              fontSize: 12,
              fontWeight: 600,
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'details' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              color: activeTab === 'details' ? 'var(--text-primary)' : 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            Ticket Specifications
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 16px',
              fontSize: 12,
              fontWeight: 600,
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'history' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              color: activeTab === 'history' ? 'var(--text-primary)' : 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            <History size={13} />
            <span>Audit History & Activity ({historyItems.length})</span>
          </button>
        </div>

        {activeTab === 'details' ? (
          <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                Task Title
              </label>
              <input 
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Implement Webhook Verification"
                required
                style={{
                  width: '100%',
                  fontSize: 15,
                  fontWeight: 600,
                  padding: '10px 14px',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                  Status Lane
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Status)}
                  style={{ width: '100%', padding: '8px 12px' }}
                >
                  <option value="backlog">Backlog</option>
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="in_review">In Review</option>
                  <option value="done">Done</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  style={{ width: '100%', padding: '8px 12px' }}
                >
                  <option value="urgent">🔴 Urgent</option>
                  <option value="high">🟠 High</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="low">🔵 Low</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                Due Date & Reminders
              </label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input 
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  style={{ flex: 1, padding: '8px 12px' }}
                />
                <button
                  type="button"
                  onClick={() => setDueDate(new Date().toISOString().split('T')[0])}
                  style={{
                    padding: '8px 12px',
                    fontSize: 12,
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    setDueDate(tomorrow.toISOString().split('T')[0]);
                  }}
                  style={{
                    padding: '8px 12px',
                    fontSize: 12,
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Tomorrow
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                Description & Implementation Notes
              </label>
              <textarea 
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add comprehensive task specifications, curl commands, test steps..."
                style={{
                  width: '100%',
                  resize: 'vertical',
                  lineHeight: 1.5,
                }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Checklist / Subtasks ({subtasks.filter(s => s.completed).length}/{subtasks.length})
                </label>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                {subtasks.map((sub) => (
                  <div 
                    key={sub.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flex: 1 }}>
                      <input 
                        type="checkbox"
                        checked={sub.completed}
                        onChange={() => handleToggleSubtask(sub.id)}
                        style={{ cursor: 'pointer', accentColor: 'var(--accent-primary)' }}
                      />
                      <span style={{
                        fontSize: 13,
                        color: sub.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                        textDecoration: sub.completed ? 'line-through' : 'none',
                      }}>
                        {sub.title}
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleDeleteSubtask(sub.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', padding: 2 }}
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 6 }}>
                <input 
                  type="text"
                  placeholder="Add subtask item..."
                  value={newSubtaskInput}
                  onChange={(e) => setNewSubtaskInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSubtask(e);
                    }
                  }}
                  style={{ flex: 1, height: 32, fontSize: 12 }}
                />
                <button
                  type="button"
                  onClick={handleAddSubtask}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '0 12px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: 12,
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <Plus size={13} />
                  <span>Add</span>
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                Tags (Press Enter to add)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                {tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '2px 8px',
                      borderRadius: 4,
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-secondary)',
                      fontSize: 11,
                    }}
                  >
                    <TagIcon size={10} />
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', padding: 0, cursor: 'pointer' }}
                    >
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
              <input 
                type="text"
                placeholder="e.g. backend, frontend, security..."
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                style={{ width: '100%', height: 32, fontSize: 12 }}
              />
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 10,
              paddingTop: 8,
            }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: '8px 20px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--accent-primary)',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: 13,
                  fontWeight: 600,
                  boxShadow: '0 2px 10px rgba(99, 102, 241, 0.4)',
                }}
              >
                Save Changes
              </button>
            </div>
          </form>
        ) : (
          <div style={{ overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
              Chronological log of all modifications made to this ticket by team members and AI agents:
            </div>

            {isLoadingHistory ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>Loading audit history...</div>
            ) : historyItems.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                No audit entries recorded yet.
              </div>
            ) : (
              historyItems.map((item, idx) => {
                const itemIsAgent = item.actorType === 'agent';
                return (
                  <div
                    key={item.id || idx}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: itemIsAgent ? 'rgba(168, 85, 247, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                      color: itemIsAgent ? '#C084FC' : '#38BDF8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: 2,
                    }}>
                      {itemIsAgent ? <Bot size={14} /> : <User size={14} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                          {item.actorName}
                        </span>
                        <span style={{ fontSize: 10, color: 'var(--text-faint)' }}>
                          {new Date(item.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        {item.action === 'created' && `Created ticket in ${item.details?.status || 'todo'} lane`}
                        {item.action === 'status_changed' && `Moved status: ${item.details?.status?.from || ''} ➔ ${item.details?.status?.to || ''}`}
                        {item.action === 'priority_changed' && `Changed priority: ${item.details?.priority?.from || ''} ➔ ${item.details?.priority?.to || ''}`}
                        {item.action === 'edited' && `Updated ticket details`}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};
