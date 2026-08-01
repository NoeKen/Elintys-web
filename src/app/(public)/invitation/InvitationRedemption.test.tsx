import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InvitationRedemption } from './InvitationRedemption';

const mocks = vi.hoisted(() => ({ accept: vi.fn() }));

vi.mock('@/features/invitations/services/invitations.service', () => ({
  invitationsService: { accept: mocks.accept },
}));

describe('InvitationRedemption', () => {
  beforeEach(() => vi.clearAllMocks());

  it('refuse un lien sans token sans appeler le backend', () => {
    render(<InvitationRedemption />);
    expect(screen.getByText('Ce lien d’invitation est incomplet.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Accepter l’invitation' })).toBeDisabled();
  });

  it('accepte une invitation une seule fois depuis une action explicite', async () => {
    const user = userEvent.setup();
    mocks.accept.mockResolvedValue({});
    render(<InvitationRedemption token="raw-token" />);
    await user.click(screen.getByRole('button', { name: 'Accepter l’invitation' }));
    expect(await screen.findByText(/Votre accès est maintenant confirmé/)).toBeInTheDocument();
    expect(mocks.accept).toHaveBeenCalledWith('raw-token');
    expect(screen.queryByRole('button', { name: 'Accepter l’invitation' })).not.toBeInTheDocument();
  });
});
