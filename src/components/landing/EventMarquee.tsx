'use client';

import { motion, useReducedMotion } from 'framer-motion';

const ITEMS = [
  'Mariages',
  'Conférences',
  'Galas corporatifs',
  'Festivals',
  'Ateliers',
  'Soirées privées',
  'Lancements de produits',
  'Concerts',
  'Salons professionnels',
  'Anniversaires',
  'Formations',
  'Séminaires',
];

export function EventMarquee() {
  const reduced = useReducedMotion();
  const doubled = [...ITEMS, ...ITEMS];

  return (
    <div className="relative w-full overflow-hidden py-8">
      <p className="mb-5 text-center text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant">
        Tous types d&apos;événements
      </p>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-0 top-0 z-10 w-32 bg-gradient-to-r from-background to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 top-0 z-10 w-32 bg-gradient-to-l from-background to-transparent"
      />

      <motion.div
        className="flex gap-8 w-max"
        animate={reduced ? {} : { x: ['0%', '-50%'] }}
        transition={{ duration: 28, ease: 'linear', repeat: Infinity }}
      >
        {doubled.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="cursor-default select-none whitespace-nowrap text-sm font-semibold text-on-surface-variant transition-colors hover:text-primary"
          >
            {item}
            <span className="ml-8 text-terracotta">·</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}
