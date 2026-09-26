import React, { useState } from 'react';
import { Mic, MicOff, AlertCircle, Send, Radio } from 'lucide-react';
import type { VoiceCommandResult } from '../types/task';

interface VoiceHUDProps {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  lastCommand: VoiceCommandResult | null;
  audioLevel: number;
  errorMessage: string | null;
  onToggleListening: () => void;
  onSimulateCommand: (commandText: string) => void;
}

export const VoiceHUD: React.FC<VoiceHUDProps> = ({
  isListening,
  transcript,
  interimTranscript,
  lastCommand,
  audioLevel,
  errorMessage,
  onToggleListening,
  onSimulateCommand,
}) => {
  const [manualInput, setManualInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      onSimulateCommand(manualInput.trim());
      setManualInput('');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 45,
      width: '90%',
      maxWidth: 640,
    }}>
      <div 
        className="glass-panel"
        style={{
          borderRadius: 'var(--radius-lg)',
          boxShadow: isListening ? '0 0 35px rgba(239, 68, 68, 0.35)' : 'var(--shadow-lg)',
          border: isListening ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border-subtle)',
          padding: '12px 18px',
          transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>
          {/* Mic Button & Waveform */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={onToggleListening}
              style={{
                width: 40,
                height: 40,
                borderRadius: 'var(--radius-full)',
                background: isListening 
                  ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)' 
                  : 'var(--bg-card-hover)',
                border: isListening ? '2px solid #FCA5A5' : '1px solid var(--border-focus)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                boxShadow: isListening ? '0 0 15px rgba(239, 68, 68, 0.6)' : 'none',
              }}
            >
              {isListening ? <Mic size={20} className="animate-pulse" /> : <MicOff size={18} color="var(--text-muted)" />}
            </button>

            {/* Live Audio Visualizer Bars */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', height: 26, width: 44 }}>
              {[0.4, 0.8, 1.0, 0.7, 0.3].map((multiplier, idx) => {
                const height = isListening ? Math.max(4, audioLevel * 24 * multiplier) : 4;
                return (
                  <span
                    key={idx}
                    style={{
                      width: 4,
                      height: `${height}px`,
                      borderRadius: 2,
                      backgroundColor: isListening ? '#EF4444' : 'var(--border-focus)',
                      transition: 'height 0.08s ease-in-out',
                    }}
                  />
                );
              })}
            </div>

            {/* Status text or live speech */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: isListening ? '#EF4444' : 'var(--text-muted)' }}>
                  {isListening ? 'LIVE VOICE STREAM' : 'VOICE HUD (STANDBY)'}
                </span>
                <span style={{ fontSize: 10, color: 'var(--text-faint)' }}>• Alt+V</span>
              </div>
              <div style={{
                fontSize: 13,
                fontWeight: 500,
                color: isListening ? 'var(--text-primary)' : 'var(--text-secondary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: 280,
              }}>
                {interimTranscript ? (
                  <span style={{ color: '#38BDF8', fontStyle: 'italic' }}>"{interimTranscript}..."</span>
                ) : transcript ? (
                  <span>"{transcript}"</span>
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>
                    {isListening ? "Listening... say 'Create task ...' or 'Move task to done'" : "Click mic or press Alt+V to speak"}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions / Simulated Command Input Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 11,
                padding: '4px 8px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Radio size={12} />
              <span>{isExpanded ? 'Hide Test Bar' : 'Test Command'}</span>
            </button>
          </div>
        </div>

        {/* Error notice if microphone is blocked */}
        {errorMessage && (
          <div style={{
            marginTop: 8,
            padding: '6px 10px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: 12,
            color: '#FCA5A5',
          }}>
            <AlertCircle size={14} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Last executed command banner */}
        {lastCommand && (
          <div style={{
            marginTop: 8,
            padding: '6px 10px',
            borderRadius: 'var(--radius-sm)',
            background: lastCommand.intent === 'unknown' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
            border: `1px solid ${lastCommand.intent === 'unknown' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(16, 185, 129, 0.25)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                padding: '1px 5px',
                borderRadius: 3,
                background: lastCommand.intent === 'unknown' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)',
                color: lastCommand.intent === 'unknown' ? '#F87171' : '#34D399',
              }}>
                {lastCommand.intent}
              </span>
              <span style={{ color: 'var(--text-primary)' }}>{lastCommand.feedbackMessage}</span>
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Confirmed</span>
          </div>
        )}

        {/* Expandable Simulated Text Command Bar */}
        {isExpanded && (
          <form 
            onSubmit={handleManualSubmit}
            style={{
              marginTop: 10,
              paddingTop: 10,
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              gap: '6px',
            }}
          >
            <input 
              type="text"
              placeholder="Simulate speech: e.g. 'add urgent task fix prod bug due tomorrow'"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              style={{
                flex: 1,
                height: 32,
                fontSize: 12,
                borderRadius: 'var(--radius-sm)',
              }}
            />
            <button
              type="submit"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '0 12px',
                background: 'var(--accent-primary)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                color: '#FFFFFF',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              <Send size={12} />
              <span>Simulate</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
