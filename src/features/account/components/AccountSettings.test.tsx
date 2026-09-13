import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthSession, User } from '@/shared/types';

const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
  updateProfile: vi.fn(),
  changePassword: vi.fn(),
  updatePreferences: vi.fn(),
  addRole: vi.fn(),
  resend: vi.fn(),
  getPurchases: vi.fn(),
  replaceDocument: vi.fn(),
}));

vi.mock('@/shared/lib/hard-navigation', () => ({ replaceDocument: mocks.replaceDocument }));

vi.mock('@/shared/hooks/useAuth', () => ({ useAuth: () => mocks.useAuth() }));
vi.mock('@/features/auth/client/auth.service', () => ({
  authService: {
    updateProfile: mocks.updateProfile,
    changePassword: mocks.changePassword,
    updateNotificationPreferences: mocks.updatePreferences,
    addRole: mocks.addRole,
    resendMyVerification: mocks.resend,
  },
}));
vi.mock('@/features/account/client/account.service', () => ({
  accountService: { getPurchases: mocks.getPurchases },
}));

import { AccountSettings } from './AccountSettings';

const user: User = {
  id: 'user-1',
  email: 'ana@example.ca',
  firstName: 'Ana',
  lastName: 'Tremblay',
  roles: ['participant'],
  subscriptions: [],
  referralBalance: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  isEmailVerified: false,
  onboardingCompleted: true,
  onboardingByRole: {},
  onboardingData: {},
  emailNotifications: {
    vendorRequestReceived: true,
    vendorResponse: true,
    venueBookingReceived: true,
    venueResponse: true,
  },
};

function renderSettings() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <AccountSettings />
    </QueryClientProvider>,
  );
}

describe('AccountSettings', () => {
  const login = vi.fn();
  const clearSession = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useAuth.mockReturnValue({ user, isLoading: false, login, clearSession });
    mocks.getPurchases.mockResolvedValue({ data: [], total: 0, page: 1, limit: 10 });
  });

  it('présente uniquement les sections opérationnelles, sans faux abonnement', async () => {
    renderSettings();

    expect(screen.getByRole('heading', { name: 'Paramètres du compte' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Profil' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sécurité' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Notifications par courriel' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Rôles' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Historique des achats' })).toBeInTheDocument();
    expect(screen.queryByText(/gérer.*abonnement/i)).not.toBeInTheDocument();
  });

  it('enregistre le profil et synchronise la session avec la réponse serveur', async () => {
    const session = { user: { ...user, firstName: 'Marie' } } as AuthSession;
    mocks.updateProfile.mockResolvedValue(session);
    renderSettings();

    await userEvent.clear(screen.getByLabelText('Prénom'));
    await userEvent.type(screen.getByLabelText('Prénom'), 'Marie');
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer le profil' }));

    await waitFor(() => expect(mocks.updateProfile).toHaveBeenCalledWith({
      firstName: 'Marie',
      lastName: 'Tremblay',
    }));
    expect(login).toHaveBeenCalledWith(session);
    expect(await screen.findByRole('status')).toHaveTextContent('Profil mis à jour');
  });

  it('met à jour une préférence puis conserve la source serveur', async () => {
    const session = { user: { ...user, emailNotifications: { ...user.emailNotifications!, vendorResponse: false } } } as AuthSession;
    mocks.updatePreferences.mockResolvedValue(session);
    renderSettings();

    await userEvent.click(screen.getByRole('checkbox', { name: /Réponses des prestataires/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer les préférences' }));

    await waitFor(() => expect(mocks.updatePreferences).toHaveBeenCalledWith(
      expect.objectContaining({ vendorResponse: false }),
    ));
    expect(login).toHaveBeenCalledWith(session);
  });

  it('ajoute un rôle autorisé et propose son onboarding sans perdre participant', async () => {
    const session = { user: { ...user, roles: ['participant', 'prestataire'] } } as AuthSession;
    mocks.addRole.mockResolvedValue(session);
    renderSettings();

    await userEvent.click(screen.getByRole('button', { name: 'Ajouter le rôle Prestataire' }));

    await waitFor(() => expect(mocks.addRole).toHaveBeenCalledWith('prestataire'));
    expect(login).toHaveBeenCalledWith(session);
    expect(await screen.findByRole('link', { name: 'Configurer mon profil prestataire' }))
      .toHaveAttribute('href', '/onboarding/prestataire');
  });

  it('révoque la session locale après un changement de mot de passe réussi', async () => {
    mocks.changePassword.mockResolvedValue(undefined);
    renderSettings();

    await userEvent.type(screen.getByLabelText('Mot de passe actuel'), 'AncienSecret1!');
    await userEvent.type(screen.getByLabelText('Nouveau mot de passe'), 'NouveauSecret2!');
    await userEvent.type(screen.getByLabelText('Confirmer le nouveau mot de passe'), 'NouveauSecret2!');
    await userEvent.click(screen.getByRole('button', { name: 'Changer le mot de passe' }));

    await waitFor(() => expect(mocks.changePassword).toHaveBeenCalledWith(
      'AncienSecret1!',
      'NouveauSecret2!',
    ));
    expect(clearSession).toHaveBeenCalled();
    expect(mocks.replaceDocument).toHaveBeenCalledWith('/connexion?reason=password_changed');
  });

  it('refuse une confirmation différente sans appeler le serveur', async () => {
    renderSettings();

    await userEvent.type(screen.getByLabelText('Mot de passe actuel'), 'AncienSecret1!');
    await userEvent.type(screen.getByLabelText('Nouveau mot de passe'), 'NouveauSecret2!');
    await userEvent.type(screen.getByLabelText('Confirmer le nouveau mot de passe'), 'AutreSecret3!');
    await userEvent.click(screen.getByRole('button', { name: 'Changer le mot de passe' }));

    expect(mocks.changePassword).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('ne correspondent pas');
    expect(screen.getByLabelText('Confirmer le nouveau mot de passe')).toHaveFocus();
  });

  it('renvoie la vérification depuis l’identité serveur', async () => {
    mocks.resend.mockResolvedValue(undefined);
    renderSettings();

    await userEvent.click(screen.getByRole('button', { name: 'Renvoyer le lien' }));

    await waitFor(() => expect(mocks.resend).toHaveBeenCalledWith());
    expect(screen.getByRole('status')).toHaveTextContent('un nouveau lien');
  });

  it('affiche les commandes réelles et un événement indisponible sans lien trompeur', async () => {
    mocks.getPurchases.mockResolvedValue({
      data: [{
        _id: 'order-1',
        event: 'event-1',
        eventSummary: null,
        status: 'CANCELLED',
        currency: 'cad',
        totalAmount: 2500,
        createdAt: '2026-09-01T12:00:00.000Z',
        lines: [{ ticketTypeId: 'type-1', quantity: 1, unitPrice: 2500, lineTotal: 2500 }],
        payment: { provider: 'paypal', status: 'CANCELLED', checkoutUrl: null },
      }],
      total: 1,
      page: 1,
      limit: 10,
    });

    renderSettings();

    expect(await screen.findByText('Événement indisponible')).toBeInTheDocument();
    expect(screen.getByText(/25,00/)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Événement indisponible' })).not.toBeInTheDocument();
  });
});
