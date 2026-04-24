import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion';

export default function ThreeDHero() {
  const containerRef = useRef(null);

  // Mouse tracking logic for 3D tilt
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e) => {
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  // Smoothing springs
  const springConfig = { damping: 25, stiffness: 120 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [10, -10]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-15, 15]), springConfig);
  
  // Parallax layers
  const { scrollY } = useScroll();
  const bgY = useTransform(scrollY, [0, 500], [0, 150]);
  const midY = useTransform(scrollY, [0, 500], [0, -50]);
  const fgY = useTransform(scrollY, [0, 500], [0, -120]);

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="w-full h-[600px] relative flex items-center justify-center overflow-hidden bg-[#0A0A0C]"
    >
      {/* Background Layer: Blueprint Grid */}
      <motion.div 
        style={{ y: bgY }}
        className="absolute inset-0 opacity-20"
      >
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0A0A0C]/50 to-[#0A0A0C]" />
      </motion.div>

      {/* Midground Layer: Silhouettes & Glowing Lines */}
      <motion.div 
        style={{ y: midY }}
        className="absolute inset-0 pointer-events-none"
      >
        {/* Subtle glowing architectural line */}
        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-yellow-500/20 to-transparent blur-sm" />
      </motion.div>

      {/* Main 3D Container (Tilt Effect) */}
      <motion.div
        style={{ rotateX, rotateY, z: 100 }}
        className="relative z-10 w-[320px] h-[420px] flex items-center justify-center tilt-effect"
      >
        {/* The "3D" Object: Floating Cement Bag Simulation */}
        <div className="relative group">
          {/* Ambient Glow */}
          <div className="absolute -inset-10 bg-yellow-500/10 rounded-full blur-[80px] group-hover:bg-yellow-500/15 transition-all duration-700" />
          
          {/* Cement Bag Shape (Layered for Depth) */}
          <div className="relative w-48 h-64 bg-[#1C1C1F] border border-white/10 rounded-lg shadow-premium overflow-hidden transform-gpu">
            <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500" />
            <div className="p-6 h-full flex flex-col justify-between">
              <div>
                <div className="text-[10px] text-zinc-500 font-bold tracking-[0.2em] uppercase mb-2">Industrial Grade</div>
                <h3 className="text-xl font-bold text-white leading-tight">ULTRA<br/>CEMENT</h3>
              </div>
              <div className="space-y-2">
                <div className="w-12 h-[2px] bg-zinc-700" />
                <div className="text-[9px] text-zinc-400 font-medium">TYPE OPC-53</div>
                <div className="text-[8px] text-zinc-600 font-mono">BATCH: VT-2024-04</div>
              </div>
            </div>
            
            {/* Texture Overlay */}
            <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
          </div>

          {/* Floating Details around the bag */}
          <motion.div 
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-8 -right-8 glass-light p-3 rounded-full shadow-lg"
          >
            <span className="text-xl">🏗️</span>
          </motion.div>
          
          <motion.div 
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="absolute -bottom-6 -left-10 glass-light px-3 py-1 rounded-full shadow-lg border border-white/5"
          >
            <span className="text-[10px] font-bold text-yellow-500">PREMIUM STEEL</span>
          </motion.div>
        </div>
      </motion.div>

      {/* Foreground Layer: Particles & Depth Blur */}
      <motion.div 
        style={{ y: fgY }}
        className="absolute inset-0 pointer-events-none z-20"
      >
        {[...Array(6)].map((_, i) => (
          <div 
            key={i}
            className="absolute w-2 h-2 rounded-full bg-yellow-500/20 blur-[1px]"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.5 + 0.2
            }}
          />
        ))}
      </motion.div>

      {/* Bottom Gradient for section blending */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#0A0A0C] to-transparent z-30" />
    </div>
  );
}

