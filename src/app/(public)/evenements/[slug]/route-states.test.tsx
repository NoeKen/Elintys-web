import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import PublicEventError from './error';
import PublicEventLoading from './loading';
import PublicEventNotFound from './not-found';
import { generateMetadata } from './page';

describe('états de route de la page événement publique', () => {
  it('annonce le chargement et rend un squelette stable', () => {
    render(<PublicEventLoading />);

    expect(screen.getByLabelText('Chargement de l’événement')).toHaveAttribute('aria-busy', 'true');
  });

  it('propose une nouvelle tentative après une erreur serveur', async () => {
    const reset = vi.fn();
    const user = userEvent.setup({ delay: null });
    render(<PublicEventError error={new Error('indisponible')} reset={reset} />);

    expect(screen.getByRole('heading', { name: 'Impossible de charger cet événement' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Réessayer' }));
    expect(reset).toHaveBeenCalledOnce();
  });

  it('rend un état introuvable neutre sans révéler de détail', () => {
    render(<PublicEventNotFound />);

    expect(screen.getByRole('heading', { name: 'Cet événement n’est pas disponible' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Voir les événements' })).toHaveAttribute('href', '/evenements');
  });

  it('conserve un titre et noindex quand la récupération serveur échoue', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('API indisponible')));

    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: 'erreur-metadata' }),
    });

    expect(metadata.title).toBe('Impossible de charger cet événement');
    expect(metadata.robots).toEqual({ index: false, follow: false });
    vi.unstubAllGlobals();
  });
});
