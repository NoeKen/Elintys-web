interface OrganizerData {
  name?: string;
  avatar?: string;
  description?: string;
}

interface EventOrganizerProps {
  organizer?: OrganizerData;
}

export function EventOrganizer({ organizer }: EventOrganizerProps) {
  if (!organizer?.name) return null;

  return (
    <section className="event-section">
      <h2 className="event-section-title">Organisateur</h2>
      <div
        style={{
          display: 'flex',
          gap: 16,
          alignItems: 'center',
          background: 'var(--surface-low)',
          borderRadius: 12,
          padding: 20,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'var(--color-teal-pale)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-serif)',
            fontSize: 20,
            color: 'var(--color-teal)',
            flexShrink: 0,
            overflow: 'hidden',
          }}
        >
          {organizer.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={organizer.avatar} alt={organizer.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            organizer.name.charAt(0).toUpperCase()
          )}
        </div>
        <div>
          <p style={{ fontWeight: 600, fontSize: 15, color: 'var(--on-surface)' }}>{organizer.name}</p>
          {organizer.description && (
            <p style={{ fontSize: 13, color: 'var(--on-surface-variant)', marginTop: 3 }}>
              {organizer.description}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
