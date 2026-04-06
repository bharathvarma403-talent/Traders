import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { MapPin, Phone, Mail, Clock, MessageCircle } from 'lucide-react';

export default function Contact() {
  const whatsappNumber = '919912517623';
  const whatsappUrl = `https://wa.me/${whatsappNumber}`;

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
      <Navbar />
      <main className="flex-grow py-16 px-6 max-w-5xl mx-auto w-full">

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
            Contact <span style={{ color: 'var(--color-accent)' }}>Us</span>
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
            We're here to help with your construction material needs.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Contact Info Cards */}
          <div className="space-y-4">

            {/* Location */}
            <div className="card p-5 flex items-start gap-4 transition-all"
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(75,124,243,0.3)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}>
              <div className="p-2.5 rounded-lg" style={{ background: 'rgba(75,124,243,0.08)', border: '1px solid rgba(75,124,243,0.15)' }}>
                <MapPin className="h-5 w-5" style={{ color: 'var(--color-accent)' }} />
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text)' }}>Store Location</h3>
                <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Vasavi Traders</p>
                <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Edlapadu, Andhra Pradesh</p>
              </div>
            </div>

            {/* WhatsApp / Phone */}
            <a href={whatsappUrl} target="_blank" rel="noreferrer"
              className="card p-5 flex items-start gap-4 transition-all block"
              style={{ textDecoration: 'none' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(37,211,102,0.4)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}>
              <div className="p-2.5 rounded-lg" style={{ background: 'rgba(37,211,102,0.08)', border: '1px solid rgba(37,211,102,0.2)' }}>
                <MessageCircle className="h-5 w-5" style={{ color: '#25D366' }} />
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text)' }}>WhatsApp & Phone</h3>
                <p className="text-sm font-medium" style={{ color: '#25D366' }}>+91 99125 17623</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>Tap to chat on WhatsApp</p>
              </div>
            </a>

            {/* Email */}
            <div className="card p-5 flex items-start gap-4 transition-all"
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(75,124,243,0.3)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}>
              <div className="p-2.5 rounded-lg" style={{ background: 'rgba(75,124,243,0.08)', border: '1px solid rgba(75,124,243,0.15)' }}>
                <Mail className="h-5 w-5" style={{ color: 'var(--color-accent)' }} />
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text)' }}>Email</h3>
                <p className="text-sm" style={{ color: 'var(--color-muted)' }}>vasavitraderssupport@gmail.com</p>
              </div>
            </div>

            {/* Hours */}
            <div className="card p-5 flex items-start gap-4 transition-all"
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(75,124,243,0.3)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}>
              <div className="p-2.5 rounded-lg" style={{ background: 'rgba(75,124,243,0.08)', border: '1px solid rgba(75,124,243,0.15)' }}>
                <Clock className="h-5 w-5" style={{ color: 'var(--color-accent)' }} />
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>Business Hours</h3>
                <div className="space-y-1">
                  <div className="flex justify-between gap-8">
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Mon – Sat</p>
                    <p className="text-sm" style={{ color: 'var(--color-muted)' }}>6:30 AM – 9:30 PM</p>
                  </div>
                  <div className="flex justify-between gap-8">
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Sunday</p>
                    <p className="text-sm" style={{ color: 'var(--color-muted)' }}>8:00 AM – 8:00 PM</p>
                  </div>
                </div>
              </div>
            </div>

            {/* WhatsApp Button */}
            <a href={whatsappUrl} target="_blank" rel="noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold transition-all"
              style={{ background: '#25D366', color: 'white' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
              <MessageCircle className="h-5 w-5" />
              Chat with us on WhatsApp
            </a>
          </div>

          {/* Google Map */}
          <div className="card overflow-hidden" style={{ minHeight: '420px', padding: 0 }}>
            <iframe
              title="Vasavi Traders Location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d501.8687268157822!2d80.22633213327092!3d16.169927547860205!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a4a7b3e0d9de7cb%3A0x9e3fc86593e1b194!2sVasavi%20traders!5e0!3m2!1sen!2sin!4v1775121514020!5m2!1sen!2sin"
              width="100%"
              height="100%"
              style={{ border: 0, display: 'block', minHeight: '420px' }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
