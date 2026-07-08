import Link from 'next/link';

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
    <section style={{ background: 'var(--surface)', padding: '80px 0' }}>
      <div className="container-public">
        <h2 className="section-title" style={{ textAlign: 'center', marginBottom: 40 }}>
          Explorer par passion
        </h2>
        <div className="categories-grid">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/evenements?category=${cat.slug}`}
              className="category-tile"
              style={{ background: cat.bg }}
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
