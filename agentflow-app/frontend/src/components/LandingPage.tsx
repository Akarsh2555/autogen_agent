import { ArrowRight } from 'lucide-react';

interface Props { onGetStarted: () => void; }

export default function LandingPage({ onGetStarted }: Props) {
  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* Ambient orbs */}
      <div className="orb orb-orange" style={{ width: 500, height: 500, top: -200, right: -100 }} />
      <div className="orb orb-pink" style={{ width: 400, height: 400, bottom: -100, left: -100 }} />
      <div className="orb orb-purple" style={{ width: 350, height: 350, top: '40%', left: '60%' }} />

      {/* Navbar */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, height: 60, display: 'flex', alignItems: 'center', padding: '0 32px', background: 'rgba(10,10,15,0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--glass-border)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 800, fontSize: 20 }}>◆ <span className="text-gradient">NexAgent</span></span>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="ghost-btn" style={{ padding: '8px 20px', fontSize: 14 }}>Sign In</button>
            <button className="glow-btn" style={{ padding: '8px 24px', fontSize: 14 }} onClick={onGetStarted}>Get Started Free</button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', padding: '100px 24px 60px', position: 'relative', zIndex: 1 }}>
        <div className="animate-slide-up" style={{ maxWidth: 1200, margin: '0 auto', width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
          {/* Left — text */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--pink)', background: 'rgba(232,67,147,0.1)', border: '1px solid rgba(232,67,147,0.25)', borderRadius: 100, padding: '6px 16px', width: 'fit-content', position: 'relative', overflow: 'hidden' }}>
              ✦ Introducing NexAgent 2.0
              <span style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent, rgba(232,67,147,0.3), transparent)', transform: 'translateX(-100%)', animation: 'shimmer 4s ease-in-out infinite' }} />
            </span>

            <h1 style={{ fontFamily: 'var(--font)', fontSize: 'clamp(40px, 5.5vw, 72px)', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.03em' }}>
              AI agents for<br />
              <span className="text-gradient" style={{ backgroundSize: '200% 200%', animation: 'gradientShift 4s ease infinite' }}>magical customer</span><br />
              experiences
            </h1>

            <p style={{ fontSize: 18, color: 'var(--text-muted)', maxWidth: 460, lineHeight: 1.7 }}>
              The complete platform for building & deploying AI support agents for your business. No code required.
            </p>

            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              <button className="glow-btn" style={{ fontSize: 17, padding: '16px 36px' }} onClick={onGetStarted}>
                Build your agent for free <ArrowRight size={18} className="arrow" />
              </button>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>🔒 No credit card required</span>
            </div>

            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>
              Trusted by 10,000+ businesses · Live in under 10 minutes
            </p>
          </div>

          {/* Right — hero card */}
          <div style={{ position: 'relative', perspective: 1200 }}>
            <div style={{
              background: 'var(--gradient-warm)', borderRadius: 24, padding: 3,
              transform: 'rotateY(-5deg) rotateX(3deg)',
              animation: 'float 6s ease-in-out infinite',
              boxShadow: '0 40px 80px rgba(232,67,147,0.2)',
            }}>
              <div style={{ background: 'var(--surface)', borderRadius: 22, padding: 28 }}>
                <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ alignSelf: 'flex-end', background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.2)', padding: '10px 14px', borderRadius: 14, borderBottomRightRadius: 4, fontSize: 14, maxWidth: '80%' }}>I'd like to return my jacket from last week.</div>
                  <div style={{ alignSelf: 'flex-start', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)', padding: '10px 14px', borderRadius: 14, borderBottomLeftRadius: 4, fontSize: 14, maxWidth: '85%' }}>
                    Found your order #4829! I've initiated the return. Refund of $129.00 will arrive in 3-5 days. ✅
                  </div>
                  <div style={{ alignSelf: 'flex-start', display: 'flex', gap: 4, padding: '8px 14px' }}>
                    <span style={{ width: 6, height: 6, background: 'var(--pink)', borderRadius: '50%', animation: 'pulse 1.4s infinite' }} />
                    <span style={{ width: 6, height: 6, background: 'var(--pink)', borderRadius: '50%', animation: 'pulse 1.4s 0.2s infinite' }} />
                    <span style={{ width: 6, height: 6, background: 'var(--pink)', borderRadius: '50%', animation: 'pulse 1.4s 0.4s infinite' }} />
                  </div>
                </div>
              </div>
            </div>
            {/* Float cards */}
            <div style={{ position: 'absolute', top: -20, right: -30, background: 'var(--surface)', border: '1px solid var(--glass-border)', borderRadius: 10, padding: '8px 14px', fontSize: 13, fontWeight: 600, animation: 'float 5s ease-in-out infinite', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
              ✓ Resolved in 2.3s
            </div>
            <div style={{ position: 'absolute', bottom: 40, left: -40, background: 'var(--surface)', border: '1px solid var(--glass-border)', borderRadius: 10, padding: '8px 14px', fontSize: 13, fontWeight: 600, animation: 'float 5s ease-in-out 1.5s infinite', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
              🔗 Connected to Stripe
            </div>
          </div>
        </div>
      </section>

      {/* Features strip */}
      <section style={{ padding: '80px 24px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {[
            { icon: '🧠', title: 'Purpose-built for LLMs', desc: 'Advanced reasoning chains that understand context, nuance, and intent.' },
            { icon: '✨', title: 'Deploy in minutes', desc: 'Describe your agent in plain English. No ML expertise needed.' },
            { icon: '🔒', title: 'Enterprise security', desc: 'SOC 2 Type II, AES-256, GDPR compliant. Your data stays yours.' }
          ].map((f, i) => (
            <div key={i} className="glass-panel" style={{ padding: 32, transition: 'all 0.3s ease' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(232,67,147,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 16 }}>{f.icon}</div>
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: 'white' }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 24px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div className="orb orb-pink" style={{ width: 400, height: 400, top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, marginBottom: 16 }}>
            Ready to build your <span className="text-gradient">AI agent?</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: 500, margin: '0 auto 32px' }}>
            Join 10,000+ businesses delivering exceptional AI-powered support.
          </p>
          <button className="glow-btn" style={{ fontSize: 18, padding: '16px 40px' }} onClick={onGetStarted}>
            Get Started Free <ArrowRight size={18} />
          </button>
        </div>
      </section>
    </div>
  );
}
