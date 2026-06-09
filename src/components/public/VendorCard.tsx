import Link from 'next/link';

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
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt={displayName} />
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
          <span className="badge-recommended">RECOMMANDÉ ✦</span>
        )}
        <button
          className="btn-favorite"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          aria-label="Sauvegarder ce prestataire"
        >
          🤍
        </button>
      </div>
      <div className="vendor-card-body">
        {vendor.rating != null && vendor.rating > 0 && (
          <div className="rating-row">
            <span style={{ color: 'var(--color-amber)' }}>★</span>
            <span style={{ fontWeight: 700 }}>{vendor.rating.toFixed(1)}</span>
            {vendor.reviewsCount != null && vendor.reviewsCount > 0 && (
              <span style={{ color: 'var(--on-surface-variant)', fontSize: 12 }}>
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
          <span style={{ fontSize: 13, color: 'var(--on-surface-variant)' }}>À partir de</span>
          <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--on-surface)' }}>
            {vendor.startingPrice ? `${vendor.startingPrice}$` : 'Sur devis'}
          </span>
        </div>
        <div className="vendor-card-cta">Réserver</div>
      </div>
    </Link>
  );
}
