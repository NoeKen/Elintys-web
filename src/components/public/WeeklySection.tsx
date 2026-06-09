import Link from 'next/link';

interface WeeklyEvent {
  _id: string;
  title: string;
  startDate?: string;
  coverImage?: string;
  location?: { address?: string; city?: string };
}

function formatWeekDay(dateStr: string) {
  return new Date(dateStr)
    .toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'short' })
    .toUpperCase();
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' });
}

interface WeeklySectionProps {
  events: WeeklyEvent[];
}

export function WeeklySection({ events }: WeeklySectionProps) {
  if (!events?.length) return null;

  return (
    <section style={{ background: 'var(--surface-low)', padding: '80px 0' }}>
      <div className="container-public">
        <h2 className="section-title" style={{ marginBottom: 32 }}>
          Cette semaine à Montréal
        </h2>

        <div>
          {events.slice(0, 5).map((event) => (
            <Link key={event._id} href={`/evenements/${event._id}`} className="weekly-item">
              <div className="weekly-img">
                <img
                  src={event.coverImage ?? '/placeholder-event.jpg'}
                  alt={event.title}
                />
              </div>
              <div className="weekly-content">
                {event.startDate && (
                  <span className="weekly-day">{formatWeekDay(event.startDate)}</span>
                )}
                <span className="weekly-title">{event.title}</span>
                <span className="weekly-location">
                  {event.location?.address ?? event.location?.city ?? 'Montréal'}
                  {event.startDate ? ` • ${formatTime(event.startDate)}` : ''}
                </span>
              </div>
              <span className="weekly-voir">Voir →</span>
            </Link>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <Link href="/evenements" className="btn-secondary">
            Charger plus d&apos;événements
          </Link>
        </div>
      </div>
    </section>
  );
}
