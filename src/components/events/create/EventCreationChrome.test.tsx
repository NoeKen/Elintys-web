import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { StepNavigation } from './EventCreationChrome';

describe('StepNavigation media state', () => {
  it('désactive la continuation et annonce le téléversement en cours', () => {
    render(
      <StepNavigation
        step={5}
        isSaving
        isUploading
        canGoBack
        canSkip={false}
        venueMode="existing"
        onBack={vi.fn()}
        onContinue={vi.fn()}
        onSkip={vi.fn()}
        onSaveAndExit={vi.fn()}
      />,
    );

    const button = screen.getByRole('button', {
      name: 'Téléversement en cours…',
    });
    expect(button).toBeDisabled();
  });
});
