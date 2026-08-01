import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProtectedRoute } from './ProtectedRoute';

const { replace, authState } = vi.hoisted(() => ({
  replace: vi.fn(),
  authState: {
    isAuthenticated: false,
    isLoading: true,
  },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
}));

vi.mock('@/shared/hooks/useAuth', () => ({
  useAuth: () => authState,
}));

describe('ProtectedRoute', () => {
  beforeEach(() => {
    replace.mockReset();
    authState.isAuthenticated = false;
    authState.isLoading = true;
  });

  it('attend la validation de session sans afficher le contenu protégé', () => {
    render(
      <ProtectedRoute>
        <p>Contenu privé</p>
      </ProtectedRoute>,
    );

    expect(screen.getByRole('status', { name: 'Vérification de la session' })).toBeInTheDocument();
    expect(screen.queryByText('Contenu privé')).not.toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it('redirige une session absente vers la connexion', async () => {
    authState.isLoading = false;

    render(
      <ProtectedRoute>
        <p>Contenu privé</p>
      </ProtectedRoute>,
    );

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/connexion'));
    expect(screen.queryByText('Contenu privé')).not.toBeInTheDocument();
  });

  it('affiche le contenu seulement après validation de la session', () => {
    authState.isLoading = false;
    authState.isAuthenticated = true;

    render(
      <ProtectedRoute>
        <p>Contenu privé</p>
      </ProtectedRoute>,
    );

    expect(screen.getByText('Contenu privé')).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});
