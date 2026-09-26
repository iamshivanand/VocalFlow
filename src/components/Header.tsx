import React, { useRef } from 'react';
import { 
  Sparkles, 
  Kanban, 
  List, 
  Plus, 
  Download, 
  Upload, 
  RotateCcw, 
  HelpCircle, 
  Volume2, 
  VolumeX, 
  Mic, 
  Flame, 
  Clock, 
  CheckCircle2,
  Search
} from 'lucide-react';
import type { ViewMode, TaskTicket } from '../types/task';
import { soundEffects } from '../utils/audio';

interface HeaderProps {
  tasks: TaskTicket[];
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onNewTaskClick: () => void;
  onDailyStandupClick: () => void;
  onHelpClick: () => void;
  onVoiceToggle: () => void;
  isListening: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onExportBackup: () => void;
  onImportBackup: (file: File) => void;
  onResetData: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  tasks,
  viewMode,
  onViewModeChange,
  onNewTaskClick,
  onDailyStandupClick,
  onHelpClick,
  onVoiceToggle,
  isListening,
  searchQuery,
  onSearchChange,
  onExportBackup,
  onImportBackup,
  onResetData,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isMuted, setIsMuted] = React.useState(false);
  const [showBackupMenu, setShowBackupMenu] = React.useState(false);

  // Stats calculation
  const totalCount = tasks.length;
  const activeCount = tasks.filter(t => t.status === 'in_progress' || t.status === 'todo').length;
  const urgentCount = tasks.filter(t => t.priority === 'urgent' && t.status !== 'done').length;
  
  const todayStr = new Date().toISOString().split('T')[0];
  const dueTodayCount = tasks.filter(t => t.dueDate === todayStr && t.status !== 'done').length;
  const completedCount = tasks.filter(t => t.status === 'done').length;

  const handleToggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    soundEffects.isMuted = nextMute;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportBackup(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setShowBackupMenu(false);
    }
  };

  return (
    <header style={{
      borderBottom: '1px solid var(--border-subtle)',
      background: 'rgba(11, 14, 20, 0.85)',
      backdropFilter: 'blur(16px)',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      padding: '12px 24px',
    }}>
      <div style={{
        maxWidth: 1680,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        {/* Left: Brand & Telemetry stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #6366F1 0%, #4338CA 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(99, 102, 241, 0.4)',
            }}>
              <Sparkles size={20} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-0.02em' }}>VocalFlow</span>
                <span style={{
                  fontSize: 10,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  padding: '2px 6px',
                  borderRadius: 4,
                  background: 'rgba(99, 102, 241, 0.15)',
                  color: '#818CF8',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                }}>Solo Pro</span>
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Voice-Driven High Velocity Tracker</p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 10px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            fontSize: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{totalCount}</span> tasks
            </div>
            <span style={{ color: 'var(--border-subtle)' }}>•</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#38BDF8' }}>
              <span style={{ fontWeight: 700 }}>{activeCount}</span> active
            </div>
            {urgentCount > 0 && (
              <>
                <span style={{ color: 'var(--border-subtle)' }}>•</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#EF4444' }}>
                  <Flame size={13} />
                  <span style={{ fontWeight: 700 }}>{urgentCount}</span> urgent
                </div>
              </>
            )}
            {dueTodayCount > 0 && (
              <>
                <span style={{ color: 'var(--border-subtle)' }}>•</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#EAB308' }}>
                  <Clock size={13} />
                  <span style={{ fontWeight: 700 }}>{dueTodayCount}</span> due today
                </div>
              </>
            )}
            <span style={{ color: 'var(--border-subtle)' }}>•</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10B981' }}>
              <CheckCircle2 size={13} />
              <span style={{ fontWeight: 600 }}>{completedCount}</span> done
            </div>
          </div>
        </div>

        {/* Center: Search & Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 240px', maxWidth: 360 }}>
          <div style={{
            position: 'relative',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
          }}>
            <Search size={14} style={{ position: 'absolute', left: 10, color: 'var(--text-muted)' }} />
            <input 
              type="text"
              placeholder="Search tasks, tags, IDs... (Ctrl+K)"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: 32,
                paddingRight: 60,
                height: 34,
                fontSize: 13,
                borderRadius: 'var(--radius-md)',
              }}
            />
            {searchQuery && (
              <button 
                onClick={() => onSearchChange('')}
                style={{
                  position: 'absolute',
                  right: 8,
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: 11,
                  padding: '2px 6px',
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Right: Actions, Voice HUD Trigger, Standup, View Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Daily Standup Briefing Button */}
          <button
            onClick={onDailyStandupClick}
            title="Listen to Executive Daily Standup Briefing"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(234, 179, 8, 0.12)',
              border: '1px solid rgba(234, 179, 8, 0.35)',
              color: '#FDE047',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <Sparkles size={14} />
            <span>Daily Standup</span>
          </button>

          {/* Voice Microphone Toggle Button */}
          <button
            onClick={onVoiceToggle}
            title="Toggle Voice Command Listening (Alt+V)"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: 'var(--radius-md)',
              background: isListening 
                ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)' 
                : 'rgba(99, 102, 241, 0.15)',
              border: `1px solid ${isListening ? '#EF4444' : 'rgba(99, 102, 241, 0.35)'}`,
              color: isListening ? '#FFFFFF' : '#A5B4FC',
              fontSize: 12,
              fontWeight: 600,
              boxShadow: isListening ? '0 0 16px rgba(239, 68, 68, 0.5)' : 'none',
            }}
          >
            <Mic size={14} className={isListening ? 'animate-bounce' : ''} />
            <span>{isListening ? 'Listening...' : 'Voice (Alt+V)'}</span>
          </button>

          {/* View Mode Switcher */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: 2,
          }}>
            <button
              onClick={() => onViewModeChange('kanban')}
              title="Board / Kanban View"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: 'calc(var(--radius-md) - 2px)',
                border: 'none',
                background: viewMode === 'kanban' ? 'var(--bg-card-hover)' : 'transparent',
                color: viewMode === 'kanban' ? 'var(--text-primary)' : 'var(--text-muted)',
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              <Kanban size={13} />
              <span>Board</span>
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              title="List / Table View"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: 'calc(var(--radius-md) - 2px)',
                border: 'none',
                background: viewMode === 'list' ? 'var(--bg-card-hover)' : 'transparent',
                color: viewMode === 'list' ? 'var(--text-primary)' : 'var(--text-muted)',
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              <List size={13} />
              <span>List</span>
            </button>
          </div>

          {/* New Task Button */}
          <button
            onClick={onNewTaskClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent-primary)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#FFFFFF',
              fontSize: 12,
              fontWeight: 600,
              boxShadow: '0 2px 8px rgba(99, 102, 241, 0.35)',
            }}
          >
            <Plus size={14} />
            <span>New Task</span>
          </button>

          {/* Sound Mute/Unmute */}
          <button
            onClick={handleToggleMute}
            title={isMuted ? "Unmute Sound Feedback" : "Mute Sound Feedback"}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              color: isMuted ? 'var(--text-muted)' : 'var(--text-secondary)',
            }}
          >
            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>

          {/* Backup & Data Menu */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowBackupMenu(!showBackupMenu)}
              title="Storage & Backup Settings"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
              }}
            >
              <Download size={14} />
            </button>

            {showBackupMenu && (
              <div 
                className="animate-slide-down"
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '110%',
                  width: 210,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                  padding: '6px',
                  zIndex: 50,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div style={{ padding: '6px 8px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>
                  LOCAL PERSISTENCE & DATA
                </div>
                <button
                  onClick={() => {
                    onExportBackup();
                    setShowBackupMenu(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '8px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-primary)',
                    fontSize: 12,
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Download size={14} color="#38BDF8" />
                  <span>Export JSON Backup</span>
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '8px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-primary)',
                    fontSize: 12,
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Upload size={14} color="#A855F7" />
                  <span>Import JSON Backup</span>
                </button>
                <button
                  onClick={() => {
                    if (confirm("Reset tasks to default demonstration dataset?")) {
                      onResetData();
                      setShowBackupMenu(false);
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '8px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'none',
                    border: 'none',
                    color: '#EF4444',
                    fontSize: 12,
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <RotateCcw size={14} />
                  <span>Reset Demo Data</span>
                </button>
              </div>
            )}
            <input 
              ref={fileInputRef}
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>

          {/* Help Button */}
          <button
            onClick={onHelpClick}
            title="Voice Commands & Hotkey Cheat Sheet (?)"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
            }}
          >
            <HelpCircle size={14} />
          </button>
        </div>
      </div>
    </header>
  );
};
