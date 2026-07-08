import Image from 'next/image';
import Link from 'next/link';

export interface PublicVenue {
  _id: string;
  name: string;
  description?: string;
  photos?: string[];
  rating?: number;
  reviewsCount?: number;
  capacity?: number;
  pricePerHour?: number;
  location?: { city?: string; address?: string };
  isVerified?: boolean;
  features?: string[];
}

interface VenueCardProps {
  venue: PublicVenue;
}

export function VenueCard({ venue }: VenueCardProps) {
  const photo = venue.photos?.[0];

  return (
    <Link href={`/lieux/${venue._id}`} className="venue-card">
      <div className="venue-card-image">
        {photo ? (
          <Image
            src={photo}
            alt={venue.name}
            fill
            unoptimized
            className="image-cinematic"
            sizes="(max-width: 560px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              background: 'var(--color-teal-pale)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-serif)',
              fontSize: 40,
              color: 'var(--color-teal)',
            }}
          >
            {venue.name.charAt(0)}
          </div>
        )}
        {venue.isVerified && (
          <span className="badge-verified">VÉRIFIÉ ✓</span>
        )}
        <button
          className="btn-favorite"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          aria-label="Sauvegarder ce lieu"
        >
          🤍
        </button>
      </div>
      <div className="venue-card-body">
        {venue.rating != null && venue.rating > 0 && (
          <div className="rating-row">
            <span style={{ color: 'var(--color-amber)' }}>★</span>
            <span style={{ fontWeight: 700 }}>{venue.rating.toFixed(1)}</span>
            {venue.reviewsCount != null && venue.reviewsCount > 0 && (
              <span style={{ color: 'var(--on-surface-variant)', fontSize: 12 }}>
                ({venue.reviewsCount} avis)
              </span>
            )}
          </div>
        )}
        <h3 className="venue-card-name">{venue.name}</h3>
        {venue.description && (
          <p className="venue-card-desc">{venue.description}</p>
        )}
        <div className="venue-card-footer">
          <span style={{ fontSize: 13, color: 'var(--on-surface-variant)' }}>
            {venue.capacity ? `Capacité ${venue.capacity} pers.` : 'Capacité sur demande'}
          </span>
          <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--on-surface)' }}>
            {venue.pricePerHour ? `${venue.pricePerHour}$/h` : 'Sur devis'}
          </span>
        </div>
        <div className="venue-card-cta">Réserver</div>
      </div>
    </Link>
  );
}
