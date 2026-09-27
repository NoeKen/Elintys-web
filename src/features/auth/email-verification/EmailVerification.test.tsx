import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiClientError } from '@/shared/lib/api';
import { notifyEmailNotVerified } from '@/shared/lib/email-verification-signal';
import type { AuthSession, User } from '@/shared/types';
import messages from '../../../../messages/fr.json';
import { EmailVerificationBanner } from './EmailVerificationBanner';
import { EmailVerificationProvider } from './EmailVerificationProvider';
import { RESEND_COOLDOWN_SECONDS } from './email-verification-context';

const copy = messages.emailVerification;

const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
  resendMyVerification: vi.fn(),
  restoreSession: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock('@/shared/hooks/useAuth', () => ({ useAuth: () => mocks.useAuth() }));
vi.mock('@/features/auth/client/auth.service', () => ({
  authService: {
    resendMyVerification: mocks.resendMyVerification,
    restoreSession: mocks.restoreSession,
  },
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mocks.replace, refresh: mocks.refresh }),
}));

function buildUser(overrides: Partial<User> = {}): User {
  return {
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
    ...overrides,
  };
}

const login = vi.fn();
const logout = vi.fn();

function setUser(user: User | null) {
  const session: AuthSession | null = user ? { user } : null;
  mocks.useAuth.mockReturnValue({ user, session, login, logout });
}

function renderBanner() {
  return render(
    <EmailVerificationProvider>
      <EmailVerificationBanner />
    </EmailVerificationProvider>,
  );
}

describe('EmailVerificationBanner', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    login.mockReset();
    logout.mockReset().mockResolvedValue(undefined);
    mocks.resendMyVerification.mockReset();
    mocks.restoreSession.mockReset();
    mocks.replace.mockReset();
    mocks.refresh.mockReset();
    setUser(buildUser());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function user() {
    return userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  }

  it('devrait afficher le message et l’adresse de l’utilisateur non vérifié', () => {
    renderBanner();

    const banner = screen.getByTestId('email-verification-banner');
    expect(banner).toHaveAccessibleName(copy.bannerTitle);
    expect(screen.getByTestId('email-verification-banner-email')).toHaveTextContent('ana@example.ca');
    expect(screen.getByRole('button', { name: copy.resend })).toBeEnabled();
    expect(screen.getByRole('button', { name: copy.logout })).toBeInTheDocument();
  });

  it('devrait être masqué pour un utilisateur vérifié', () => {
    setUser(buildUser({ isEmailVerified: true }));
    renderBanner();

    expect(screen.queryByTestId('email-verification-banner')).not.toBeInTheDocument();
  });

  it('devrait être masqué sans session', () => {
    setUser(null);
    renderBanner();

    expect(screen.queryByTestId('email-verification-banner')).not.toBeInTheDocument();
  });

  it('devrait confirmer le renvoi puis imposer un délai visible avant un nouvel envoi', async () => {
    mocks.resendMyVerification.mockResolvedValue(undefined);
    renderBanner();

    await user().click(screen.getByTestId('email-verification-banner-resend'));

    expect(await screen.findByTestId('email-verification-banner-success')).toHaveTextContent(
      copy.resendSuccess,
    );
    const button = screen.getByTestId('email-verification-banner-resend');
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent(
      copy.cooldown.replace('{seconds}', String(RESEND_COOLDOWN_SECONDS)),
    );

    await act(async () => {
      vi.advanceTimersByTime(10_000);
    });
    expect(button).toHaveTextContent(
      copy.cooldown.replace('{seconds}', String(RESEND_COOLDOWN_SECONDS - 10)),
    );

    await act(async () => {
      vi.advanceTimersByTime(RESEND_COOLDOWN_SECONDS * 1000);
    });
    expect(screen.getByTestId('email-verification-banner-resend')).toBeEnabled();
    expect(screen.getByTestId('email-verification-banner-resend')).toHaveTextContent(copy.resend);
    expect(mocks.resendMyVerification).toHaveBeenCalledTimes(1);
  });

  it('devrait signaler un échec d’envoi sans délai pour permettre un nouvel essai', async () => {
    mocks.resendMyVerification.mockRejectedValue(new ApiClientError(500, {}));
    renderBanner();

    await user().click(screen.getByTestId('email-verification-banner-resend'));

    expect(await screen.findByRole('alert')).toHaveTextContent(copy.resendError);
    expect(screen.getByTestId('email-verification-banner-resend')).toBeEnabled();
  });

  it('devrait respecter un 429 de l’API en affichant le délai', async () => {
    mocks.resendMyVerification.mockRejectedValue(new ApiClientError(429, {}));
    renderBanner();

    await user().click(screen.getByTestId('email-verification-banner-resend'));

    expect(await screen.findByRole('alert')).toHaveTextContent(copy.resendRateLimited);
    expect(screen.getByTestId('email-verification-banner-resend')).toBeDisabled();
  });

  it('devrait relire la session et indiquer une adresse toujours non confirmée', async () => {
    const stillUnverified = { user: buildUser() };
    mocks.restoreSession.mockResolvedValue({ status: 'authenticated', session: stillUnverified });
    renderBanner();

    await user().click(screen.getByTestId('email-verification-banner-refresh'));

    expect(await screen.findByText(copy.stillUnverified)).toBeInTheDocument();
    expect(login).toHaveBeenCalledWith(stillUnverified);
  });

  it('devrait mettre à jour la session quand l’adresse a été confirmée', async () => {
    const verified = { user: buildUser({ isEmailVerified: true }) };
    mocks.restoreSession.mockResolvedValue({ status: 'authenticated', session: verified });
    renderBanner();

    await user().click(screen.getByTestId('email-verification-banner-refresh'));

    await waitFor(() => expect(login).toHaveBeenCalledWith(verified));
    expect(screen.queryByText(copy.stillUnverified)).not.toBeInTheDocument();
  });

  it('devrait ignorer une relecture qui ne renvoie pas de session', async () => {
    mocks.restoreSession.mockResolvedValue({ status: 'anonymous' });
    renderBanner();

    await user().click(screen.getByTestId('email-verification-banner-refresh'));

    await waitFor(() =>
      expect(screen.getByTestId('email-verification-banner-refresh')).toHaveTextContent(copy.refresh),
    );
    expect(login).not.toHaveBeenCalled();
  });

  it('devrait déconnecter puis rediriger vers la connexion', async () => {
    renderBanner();

    await user().click(screen.getByTestId('email-verification-banner-logout'));

    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/connexion'));
    expect(logout).toHaveBeenCalledTimes(1);
  });
});

describe('EmailVerificationProvider — refus EMAIL_NOT_VERIFIED', () => {
  beforeEach(() => {
    login.mockReset();
    mocks.resendMyVerification.mockReset();
  });

  it('devrait ouvrir le dialogue de vérification quand le client API émet le signal', async () => {
    setUser(buildUser());
    render(<EmailVerificationProvider><p>page</p></EmailVerificationProvider>);
    expect(screen.queryByTestId('email-verification-dialog')).not.toBeInTheDocument();

    act(() => notifyEmailNotVerified());

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveAccessibleName(copy.dialogTitle);
    expect(screen.getByTestId('email-verification-dialog')).toHaveTextContent('ana@example.ca');
    expect(screen.getByTestId('email-verification-dialog-resend')).toBeEnabled();
  });

  it('devrait corriger une session locale qui se croyait vérifiée', () => {
    const verifiedUser = buildUser({ isEmailVerified: true });
    setUser(verifiedUser);
    render(<EmailVerificationProvider><p>page</p></EmailVerificationProvider>);

    act(() => notifyEmailNotVerified());

    expect(login).toHaveBeenCalledWith({ user: { ...verifiedUser, isEmailVerified: false } });
  });

  it('devrait ignorer le signal sans session', () => {
    setUser(null);
    render(<EmailVerificationProvider><p>page</p></EmailVerificationProvider>);

    act(() => notifyEmailNotVerified());

    expect(login).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
