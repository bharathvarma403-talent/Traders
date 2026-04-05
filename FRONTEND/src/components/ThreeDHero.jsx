import React from 'react';

export default function ThreeDHero() {
  return (
    <div className="w-full h-full relative flex items-center justify-center overflow-hidden" style={{ minHeight: '400px' }}>
      {/* Subtle central circle */}
      <div style={{
        position: 'absolute',
        width: '220px', height: '220px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255, 215, 0, 0.12) 0%, transparent 70%)',
        animation: 'gentlePulse 5s ease-in-out infinite',
      }} />

      {/* Cement block - minimal */}
      <div style={{
        position: 'absolute', top: '18%', left: '12%',
        width: '75px', height: '96px',
        background: 'var(--color-surface)',
        borderRadius: '8px',
        border: '1px solid var(--color-border)',
        animation: 'floatSlow 6s ease-in-out infinite',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px',
      }}>
        <div style={{ width: '36px', height: '4px', background: 'var(--color-accent)', borderRadius: '2px', opacity: 0.7 }} />
        <span style={{ color: 'var(--color-muted)', fontSize: '9px', fontWeight: 600, letterSpacing: '0.08em', textAlign: 'center', lineHeight: 1.3 }}>OPC 53{'\n'}CEMENT</span>
      </div>

      {/* Pipe — minimal orange stroke */}
      <div style={{
        position: 'absolute', top: '52%', right: '10%',
        width: '22px', height: '110px',
        background: 'linear-gradient(to bottom, var(--color-surface), rgba(255, 215, 0, 0.2), var(--color-surface))',
        borderRadius: '11px',
        border: '1px solid rgba(255, 215, 0, 0.3)',
        animation: 'floatSlow 5s ease-in-out 1s infinite',
      }} />

      {/* Bulb dot */}
      <div style={{
        position: 'absolute', bottom: '20%', left: '25%',
        width: '44px', height: '44px',
        borderRadius: '50%',
        background: 'rgba(255, 215, 0, 0.06)',
        border: '1px solid rgba(255, 215, 0, 0.2)',
        animation: 'floatSlow 7s ease-in-out 0.5s infinite',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '18px',
      }}>💡</div>

      {/* Tool dot */}
      <div style={{
        position: 'absolute', top: '22%', right: '22%',
        width: '44px', height: '44px',
        borderRadius: '50%',
        background: 'rgba(255, 215, 0, 0.08)',
        border: '1px solid rgba(255, 215, 0, 0.2)',
        animation: 'floatSlow 6.5s ease-in-out 2s infinite',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '18px',
      }}>🔧</div>

      {/* Very subtle grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
        backgroundSize: '44px 44px',
        borderRadius: '16px',
      }} />

      <style>{`
        @keyframes gentlePulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.1); opacity: 1; }
        }
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-14px); }
        }
      `}</style>
    </div>
  );
}
