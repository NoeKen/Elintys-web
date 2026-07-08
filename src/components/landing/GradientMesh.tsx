'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';

// rgb triplets mirror the teal/terracotta/navy tokens in globals.css — canvas gradients can't consume Tailwind classes.
const ORBS = [
  { x: 0.22, y: 0.3, r: 0.45, rgb: '74,142,158', spd: 0.00016, ph: 0 },
  { x: 0.75, y: 0.6, r: 0.38, rgb: '212,132,74', spd: 0.00011, ph: 2.0 },
  { x: 0.5, y: 0.85, r: 0.3, rgb: '30,61,79', spd: 0.0002, ph: 4.2 },
];

export function GradientMesh() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let rafId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = (t: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ORBS.forEach((o) => {
        const cx = (o.x + Math.sin(t * o.spd + o.ph) * 0.11) * canvas.width;
        const cy = (o.y + Math.cos(t * o.spd * 0.7 + o.ph) * 0.09) * canvas.height;
        const r = o.r * Math.min(canvas.width, canvas.height);
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, `rgba(${o.rgb},0.16)`);
        g.addColorStop(0.5, `rgba(${o.rgb},0.05)`);
        g.addColorStop(1, `rgba(${o.rgb},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      });
      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, [reduced]);

  if (reduced) {
    return (
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 22% 30%, rgba(74,142,158,0.11) 0%, transparent 65%)',
        }}
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 opacity-80"
      style={{ mixBlendMode: 'multiply' }}
    />
  );
}
