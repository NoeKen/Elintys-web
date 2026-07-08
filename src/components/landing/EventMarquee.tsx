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
    <div className="relative w-full overflow-hidden py-6">
      <p className="text-center text-xs font-semibold tracking-[0.15em] uppercase text-white/25 mb-5">
        Tous types d&apos;événements
      </p>

      <div
        aria-hidden="true"
        className="absolute left-0 top-0 bottom-0 w-32 z-10 pointer-events-none bg-gradient-to-r from-primary to-transparent"
      />
      <div
        aria-hidden="true"
        className="absolute right-0 top-0 bottom-0 w-32 z-10 pointer-events-none bg-gradient-to-l from-primary to-transparent"
      />

      <motion.div
        className="flex gap-8 w-max"
        animate={reduced ? {} : { x: ['0%', '-50%'] }}
        transition={{ duration: 28, ease: 'linear', repeat: Infinity }}
      >
        {doubled.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="whitespace-nowrap text-sm font-medium text-white/40 hover:text-white/70 transition-colors cursor-default select-none"
          >
            {item}
            <span className="ml-8 text-white/15">·</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}
