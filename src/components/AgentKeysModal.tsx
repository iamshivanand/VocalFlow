import React, { useState, useEffect } from 'react';
import { 
  X, 
  Bot, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  Key, 
  ShieldCheck,
  FileCode
} from 'lucide-react';
import type { AgentApiKey } from '../types/task';
import { api } from '../utils/api';
import { soundEffects } from '../utils/audio';

interface AgentKeysModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AgentKeysModal: React.FC<AgentKeysModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const [keys, setKeys] = useState<AgentApiKey[]>([]);
  const [newAgentName, setNewAgentName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [configSnippet, setConfigSnippet] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadKeys = () => {
    setIsLoading(true);
    api.getApiKeys()
      .then(setKeys)
      .catch(() => setKeys([]))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadKeys();
  }, []);

  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgentName.trim()) return;

    try {
      const res = await api.createApiKey(newAgentName.trim());
      setGeneratedKey(res.apiKey);
      setConfigSnippet(res.claudeConfigSnippet);
      setNewAgentName('');
      soundEffects.playSuccessChord();
      loadKeys();
    } catch (err: any) {
      alert(err.message || 'Failed to generate key');
    }
  };

  const handleDeleteKey = async (id: string) => {
    if (confirm('Are you sure you want to revoke this agent API key? Connected agents will lose access.')) {
      await api.deleteApiKey(id);
      loadKeys();
    }
  };

  const handleCopyKey = () => {
    if (generatedKey) {
      navigator.clipboard.writeText(generatedKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const handleCopySnippet = () => {
    if (configSnippet) {
      navigator.clipboard.writeText(JSON.stringify(configSnippet, null, 2));
      setCopiedSnippet(true);
      setTimeout(() => setCopiedSnippet(false), 2000);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(10px)',
      zIndex: 75,
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
          maxHeight: '90vh',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
          background: 'var(--bg-surface)',
          border: '1px solid rgba(168, 85, 247, 0.35)',
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
          background: 'rgba(168, 85, 247, 0.08)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #A855F7 0%, #7E22CE 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(168, 85, 247, 0.4)',
            }}>
              <Bot size={18} color="#FFFFFF" />
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>AI Agents & MCP API Keys</h3>
              <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Authenticate Claude Desktop, Cursor, and Autonomous Bots</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Newly Generated Key Alert Banner */}
          {generatedKey && (
            <div style={{
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#34D399' }}>
                <ShieldCheck size={16} />
                <span>New Agent Key Generated — Copy Now!</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input 
                  readOnly
                  value={generatedKey}
                  className="font-mono"
                  style={{
                    flex: 1,
                    fontSize: 12,
                    padding: '8px 10px',
                    background: 'var(--bg-deep)',
                    border: '1px solid var(--border-subtle)',
                    color: '#34D399',
                  }}
                />
                <button
                  type="button"
                  onClick={handleCopyKey}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--accent-primary)',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {copiedKey ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedKey ? 'Copied!' : 'Copy Key'}</span>
                </button>
              </div>

              {/* Claude Config Snippet */}
              {configSnippet && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <FileCode size={12} />
                      <span>claude_desktop_config.json snippet:</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleCopySnippet}
                      style={{ background: 'none', border: 'none', color: '#818CF8', fontSize: 11, cursor: 'pointer' }}
                    >
                      {copiedSnippet ? 'Copied!' : 'Copy Config'}
                    </button>
                  </div>
                  <pre 
                    className="font-mono"
                    style={{
                      background: 'var(--bg-deep)',
                      padding: 10,
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 11,
                      color: 'var(--text-secondary)',
                      overflowX: 'auto',
                    }}
                  >
                    {JSON.stringify(configSnippet, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Create New Key Form */}
          <form onSubmit={handleGenerateKey} style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                Agent Name / Identifier
              </label>
              <input 
                type="text"
                placeholder="e.g. Claude Desktop, Cursor AI, Bug Sentinel..."
                value={newAgentName}
                onChange={(e) => setNewAgentName(e.target.value)}
                style={{ width: '100%', height: 34, fontSize: 13 }}
                required
              />
            </div>
            <button
              type="submit"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '0 16px',
                height: 34,
                borderRadius: 'var(--radius-sm)',
                background: 'linear-gradient(135deg, #A855F7 0%, #7E22CE 100%)',
                border: 'none',
                color: '#FFFFFF',
                fontSize: 12,
                fontWeight: 600,
                boxShadow: '0 2px 8px rgba(168, 85, 247, 0.4)',
              }}
            >
              <Plus size={14} />
              <span>Generate Key</span>
            </button>
          </form>

          {/* Active Registered Agent Keys Table */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
              Active AI Agent Keys ({keys.length})
            </div>

            {isLoading ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>Loading keys...</div>
            ) : keys.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                No active agent keys registered yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {keys.map((k) => (
                  <div
                    key={k.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 28,
                        height: 28,
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(168, 85, 247, 0.15)',
                        color: '#C084FC',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <Key size={14} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                            {k.agent_name}
                          </span>
                          <span style={{
                            fontSize: 10,
                            padding: '1px 5px',
                            borderRadius: 3,
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: '#34D399',
                          }}>
                            {k.status}
                          </span>
                        </div>
                        <div className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          {k.prefix}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteKey(k.id)}
                      title="Revoke Agent Access"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        padding: 6,
                        borderRadius: 4,
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#EF4444'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
