import { describe, expect, it } from 'vitest';
import { normalizePublicEventDetail } from './public-event';

describe('normalizePublicEventDetail', () => {
  it('normalise un cache legacy sans relations et le rend noindex par défaut', () => {
    const result = normalizePublicEventDetail({
      _id: 'event-1',
      slug: 'gala',
      title: 'Gala',
      startDate: '2027-05-12T18:00:00.000Z',
    });

    expect(result).toMatchObject({
      gallery: [],
      providers: [],
      ticketTypes: [],
      relatedEvents: [],
      admissionModes: [],
      discoverability: 'unlisted',
      accessPolicy: { type: 'open' },
    });
  });

  it('refuse un payload sans identité publique structurante', () => {
    expect(normalizePublicEventDetail({ title: 'Incomplet' })).toBeNull();
    expect(normalizePublicEventDetail(null)).toBeNull();
  });
});
