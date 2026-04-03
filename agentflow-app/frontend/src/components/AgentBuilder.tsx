import React, { useState } from 'react';
import { Bot, ArrowRight, Code, CheckCircle, ShieldCheck } from 'lucide-react';
import type { WorkflowGraph } from '../types';

interface Props {
  businessContext: string;
  onComplete: (
    agentId: string,
    agentName: string,
    workflow: WorkflowGraph,
    script: string,
    provider: string,
    model: string,
  ) => void;
}

const STEPS = [
  'Parsing business logic...',
  'Injecting onboarding context into the system prompt...',
  'Generating autogen.AssistantAgent...',
  'Compiling executable script...',
  'Writing workflow metadata...',
];

export default function AgentBuilder({ businessContext, onComplete }: Props) {
  const [phase, setPhase] = useState<'prompt' | 'synth' | 'error'>('prompt');
  const [prompt, setPrompt] = useState('');
  const [name, setName] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [errorTitle, setErrorTitle] = useState('Compilation Failed');
  const [errorMsg, setErrorMsg] = useState('');

  const contextPreview = businessContext.trim()
    || 'No onboarding context provided. This agent will rely only on the behavior prompt below.';

  const handleBuild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || !name.trim()) return;

    setPhase('synth');
    setLogs([]);
    setErrorTitle('Compilation Failed');
    setErrorMsg('');

    let step = 0;
    const intervalId = window.setInterval(() => {
      if (step < STEPS.length) {
        setLogs((previous) => [...previous, `[compiler] ${STEPS[step]}`]);
        step += 1;
      }
    }, 800);

    try {
      const response = await fetch('http://localhost:8000/api/agents/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          prompt,
          business_context: businessContext,
        }),
      });
      const data = await response.json();
      window.clearInterval(intervalId);

      if (!response.ok) {
        throw new Error(data.detail || data.message || 'The backend could not compile this agent.');
      }

      if (data.status === 'rate_limited') {
        setErrorTitle('Gemini Cooldown Active');
        setErrorMsg(data.message || 'Gemini rate limits were hit while validating the agent. Wait a moment and retry.');
        setPhase('error');
        return;
      }

      if (data.status === 'success' || data.status === 'simulated') {
        setLogs((previous) => [...previous, `[compiler] OK Agent "${data.agent_id}" compiled.`]);
        if (data.message) {
          setLogs((previous) => [...previous, `[info] ${data.message}`]);
        }

        window.setTimeout(() => {
          onComplete(
            data.agent_id,
            name,
            data.workflow,
            data.script_preview || '',
            data.provider || 'Simulation',
            data.model || '',
          );
        }, 1200);
        return;
      }

      throw new Error(data.message || 'Unknown build status returned by the backend.');
    } catch (error) {
      window.clearInterval(intervalId);
      setErrorTitle('Compilation Failed');
      setErrorMsg(
        error instanceof Error
          ? error.message
          : 'Backend unreachable. Is `python main.py` running?',
      );
      setPhase('error');
    }
  };

  if (phase === 'error') {
    return (
      <div className="page-container animate-fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="glass-panel" style={{ padding: '50px 40px', maxWidth: 520, textAlign: 'center' }}>
          <h2 style={{ fontSize: 22, color: '#ef4444', marginBottom: 16 }}>{errorTitle}</h2>
          <p className="text-muted" style={{ marginBottom: 24 }}>{errorMsg}</p>
          <button className="glow-btn" onClick={() => setPhase('prompt')}>Back to Builder</button>
        </div>
      </div>
    );
  }

  if (phase === 'synth') {
    return (
      <div className="page-container animate-fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="orb orb-pink" style={{ width: 400, height: 400, top: '30%', left: '40%', position: 'fixed' }} />
        <div className="glass-panel" style={{ padding: '50px 40px', maxWidth: 560, textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div className="pulse-spinner" style={{ marginBottom: 28 }}>
            <Bot size={34} style={{ position: 'absolute', color: 'var(--pink)', animation: 'pulse 1.5s infinite' }} />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>Synthesizing <span className="text-gradient">AutoGen Agent</span></h2>
          <div style={{ background: 'rgba(0,0,0,0.4)', padding: 20, borderRadius: 12, border: '1px solid var(--glass-border)', textAlign: 'left', minHeight: 160 }}>
            {logs.map((line, index) => (
              <div
                key={index}
                style={{
                  fontFamily: 'monospace',
                  fontSize: 13,
                  color: line.includes('OK') ? 'var(--green)' : (index === logs.length - 1 ? 'var(--pink)' : 'var(--text-muted)'),
                  marginBottom: 8,
                }}
              >
                {index === logs.length - 1 ? '> ' : ''}
                {line}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container animate-slide-up" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div className="orb orb-orange" style={{ width: 350, height: 350, top: -80, left: -60, position: 'fixed' }} />
      <div className="glass-panel" style={{ padding: 40, maxWidth: 600, width: '100%', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Code size={40} style={{ color: 'var(--pink)', margin: '0 auto 16px', display: 'block' }} />
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>Build Your <span className="text-gradient">AI Agent</span></h1>
          <p className="text-muted" style={{ fontSize: 14 }}>Define the agent behavior and we will compile a standalone Python script around it.</p>
        </div>

        <form onSubmit={handleBuild} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: 14, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <ShieldCheck size={16} style={{ color: 'var(--orange)' }} />
              <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Business Context Injection
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: 'var(--text)' }}>{contextPreview}</p>
          </div>

          <div>
            <label>Agent Name</label>
            <input type="text" className="input-field" placeholder="e.g. SalesResponder" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div>
            <label>System Prompt / Behavior</label>
            <textarea className="input-field" rows={4} placeholder="How should this agent behave?" value={prompt} onChange={(e) => setPrompt(e.target.value)} required />
          </div>

          <div style={{ background: 'rgba(232,67,147,0.06)', border: '1px solid rgba(232,67,147,0.2)', borderRadius: 10, padding: 14 }}>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
              <CheckCircle size={13} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: 5, color: 'var(--green)' }} />
              Compiles to a <strong style={{ color: 'white' }}>standalone Python file</strong> you can deploy anywhere.
            </p>
          </div>

          <button type="submit" className="glow-btn">Compile Agent <ArrowRight size={16} /></button>
        </form>
      </div>
    </div>
  );
}
