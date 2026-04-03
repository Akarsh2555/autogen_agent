import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, ArrowLeft, Download, Plus, RotateCcw, TimerReset } from 'lucide-react';
import type { ProviderInfo } from '../types';

interface Props {
  agentId: string;
  agentName: string;
  providerInfo: ProviderInfo;
  onBack: () => void;
  onNewAgent: () => void;
}

interface ChatMessage {
  role: 'assistant' | 'user';
  text: string;
}

export default function AgentChat({ agentId, agentName, providerInfo, onBack, onNewAgent }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      text: `Hi! I'm ${agentName}, your AutoGen agent running on ${providerInfo.model} via ${providerInfo.provider}. Send me a message to test the live workflow.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [pendingRetryMessage, setPendingRetryMessage] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (!cooldownUntil) {
      setCooldownSeconds(0);
      return;
    }

    const updateCountdown = () => {
      const remaining = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));
      setCooldownSeconds(remaining);
      if (remaining === 0) {
        setCooldownUntil(null);
      }
    };

    updateCountdown();
    const intervalId = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(intervalId);
  }, [cooldownUntil]);

  const sendMessage = async (message: string, appendUserMessage = true) => {
    if (!message.trim()) return;

    if (appendUserMessage) {
      setMessages((previous) => [...previous, { role: 'user', text: message }]);
    }

    setIsTyping(true);
    try {
      const response = await fetch(`http://localhost:8000/api/agents/${agentId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.message || 'The chat request failed.');
      }

      if (data.status === 'rate_limited') {
        const waitSeconds = Number(data.wait_seconds) || 60;
        setPendingRetryMessage(message);
        setCooldownUntil(Date.now() + waitSeconds * 1000);
        setMessages((previous) => [...previous, {
          role: 'assistant',
          text: data.reply || `Gemini rate limit reached. Please wait ${waitSeconds} seconds before retrying.`,
        }]);
        return;
      }

      setPendingRetryMessage(null);
      setCooldownUntil(null);
      setMessages((previous) => [...previous, {
        role: 'assistant',
        text: data.reply || 'No reply returned by the agent.',
      }]);
    } catch (error) {
      const errorText = error instanceof Error ? error.message : 'Backend unreachable.';
      setMessages((previous) => [...previous, { role: 'assistant', text: `Backend error: ${errorText}` }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping || cooldownSeconds > 0) return;

    const message = input.trim();
    setInput('');
    await sendMessage(message, true);
  };

  const handleRetry = async () => {
    if (!pendingRetryMessage || isTyping || cooldownSeconds > 0) return;
    await sendMessage(pendingRetryMessage, true);
  };

  return (
    <div className="page-container animate-fade-in" style={{ height: '100vh', display: 'flex', flexDirection: 'column', maxWidth: 960, padding: '32px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20, gap: 10, flexWrap: 'wrap', zIndex: 1 }}>
        <button className="secondary-btn" onClick={onBack} style={{ padding: '7px 14px' }}><ArrowLeft size={14} /> Back</button>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Sandbox: <span className="text-gradient">{agentName}</span></h2>
          <p className="text-muted" style={{ fontSize: 12 }}>{providerInfo.model} via {providerInfo.provider}</p>
        </div>
        <button className="secondary-btn" onClick={() => window.open(`http://localhost:8000/api/agents/${agentId}/download`, '_blank')} style={{ padding: '7px 14px' }}><Download size={13} /></button>
        <button className="secondary-btn" onClick={onNewAgent} style={{ padding: '7px 14px' }}><Plus size={13} /> New</button>
      </div>

      <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 1 }}>
        {(cooldownSeconds > 0 || pendingRetryMessage) && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 16,
              padding: '16px 24px',
              borderBottom: '1px solid rgba(232,67,147,0.18)',
              background: 'linear-gradient(90deg, rgba(255,107,53,0.10), rgba(232,67,147,0.12), rgba(168,85,247,0.10))',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                }}
              >
                <TimerReset size={16} style={{ color: 'var(--orange)' }} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'white' }}>Gemini Cooldown</p>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
                  {cooldownSeconds > 0
                    ? `Free-tier capacity is cooling down. Retry available in ${cooldownSeconds}s.`
                    : 'Your last prompt is ready to retry.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="secondary-btn"
              onClick={handleRetry}
              disabled={!pendingRetryMessage || cooldownSeconds > 0 || isTyping}
              style={{ whiteSpace: 'nowrap' }}
            >
              <RotateCcw size={14} />
              {cooldownSeconds > 0 ? `Retry in ${cooldownSeconds}s` : 'Retry Last Prompt'}
            </button>
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {messages.map((message, index) => (
            <div key={index} style={{ alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '82%' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flexDirection: message.role === 'user' ? 'row-reverse' : 'row' }}>
                <div
                  style={{
                    background: message.role === 'user' ? 'var(--gradient-warm)' : 'rgba(255,255,255,0.05)',
                    padding: 10,
                    borderRadius: '50%',
                    flexShrink: 0,
                    border: message.role === 'user' ? 'none' : '1px solid var(--glass-border)',
                  }}
                >
                  {message.role === 'user' ? <User size={14} color="white" /> : <Bot size={14} style={{ color: 'var(--pink)' }} />}
                </div>
                <div
                  style={{
                    background: message.role === 'user' ? 'rgba(232,67,147,0.1)' : 'rgba(0,0,0,0.3)',
                    border: `1px solid ${message.role === 'user' ? 'rgba(232,67,147,0.25)' : 'var(--glass-border)'}`,
                    padding: '14px 18px',
                    borderRadius: 16,
                    borderTopRightRadius: message.role === 'user' ? 4 : 16,
                    borderTopLeftRadius: message.role === 'assistant' ? 4 : 16,
                    color: '#e2e8f0',
                    fontSize: 14,
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {message.text}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: 10, borderRadius: '50%', border: '1px solid var(--glass-border)' }}>
                <Bot size={14} style={{ color: 'var(--pink)' }} />
              </div>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px 18px', borderRadius: 16, borderTopLeftRadius: 4, border: '1px solid var(--glass-border)' }}>
                <span style={{ animation: 'pulse 1s infinite', color: 'var(--pink)', fontSize: 14 }}>Thinking...</span>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <form onSubmit={handleSend} style={{ padding: '20px 28px', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: 10, background: 'rgba(0,0,0,0.2)' }}>
          <input
            className="input-field"
            placeholder={cooldownSeconds > 0 ? `Gemini cooldown active (${cooldownSeconds}s remaining)...` : 'Send a test message...'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isTyping || cooldownSeconds > 0}
            style={{ padding: '14px 18px' }}
          />
          <button type="submit" disabled={isTyping || cooldownSeconds > 0} className="glow-btn" style={{ padding: '0 22px', borderRadius: 12 }}><Send size={18} /></button>
        </form>
      </div>
    </div>
  );
}
