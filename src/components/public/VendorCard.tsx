import Image from 'next/image';
import Link from 'next/link';
import { Heart, Sparkles, Star } from 'lucide-react';

export interface PublicVendor {
  _id: string;
  businessName?: string;
  name?: string;
  shortBio?: string;
  description?: string;
  photos?: string[];
  rating?: number;
  reviewsCount?: number;
  startingPrice?: number;
  isRecommended?: boolean;
  category?: string;
}

interface VendorCardProps {
  vendor: PublicVendor;
}

export function VendorCard({ vendor }: VendorCardProps) {
  const displayName = vendor.businessName ?? vendor.name ?? 'Prestataire';
  const displayDesc = vendor.shortBio ?? vendor.description?.substring(0, 90);
  const photo = vendor.photos?.[0];

  return (
    <Link href={`/prestataires/${vendor._id}`} className="vendor-card">
      <div className="vendor-card-image">
        {photo ? (
          <Image
            src={photo}
            alt={displayName}
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
            {displayName.charAt(0)}
          </div>
        )}
        {vendor.isRecommended && (
          <span className="badge-recommended">
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            Recommandé
          </span>
        )}
        <button
          type="button"
          className="btn-favorite"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          aria-label="Sauvegarder ce prestataire"
        >
          <Heart className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      <div className="vendor-card-body">
        {vendor.rating != null && vendor.rating > 0 && (
          <div className="rating-row">
            <Star className="h-3.5 w-3.5 fill-amber text-amber" aria-hidden="true" />
            <span className="font-bold">{vendor.rating.toFixed(1)}</span>
            {vendor.reviewsCount != null && vendor.reviewsCount > 0 && (
              <span className="text-xs text-on-surface-variant">
                ({vendor.reviewsCount} avis)
              </span>
            )}
          </div>
        )}
        <h3 className="vendor-card-name">{displayName}</h3>
        {displayDesc && (
          <p className="vendor-card-desc">
            {displayDesc}
            {(vendor.description?.length ?? 0) > 90 ? '…' : ''}
          </p>
        )}
        <div className="vendor-card-footer">
          <span className="text-[13px] text-on-surface-variant">À partir de</span>
          <span className="text-[17px] font-bold text-on-surface">
            {vendor.startingPrice ? `${vendor.startingPrice}$` : 'Sur devis'}
          </span>
        </div>
        <div className="vendor-card-cta">Réserver</div>
      </div>
    </Link>
  );
}
