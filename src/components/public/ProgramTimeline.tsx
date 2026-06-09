interface ProgramItem {
  time: string;
  title: string;
  description?: string;
}

interface ProgramTimelineProps {
  items: ProgramItem[];
}

export function ProgramTimeline({ items }: ProgramTimelineProps) {
  if (!items?.length) return null;

  return (
    <section className="event-section">
      <h2 className="event-section-title">Programme de la soirée</h2>
      <div style={{ position: 'relative', paddingLeft: 80 }}>
        <div
          style={{
            position: 'absolute',
            left: 48,
            top: 8,
            bottom: 8,
            width: 1,
            background: 'rgba(13,30,53,0.12)',
          }}
        />
        {items.map((item, i) => (
          <div key={i} style={{ position: 'relative', marginBottom: 32 }}>
            <span
              style={{
                position: 'absolute',
                left: -80,
                top: 1,
                width: 48,
                textAlign: 'right',
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--color-teal)',
                fontFamily: 'var(--font-sans)',
              }}
            >
              {item.time}
            </span>
            <div
              style={{
                position: 'absolute',
                left: -10,
                top: 4,
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: 'var(--color-teal)',
                boxShadow: '0 0 0 3px white, 0 0 0 5px var(--color-teal-pale)',
              }}
            />
            <h4 style={{ fontWeight: 600, fontSize: 16, color: 'var(--on-surface)', marginBottom: 6 }}>
              {item.title}
            </h4>
            {item.description && (
              <p style={{ fontSize: 14, color: 'var(--on-surface-variant)', lineHeight: 1.65, margin: 0 }}>
                {item.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
