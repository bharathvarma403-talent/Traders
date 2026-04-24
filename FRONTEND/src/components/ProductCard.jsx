import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ShoppingCart, AlertTriangle, ShieldCheck } from 'lucide-react';

const formatPrice = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

export default function ProductCard({ product, onReserve, isBroken, onImageError, API_URL }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["7deg", "-7deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-7deg", "7deg"]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const isOutOfStock = product.stockStatus === 'Out of Stock';
  let imageSrc = product.imageUrl?.startsWith('/uploads')
    ? `${API_URL}${product.imageUrl}`
    : product.imageUrl;

  return (
    <motion.article
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-[#141416] border border-white/5 transition-all duration-300"
    >
      {/* 3D Depth Highlight */}
      <div 
        style={{ transform: "translateZ(50px)" }}
        className="pointer-events-none absolute inset-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-white/5 to-transparent" 
      />

      {/* Image Section */}
      <div
        className="relative flex h-48 items-center justify-center overflow-hidden bg-[#0A0A0C]"
        style={{ transformStyle: "preserve-3d" }}
      >
        {!isBroken && imageSrc ? (
          <motion.img
            style={{ transform: "translateZ(30px)" }}
            src={imageSrc}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-500 group-hover:scale-110"
            onError={onImageError}
          />
        ) : (
          <div style={{ transform: "translateZ(30px)" }} className="flex flex-col items-center justify-center gap-2 p-4 text-center opacity-40">
            <ShieldCheck className="h-10 w-10" />
            <span className="text-[10px] font-bold uppercase tracking-wider">{product.name}</span>
          </div>
        )}

        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[2px] z-20">
            <span className="flex items-center gap-1.5 rounded-full bg-red-500/20 border border-red-500/30 px-3 py-1.5 text-[10px] font-bold uppercase text-red-300">
              <AlertTriangle className="h-3 w-3" />
              Sold Out
            </span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div 
        className="flex flex-1 flex-col p-5"
        style={{ transform: "translateZ(40px)" }}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-yellow-500/80">
            {product.category}
          </span>
          <span className="glass-light rounded px-2 py-0.5 text-[9px] font-bold text-zinc-500">
            {product.brand?.name || 'GENERIC'}
          </span>
        </div>

        <h3 className="mb-1.5 text-sm font-bold text-white group-hover:text-yellow-500 transition-colors">
          {product.name}
        </h3>
        <p className="mb-4 flex-1 text-xs text-zinc-500 line-clamp-2 leading-relaxed">
          {product.description || 'Premium industrial grade material sourced for maximum structural durability.'}
        </p>

        <div className="mb-4 flex items-baseline gap-1">
          <span className="text-lg font-bold text-white">{formatPrice(product.price)}</span>
          <span className="text-[10px] text-zinc-600 font-bold">/ {product.unit || 'unit'}</span>
        </div>

        <button
          type="button"
          onClick={() => onReserve(product)}
          disabled={isOutOfStock}
          className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-[11px] font-bold uppercase tracking-widest transition-all duration-300 w-full ${
            isOutOfStock 
              ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
              : 'bg-yellow-500 text-black hover:bg-yellow-400 hover:scale-[1.02] active:scale-95 shadow-xl shadow-yellow-500/10'
          }`}
        >
          <ShoppingCart className="h-4 w-4" />
          {isOutOfStock ? 'RESTOCKING' : 'RESERVE NOW'}
        </button>
      </div>

      {/* Hover Inner Glow */}
      <div className="absolute inset-0 border border-yellow-500/0 group-hover:border-yellow-500/20 rounded-2xl transition-all duration-500 pointer-events-none" />
    </motion.article>
  );
}
