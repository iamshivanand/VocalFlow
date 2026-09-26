import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Sparkles, 
  Mic, 
  Kanban, 
  List, 
  Download, 
  HelpCircle,
  ArrowRight
} from 'lucide-react';
import type { TaskTicket, ViewMode } from '../types/task';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: TaskTicket[];
  onSelectTask: (task: TaskTicket) => void;
  onNewTask: () => void;
  onDailyStandup: () => void;
  onToggleVoice: () => void;
  onSwitchView: (mode: ViewMode) => void;
  onExportBackup: () => void;
  onOpenHelp: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  tasks,
  onSelectTask,
  onNewTask,
  onDailyStandup,
  onToggleVoice,
  onSwitchView,
  onExportBackup,
  onOpenHelp,
}) => {
  if (!isOpen) return null;

  const [query, setQuery] = useState('');

  // Global actions
  const actions = [
    { id: 'new-task', title: 'Create New Task', icon: Plus, run: onNewTask },
    { id: 'standup', title: 'Start Daily Standup Briefing', icon: Sparkles, run: onDailyStandup },
    { id: 'voice', title: 'Toggle Voice Microphone', icon: Mic, run: onToggleVoice },
    { id: 'kanban', title: 'Switch to Kanban Board View', icon: Kanban, run: () => onSwitchView('kanban') },
    { id: 'list', title: 'Switch to List / Table View', icon: List, run: () => onSwitchView('list') },
    { id: 'backup', title: 'Export JSON Task Backup', icon: Download, run: onExportBackup },
    { id: 'help', title: 'Voice Commands & Shortcuts', icon: HelpCircle, run: onOpenHelp },
  ];

  const filteredTasks = query
    ? tasks.filter(t => 
        t.title.toLowerCase().includes(query.toLowerCase()) ||
        t.id.toLowerCase().includes(query.toLowerCase()) ||
        t.tags?.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
      ).slice(0, 5)
    : [];

  const filteredActions = query
    ? actions.filter(a => a.title.toLowerCase().includes(query.toLowerCase()))
    : actions;

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      zIndex: 80,
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      paddingTop: '15vh',
    }}>
      <div 
        className="glass-panel animate-slide-down"
        style={{
          width: '100%',
          maxWidth: 580,
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-focus)',
        }}
      >
        {/* Search input header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 18px',
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          <Search size={18} color="var(--text-muted)" />
          <input 
            autoFocus
            type="text"
            placeholder="Type a command or search tickets... (ESC to exit)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              padding: 0,
              fontSize: 15,
              color: 'var(--text-primary)',
              outline: 'none',
              boxShadow: 'none',
            }}
          />
          <kbd>ESC</kbd>
        </div>

        {/* Results Container */}
        <div style={{ maxHeight: 360, overflowY: 'auto', padding: '8px' }}>
          {/* Matching Tickets */}
          {filteredTasks.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', padding: '6px 10px' }}>
                Matching Tickets
              </div>
              {filteredTasks.map((t) => (
                <div
                  key={t.id}
                  onClick={() => {
                    onSelectTask(t);
                    onClose();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    background: 'transparent',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="font-mono" style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{t.id}</span>
                    <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{t.title}</span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                    {t.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', padding: '6px 10px' }}>
              Actions & Navigation
            </div>
            {filteredActions.map((act) => {
              const Icon = act.icon;
              return (
                <div
                  key={act.id}
                  onClick={() => {
                    act.run();
                    onClose();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    background: 'transparent',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Icon size={15} color="var(--accent-primary)" />
                    <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{act.title}</span>
                  </div>
                  <ArrowRight size={13} color="var(--text-muted)" />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
