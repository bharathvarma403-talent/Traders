import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export default function NovaFloatingButton() {
  return (
    <Link
      to="/nova"
      className="nova-float-btn"
      title="Ask Nova AI"
      aria-label="Ask Nova AI Assistant"
      style={{
        position: 'fixed',
        bottom: '28px',
        left: '28px',
        zIndex: 1000,
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #4B7CF3, #6C63FF)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 6px 24px rgba(75,124,243,0.4), 0 0 0 4px rgba(75,124,243,0.12)',
        border: 'none',
        cursor: 'pointer',
        textDecoration: 'none',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'scale(1.1)';
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(75,124,243,0.5), 0 0 0 6px rgba(75,124,243,0.15)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 6px 24px rgba(75,124,243,0.4), 0 0 0 4px rgba(75,124,243,0.12)';
      }}
    >
      <Sparkles className="h-6 w-6" />
      <span
        className="nova-pulse-ring"
        style={{
          position: 'absolute',
          top: '-3px',
          right: '-3px',
          width: '14px',
          height: '14px',
          borderRadius: '50%',
          background: '#FFD700',
          border: '2px solid #050505',
        }}
      />
    </Link>
  );
}
