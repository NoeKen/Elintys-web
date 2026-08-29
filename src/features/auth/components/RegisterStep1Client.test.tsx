import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RegisterStep1Client } from './RegisterStep1Client';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  saveDraft: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock('@/lib/auth/registration-draft', () => ({
  saveRegistrationDraft: mocks.saveDraft,
}));

vi.mock('./RegisterStep1Form', () => ({
  RegisterStep1Form: ({ onSuccess }: { onSuccess: (data: { email: string; password: string }) => void }) => (
    <button type="button" onClick={() => onSuccess({ email: 'participant@example.com', password: 'Secret123!' })}>
      Continuer
    </button>
  ),
}));

describe('RegisterStep1Client', () => {
  beforeEach(() => vi.clearAllMocks());

  it('transmet le retour interne à la deuxième étape', async () => {
    render(<RegisterStep1Client emailTakenError={null} initialEmail="" redirectTo="/evenements/gala-elintys" />);

    await userEvent.click(screen.getByRole('button', { name: 'Continuer' }));

    expect(mocks.saveDraft).toHaveBeenCalled();
    expect(mocks.push).toHaveBeenCalledWith('/inscription/etape-2?redirect=%2Fevenements%2Fgala-elintys');
  });
});
