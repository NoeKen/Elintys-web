import Link from 'next/link';
import Image from 'next/image';

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
    <section className="cinematic-section">
      <div className="container-public">
        <div className="section-header">
          <div>
            <span className="section-eyebrow">Agenda</span>
            <h2 className="section-title">Cette semaine à Montréal</h2>
          </div>
          <Link href="/evenements" className="link-voir-tout">
            Tout explorer
          </Link>
        </div>

        <div className="glass-card px-5 py-2 sm:px-7">
          {events.slice(0, 5).map((event) => (
            <Link key={event._id} href={`/evenements/${event._id}`} className="weekly-item">
              <div className="weekly-img">
                <Image
                  src={event.coverImage ?? '/placeholder-event.jpg'}
                  alt={event.title}
                  width={64}
                  height={64}
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
              <span className="weekly-voir">Voir</span>
            </Link>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link href="/evenements" className="btn-secondary">
            Charger plus d&apos;événements
          </Link>
        </div>
      </div>
    </section>
  );
}
