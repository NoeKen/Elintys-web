'use client';

import { motion } from 'framer-motion';
import { CalendarDays, MapPin, Users } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

interface EventLocation {
  city?: string;
  address?: string;
}

interface PublicEventHero {
  _id: string;
  title: string;
  coverImage?: string;
  eventType?: string;
  startDate?: string;
  location?: EventLocation;
  attendeesCount?: number;
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-CA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function MetaItem({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div>
      <span
        style={{
          opacity: 0.50,
          fontSize: 11,
          display: 'block',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: 4,
          fontFamily: 'var(--font-sans)',
        }}
      >
        {label}
      </span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        {icon}
        {value}
      </span>
    </div>
  );
}

interface EventHeroProps {
  event: PublicEventHero;
}

export function EventHero({ event }: EventHeroProps) {
  return (
    <section
      style={{
        position: 'relative',
        height: 'clamp(420px, 65vh, 680px)',
        overflow: 'hidden',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={event.coverImage ?? '/placeholder-hero.jpg'}
        alt={event.title}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to top, rgba(13,30,53,0.92) 0%, rgba(13,30,53,0.22) 55%, transparent 100%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{
          position: 'absolute',
          bottom: 48,
          color: 'white',
          left: 'max(40px, calc((100vw - 1200px) / 2))',
          right: 'max(40px, calc((100vw - 1200px) / 2))',
        }}
      >
        <nav
          style={{
            fontSize: 13,
            opacity: 0.55,
            marginBottom: 14,
            fontFamily: 'var(--font-sans)',
          }}
        >
          <Link href="/evenements" style={{ color: 'white', textDecoration: 'none' }}>
            Événements
          </Link>
          {' › '}
          {event.location?.city && (
            <>
              <Link
                href={`/evenements?city=${event.location.city}`}
                style={{ color: 'white', textDecoration: 'none' }}
              >
                {event.location.city}
              </Link>
              {' › '}
            </>
          )}
          <span>{event.title}</span>
        </nav>

        {event.eventType && (
          <span
            style={{
              background: 'rgba(26,122,94,0.25)',
              color: 'var(--color-teal-light)',
              border: '1px solid rgba(26,122,94,0.35)',
              borderRadius: 999,
              padding: '5px 12px',
              fontSize: 12,
              fontWeight: 700,
              fontFamily: 'var(--font-sans)',
            }}
          >
            {event.eventType}
          </span>
        )}

        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(28px, 5vw, 52px)',
            lineHeight: 1.1,
            margin: '12px 0 28px',
            maxWidth: 700,
          }}
        >
          {event.title}
        </h1>

        <div
          style={{
            display: 'flex',
            gap: 36,
            flexWrap: 'wrap',
            fontSize: 14,
            fontFamily: 'var(--font-sans)',
          }}
        >
          {event.startDate && (
            <MetaItem
              label="Date & Heure"
              value={formatDateTime(event.startDate)}
              icon={<CalendarDays size={16} aria-hidden="true" />}
            />
          )}
          {(event.location?.address ?? event.location?.city) && (
            <MetaItem
              label="Lieu"
              value={event.location?.address ?? event.location?.city ?? ''}
              icon={<MapPin size={16} aria-hidden="true" />}
            />
          )}
          {event.attendeesCount != null && event.attendeesCount > 0 && (
            <MetaItem
              label="Participants"
              value={`${event.attendeesCount} personnes inscrites`}
              icon={<Users size={16} aria-hidden="true" />}
            />
          )}
        </div>
      </motion.div>
    </section>
  );
}
