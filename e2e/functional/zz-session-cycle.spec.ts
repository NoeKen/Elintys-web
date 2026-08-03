import { expect, test } from '@playwright/test';
import { ApiClient, apiContextFor, ownerCredentials } from './helpers';

/**
 * Cycle de session : refresh + déconnexion.
 *
 * ⚠️ Exécuté EN DERNIER (préfixe `zz-`) et sur une session dédiée : l'API ne
 * conserve qu'UN refresh token par utilisateur, donc toute nouvelle connexion
 * du même compte invalide la session partagée par les autres specs.
 */
test.describe('Cycle de session', () => {
  let session: ApiClient;

  test.beforeAll(async () => {
    session = await apiContextFor(ownerCredentials());
  });

  test('devrait renouveler la session via /auth/refresh', async () => {
    expect((await session.post('/auth/refresh')).status()).toBe(200);
    expect((await session.get('/auth/me')).status()).toBe(200);
  });

  test('devrait invalider la session après déconnexion', async () => {
    expect((await session.get('/auth/me')).status()).toBe(200);
    expect((await session.post('/auth/logout')).status()).toBe(200);
    expect((await session.get('/auth/me')).status()).toBe(401);
    await session.dispose();
  });
});
