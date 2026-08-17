import { afterEach, describe, expect, it, vi } from 'vitest';
import sitemap from '@/app/sitemap';

describe('sitemap événement public', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('inclut uniquement les événements publics, publiés et non archivés', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      data: [
        { slug: 'public', status: 'published', archivedAt: null, discoverability: 'public' },
        { slug: 'unlisted', status: 'published', archivedAt: null, discoverability: 'unlisted' },
        { slug: 'private', status: 'published', archivedAt: null, discoverability: 'private' },
        { slug: 'draft', status: 'draft', archivedAt: null, discoverability: 'public' },
        { slug: 'archived', status: 'published', archivedAt: '2026-08-09T12:00:00.000Z', discoverability: 'public' },
      ],
    }), { status: 200 })));

    const urls = (await sitemap()).map((entry) => entry.url);

    expect(urls).toContain('https://app.elintys.com/evenements/public');
    expect(urls.join('\n')).not.toMatch(/unlisted|private|draft|archived/);
  });

  it('retourne les routes statiques si l’API publique est indisponible', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    const urls = (await sitemap()).map((entry) => entry.url);

    expect(urls).toEqual(expect.arrayContaining([
      'https://app.elintys.com',
      'https://app.elintys.com/evenements',
      'https://app.elintys.com/prestataires',
      'https://app.elintys.com/lieux',
    ]));
  });
});
