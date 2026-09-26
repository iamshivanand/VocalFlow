import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  X, 
  VolumeX, 
  ArrowRight,
  Play,
  RotateCcw
} from 'lucide-react';
import type { TaskTicket } from '../types/task';
import { speechFeedback } from '../utils/speech';
import { soundEffects } from '../utils/audio';

interface DailyStandupModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: TaskTicket[];
  onSelectTask: (task: TaskTicket) => void;
}

export const DailyStandupModal: React.FC<DailyStandupModalProps> = ({
  isOpen,
  onClose,
  tasks,
  onSelectTask,
}) => {
  if (!isOpen) return null;

  const [isSpeaking, setIsSpeaking] = useState(false);

  // Analytics
  const activeTasks = tasks.filter(t => t.status === 'in_progress' || t.status === 'todo');
  const todayStr = new Date().toISOString().split('T')[0];
  const dueTodayTasks = tasks.filter(t => t.dueDate === todayStr && t.status !== 'done');
  const urgentTasks = tasks.filter(t => t.priority === 'urgent' && t.status !== 'done');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');

  // Generate executive briefing script
  const generateBriefingText = () => {
    let script = "Good day! Welcome to your executive daily briefing. ";
    
    if (activeTasks.length === 0) {
      script += "Incredible job! You have zero active tasks right now. Your board is clear.";
      return script;
    }

    script += `You currently have ${activeTasks.length} active tasks. `;

    if (urgentTasks.length > 0) {
      script += `Attention needed: You have ${urgentTasks.length} urgent ticket. ${urgentTasks.map(t => t.title).join(', ')}. `;
    }

    if (dueTodayTasks.length > 0) {
      script += `There are ${dueTodayTasks.length} tasks scheduled for completion today. `;
    }

    if (inProgressTasks.length > 0) {
      script += `You currently have ${inProgressTasks.length} tasks actively in progress: ${inProgressTasks.map(t => t.title).join(', ')}. `;
    }

    script += "Let's focus on high-impact execution today. You've got this!";
    return script;
  };

  const briefingText = generateBriefingText();

  const handleStartAudio = () => {
    setIsSpeaking(true);
    speechFeedback.speak(briefingText, () => {
      setIsSpeaking(false);
    });
  };

  const handleStopAudio = () => {
    speechFeedback.cancel();
    setIsSpeaking(false);
  };

  useEffect(() => {
    handleStartAudio();
    return () => {
      speechFeedback.cancel();
    };
  }, []);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(12px)',
      zIndex: 70,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
    }}>
      <div 
        className="glass-panel animate-slide-down"
        style={{
          width: '100%',
          maxWidth: 640,
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
          background: 'var(--bg-surface)',
          border: '1px solid rgba(234, 179, 8, 0.3)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(234, 179, 8, 0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #EAB308 0%, #CA8A04 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(234, 179, 8, 0.4)',
            }}>
              <Sparkles size={18} color="#000000" />
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Executive Daily Standup</h3>
              <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Audio Briefing & Active Prioritization</p>
            </div>
          </div>

          <button
            onClick={() => {
              handleStopAudio();
              onClose();
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              padding: 4,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Audio Player Bar */}
        <div style={{
          padding: '12px 20px',
          background: 'var(--bg-card)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={isSpeaking ? handleStopAudio : handleStartAudio}
              style={{
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-full)',
                background: isSpeaking ? '#EF4444' : 'var(--accent-primary)',
                border: 'none',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              {isSpeaking ? <VolumeX size={16} /> : <Play size={14} style={{ marginLeft: 2 }} />}
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              {[0.6, 1, 0.8, 0.4, 0.9].map((m, i) => (
                <span
                  key={i}
                  style={{
                    width: 3,
                    height: isSpeaking ? `${16 * m}px` : '4px',
                    borderRadius: 2,
                    background: isSpeaking ? '#EAB308' : 'var(--border-focus)',
                    transition: 'height 0.1s ease',
                  }}
                />
              ))}
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: isSpeaking ? '#FDE047' : 'var(--text-muted)' }}>
              {isSpeaking ? 'Playing Voice Briefing...' : 'Click to hear audio briefing'}
            </span>
          </div>

          <button
            onClick={handleStartAudio}
            title="Restart speech"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
            }}
          >
            <RotateCcw size={12} />
            <span>Replay</span>
          </button>
        </div>

        {/* Modal Content */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Spoken Text Transcript Quote */}
          <div style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            fontSize: 13,
            lineHeight: 1.5,
            color: 'var(--text-secondary)',
            fontStyle: 'italic',
          }}>
            "{briefingText}"
          </div>

          {/* Key Metric Highlights */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            <div style={{
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#38BDF8' }}>{activeTasks.length}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 2 }}>Active Tasks</div>
            </div>

            <div style={{
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#EF4444' }}>{urgentTasks.length}</div>
              <div style={{ fontSize: 11, color: '#FCA5A5', textTransform: 'uppercase', marginTop: 2 }}>Urgent Items</div>
            </div>

            <div style={{
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#EAB308' }}>{dueTodayTasks.length}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 2 }}>Due Today</div>
            </div>
          </div>

          {/* Recommended Immediate Action Items */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
              Top Priority Focus for Today
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {activeTasks.slice(0, 3).map((t) => (
                <div
                  key={t.id}
                  onClick={() => {
                    handleStopAudio();
                    onSelectTask(t);
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
                    cursor: 'pointer',
                    transition: 'all 0.12s',
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.id}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{t.title}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
                    <span style={{ fontSize: 11, textTransform: 'capitalize' }}>{t.status.replace('_', ' ')}</span>
                    <ArrowRight size={12} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Modal Footer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8 }}>
            <button
              onClick={() => {
                handleStopAudio();
                soundEffects.playSuccessChord();
                onClose();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 24px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, #6366F1 0%, #4338CA 100%)',
                border: 'none',
                color: '#FFFFFF',
                fontSize: 13,
                fontWeight: 700,
                boxShadow: '0 2px 14px rgba(99, 102, 241, 0.4)',
                cursor: 'pointer',
              }}
            >
              <span>Let's Crush It!</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
