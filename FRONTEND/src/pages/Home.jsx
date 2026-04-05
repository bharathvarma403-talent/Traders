import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';
import ThreeDHero from '../components/ThreeDHero';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
      <Navbar />

      <main className="flex-grow">
        <section className="relative overflow-hidden py-24 lg:py-32" style={{ backgroundColor: 'var(--color-bg)' }}>

          {/* Very subtle grid background */}
          <div className="absolute inset-0 opacity-30 pointer-events-none" style={{
            backgroundImage: 'linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }} />

          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="grid lg:grid-cols-12 gap-8 items-center">

              {/* Text */}
              <div className="lg:col-span-6 text-left">
                <div className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full text-xs font-medium tracking-wider uppercase"
                  style={{ background: 'rgba(75,124,243,0.1)', color: 'var(--color-accent)', border: '1px solid rgba(75,124,243,0.2)' }}>
                  <span className="w-1.5 h-1.5 rounded-full inline-block animate-pulse" style={{ backgroundColor: 'var(--color-accent)' }}></span>
                  Trusted Construction Partner
                </div>

                <h1 className="text-4xl md:text-5xl xl:text-6xl font-bold leading-tight mb-6"
                  style={{ color: 'var(--color-text)' }}>
                  Smart Materials<br />
                  <span style={{ color: 'var(--color-accent)' }}>Supply</span> for<br />
                  Modern Builders
                </h1>

                <p className="text-base md:text-lg leading-relaxed mb-10 max-w-lg"
                  style={{ color: 'var(--color-muted)' }}>
                  Vasavi Traders provides high-quality cement, hardware, pipes, electrical items, and construction materials trusted by builders and homeowners.
                </p>

                <div className="flex flex-wrap gap-4">
                  <Link to="/products" className="btn-primary text-sm">
                    Explore Products
                  </Link>
                  <Link to="/orders" className="btn-outline text-sm">
                    My Orders
                  </Link>
                </div>


              </div>

              {/* Illustration */}
              <div className="lg:col-span-6 h-80 md:h-96 lg:h-[480px] rounded-2xl overflow-hidden"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                <ThreeDHero />
              </div>

            </div>
          </div>
        </section>

        {/* Trusted Brands Section */}
        <section className="py-12 bg-white/5 backdrop-blur-sm border-y border-[var(--color-border)]">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <h2 className="text-xs tracking-[0.2em] uppercase mb-10 opacity-60 font-semibold" 
                style={{ color: 'var(--color-text)' }}>
              Trusted Brands
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-8 gap-y-12">
              {[
                { name: 'Asian Paints', logo: '/images/brands/asian_paints.png' },
                { name: 'Nagarjuna', logo: '/images/brands/nagarjuna.png' },
                { name: 'UltraTech', logo: '/images/brands/ultratech.png' },
                { name: 'Ramco', logo: '/images/brands/ramco.png' },
                { name: 'Supreme', logo: '/images/brands/supreme.png' },
                { name: 'Finolex', logo: '/images/brands/finolex.png' },
              ].map(brand => (
                <div key={brand.name} className="flex flex-col items-center gap-4 group transition-transform duration-300 hover:-translate-y-1">
                  <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center p-3 shadow-lg ring-1 ring-black/5 overflow-hidden">
                    <img 
                      src={brand.logo} 
                      alt={`${brand.name} logo`} 
                      className="max-w-full max-h-full object-contain filter grayscale group-hover:grayscale-0 transition-all duration-300"
                    />
                  </div>
                  <span className="text-sm font-bold tracking-wide uppercase" style={{ color: 'var(--color-text)' }}>
                    {brand.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
