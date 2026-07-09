import { MapPin } from 'lucide-react';

interface LocationData {
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
}

interface EventLocationProps {
  location?: LocationData;
}

export function EventLocation({ location }: EventLocationProps) {
  if (!location) return null;
  const displayAddress = [location.address, location.city, location.postalCode]
    .filter(Boolean)
    .join(', ');
  if (!displayAddress) return null;

  return (
    <section className="event-section">
      <h2 className="event-section-title">Lieu</h2>
      <div
        style={{
          background: 'var(--surface-low)',
          borderRadius: 12,
          padding: 20,
          display: 'flex',
          gap: 14,
          alignItems: 'flex-start',
        }}
      >
        <MapPin className="h-5 w-5 flex-shrink-0 text-teal" aria-hidden="true" />
        <div>
          <p style={{ fontWeight: 600, fontSize: 15, color: 'var(--on-surface)', marginBottom: 4 }}>
            {location.address ?? location.city}
          </p>
          <p style={{ fontSize: 13, color: 'var(--on-surface-variant)' }}>{displayAddress}</p>
        </div>
      </div>
    </section>
  );
}
