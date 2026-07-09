import Image from 'next/image';
import Link from 'next/link';
import { Check, Heart, Star } from 'lucide-react';

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
          <span className="badge-verified">
            <Check className="h-3 w-3" aria-hidden="true" />
            Vérifié
          </span>
        )}
        <button
          type="button"
          className="btn-favorite"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          aria-label="Sauvegarder ce lieu"
        >
          <Heart className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      <div className="venue-card-body">
        {venue.rating != null && venue.rating > 0 && (
          <div className="rating-row">
            <Star className="h-3.5 w-3.5 fill-amber text-amber" aria-hidden="true" />
            <span className="font-bold">{venue.rating.toFixed(1)}</span>
            {venue.reviewsCount != null && venue.reviewsCount > 0 && (
              <span className="text-xs text-on-surface-variant">
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
          <span className="text-[13px] text-on-surface-variant">
            {venue.capacity ? `Capacité ${venue.capacity} pers.` : 'Capacité sur demande'}
          </span>
          <span className="text-[17px] font-bold text-on-surface">
            {venue.pricePerHour ? `${venue.pricePerHour}$/h` : 'Sur devis'}
          </span>
        </div>
        <div className="venue-card-cta">Réserver</div>
      </div>
    </Link>
  );
}
