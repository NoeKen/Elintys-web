'use client';

import Link from 'next/link';
import { useScroll, useTransform, motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

const NAV_LINKS = [
  { label: 'Problème', href: '#probleme' },
  { label: 'Solution', href: '#solution' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Accès bêta', href: '#cta' },
];

export function LandingNav() {
  const { scrollY } = useScroll();
  const bg = useTransform(scrollY, [0, 72], ['rgba(255,255,255,0.54)', 'rgba(255,255,255,0.82)']);
  const blur = useTransform(scrollY, [0, 72], ['blur(14px)', 'blur(24px)']);
  const borderColor = useTransform(scrollY, [0, 72], ['rgba(255,255,255,0.28)', 'rgba(30,61,79,0.12)']);

  return (
    <div className="fixed left-0 right-0 top-4 z-50 px-4 sm:px-6">
      <motion.nav
        className="mx-auto flex max-w-6xl items-center justify-between rounded-full border px-4 py-3 shadow-nav sm:px-5"
        style={{ backgroundColor: bg, backdropFilter: blur, WebkitBackdropFilter: blur, borderColor }}
      >
        <Link href="/" className="font-serif text-2xl text-primary transition-opacity hover:opacity-80">
          Elintys
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="group relative text-sm font-semibold text-on-surface-variant transition-colors hover:text-primary"
            >
              {l.label}
              <span className="absolute -bottom-1 left-0 h-px w-0 bg-accent transition-[width] duration-300 ease-out group-hover:w-full" />
            </a>
          ))}
        </div>

        <a href="#cta" className="premium-button min-h-10 px-4 py-2 text-sm">
          <span>Rejoindre le mouvement</span>
          <ArrowUpRight size={16} aria-hidden="true" />
        </a>
      </motion.nav>
    </div>
  );
}
