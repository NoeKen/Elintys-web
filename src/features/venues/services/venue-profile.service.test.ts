import { beforeEach, describe, expect, it, vi } from 'vitest';
import api, { ApiClientError } from '@/shared/lib/api';
import { venueProfileService, isMissingProfileError } from './venue-profile.service';

vi.mock('@/shared/lib/api', async () => {
  const actual = await vi.importActual<typeof import('@/shared/lib/api')>('@/shared/lib/api');
  return {
    ...actual,
    default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  };
});

const address = { street: '1 rue Test', city: 'Montréal' };

describe('venueProfileService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('lit la fiche du compte connecté', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { _id: 'l1' }, status: 200 });

    await venueProfileService.getMyProfile();

    expect(api.get).toHaveBeenCalledWith('/venues/me');
  });

  it('met à jour via PUT /venues/me et non PUT /venues/:id', async () => {
    vi.mocked(api.put).mockResolvedValue({ data: { _id: 'l1' }, status: 200 });

    await venueProfileService.updateProfile({ name: 'Salle' });

    expect(api.put).toHaveBeenCalledWith('/venues/me', { name: 'Salle' });
  });

  it('crée la fiche via POST /venues', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { _id: 'l1' }, status: 201 });

    await venueProfileService.createProfile({ name: 'Salle', capacity: 100, address });

    expect(api.post).toHaveBeenCalledWith('/venues', {
      name: 'Salle',
      capacity: 100,
      address,
    });
  });

  it('liste le catalogue public avec pagination', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { data: [], total: 0, page: 2, limit: 24 },
      status: 200,
    });

    await venueProfileService.list(2, 24);

    expect(api.get).toHaveBeenCalledWith('/venues', { params: { page: 2, limit: 24 } });
  });

  it('applique une pagination par défaut', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { data: [], total: 0, page: 1, limit: 20 },
      status: 200,
    });

    await venueProfileService.list();

    expect(api.get).toHaveBeenCalledWith('/venues', { params: { page: 1, limit: 20 } });
  });

  it('distingue un 404 métier d’une panne', () => {
    expect(isMissingProfileError(new ApiClientError(404, {}))).toBe(true);
    expect(isMissingProfileError(new ApiClientError(503, {}))).toBe(false);
  });
});
