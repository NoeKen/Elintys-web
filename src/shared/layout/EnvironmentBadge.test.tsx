import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import messages from '../../../messages/fr.json';
import { EnvironmentBadge } from './EnvironmentBadge';

describe('EnvironmentBadge', () => {
  it('devrait signaler l’environnement de recette', () => {
    render(<EnvironmentBadge environment="uat" />);

    const badge = screen.getByTestId('environment-badge');
    expect(badge).toHaveTextContent(messages.environment.badge);
    expect(badge).toHaveAccessibleName(messages.environment.badgeLabel);
  });

  it('ne devrait rien afficher hors UAT', () => {
    for (const environment of ['local', 'ci', 'dev', 'prod'] as const) {
      const { container, unmount } = render(<EnvironmentBadge environment={environment} />);
      expect(container).toBeEmptyDOMElement();
      unmount();
    }
  });
});
