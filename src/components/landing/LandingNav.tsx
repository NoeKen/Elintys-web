'use client';

import Link from 'next/link';
import { useScroll, useTransform, motion } from 'framer-motion';

const NAV_LINKS = [
  { label: 'Problème', href: '#probleme' },
  { label: 'Solution', href: '#solution' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Accès bêta', href: '#cta' },
];

export function LandingNav() {
  const { scrollY } = useScroll();
  // rgba values mirror the navy token (--color-navy: 30,61,79) — motion style values can't consume Tailwind classes.
  const bg = useTransform(scrollY, [0, 72], ['rgba(30,61,79,0)', 'rgba(30,61,79,0.90)']);
  const blur = useTransform(scrollY, [0, 72], ['blur(0px)', 'blur(18px)']);
  const borderColor = useTransform(scrollY, [0, 72], ['rgba(255,255,255,0)', 'rgba(255,255,255,0.07)']);

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 md:px-12 border-b"
      style={{ backgroundColor: bg, backdropFilter: blur, borderBottomColor: borderColor }}
    >
      <Link href="/" className="font-serif text-2xl text-accent-light hover:opacity-80 transition-opacity">
        Elintys
      </Link>

      <div className="hidden md:flex items-center gap-8">
        {NAV_LINKS.map((l) => (
          <a
            key={l.href}
            href={l.href}
            className="relative text-sm font-medium text-white/60 hover:text-white transition-colors group"
          >
            {l.label}
            <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-accent group-hover:w-full transition-[width] duration-300 ease-out" />
          </a>
        ))}
      </div>

      <a
        href="#cta"
        className="group relative overflow-hidden rounded-[8px] px-4 py-2 text-sm font-semibold text-white bg-accent hover:bg-accent/90 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
      >
        <span className="absolute inset-0 -translate-x-full skew-x-[-12deg] bg-gradient-to-r from-transparent via-white/12 to-transparent group-hover:translate-x-[200%] transition-transform duration-500 ease-in-out" />
        <span className="relative">Rejoindre le mouvement ↗</span>
      </a>
    </motion.nav>
  );
}
