interface EventAboutProps {
  description?: string;
}

export function EventAbout({ description }: EventAboutProps) {
  if (!description) return null;
  return (
    <section className="event-section">
      <h2 className="event-section-title">À propos de cet événement</h2>
      <p style={{ fontSize: 15, color: 'var(--on-surface)', lineHeight: 1.75, whiteSpace: 'pre-line' }}>
        {description}
      </p>
    </section>
  );
}
