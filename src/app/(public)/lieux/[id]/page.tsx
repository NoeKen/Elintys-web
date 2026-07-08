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
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Link href="/lieux" className="text-sm text-teal hover:underline">
        &larr; Retour aux lieux
      </Link>

      <h1 className="font-serif text-3xl text-navy mt-6 mb-2">
        {venue.name}
      </h1>

      <p className="text-sm text-muted mb-2">{fullAddress}</p>

      <p className="text-sm text-muted mb-2">
        Capacite&nbsp;: {venue.capacity} personnes
      </p>

      {venue.pricePerDay !== undefined && (
        <p className="text-sm text-muted mb-2">
          Prix&nbsp;: {(venue.pricePerDay / 100).toFixed(2)}&nbsp;$ / jour
        </p>
      )}

      {venue.reviewCount > 0 && (
        <p className="text-sm text-muted mb-2">
          {venue.rating.toFixed(1)} / 5 ({venue.reviewCount} avis)
        </p>
      )}

      {venue.description && (
        <p className="text-sm text-muted mt-4 leading-relaxed">
          {venue.description}
        </p>
      )}

      {venue.amenities.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {venue.amenities.map((amenity) => (
            <span
              key={amenity}
              className="text-xs bg-surface border border-border rounded-full px-2 py-1 text-muted"
            >
              {amenity}
            </span>
          ))}
        </div>
      )}

      {venue.contactEmail && (
        <p className="mt-4 text-sm">
          Courriel&nbsp;:{' '}
          <a href={`mailto:${venue.contactEmail}`} className="text-teal hover:underline">
            {venue.contactEmail}
          </a>
        </p>
      )}
    </main>
  );
}
