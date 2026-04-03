import React, { useState, useEffect } from 'react';
import { Target, Globe, DollarSign, ArrowRight, BrainCircuit } from 'lucide-react';

interface OnboardingProps {
  onComplete: (context: string, report: string) => void;
  onSkip?: () => void;
}

const LOADING_STEPS = [
  "Waking CrewAI Intelligence Agents...",
  "Executing deep-web queries for market context...",
  "Mapping competitor trajectories...",
  "Extracting core buyer personas...",
  "Synthesizing Strategic Advisory Report..."
];

export default function Onboarding({ onComplete, onSkip }: OnboardingProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({ businessName: '', industry: '', revenue: '1k_10k', targetAudience: '' });

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isSubmitting) {
      interval = setInterval(() => { setCurrentStep(prev => prev < LOADING_STEPS.length - 1 ? prev + 1 : prev); }, 4500);
    }
    return () => clearInterval(interval);
  }, [isSubmitting]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const contextStr = `${formData.businessName} is in the ${formData.industry} vertical, generating ${formData.revenue} targeting: ${formData.targetAudience}.`;
    try {
      const res = await fetch('http://localhost:8000/api/research', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ business_context: contextStr }) });
      const data = await res.json();
      onComplete(contextStr, data.report);
    } catch (err) {
      console.error(err);
      onComplete(contextStr, "# Error\n\nFailed to reach the backend.");
    }
  };

  if (isSubmitting) {
    return (
      <div className="page-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="orb orb-pink" style={{ width: 400, height: 400, top: '20%', left: '30%', position: 'fixed' }} />
        <div className="glass-panel" style={{ padding: '60px 40px', width: '100%', maxWidth: 560, textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div className="pulse-spinner" style={{ marginBottom: 32 }}>
            <BrainCircuit size={36} style={{ position: 'absolute', color: 'var(--pink)', animation: 'pulse 1.5s infinite' }} />
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 700, marginBottom: 20 }}>CrewAI Engine Processing</h2>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: 20, borderRadius: 12, border: '1px solid var(--glass-border)', minHeight: 80 }}>
            <p style={{ fontSize: 14, fontFamily: 'monospace', color: 'var(--pink)', margin: 0, textAlign: 'left' }}>
              $ {LOADING_STEPS[currentStep]} <span style={{ animation: 'pulse 1s infinite' }}>_</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container animate-slide-up" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div className="orb orb-orange" style={{ width: 350, height: 350, top: -100, right: -80, position: 'fixed' }} />
      <div className="orb orb-purple" style={{ width: 300, height: 300, bottom: -80, left: -60, position: 'fixed' }} />
      <div className="glass-panel" style={{ padding: 40, maxWidth: 640, width: '100%', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Initialize <span className="text-gradient">Business Context</span></h1>
          <p className="text-muted" style={{ fontSize: 15 }}>Feed your business parameters into the AI Factory.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label><Target size={12} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: 4 }} /> Business Name</label>
              <input type="text" className="input-field" value={formData.businessName} onChange={e => setFormData({...formData, businessName: e.target.value})} required />
            </div>
            <div>
              <label><Globe size={12} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: 4 }} /> Industry</label>
              <input type="text" className="input-field" value={formData.industry} onChange={e => setFormData({...formData, industry: e.target.value})} required />
            </div>
          </div>
          <div>
            <label><DollarSign size={12} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: 4 }} /> Monthly Revenue</label>
            <select className="input-field" value={formData.revenue} onChange={e => setFormData({...formData, revenue: e.target.value})}>
              <option value="pre-revenue">Pre-revenue</option>
              <option value="under_1k">Under $1,000 / mo</option>
              <option value="1k_10k">$1,000 - $10,000 / mo</option>
              <option value="10k_50k">$10,000 - $50,000 / mo</option>
              <option value="over_50k">Over $50,000 / mo</option>
            </select>
          </div>
          <div>
            <label>Target Audience</label>
            <textarea className="input-field" rows={3} value={formData.targetAudience} onChange={e => setFormData({...formData, targetAudience: e.target.value})} required placeholder="Describe their demographics, pain points, and desires..." />
          </div>
          <button type="submit" className="glow-btn" style={{ marginTop: 8 }}>
            Run Market Research Pipeline <ArrowRight size={18} />
          </button>
          {onSkip && (
            <button type="button" onClick={onSkip} className="ghost-btn" style={{ width: '100%', justifyContent: 'center' }}>
              Skip to Agent Builder →
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
