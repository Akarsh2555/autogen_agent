import { CheckCircle2, FileText } from 'lucide-react';

interface Props { report: string; onContinue: () => void; }

export default function CrewAIReport({ report, onContinue }: Props) {
  return (
    <div className="page-container animate-fade-in" style={{ maxWidth: 960, minHeight: '100vh', paddingTop: 60 }}>
      <div className="orb orb-purple" style={{ width: 350, height: 350, top: -80, right: -80, position: 'fixed' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16, position: 'relative', zIndex: 1 }}>
        <div>
          <h2 style={{ fontSize: 26, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileText size={24} style={{ color: 'var(--pink)' }} />
            Strategic <span className="text-gradient">Research Report</span>
          </h2>
          <p className="text-muted" style={{ marginTop: 6, fontSize: 14 }}>Compiled autonomously by your CrewAI Analysis Team.</p>
        </div>
        <button className="glow-btn" onClick={onContinue} style={{ padding: '12px 28px' }}>
          Build Agent <CheckCircle2 size={16} />
        </button>
      </div>
      <div className="glass-panel" style={{ padding: 36, maxHeight: '65vh', overflowY: 'auto', position: 'relative', zIndex: 1 }}>
        <div style={{ color: '#e2e8f0', whiteSpace: 'pre-wrap', lineHeight: 1.8, fontSize: 15 }}>{report}</div>
      </div>
    </div>
  );
}
