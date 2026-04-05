import React from 'react';
import { MapPin, Phone, Mail, Clock, HardHat } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer style={{ backgroundColor: 'var(--color-surface)', borderTop: '1px solid var(--color-border)' }} className="py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">

          <div>
            <div className="flex items-center gap-2 mb-4">
              <HardHat style={{ color: 'var(--color-accent)' }} className="h-5 w-5" />
              <span className="font-semibold text-base" style={{ color: 'var(--color-text)' }}>
                Vasavi <span style={{ color: 'var(--color-accent)' }}>Traders</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
              Your trusted partner for modern construction materials.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-5" style={{ color: 'var(--color-muted)' }}>Quick Links</h3>
            <ul className="space-y-3">
              {[['Home', '/'], ['Products', '/products'], ['Nova AI', '/nova'], ['Orders', '/orders']].map(([label, to]) => (
                <li key={label}>
                  <Link to={to} className="text-sm transition-colors"
                    style={{ color: 'var(--color-muted)' }}
                    onMouseEnter={e => e.target.style.color = 'var(--color-text)'}
                    onMouseLeave={e => e.target.style.color = 'var(--color-muted)'}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-5" style={{ color: 'var(--color-muted)' }}>Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0" style={{ color: 'var(--color-muted)' }} />
                <span className="text-sm" style={{ color: 'var(--color-muted)' }}>Vasavi Traders,<br/>Narasaraopet, A.P.</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0" style={{ color: 'var(--color-muted)' }} />
                <a href="https://wa.me/919912517623" target="_blank" rel="noreferrer" className="text-sm hover:opacity-80" style={{ color: 'var(--color-muted)' }}>+91 99125 17623</a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0" style={{ color: 'var(--color-muted)' }} />
                <span className="text-sm" style={{ color: 'var(--color-muted)' }}>vasavitraderssupport@gmail.com</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-5" style={{ color: 'var(--color-muted)' }}>Hours</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5">
                <Clock className="h-4 w-4 mt-0.5 shrink-0" style={{ color: 'var(--color-muted)' }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Mon–Sat</p>
                  <p className="text-sm" style={{ color: 'var(--color-muted)' }}>6:30 AM – 9:30 PM</p>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <Clock className="h-4 w-4 mt-0.5 shrink-0" style={{ color: 'var(--color-muted)' }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Sunday</p>
                  <p className="text-sm" style={{ color: 'var(--color-muted)' }}>8:00 AM – 8:00 PM</p>
                </div>
              </li>
            </ul>
          </div>

        </div>

        <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4"
          style={{ borderTop: '1px solid var(--color-border)' }}>
          <p className="text-xs" style={{ color: 'var(--color-muted)' }}>© {new Date().getFullYear()} Vasavi Traders. All rights reserved.</p>
          <div className="flex gap-5">
            <a href="#" className="text-xs" style={{ color: 'var(--color-muted)' }}>Privacy</a>
            <a href="#" className="text-xs" style={{ color: 'var(--color-muted)' }}>Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
