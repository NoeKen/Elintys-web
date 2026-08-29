import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RegisterStep2Client } from './RegisterStep2Client';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
  clearDraft: vi.fn(),
  readDraft: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push, replace: mocks.replace }),
}));

vi.mock('@/shared/hooks/useAuth', () => ({
  useAuth: () => ({ login: mocks.login }),
}));

vi.mock('@/features/auth/client/auth.service', () => ({
  authService: { register: mocks.register },
}));

vi.mock('@/lib/auth/registration-draft', () => ({
  clearRegistrationDraft: mocks.clearDraft,
  readRegistrationDraft: mocks.readDraft,
}));

vi.mock('@/features/auth/components/AuthSplitLayout', () => ({
  AuthSplitLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/features/auth/components/RegisterStep2RoleSelector', () => ({
  RegisterStep2RoleSelector: ({
    onSubmit,
  }: {
    onSubmit: (data: { firstName: string; lastName: string; role: 'participant' }) => Promise<void>;
  }) => (
    <button
      type="button"
      onClick={() =>
        void onSubmit({
          firstName: 'Alice',
          lastName: 'Martin',
          role: 'participant',
        })
      }
    >
      Créer le compte
    </button>
  ),
}));

describe('RegisterStep2Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.readDraft.mockReturnValue({
      email: 'participant@example.com',
      password: 'Secret123!',
    });
    mocks.register.mockResolvedValue({ user: { roles: ['participant'] } });
  });

  it("conserve le retour événement jusqu'à la vérification du courriel", async () => {
    render(<RegisterStep2Client redirectTo="/evenements/gala-elintys" />);

    await userEvent.click(await screen.findByRole('button', { name: 'Créer le compte' }));

    await waitFor(() => {
      expect(mocks.push).toHaveBeenCalledWith(
        '/verification-email?email=participant%40example.com&next=%2Fevenements%2Fgala-elintys',
      );
    });
  });
});
