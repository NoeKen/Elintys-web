import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { WeeklySection } from './WeeklySection';

describe('WeeklySection', () => {
  it('utilise le slug public et jamais l’ObjectId dans le lien événement', () => {
    render(
      <WeeklySection
        events={[
          {
            _id: '507f1f77bcf86cd799439011',
            slug: 'gala-annuel-elintys',
            title: 'Gala annuel Elintys',
            startDate: '2026-09-10T18:00:00.000Z',
          },
        ]}
      />,
    );

    const link = screen.getByRole('link', { name: /gala annuel elintys/i });
    expect(link).toHaveAttribute('href', '/evenements/gala-annuel-elintys');
    expect(link).not.toHaveAttribute('href', '/evenements/507f1f77bcf86cd799439011');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('G')).toHaveAttribute('aria-hidden', 'true');
  });
});
