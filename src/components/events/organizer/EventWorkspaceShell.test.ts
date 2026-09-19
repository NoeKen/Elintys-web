import { describe, expect, it } from 'vitest';
import { ApiClientError } from '@/shared/lib/api';
import {
  canPreviewWorkspaceEvent,
  getWorkspaceErrorMessage,
  isTerminalWorkspaceReadOnly,
} from './EventWorkspaceShell';

describe('canPreviewWorkspaceEvent', () => {
  const active = {
    slug: 'gala-boreal',
    status: 'published' as const,
    discoverability: 'public' as const,
  };

  it('autorise les événements publics/non répertoriés actifs', () => {
    expect(canPreviewWorkspaceEvent(active)).toBe(true);
    expect(canPreviewWorkspaceEvent({
      ...active,
      status: 'ongoing',
      discoverability: 'unlisted',
    })).toBe(true);
  });

  it('masque le CTA pour privé, terminal, brouillon ou sans slug', () => {
    expect(canPreviewWorkspaceEvent({ ...active, discoverability: 'private' })).toBe(false);
    expect(canPreviewWorkspaceEvent({ ...active, status: 'cancelled' })).toBe(false);
    expect(canPreviewWorkspaceEvent({ ...active, status: 'draft' })).toBe(false);
    expect(canPreviewWorkspaceEvent({ ...active, slug: '' })).toBe(false);
  });
});

describe('getWorkspaceErrorMessage', () => {
  it('distingue le refus d’accès de la ressource absente', () => {
    expect(getWorkspaceErrorMessage(new ApiClientError(403, {}))).toMatch(/autorisation/);
    expect(getWorkspaceErrorMessage(new ApiClientError(404, {}))).toMatch(/introuvable/);
  });

  it('conserve un état indisponible générique pour les autres pannes', () => {
    expect(getWorkspaceErrorMessage(new ApiClientError(503, {}))).toMatch(/Impossible de charger/);
  });
});

describe('isTerminalWorkspaceReadOnly', () => {
  const base = '/tableau-de-bord/evenements/507f1f77bcf86cd799439011';

  it.each(['completed', 'cancelled'])(
    'rend les sous-modules inertes pour un événement %s',
    (status) => {
      expect(
        isTerminalWorkspaceReadOnly(status, `${base}/informations`, base),
      ).toBe(true);
    },
  );

  it('conserve la vue d’ensemble et les paramètres navigables', () => {
    expect(isTerminalWorkspaceReadOnly('completed', base, base)).toBe(false);
    expect(
      isTerminalWorkspaceReadOnly('cancelled', `${base}/parametres`, base),
    ).toBe(false);
  });

  it('ne bloque jamais un événement actif', () => {
    expect(
      isTerminalWorkspaceReadOnly('ongoing', `${base}/informations`, base),
    ).toBe(false);
  });
});
