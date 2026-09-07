import { beforeEach, describe, expect, it, vi } from 'vitest';
import api, { ApiClientError } from '@/shared/lib/api';
import {
  vendorProfileService,
  isMissingProfileError,
} from './vendor-profile.service';

vi.mock('@/shared/lib/api', async () => {
  const actual = await vi.importActual<typeof import('@/shared/lib/api')>('@/shared/lib/api');
  return {
    ...actual,
    default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  };
});

describe('vendorProfileService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('lit le profil du compte connecté', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { _id: 'v1' }, status: 200 });

    await vendorProfileService.getMyProfile();

    expect(api.get).toHaveBeenCalledWith('/vendors/me');
  });

  it('met à jour via PUT /vendors/me et non PUT /vendors/:id', async () => {
    // Régression F-04 : PUT /vendors/me était capté par PUT /vendors/:id avec
    // id="me", produisant un CastError Mongoose remonté en 500.
    vi.mocked(api.put).mockResolvedValue({ data: { _id: 'v1' }, status: 200 });

    await vendorProfileService.updateProfile({ businessName: 'Studio' });

    expect(api.put).toHaveBeenCalledWith('/vendors/me', { businessName: 'Studio' });
  });

  it('crée le profil via POST /vendors sans transmettre d’identité', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { _id: 'v1' }, status: 201 });

    await vendorProfileService.createProfile({
      businessName: 'Studio',
      category: 'photographe',
    });

    const [path, body] = vi.mocked(api.post).mock.calls[0];
    expect(path).toBe('/vendors');
    // L'identité vient du JWT côté serveur : aucun userId dans le corps.
    expect(Object.keys(body as object)).not.toContain('userId');
  });

  it('reconnaît un 404 comme « pas encore de profil »', () => {
    expect(isMissingProfileError(new ApiClientError(404, {}))).toBe(true);
  });

  it('ne confond pas une panne serveur avec un profil manquant', () => {
    // Sans cette distinction, une 500 affichait un formulaire d'édition vide.
    expect(isMissingProfileError(new ApiClientError(500, {}))).toBe(false);
    expect(isMissingProfileError(new Error('réseau'))).toBe(false);
  });
});
