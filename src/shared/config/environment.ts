/**
 * Environnement Elintys ciblé par le BUILD du frontend.
 *
 * Source : `NEXT_PUBLIC_ELINTYS_ENV` (inlinée au build par Next — valeur non
 * secrète). À défaut, un déploiement Vercel de production (`VERCEL_ENV` ou
 * `NEXT_PUBLIC_VERCEL_ENV` = `production`) est traité comme `prod` pour ne pas
 * couper l'analytics de production avant que la variable soit posée. Tout le
 * reste retombe sur `local`. Une valeur inconnue fait échouer le build.
 *
 * | Valeur | Usage                                  |
 * |--------|----------------------------------------|
 * | local  | poste de développement                 |
 * | ci     | GitHub Actions (build / E2E)           |
 * | dev    | https://dev.elintys.com (branche dev)  |
 * | uat    | https://uat.elintys.com (branche uat)  |
 * | prod   | https://app.elintys.com (branche main) |
 */
export const ELINTYS_ENVIRONMENTS = ['local', 'ci', 'dev', 'uat', 'prod'] as const;

export type ElintysEnvironment = (typeof ELINTYS_ENVIRONMENTS)[number];

export interface ElintysEnvironmentSource {
  NEXT_PUBLIC_ELINTYS_ENV?: string;
  NEXT_PUBLIC_VERCEL_ENV?: string;
  /** Posée par Vercel côté serveur et pendant le build (jamais dans le bundle client). */
  VERCEL_ENV?: string;
}

function isElintysEnvironment(value: string): value is ElintysEnvironment {
  return (ELINTYS_ENVIRONMENTS as readonly string[]).includes(value);
}

export function resolveElintysEnvironment(
  source: ElintysEnvironmentSource = {
    // Accès littéraux : Next ne remplace que `process.env.NEXT_PUBLIC_X` écrit en entier.
    NEXT_PUBLIC_ELINTYS_ENV: process.env.NEXT_PUBLIC_ELINTYS_ENV,
    NEXT_PUBLIC_VERCEL_ENV: process.env.NEXT_PUBLIC_VERCEL_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
  },
): ElintysEnvironment {
  const raw = source.NEXT_PUBLIC_ELINTYS_ENV?.trim().toLowerCase();
  if (raw) {
    if (isElintysEnvironment(raw)) return raw;
    throw new Error(
      `NEXT_PUBLIC_ELINTYS_ENV doit valoir l'une de : ${ELINTYS_ENVIRONMENTS.join(', ')}.`,
    );
  }
  const vercelEnvironment = source.NEXT_PUBLIC_VERCEL_ENV ?? source.VERCEL_ENV;
  if (vercelEnvironment === 'production') return 'prod';
  return 'local';
}

/** Environnements déployés et accessibles publiquement. */
export function isDeployedEnvironment(environment: ElintysEnvironment): boolean {
  return environment === 'dev' || environment === 'uat' || environment === 'prod';
}

/** L'analytics (Vercel Analytics) ne mesure que la production réelle. */
export function isAnalyticsEnabled(environment: ElintysEnvironment): boolean {
  return environment === 'prod';
}

/**
 * Les environnements de test DÉPLOYÉS ne doivent pas être indexés.
 *
 * Volontairement limité aux valeurs explicites `dev` et `uat` : un oubli de
 * configuration en production (repli `local`) ne doit jamais désindexer
 * app.elintys.com.
 */
export function shouldBlockIndexing(environment: ElintysEnvironment): boolean {
  return environment === 'dev' || environment === 'uat';
}

export const ELINTYS_ENV: ElintysEnvironment = resolveElintysEnvironment();
