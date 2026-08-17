import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PublicEventExperience } from './PublicEventExperience';
import type { PublicEventDetail } from '@/features/events/types';

vi.mock('./EventGallery', () => ({
  EventGallery: ({ images }: { images: unknown[] }) => <div data-testid="gallery">{images.length} images</div>,
}));
vi.mock('./EventPageClient', () => ({
  EventPageClient: () => <div data-testid="access-panel">Accès</div>,
}));

const baseEvent: PublicEventDetail = {
  _id: 'event-1',
  slug: 'gala-elintys',
  title: 'Gala Elintys',
  shortDescription: 'Une rencontre pensée pour le Québec.',
  gallery: [],
  startDate: '2027-05-12T18:00:00.000Z',
  timezone: 'America/Toronto',
  dateIsTentative: false,
  discoverability: 'public',
  accessPolicy: { type: 'open' },
  admissionModes: ['free'],
  providers: [],
  ticketTypes: [],
  relatedEvents: [],
};

describe('PublicEventExperience', () => {
  it('rend un hero serveur premium avec fallback et données essentielles réelles', () => {
    const { container } = render(<PublicEventExperience event={baseEvent} />);

    expect(screen.getByRole('heading', { level: 1, name: 'Gala Elintys' })).toBeInTheDocument();
    expect(screen.getByText('Une rencontre pensée pour le Québec.')).toBeInTheDocument();
    expect(container.querySelector('.public-event-hero-fallback')).toBeInTheDocument();
    expect(screen.getByTestId('access-panel')).toBeInTheDocument();
  });

  it('masque toutes les sections optionnelles sans données au lieu de les inventer', () => {
    render(<PublicEventExperience event={baseEvent} />);

    expect(screen.queryByRole('heading', { name: 'À propos de l’événement' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'L’univers de l’événement' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Prestataires confirmés' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'À découvrir aussi' })).not.toBeInTheDocument();
    expect(screen.queryByText(/programme/i)).not.toBeInTheDocument();
  });

  it('rend les sections enrichies seulement lorsqu’elles sont fournies par l’API', () => {
    render(
      <PublicEventExperience
        event={{
          ...baseEvent,
          description: 'Une soirée complète et documentée.',
          gallery: ['https://images.unsplash.com/photo-1'],
          organizer: { name: 'Collectif Elintys' },
          venue: {
            _id: 'venue-1',
            name: 'Maison Elintys',
            type: 'conference',
            description: 'Un espace lumineux au centre-ville.',
            address: { street: '100 rue du Test', city: 'Montréal', province: 'QC' },
            capacity: 180,
            photos: [],
            amenities: ['Wi-Fi', 'Accès universel'],
            rating: 4.8,
            reviewCount: 12,
          },
          providers: [{
            _id: 'provider-1',
            businessName: 'Studio Boréal',
            category: 'photographe',
            photos: [],
            serviceArea: 'Montréal',
            rating: 5,
            reviewCount: 3,
          }],
          relatedEvents: [{
            _id: 'related-1',
            slug: 'atelier-boreal',
            title: 'Atelier Boréal',
            startDate: '2027-06-20T18:00:00.000Z',
            location: { type: 'physical', city: 'Montréal' },
          }],
        }}
      />,
    );

    expect(screen.getByRole('heading', { name: 'À propos de l’événement' })).toBeInTheDocument();
    expect(screen.getByTestId('gallery')).toHaveTextContent('1 images');
    expect(screen.getByRole('heading', { name: 'Maison Elintys' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Prestataires confirmés' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Collectif Elintys' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Atelier Boréal/ })).toHaveAttribute('href', '/evenements/atelier-boreal');
  });

  it('rend la cover réelle avec next/image et supporte un fuseau invalide sans planter', () => {
    const { container } = render(
      <PublicEventExperience
        event={{
          ...baseEvent,
          coverImage: 'https://images.unsplash.com/photo-2',
          timezone: 'Fuseau/Invalide',
        }}
      />,
    );

    expect(container.querySelector('img[alt="Image de couverture — Gala Elintys"]')).toBeInTheDocument();
  });
});
