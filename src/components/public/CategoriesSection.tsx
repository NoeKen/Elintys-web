import Link from 'next/link';
import type { CSSProperties } from 'react';

const CATEGORIES = [
  { label: 'Musique & Festivals', count: 124, bg: '#4A8E9E', slug: 'musique' },
  { label: 'Affaires & Réseautage', count: 86, bg: '#1E3D4F', slug: 'affaires' },
  { label: 'Art & Culture', count: 52, bg: '#3C6478', slug: 'art' },
  { label: 'Gastronomie', count: 37, bg: '#6B4226', slug: 'gastronomie' },
  { label: 'Sport & Bien-être', count: 45, bg: '#C8862A', slug: 'sport' },
  { label: 'Ateliers & Formations', count: 87, bg: '#2A4E7A', slug: 'ateliers' },
] as const;

export function CategoriesSection() {
  return (
    <section className="cinematic-section mesh-gradient">
      <div className="container-public">
        <div className="mb-10 text-center">
          <span className="section-eyebrow justify-center mb-3">
            Découverte
          </span>
          <h2 className="section-title">
            Explorer par passion
          </h2>
        </div>
        <div className="categories-grid">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/evenements?category=${cat.slug}`}
              className="category-tile"
              style={{ '--category-color': cat.bg } as CSSProperties}
            >
              <div className="category-tile-overlay" />
              <div className="category-tile-content">
                <span className="category-tile-title">{cat.label}</span>
                <span className="category-tile-count">{cat.count} événements</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
