import { afterEach, describe, expect, it, vi } from 'vitest';
import sitemap from './sitemap';

describe('sitemap', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('devrait borner l’appel API pour ne jamais bloquer le build', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: [] }), { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await sitemap();

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it('devrait publier les routes statiques quand l’API ne répond pas à temps', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new DOMException('The operation timed out.', 'TimeoutError')),
    );

    const routes = await sitemap();

    expect(routes).toHaveLength(4);
  });

  it('devrait ajouter uniquement les événements publics publiés', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            data: [
              { slug: 'gala', status: 'published', discoverability: 'public', updatedAt: '2026-09-01T00:00:00.000Z' },
              { slug: 'prive', status: 'published', discoverability: 'private' },
              { slug: 'brouillon', status: 'draft', discoverability: 'public' },
            ],
          }),
          { status: 200 },
        ),
      ),
    );

    const routes = await sitemap();

    expect(routes.map((route) => route.url)).toContain('https://app.elintys.com/evenements/gala');
    expect(routes).toHaveLength(5);
  });
});
