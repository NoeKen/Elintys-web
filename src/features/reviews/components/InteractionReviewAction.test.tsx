import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InteractionReviewAction } from './InteractionReviewAction';
import { reviewsService } from '../services/reviews.service';

vi.mock('../services/reviews.service', async () => {
  const actual = await vi.importActual<typeof import('../services/reviews.service')>('../services/reviews.service');
  return { ...actual, reviewsService: { ...actual.reviewsService, contextEligibility: vi.fn(), create: vi.fn() } };
});

function show() {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <InteractionReviewAction contextType="vendor_request" contextId="request-1" />
    </QueryClientProvider>,
  );
}

describe('InteractionReviewAction', () => {
  beforeEach(() => {
    vi.mocked(reviewsService.contextEligibility).mockResolvedValue({
      canReview: true,
      targetType: 'organizer',
      contextType: 'vendor_request',
      contextId: 'request-1',
    });
    vi.mocked(reviewsService.create).mockResolvedValue({});
  });

  it('ne charge l’éligibilité qu’à la demande', async () => {
    show();
    expect(reviewsService.contextEligibility).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Évaluer la collaboration' }));
    expect(await screen.findByRole('radio', { name: '5 étoiles' })).toBeChecked();
    expect(reviewsService.contextEligibility).toHaveBeenCalledWith('vendor_request', 'request-1');
  });

  it('publie la direction retournée par le serveur sans cible choisie côté client', async () => {
    show();
    fireEvent.click(screen.getByRole('button', { name: 'Évaluer la collaboration' }));
    fireEvent.change(await screen.findByLabelText('Votre commentaire'), { target: { value: 'Collaboration très professionnelle.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Publier mon avis' }));
    await waitFor(() => expect(reviewsService.create).toHaveBeenCalledWith({
      targetType: 'organizer',
      contextType: 'vendor_request',
      contextId: 'request-1',
      rating: 5,
      comment: 'Collaboration très professionnelle.',
    }));
    expect(await screen.findByText('Votre avis a déjà été transmis.')).toBeInTheDocument();
  });

  it('reste honnête lorsque la collaboration n’est pas terminée', async () => {
    vi.mocked(reviewsService.contextEligibility).mockResolvedValue({ canReview: false, reason: 'REVIEW_NOT_ELIGIBLE' });
    show();
    fireEvent.click(screen.getByRole('button', { name: 'Évaluer la collaboration' }));
    expect(await screen.findByText('L’avis sera disponible lorsque la collaboration sera terminée.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Publier mon avis' })).not.toBeInTheDocument();
  });
});
