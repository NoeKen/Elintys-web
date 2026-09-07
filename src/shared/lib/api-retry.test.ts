import { describe, expect, it } from 'vitest';
import { ApiClientError, retryOnTransientError } from './api';

describe('retryOnTransientError', () => {
  it('ne rejoue jamais une réponse 4xx', () => {
    // Une 4xx est une décision du serveur : la rejouer ne fait que retarder
    // l'affichage de l'état correspondant (mode création sur un 404).
    for (const status of [400, 401, 403, 404, 409, 422]) {
      expect(retryOnTransientError(0, new ApiClientError(status, {}))).toBe(false);
    }
  });

  it('rejoue une 5xx tant que le plafond n’est pas atteint', () => {
    expect(retryOnTransientError(0, new ApiClientError(500, {}))).toBe(true);
    expect(retryOnTransientError(1, new ApiClientError(503, {}))).toBe(true);
    expect(retryOnTransientError(2, new ApiClientError(500, {}))).toBe(false);
  });

  it('rejoue une erreur réseau non typée', () => {
    expect(retryOnTransientError(0, new Error('network'))).toBe(true);
    expect(retryOnTransientError(5, new Error('network'))).toBe(false);
  });
});
