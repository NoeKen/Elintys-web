import { describe, expect, it } from 'vitest';
import {
  isAnalyticsEnabled,
  isDeployedEnvironment,
  resolveElintysEnvironment,
  shouldBlockIndexing,
} from './environment';

describe('resolveElintysEnvironment', () => {
  it('devrait retenir une valeur explicite, sans tenir compte de la casse', () => {
    expect(resolveElintysEnvironment({ NEXT_PUBLIC_ELINTYS_ENV: 'uat' })).toBe('uat');
    expect(resolveElintysEnvironment({ NEXT_PUBLIC_ELINTYS_ENV: ' PROD ' })).toBe('prod');
    expect(
      resolveElintysEnvironment({ NEXT_PUBLIC_ELINTYS_ENV: 'dev', VERCEL_ENV: 'production' }),
    ).toBe('dev');
  });

  it('devrait faire échouer le build sur une valeur inconnue', () => {
    expect(() => resolveElintysEnvironment({ NEXT_PUBLIC_ELINTYS_ENV: 'staging' })).toThrow(
      /NEXT_PUBLIC_ELINTYS_ENV/,
    );
  });

  it('devrait traiter une production Vercel sans variable comme prod', () => {
    expect(resolveElintysEnvironment({ VERCEL_ENV: 'production' })).toBe('prod');
    expect(resolveElintysEnvironment({ NEXT_PUBLIC_VERCEL_ENV: 'production' })).toBe('prod');
  });

  it('devrait retomber sur local sinon', () => {
    expect(resolveElintysEnvironment({})).toBe('local');
    expect(resolveElintysEnvironment({ VERCEL_ENV: 'preview' })).toBe('local');
    expect(resolveElintysEnvironment({ NEXT_PUBLIC_ELINTYS_ENV: '  ' })).toBe('local');
  });
});

describe('politiques par environnement', () => {
  it('devrait activer l’analytics uniquement en production', () => {
    expect(isAnalyticsEnabled('prod')).toBe(true);
    for (const env of ['local', 'ci', 'dev', 'uat'] as const) {
      expect(isAnalyticsEnabled(env)).toBe(false);
    }
  });

  it('devrait bloquer l’indexation uniquement des déploiements de test explicites', () => {
    expect(shouldBlockIndexing('dev')).toBe(true);
    expect(shouldBlockIndexing('uat')).toBe(true);
    for (const env of ['local', 'ci', 'prod'] as const) {
      expect(shouldBlockIndexing(env)).toBe(false);
    }
  });

  it('devrait reconnaître les environnements déployés', () => {
    expect(isDeployedEnvironment('dev')).toBe(true);
    expect(isDeployedEnvironment('uat')).toBe(true);
    expect(isDeployedEnvironment('prod')).toBe(true);
    expect(isDeployedEnvironment('local')).toBe(false);
    expect(isDeployedEnvironment('ci')).toBe(false);
  });
});
