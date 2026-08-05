import type { CSSProperties } from 'react';
import Link from 'next/link';
import { CategoryChip } from './CategoryChip';
import { SearchBar } from './SearchBar';

const CHIPS = [
  { label: 'Conférence', slug: 'conference' },
  { label: 'Gala', slug: 'gala' },
  { label: 'Concert', slug: 'concert' },
  { label: 'Atelier', slug: 'workshop' },
  { label: 'Festival', slug: 'festival' },
];

/**
 * Échelonne l'entrée des blocs du héros.
 *
 * L'animation est portée par CSS et non par Framer Motion : le titre est
 * l'élément LCP de la page, il ne doit pas attendre l'hydratation pour être
 * peint.
 */
const REVEAL = (delay: number): CSSProperties =>
  ({ '--reveal-delay': `${delay}s`, '--reveal-duration': '0.55s', '--reveal-shift': '20px' }) as CSSProperties;

interface HeroSectionProps {
  eventCount: number | null;
}

export function HeroSection({ eventCount }: HeroSectionProps) {
  const proofPoints = [
    {
      value: eventCount === null ? '—' : String(eventCount),
      label: eventCount === 1 ? 'événement à explorer' : 'événements et expériences à explorer',
    },
    { value: '4 rôles', label: 'organisateurs, prestataires, lieux, participants' },
    { value: 'QC', label: 'pensé pour le marché québécois' },
  ] as const;

  return (
    <section className="hero-section">
      <div className="hero-content">
        <div className="hero-badge reveal" style={REVEAL(0)}>
          Plateforme événementielle québécoise
        </div>

        <h1 className="hero-title reveal" style={REVEAL(0.1)}>
          Découvrez les événements<br />qui méritent votre soirée.
        </h1>

        <p className="hero-subtitle reveal" style={REVEAL(0.18)}>
          Une sélection publique d&apos;événements, de lieux et de prestataires
          pour composer une expérience cohérente, du billet au dernier détail.
        </p>

        <div className="hero-cta-row reveal" style={REVEAL(0.24)}>
          <Link href="/evenements/recherche" className="premium-button">
            Explorer les événements
          </Link>
          <Link href="/comment-ca-marche" className="premium-button-secondary">
            Voir le fonctionnement
          </Link>
        </div>

        <div className="reveal w-full max-w-[760px]" style={REVEAL(0.32)}>
          <SearchBar />
        </div>

        <div className="hero-chips reveal" style={REVEAL(0.4)}>
          {CHIPS.map((chip) => (
            <CategoryChip
              key={chip.slug}
              label={chip.label}
              href={`/evenements?category=${chip.slug}`}
            />
          ))}
        </div>

        <div className="hero-proof-row reveal" style={REVEAL(0.48)}>
          {proofPoints.map((point) => (
            <div key={point.value} className="hero-proof-card">
              <strong>{point.value}</strong>
              <span>{point.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
