import { describe, expect, it } from 'vitest';
import { ApiClientError } from '@/shared/lib/api';
import { getWorkspaceErrorMessage } from './EventWorkspaceShell';

describe('getWorkspaceErrorMessage', () => {
  it('distingue le refus d’accès de la ressource absente', () => {
    expect(getWorkspaceErrorMessage(new ApiClientError(403, {}))).toMatch(/autorisation/);
    expect(getWorkspaceErrorMessage(new ApiClientError(404, {}))).toMatch(/introuvable/);
  });

  it('conserve un état indisponible générique pour les autres pannes', () => {
    expect(getWorkspaceErrorMessage(new ApiClientError(503, {}))).toMatch(/Impossible de charger/);
  });
});
