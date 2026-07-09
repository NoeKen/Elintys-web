'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { CategoryChip } from './CategoryChip';
import { SearchBar } from './SearchBar';

const CHIPS = [
  { label: 'Conférence', slug: 'conference' },
  { label: 'Gala', slug: 'gala' },
  { label: 'Concert', slug: 'concert' },
  { label: 'Atelier', slug: 'atelier' },
  { label: 'Théâtre', slug: 'theatre' },
];

const EASE = 'easeOut' as const;
const PROOF_POINTS = [
  { value: '500+', label: 'événements et expériences à explorer' },
  { value: '4 rôles', label: 'organisateurs, prestataires, lieux, participants' },
  { value: 'QC', label: 'pensé pour le marché québécois' },
] as const;

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
          Plateforme événementielle québécoise
        </motion.div>

        <motion.h1
          className="hero-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: EASE, delay: 0.10 }}
        >
          Découvrez les événements<br />qui méritent votre soirée.
        </motion.h1>

        <motion.p
          className="hero-subtitle"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: EASE, delay: 0.18 }}
        >
          Une sélection publique d&apos;événements, de lieux et de prestataires
          pour composer une expérience cohérente, du billet au dernier détail.
        </motion.p>

        <motion.div
          className="hero-cta-row"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: EASE, delay: 0.24 }}
        >
          <Link href="/evenements/recherche" className="premium-button">
            Explorer les événements
          </Link>
          <Link href="/comment-ca-marche" className="premium-button-secondary">
            Voir le fonctionnement
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: EASE, delay: 0.32 }}
          className="w-full max-w-[760px]"
        >
          <SearchBar />
        </motion.div>

        <motion.div
          className="hero-chips"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: EASE, delay: 0.40 }}
        >
          {CHIPS.map((chip) => (
            <CategoryChip
              key={chip.slug}
              label={chip.label}
              href={`/evenements?category=${chip.slug}`}
            />
          ))}
        </motion.div>

        <motion.div
          className="hero-proof-row"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: EASE, delay: 0.48 }}
        >
          {PROOF_POINTS.map((point) => (
            <div key={point.value} className="hero-proof-card">
              <strong>{point.value}</strong>
              <span>{point.label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
