import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchCatalogJson } from './catalog-api';

describe('fetchCatalogJson', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it.each([429, 503])('retourne une panne explicite pour HTTP %s', async (status) => {
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status })));

    await expect(fetchCatalogJson('/discovery/search?q=gala')).resolves.toMatchObject({
      data: null,
      error: true,
    });
  });

  it('retourne une panne explicite sur erreur réseau sans exposer le détail', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('socket secret')));

    const result = await fetchCatalogJson('/discovery/search?q=gala');

    expect(result.data).toBeNull();
    expect(result.error).toBe(true);
    expect(log).toHaveBeenCalledOnce();
    expect(log.mock.calls[0]?.[0]).not.toContain('socket secret');
  });
});
