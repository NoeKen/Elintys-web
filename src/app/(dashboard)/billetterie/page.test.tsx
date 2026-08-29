import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import BilletteriePage from './page';

const mocks = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock('@/shared/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/lib/api')>();
  return { ...actual, default: { get: mocks.get } };
});

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <BilletteriePage />
    </QueryClientProvider>,
  );
}

const sampleTickets = [
  {
    _id: 'ticket-1',
    event: { _id: 'event-1', title: 'Gala Elintys', startDate: '2027-05-15T18:00:00.000Z', slug: 'gala-elintys' },
    ticketType: { _id: 'tt-1', name: 'Admission générale', price: 4500, isFree: false },
    status: 'valid',
    price: 4500,
    createdAt: '2026-08-01T10:00:00.000Z',
  },
  {
    _id: 'ticket-2',
    event: { _id: 'event-2', title: 'Conférence Tech', startDate: '2026-09-10T09:00:00.000Z', slug: 'conference-tech' },
    ticketType: { _id: 'tt-2', name: 'Gratuit', price: 0, isFree: true },
    status: 'used',
    price: 0,
    createdAt: '2026-07-15T08:00:00.000Z',
  },
];

describe('BilletteriePage', () => {
  beforeEach(() => vi.clearAllMocks());

  it("devrait afficher le titre de la page", async () => {
    mocks.get.mockResolvedValue({ data: [] });
    renderPage();
    expect(await screen.findByRole('heading', { name: 'Mes billets' })).toBeInTheDocument();
  });

  it("devrait afficher l'état vide si aucun billet", async () => {
    mocks.get.mockResolvedValue({ data: [] });
    renderPage();
    expect(await screen.findByTestId('empty-state')).toBeInTheDocument();
    expect(screen.getByText(/Aucun billet pour l/)).toBeInTheDocument();
  });

  it("devrait afficher les billets avec titre de l'événement et lien", async () => {
    mocks.get.mockResolvedValue({ data: sampleTickets });
    renderPage();

    const eventLinks = await screen.findAllByTestId('ticket-event-link');
    expect(eventLinks[0]).toHaveAttribute('href', '/evenements/gala-elintys');
    expect(eventLinks[0]).toHaveTextContent('Gala Elintys');
  });

  it("devrait afficher le nom du type de billet", async () => {
    mocks.get.mockResolvedValue({ data: sampleTickets });
    renderPage();

    const ticketTypeNames = await screen.findAllByTestId('ticket-type-name');
    expect(ticketTypeNames[0]).toHaveTextContent('Admission générale');
    expect(ticketTypeNames[1]).toHaveTextContent('Gratuit');
  });

  it("devrait afficher les badges de statut", async () => {
    mocks.get.mockResolvedValue({ data: sampleTickets });
    renderPage();

    const statuses = await screen.findAllByTestId('ticket-status');
    expect(statuses[0]).toHaveTextContent('Valide');
    expect(statuses[1]).toHaveTextContent('Utilisé');
  });

  it("devrait afficher Gratuit pour les billets isFree", async () => {
    mocks.get.mockResolvedValue({ data: sampleTickets });
    renderPage();

    const prices = await screen.findAllByTestId('ticket-price');
    expect(prices[0]).toHaveTextContent('45.00 $ CAD');
    expect(prices[1]).toHaveTextContent('Gratuit');
  });

  it("devrait afficher une erreur et le bouton réessayer", async () => {
    mocks.get.mockRejectedValue(new Error('Network error'));
    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('Impossible de charger vos billets');
    expect(screen.getByRole('button', { name: 'Réessayer' })).toBeInTheDocument();
  });

  it("devrait appeler refetch au clic sur Réessayer", async () => {
    const user = userEvent.setup({ delay: null });
    mocks.get
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValue({ data: [] });

    renderPage();
    await screen.findByRole('alert');
    await user.click(screen.getByRole('button', { name: 'Réessayer' }));

    expect(mocks.get).toHaveBeenCalledTimes(2);
  });
});
