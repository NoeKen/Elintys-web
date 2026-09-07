import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { ApiClientError } from '@/shared/lib/api';
import PrestataireProfilPage from './page';

const mocks = vi.hoisted(() => ({
  getMyProfile: vi.fn(),
  createProfile: vi.fn(),
  updateProfile: vi.fn(),
  useAuth: vi.fn(),
}));

vi.mock('@/features/vendors/services/vendor-profile.service', async () => {
  const actual = await vi.importActual<
    typeof import('@/features/vendors/services/vendor-profile.service')
  >('@/features/vendors/services/vendor-profile.service');
  return {
    ...actual,
    vendorProfileService: {
      getMyProfile: mocks.getMyProfile,
      createProfile: mocks.createProfile,
      updateProfile: mocks.updateProfile,
    },
  };
});
vi.mock('@/shared/hooks/useAuth', () => ({ useAuth: () => mocks.useAuth() }));

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return render(<PrestataireProfilPage />, { wrapper: Wrapper });
}

const existingProfile = {
  _id: 'v1',
  businessName: 'Lumière Nord',
  category: 'photographe' as const,
  serviceArea: 'Montréal',
  photos: [],
  rating: 0,
  reviewCount: 0,
  isActive: true,
};

describe('Page profil prestataire', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useAuth.mockReturnValue({
      user: { email: 'qa@demo.ca', onboardingData: {} },
    });
  });

  it('passe en mode création quand aucun profil n’existe (404 métier)', async () => {
    mocks.getMyProfile.mockRejectedValue(new ApiClientError(404, { message: 'VENDOR_PROFILE_NOT_FOUND' }));

    renderPage();

    expect(
      await screen.findByRole('heading', { name: 'Créer mon profil prestataire' }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('vendor-profile-submit')).toHaveTextContent('Créer mon profil');
  });

  it('crée le profil via POST plutôt que via une mise à jour', async () => {
    mocks.getMyProfile.mockRejectedValue(new ApiClientError(404, {}));
    mocks.createProfile.mockResolvedValue(existingProfile);

    renderPage();
    await screen.findByTestId('vendor-profile-form');

    await userEvent.type(screen.getByLabelText(/Nom commercial/), 'Studio QA');
    await userEvent.selectOptions(screen.getByLabelText(/Catégorie/), 'photographe');
    await userEvent.click(screen.getByTestId('vendor-profile-submit'));

    await waitFor(() => expect(mocks.createProfile).toHaveBeenCalled());
    expect(mocks.updateProfile).not.toHaveBeenCalled();
  });

  it('édite un profil existant via PUT /vendors/me', async () => {
    mocks.getMyProfile.mockResolvedValue(existingProfile);
    mocks.updateProfile.mockResolvedValue(existingProfile);

    renderPage();
    await waitFor(() =>
      expect(screen.getByLabelText(/Nom commercial/)).toHaveValue('Lumière Nord'),
    );

    await userEvent.click(screen.getByTestId('vendor-profile-submit'));

    await waitFor(() => expect(mocks.updateProfile).toHaveBeenCalled());
    expect(mocks.createProfile).not.toHaveBeenCalled();
  });

  it('propose la catégorie en liste fermée, alignée sur l’énumération API', async () => {
    // Régression F-12 : un champ texte libre était systématiquement refusé
    // en 400 par @IsEnum(VendorCategory).
    mocks.getMyProfile.mockResolvedValue(existingProfile);

    renderPage();
    const select = await screen.findByLabelText(/Catégorie/);

    expect(select.tagName).toBe('SELECT');
    const values = Array.from(select.querySelectorAll('option')).map((o) => o.value);
    expect(values).toEqual([
      'photographe',
      'traiteur',
      'dj',
      'decorateur',
      'animateur',
      'sonorisation',
      'autre',
    ]);
  });

  it('affiche un état d’erreur explicite sur une panne, pas un formulaire vide', async () => {
    // Cœur du finding : une 500 rendait un formulaire d'édition vierge, comme
    // si un profil existait et était simplement vide.
    mocks.getMyProfile.mockRejectedValue(new ApiClientError(500, {}));

    renderPage();

    // Une 5xx est transitoire : elle est réessayée avant d'être présentée
    // comme une panne, d'où l'attente explicite.
    expect(await screen.findByRole('alert', {}, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.queryByTestId('vendor-profile-form')).not.toBeInTheDocument();
  });

  it('préremplit la création avec les données d’onboarding disponibles', async () => {
    mocks.getMyProfile.mockRejectedValue(new ApiClientError(404, {}));
    mocks.useAuth.mockReturnValue({
      user: {
        email: 'qa@demo.ca',
        onboardingData: { prestataire: { displayName: 'Studio Onboardé' } },
      },
    });

    renderPage();

    await waitFor(() =>
      expect(screen.getByLabelText(/Nom commercial/)).toHaveValue('Studio Onboardé'),
    );
  });

  it('annonce le succès au lecteur d’écran', async () => {
    mocks.getMyProfile.mockResolvedValue(existingProfile);
    mocks.updateProfile.mockResolvedValue(existingProfile);

    renderPage();
    await waitFor(() =>
      expect(screen.getByLabelText(/Nom commercial/)).toHaveValue('Lumière Nord'),
    );
    await userEvent.click(screen.getByTestId('vendor-profile-submit'));

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Profil enregistré avec succès.',
    );
  });

  it('rend visible un échec d’enregistrement', async () => {
    mocks.getMyProfile.mockResolvedValue(existingProfile);
    mocks.updateProfile.mockRejectedValue(new ApiClientError(400, { message: 'invalide' }));

    renderPage();
    await waitFor(() =>
      expect(screen.getByLabelText(/Nom commercial/)).toHaveValue('Lumière Nord'),
    );
    await userEvent.click(screen.getByTestId('vendor-profile-submit'));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });
});
