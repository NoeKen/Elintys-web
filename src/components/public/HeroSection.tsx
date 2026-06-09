'use client';

import { motion } from 'framer-motion';
import { CategoryChip } from './CategoryChip';
import { SearchBar } from './SearchBar';

const CHIPS = [
  { label: '🎤 Conférence', slug: 'conference' },
  { label: '🥂 Gala', slug: 'gala' },
  { label: '🎵 Concert', slug: 'concert' },
  { label: '🎨 Atelier', slug: 'atelier' },
  { label: '🎭 Théâtre', slug: 'theatre' },
];

const EASE = 'easeOut' as const;

export function HeroSection() {
  return (
    <section className="hero-section">
      <div className="hero-content">
        <motion.div
          className="hero-badge"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: EASE, delay: 0 }}
        >
          ✦ Plateforme événementielle québécoise
        </motion.div>

        <motion.h1
          className="hero-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: EASE, delay: 0.10 }}
        >
          Trouvez votre prochain<br />événement à Montréal
        </motion.h1>

        <motion.p
          className="hero-subtitle"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: EASE, delay: 0.18 }}
        >
          Découvrez une sélection exclusive de moments culturels,<br />
          professionnels et artistiques au cœur de la métropole.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: EASE, delay: 0.26 }}
          style={{ width: '100%', maxWidth: 720 }}
        >
          <SearchBar />
        </motion.div>

        <motion.div
          className="hero-chips"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: EASE, delay: 0.34 }}
        >
          {CHIPS.map((chip) => (
            <CategoryChip
              key={chip.slug}
              label={chip.label}
              href={`/evenements?category=${chip.slug}`}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
