import Link from 'next/link';
import type { CSSProperties } from 'react';
import { EVENT_CATEGORIES } from '@/features/catalog/catalog-filters';

interface CategoriesSectionProps {
  counts: Partial<Record<(typeof EVENT_CATEGORIES)[number]['value'], number>>;
  hasError?: boolean;
}

export function CategoriesSection({ counts, hasError = false }: CategoriesSectionProps) {
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
        {hasError ? (
          <p role="alert" className="glass-card p-6 text-center text-sm text-on-surface-variant">
            Les compteurs par catégorie sont temporairement indisponibles.
          </p>
        ) : (
        <div className="categories-grid">
          {EVENT_CATEGORIES.map((category) => {
            const count = counts[category.value] ?? 0;

            return (
            <Link
              key={category.value}
              href={`/evenements?category=${category.value}`}
              className="category-tile"
              style={{ '--category-color': category.color } as CSSProperties}
            >
              <div className="category-tile-overlay" />
              <div className="category-tile-content">
                <span className="category-tile-title">{category.label}</span>
                <span className="category-tile-count">
                  {count} événement{count !== 1 ? 's' : ''}
                </span>
              </div>
            </Link>
            );
          })}
        </div>
        )}
      </div>
    </section>
  );
}
