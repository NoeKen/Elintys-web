'use client';

import { createContext, useContext, useEffect, useRef } from 'react';
import Lenis from 'lenis';
import { useReducedMotion } from 'framer-motion';

const LenisContext = createContext<Lenis | null>(null);

export function useLenis(): Lenis | null {
  return useContext(LenisContext);
}

export function LenisProvider({ children }: { children: React.ReactNode }) {
  const prefersReduced = useReducedMotion();
  const lenisRef = useRef<Lenis | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (prefersReduced) return;

    const lenis = new Lenis({
      lerp: 0.1,
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });
    lenisRef.current = lenis;

    function raf(time: number) {
      lenis.raf(time);
      rafRef.current = requestAnimationFrame(raf);
    }
    rafRef.current = requestAnimationFrame(raf);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [prefersReduced]);

  return (
    <LenisContext.Provider value={lenisRef.current}>
      {children}
    </LenisContext.Provider>
  );
}
