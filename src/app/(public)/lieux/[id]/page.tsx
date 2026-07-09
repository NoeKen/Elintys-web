import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

interface VenueProfile {
  _id: string;
  name: string;
  description?: string;
  address: { street: string; city: string; province: string; postalCode?: string };
  capacity: number;
  amenities: string[];
  pricePerDay?: number;
  rating: number;
  reviewCount: number;
  contactEmail?: string;
  isActive: boolean;
}

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const res = await fetch(`${API_URL}/venues/${id}`, { next: { revalidate: 60 } });
    if (!res.ok) return { title: 'Lieu introuvable — Elintys' };
    const venue = await res.json() as VenueProfile;
    return {
      title: `${venue.name} — Elintys`,
      description: venue.description?.slice(0, 160),
    };
  } catch {
    return { title: 'Lieu — Elintys' };
  }
}

export default async function LieuDetailPage({ params }: Props) {
  const { id } = await params;

  const res = await fetch(`${API_URL}/venues/${id}`, { next: { revalidate: 60 } });
  if (!res.ok) notFound();
  const venue: VenueProfile = await res.json();
  if (!venue.isActive) notFound();

  const { street, city, province, postalCode } = venue.address;
  const fullAddress = [street, city, province, postalCode].filter(Boolean).join(', ');

  return (
    <main className="public-detail-shell mesh-gradient">
      <article className="container-public">
        <div className="glass-card mx-auto max-w-3xl p-6 sm:p-9">
          <Link href="/lieux" className="premium-button-ghost mb-6">
            Retour aux lieux
          </Link>

          <p className="section-eyebrow mb-4">Lieu d&apos;exception</p>
          <h1 className="premium-heading mb-4">{venue.name}</h1>

          <div className="mb-7 grid gap-3 text-sm text-on-surface-variant sm:grid-cols-2">
            <p className="rounded-2xl border border-outline-variant/70 bg-white/70 p-4 shadow-[var(--shadow-soft-line)]">
              {fullAddress}
            </p>

            <p className="rounded-2xl border border-outline-variant/70 bg-white/70 p-4 shadow-[var(--shadow-soft-line)]">
              Capacité&nbsp;: {venue.capacity} personnes
            </p>

            {venue.pricePerDay !== undefined && (
              <p className="rounded-2xl border border-outline-variant/70 bg-white/70 p-4 shadow-[var(--shadow-soft-line)]">
                Prix&nbsp;: {(venue.pricePerDay / 100).toFixed(2)}&nbsp;$ / jour
              </p>
            )}

            {venue.reviewCount > 0 && (
              <p className="rounded-2xl border border-outline-variant/70 bg-white/70 p-4 shadow-[var(--shadow-soft-line)]">
                {venue.rating.toFixed(1)} / 5 ({venue.reviewCount} avis)
              </p>
            )}
          </div>

          {venue.description && (
            <p className="premium-subtitle whitespace-pre-wrap">
              {venue.description}
            </p>
          )}

          {venue.amenities.length > 0 && (
            <div className="mt-7 flex flex-wrap gap-2">
              {venue.amenities.map((amenity) => (
                <span key={amenity} className="chip">
                  {amenity}
                </span>
              ))}
            </div>
          )}

          {venue.contactEmail && (
            <p className="mt-7 text-sm text-on-surface-variant">
              Courriel&nbsp;:{' '}
              <a href={`mailto:${venue.contactEmail}`} className="font-semibold text-teal hover:text-teal-dark">
                {venue.contactEmail}
              </a>
            </p>
          )}
        </div>
      </article>
    </main>
  );
}
