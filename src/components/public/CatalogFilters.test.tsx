import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EventsCatalogContent } from './EventsCatalogContent';
import { LieuxContent } from './LieuxContent';
import { PrestatairesContent } from './PrestatairesContent';

const { push } = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

describe('public catalog filters', () => {
  beforeEach(() => {
    push.mockReset();
  });

  it('sends vendor enum, city and price parameters', async () => {
    const user = userEvent.setup();
    render(<PrestatairesContent vendors={[]} total={0} />);

    await user.click(screen.getByLabelText('Photographie'));
    await user.selectOptions(screen.getByLabelText('Filtrer par zone'), 'Montréal');
    await user.click(screen.getByRole('button', { name: '$$' }));
    await user.click(screen.getByRole('button', { name: 'Appliquer' }));

    expect(push).toHaveBeenCalledWith(
      '/prestataires?category=photographe&city=Montr%C3%A9al&price=%24%24',
    );
  });

  it('sends venue enum and minimum capacity parameters', async () => {
    const user = userEvent.setup();
    render(<LieuxContent venues={[]} total={0} />);

    await user.click(screen.getByLabelText('Salle de conférence'));
    await user.click(screen.getByLabelText('Au moins 200 personnes'));
    await user.click(screen.getByRole('button', { name: 'Appliquer' }));

    expect(push).toHaveBeenCalledWith('/lieux?type=conference&capacity=200');
  });

  it('sends event category and city parameters', async () => {
    const user = userEvent.setup();
    render(
      <EventsCatalogContent
        events={[]}
        total={0}
        hasError={false}
      />,
    );

    await user.selectOptions(
      screen.getByLabelText('Filtrer les événements par catégorie'),
      'workshop',
    );
    await user.selectOptions(
      screen.getByLabelText('Filtrer les événements par ville'),
      'Québec',
    );
    await user.click(screen.getByRole('button', { name: 'Appliquer' }));

    expect(push).toHaveBeenCalledWith('/evenements?category=workshop&city=Qu%C3%A9bec');
  });

  it('does not present an API failure as an empty catalog', () => {
    render(<PrestatairesContent vendors={[]} total={0} hasError />);

    expect(screen.getByRole('alert')).toHaveTextContent('Impossible de charger les données');
    expect(screen.queryByText('Aucun résultat')).not.toBeInTheDocument();
  });
});
