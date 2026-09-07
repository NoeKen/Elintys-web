import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '@/shared/lib/api';
import { discoveryService } from './discovery.service';

vi.mock('@/shared/lib/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

describe('discoveryService', () => {
  beforeEach(() => vi.clearAllMocks());

  it("n'envoie que les filtres réellement supportés par l'API", async () => {
    // La route valide désormais ses entrées avec forbidNonWhitelisted : un
    // paramètre inconnu produit un 400 au lieu d'être ignoré en silence.
    vi.mocked(api.get).mockResolvedValue({ data: { data: [], total: 0 }, status: 200 });

    await discoveryService.search({ q: 'gala', city: 'Montréal', page: 2, limit: 12 });

    expect(api.get).toHaveBeenCalledWith('/discovery/events', {
      params: { q: 'gala', city: 'Montréal', page: 2, limit: 12 },
    });
  });

  it('accepte une recherche sans filtre', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { data: [], total: 0 }, status: 200 });

    await discoveryService.search();

    expect(api.get).toHaveBeenCalledWith('/discovery/events', { params: {} });
  });

  it('lit les événements mis en avant', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [], status: 200 });

    await discoveryService.getFeatured();

    expect(api.get).toHaveBeenCalledWith('/discovery/featured');
  });
});
