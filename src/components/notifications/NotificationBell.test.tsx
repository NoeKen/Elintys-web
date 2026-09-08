import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotificationBell } from './NotificationBell';

const mocks = vi.hoisted(() => ({
  countUnread: vi.fn(),
  list: vi.fn(),
  markAllRead: vi.fn(),
}));

vi.mock('@/features/notifications/services/notifications.service', () => ({
  notificationsService: mocks,
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

describe('NotificationBell — états honnêtes Wave D', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.countUnread.mockResolvedValue({ count: 0 });
    mocks.list.mockResolvedValue([]);
    mocks.markAllRead.mockResolvedValue(undefined);
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
});
