import { expect, test } from '@playwright/test';

const redirects = [
  ['/organisateur/evenements', '/tableau-de-bord/evenements'],
  ['/organisateur/invites', '/tableau-de-bord/invitations'],
  ['/prestataire/demandes', '/tableau-de-bord/prestataire/demandes'],
  ['/gestionnaire/reservations', '/tableau-de-bord/gestionnaire/reservations'],
] as const;

test.describe('Wave C — routes dashboard historiques', () => {
  for (const [source, destination] of redirects) {
    test(`${source} redirige vers sa route canonique`, async ({ request }) => {
      const response = await request.get(source, { maxRedirects: 0 });
      expect([307, 308]).toContain(response.status());
      expect(response.headers().location).toBe(destination);
    });
  }
});
