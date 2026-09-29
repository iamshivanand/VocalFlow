import React, { useState } from 'react';
import { X, Lock, Mail, User, LogOut, CheckCircle2 } from 'lucide-react';
import type { UserProfile } from '../types/task';
import { api } from '../utils/api';
import { soundEffects } from '../utils/audio';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onLoginSuccess: (user: UserProfile) => void;
  onLogout: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
  onLogout,
}) => {
  if (!isOpen) return null;

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'member'>('member');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const res = await api.login(email, password);
        soundEffects.playSuccessChord();
        onLoginSuccess(res.user);
        onClose();
      } else {
        const res = await api.register(name, email, password, role);
        soundEffects.playSuccessChord();
        onLoginSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed');
      soundEffects.playErrorTone();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(10px)',
      zIndex: 80,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
    }}>
      <div 
        className="glass-panel animate-slide-down"
        style={{
          width: '100%',
          maxWidth: 440,
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
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
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #6366F1 0%, #4338CA 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Lock size={16} color="#FFFFFF" />
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700 }}>
                {currentUser ? 'Team Profile' : mode === 'login' ? 'Team Member Login' : 'Register New Employee'}
              </h3>
              <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {currentUser ? 'Active Workspace Session' : 'Collaborate with team & AI agents'}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px' }}>
          {currentUser ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
              }}>
                <img 
                  src={currentUser.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${currentUser.name}`}
                  alt={currentUser.name}
                  style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--bg-surface)' }}
                />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{currentUser.name}</span>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      padding: '1px 6px',
                      borderRadius: 3,
                      background: currentUser.role === 'admin' ? 'rgba(234, 179, 8, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                      color: currentUser.role === 'admin' ? '#FDE047' : '#38BDF8',
                    }}>
                      {currentUser.role}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{currentUser.email}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#10B981' }}>
                <CheckCircle2 size={14} />
                <span>Connected to centralized database. All your edits are attributed to your profile.</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '10px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  color: '#EF4444',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <LogOut size={14} />
                <span>Sign Out of VocalFlow</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', background: 'var(--bg-deep)', padding: 2, borderRadius: 'var(--radius-sm)' }}>
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  style={{
                    flex: 1,
                    padding: '6px',
                    fontSize: 12,
                    fontWeight: 600,
                    borderRadius: 'calc(var(--radius-sm) - 2px)',
                    background: mode === 'login' ? 'var(--bg-card)' : 'transparent',
                    color: mode === 'login' ? 'var(--text-primary)' : 'var(--text-muted)',
                    border: 'none',
                  }}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  style={{
                    flex: 1,
                    padding: '6px',
                    fontSize: 12,
                    fontWeight: 600,
                    borderRadius: 'calc(var(--radius-sm) - 2px)',
                    background: mode === 'register' ? 'var(--bg-card)' : 'transparent',
                    color: mode === 'register' ? 'var(--text-primary)' : 'var(--text-muted)',
                    border: 'none',
                  }}
                >
                  Register
                </button>
              </div>

              {errorMessage && (
                <div style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  fontSize: 12,
                  color: '#FCA5A5',
                }}>
                  {errorMessage}
                </div>
              )}

              {mode === 'register' && (
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                    Full Name
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-muted)' }} />
                    <input 
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      style={{ width: '100%', paddingLeft: 32 }}
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-muted)' }} />
                  <input 
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ width: '100%', paddingLeft: 32 }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-muted)' }} />
                  <input 
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ width: '100%', paddingLeft: 32 }}
                    required
                  />
                </div>
              </div>

              {mode === 'register' && (
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                    Workspace Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    style={{ width: '100%' }}
                  >
                    <option value="member">Member (Employee / Developer)</option>
                    <option value="admin">Admin (Can manage Agent API Keys)</option>
                  </select>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  marginTop: 6,
                  padding: '10px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--accent-primary)',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: 13,
                  fontWeight: 600,
                  boxShadow: '0 2px 10px rgba(99, 102, 241, 0.4)',
                  cursor: 'pointer',
                }}
              >
                {isLoading ? 'Processing...' : mode === 'login' ? 'Sign In to Tracker' : 'Create Account'}
              </button>

              <div style={{ fontSize: 11, color: 'var(--text-faint)', textAlign: 'center', marginTop: 4 }}>
                Demo Admin: <span className="font-mono text-slate-300">admin@vocalflow.local</span> / <span className="font-mono text-slate-300">admin123</span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
