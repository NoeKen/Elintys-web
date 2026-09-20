import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VerifiedReviews } from './VerifiedReviews';
import { reviewsService } from '../services/reviews.service';

const auth = vi.hoisted(() => ({
  value: { isAuthenticated: true, isLoading: false, isSessionUnavailable: false },
}));

vi.mock('@/shared/hooks/useAuth', () => ({ useAuth: () => auth.value }));

vi.mock('../services/reviews.service', async () => {
  const actual = await vi.importActual<typeof import('../services/reviews.service')>('../services/reviews.service');
  return { ...actual, reviewsService: { list: vi.fn(), eligibility: vi.fn(), create: vi.fn() } };
});

function show() {
  return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><VerifiedReviews targetType="event" targetId="event-1" /></QueryClientProvider>);
}

describe('VerifiedReviews', () => {
  beforeEach(() => {
    auth.value = { isAuthenticated: true, isLoading: false, isSessionUnavailable: false };
    vi.mocked(reviewsService.list).mockResolvedValue({ data: [], total: 0, page: 1, limit: 10, summary: { average: 0, count: 0 } });
    vi.mocked(reviewsService.eligibility).mockResolvedValue({ canReview: false, reason: 'REVIEW_NOT_ELIGIBLE' });
    vi.mocked(reviewsService.create).mockResolvedValue({});
  });

  it('n’appelle pas l’éligibilité privée pour un visiteur anonyme', async () => {
    auth.value = { isAuthenticated: false, isLoading: false, isSessionUnavailable: false };
    show();
    expect(await screen.findByText('Aucun avis pour le moment.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Connectez-vous pour vérifier votre admissibilité.' })).toBeInTheDocument();
    expect(reviewsService.eligibility).not.toHaveBeenCalled();
  });

  it('affiche un empty state honnête sans formulaire si inéligible', async () => {
    show();
    expect(await screen.findByText('Aucun avis pour le moment.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Publier mon avis' })).not.toBeInTheDocument();
  });

  it('rend le contrôle radio accessible seulement si le serveur autorise', async () => {
    vi.mocked(reviewsService.eligibility).mockResolvedValue({ canReview: true, targetType: 'event', contextType: 'event', contextId: 'event-1' });
    show();
    expect(await screen.findByRole('radio', { name: '5 étoiles' })).toBeChecked();
    expect(screen.getAllByRole('radio')).toHaveLength(5);
  });

  it('bloque le double submit et attend le succès serveur', async () => {
    vi.mocked(reviewsService.eligibility).mockResolvedValue({ canReview: true, targetType: 'event', contextType: 'event', contextId: 'event-1' });
    let resolve!: (value: unknown) => void;
    vi.mocked(reviewsService.create).mockReturnValue(new Promise((done) => { resolve = done; }));
    show();
    fireEvent.change(await screen.findByLabelText('Votre commentaire'), { target: { value: 'Une expérience superbe.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Publier mon avis' }));
    expect(screen.getByRole('button', { name: 'Publication…' })).toBeDisabled();
    await waitFor(() => expect(reviewsService.create).toHaveBeenCalledTimes(1));
    resolve({});
    await waitFor(() => expect(screen.getByText('Votre avis a été publié.')).toBeInTheDocument());
  });
});
