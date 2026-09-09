import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotificationBell } from './NotificationBell';

const mocks = vi.hoisted(() => ({
  countUnread: vi.fn(),
  list: vi.fn(),
  markAllRead: vi.fn(),
  markRead: vi.fn(),
  push: vi.fn(),
}));

vi.mock('@/features/notifications/services/notifications.service', () => ({
  notificationsService: mocks,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push }),
}));

function renderBell() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <NotificationBell />
    </QueryClientProvider>,
  );
}

describe('NotificationBell — intégration produit Wave F', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.countUnread.mockResolvedValue({ count: 0 });
    mocks.list.mockResolvedValue([]);
    mocks.markAllRead.mockResolvedValue(undefined);
    mocks.markRead.mockResolvedValue(undefined);
  });

  it('affiche un chargement avant de conclure que la liste est vide', async () => {
    let resolveList!: (value: []) => void;
    mocks.list.mockReturnValue(new Promise((resolve) => { resolveList = resolve; }));
    const user = userEvent.setup();
    renderBell();

    await user.click(screen.getByRole('button', { name: 'Notifications' }));
    expect(screen.getByText('Chargement des notifications…')).toBeInTheDocument();
    expect(screen.queryByText('Aucune notification.')).not.toBeInTheDocument();

    resolveList([]);
    expect(await screen.findByText('Aucune notification.')).toBeInTheDocument();
  });

  it('affiche une panne récupérable avec un vrai retry', async () => {
    mocks.list.mockRejectedValueOnce(new Error('network'));
    const user = userEvent.setup();
    renderBell();

    await user.click(screen.getByRole('button', { name: 'Notifications' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Les notifications sont temporairement indisponibles.',
    );
    expect(screen.queryByText('Aucune notification.')).not.toBeInTheDocument();

    mocks.list.mockResolvedValueOnce([]);
    await user.click(screen.getByRole('button', { name: 'Réessayer' }));
    expect(await screen.findByText('Aucune notification.')).toBeInTheDocument();
    expect(mocks.list).toHaveBeenCalledTimes(2);
  });

  it('marque une notification comme lue puis ouvre son contexte métier sûr', async () => {
    const eventId = '507f1f77bcf86cd799439011';
    mocks.countUnread.mockResolvedValue({ count: 1 });
    mocks.list.mockResolvedValue([{
      _id: '507f1f77bcf86cd799439012',
      type: 'VENDOR_RESPONDED',
      payload: { requestId: '507f1f77bcf86cd799439013', eventId, status: 'accepted' },
      read: false,
      createdAt: '2026-09-08T12:00:00.000Z',
    }]);
    const user = userEvent.setup();
    renderBell();

    await user.click(screen.getByRole('button', { name: /Notifications/ }));
    await user.click(await screen.findByRole('button', { name: /Réponse prestataire/ }));

    expect(mocks.markRead).toHaveBeenCalledWith('507f1f77bcf86cd799439012');
    expect(mocks.push).toHaveBeenCalledWith(
      `/tableau-de-bord/evenements/${eventId}/prestataires`,
    );
    await waitFor(() => expect(screen.queryByText('1')).not.toBeInTheDocument());
  });

  it("n'utilise jamais une destination arbitraire provenant du payload", async () => {
    mocks.list.mockResolvedValue([{
      _id: '507f1f77bcf86cd799439012',
      type: 'VENDOR_RESPONDED',
      payload: { eventId: 'javascript:alert(1)', href: 'https://evil.example' },
      read: false,
      createdAt: '2026-09-08T12:00:00.000Z',
    }]);
    const user = userEvent.setup();
    renderBell();

    await user.click(screen.getByRole('button', { name: /Notifications/ }));
    const item = await screen.findByRole('button', { name: /Réponse prestataire/ });
    await user.click(item);

    expect(mocks.markRead).toHaveBeenCalled();
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("utilise la route canonique invites pour l'acceptation d'une invitation", async () => {
    const eventId = '507f1f77bcf86cd799439011';
    mocks.list.mockResolvedValue([{
      _id: '507f1f77bcf86cd799439012',
      type: 'INVITATION_ACCEPTED',
      payload: { eventId },
      read: false,
      createdAt: '2026-09-08T12:00:00.000Z',
    }]);
    const user = userEvent.setup();
    renderBell();

    await user.click(screen.getByRole('button', { name: /Notifications/ }));
    await user.click(await screen.findByRole('button', { name: /Invitation acceptée/ }));

    expect(mocks.push).toHaveBeenCalledWith(
      `/tableau-de-bord/evenements/${eventId}/invites`,
    );
  });

  it('ferme le panneau avec Escape et rend le focus à la cloche', async () => {
    const user = userEvent.setup();
    renderBell();
    const trigger = screen.getByRole('button', { name: /Notifications/ });

    await user.click(trigger);
    expect(await screen.findByRole('dialog', { name: 'Notifications' })).toBeInTheDocument();
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog', { name: 'Notifications' })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('signale une panne du compteur sans afficher un faux zéro', async () => {
    mocks.countUnread.mockRejectedValue(new Error('503'));
    renderBell();

    expect(await screen.findByRole('button', { name: 'Notifications indisponibles' }))
      .toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('synchronise immédiatement le compteur et la liste après Tout marquer lu', async () => {
    mocks.countUnread.mockResolvedValue({ count: 1 });
    mocks.list.mockResolvedValue([{
      _id: '507f1f77bcf86cd799439012',
      type: 'VENDOR_REQUEST_RECEIVED',
      payload: { requestId: '507f1f77bcf86cd799439013' },
      read: false,
      createdAt: '2026-09-08T12:00:00.000Z',
    }]);
    const user = userEvent.setup();
    renderBell();

    await user.click(screen.getByRole('button', { name: /Notifications/ }));
    await user.click(await screen.findByRole('button', { name: 'Tout marquer lu' }));

    expect(mocks.markAllRead).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByText('1')).not.toBeInTheDocument());
  });

  it("conserve l'état non lu et affiche l'erreur si markRead échoue", async () => {
    mocks.countUnread.mockResolvedValue({ count: 1 });
    mocks.list.mockResolvedValue([{
      _id: '507f1f77bcf86cd799439012',
      type: 'EVENT_REMINDER',
      payload: {},
      read: false,
      createdAt: '2026-09-08T12:00:00.000Z',
    }]);
    mocks.markRead.mockRejectedValueOnce(new Error('503'));
    const user = userEvent.setup();
    renderBell();

    await user.click(screen.getByRole('button', { name: /Notifications/ }));
    await user.click(await screen.findByRole('button', { name: /Rappel événement/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Impossible de marquer cette notification comme lue.',
    );
    expect(screen.getByRole('button', { name: /Rappel événement.*non lue/ })).toBeVisible();
    expect(screen.getByText('1')).toBeVisible();
  });

  it('permet de réessayer Tout marquer lu après une panne', async () => {
    mocks.countUnread.mockResolvedValue({ count: 1 });
    mocks.list.mockResolvedValue([{
      _id: '507f1f77bcf86cd799439012',
      type: 'VENDOR_REQUEST_RECEIVED',
      payload: {},
      read: false,
      createdAt: '2026-09-08T12:00:00.000Z',
    }]);
    mocks.markAllRead.mockRejectedValueOnce(new Error('network'));
    const user = userEvent.setup();
    renderBell();

    await user.click(screen.getByRole('button', { name: /Notifications/ }));
    await user.click(await screen.findByRole('button', { name: 'Tout marquer lu' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Impossible de marquer les notifications comme lues.',
    );
    expect(screen.getByText('1')).toBeVisible();

    mocks.markAllRead.mockResolvedValueOnce(undefined);
    await user.click(screen.getByRole('button', { name: 'Tout marquer lu' }));
    await waitFor(() => expect(screen.queryByText('1')).not.toBeInTheDocument());
  });
});
