import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CheckoutPage from '../checkout/[eventId]/page';
import PaymentCancelPage from './annule/page';
import PaymentSuccessPage from './succes/page';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

describe('Routes publiques de paiement fermées', () => {
  it('présente le checkout comme indisponible', async () => {
    render(await CheckoutPage({ params: Promise.resolve({ eventId: 'event-1' }) }));

    expect(screen.getByRole('heading', { name: 'L’achat en ligne n’est pas encore ouvert' }))
      .toBeInTheDocument();
    expect(screen.queryByText(/sera finalisé ici/i)).not.toBeInTheDocument();
  });

  it.each([
    ['succès', <PaymentSuccessPage key="success" />],
    ['annulation', <PaymentCancelPage key="cancel" />],
  ])('ne fabrique aucun résultat de paiement sur la route %s', (_label, page) => {
    render(page);

    expect(screen.getByRole('heading', { name: 'L’achat en ligne n’est pas encore ouvert' }))
      .toBeInTheDocument();
    expect(screen.queryByText(/paiement confirmé|paiement annulé|aucun montant.*débité/i))
      .not.toBeInTheDocument();
    expect(screen.queryByText(/référence de session/i)).not.toBeInTheDocument();
  });
});
