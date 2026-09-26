import React from 'react';
import { X, Mic, Keyboard } from 'lucide-react';

interface VoiceHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSimulateCommand: (command: string) => void;
}

export const VoiceHelpModal: React.FC<VoiceHelpModalProps> = ({
  isOpen,
  onClose,
  onSimulateCommand,
}) => {
  if (!isOpen) return null;

  const sampleCommands = [
    {
      category: "1. Create Tasks With Priority & Due Dates",
      commands: [
        "Create urgent task Fix Stripe checkout webhook due today",
        "Add high priority ticket Redesign landing page header due tomorrow",
        "New task Write test suites for authentication tag backend",
        "Task review pull requests and update dependencies",
      ],
    },
    {
      category: "2. Change Ticket Status (Hands-Free)",
      commands: [
        "Move task 101 to in progress",
        "Mark task 102 as completed",
        "Move ticket TK-104 to in review",
        "Send task 107 back to backlog",
      ],
    },
    {
      category: "3. Update Priority & Remove Tasks",
      commands: [
        "Set task 103 priority to urgent",
        "Delete task 106",
      ],
    },
    {
      category: "4. Executive Daily Standup & Briefing",
      commands: [
        "Brief me on today's tasks",
        "Daily standup",
        "What are my active tasks",
      ],
    },
    {
      category: "5. Search & Filter",
      commands: [
        "Search frontend",
        "Clear filters",
      ],
    },
  ];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      zIndex: 85,
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
          overflow: 'hidden',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
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
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Mic size={16} color="#FFFFFF" />
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700 }}>Voice Commands & Hotkeys Guide</h3>
              <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Natural Speech Patterns & Pro Shortcuts</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Keyboard Hotkeys Bar */}
          <div style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 16,
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <Keyboard size={14} color="var(--text-secondary)" />
              <span style={{ color: 'var(--text-secondary)' }}>Toggle Voice Mic:</span>
              <kbd>Alt + V</kbd>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Command Palette:</span>
              <kbd>Ctrl + K</kbd>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <span style={{ color: 'var(--text-secondary)' }}>New Task:</span>
              <kbd>C</kbd>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Daily Standup:</span>
              <kbd>B</kbd>
            </div>
          </div>

          <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Click any phrase below to test execute it directly, or speak it aloud into your microphone:
          </div>

          {/* Sample Commands List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {sampleCommands.map((group, gIdx) => (
              <div key={gIdx}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                  {group.category}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {group.commands.map((cmd, cIdx) => (
                    <button
                      key={cIdx}
                      onClick={() => {
                        onSimulateCommand(cmd);
                        onClose();
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-primary)',
                        fontSize: 12,
                        textAlign: 'left',
                        transition: 'all 0.12s',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--accent-primary)';
                        e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-subtle)';
                        e.currentTarget.style.backgroundColor = 'var(--bg-card)';
                      }}
                    >
                      <span className="font-mono">"{cmd}"</span>
                      <span style={{ fontSize: 10, color: 'var(--accent-primary)', fontWeight: 600 }}>Try ➔</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
