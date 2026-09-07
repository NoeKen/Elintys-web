/**
 * Validation de l'URL d'approbation PayPal — abstraction UNIQUE.
 *
 * Pourquoi une garde côté client alors que l'API valide déjà l'URL avant de la
 * renvoyer ? Parce que les deux gardes protègent contre des choses
 * différentes : celle du serveur protège d'une réponse PayPal inattendue,
 * celle-ci protège d'une redirection ouverte si la réponse de l'API était
 * altérée en transit ou si un environnement était mal configuré.
 *
 * L'hôte autorisé vient d'une variable de BUILD (`NEXT_PUBLIC_PAYPAL_ENV`) et
 * non de la réponse serveur : une allow-list transmise dans la réponse qu'elle
 * est censée valider n'apporterait aucune garantie.
 *
 * Basculer Sandbox ↔ Live ne demande aucune modification de ce fichier.
 */

export const PAYPAL_ENVIRONMENTS = ['sandbox', 'live'] as const;
export type PayPalEnvironment = (typeof PAYPAL_ENVIRONMENTS)[number];

/**
 * Hôtes d'approbation acheteur, par environnement.
 *
 * Comparaison EXACTE et non par domaine : `www.sandbox.paypal.com` est un
 * sous-domaine de `paypal.com`, donc une règle par domaine accepterait les URL
 * Sandbox en configuration Live et ne cloisonnerait pas les environnements.
 */
const APPROVAL_HOSTS: Record<PayPalEnvironment, readonly string[]> = {
  sandbox: ['sandbox.paypal.com', 'www.sandbox.paypal.com'],
  live: ['paypal.com', 'www.paypal.com'],
};

export function isPayPalEnvironment(value: string): value is PayPalEnvironment {
  return (PAYPAL_ENVIRONMENTS as readonly string[]).includes(value);
}

/**
 * `NEXT_PUBLIC_PAYPAL_ENV` absent ⇒ `sandbox`; une valeur invalide est rejetée.
 *
 * Le défaut penche vers l'environnement inoffensif. Une faute de configuration
 * explicite échoue bruyamment au lieu de sélectionner un environnement à son insu.
 */
export function resolvePayPalEnvironment(raw = process.env.NEXT_PUBLIC_PAYPAL_ENV): PayPalEnvironment {
  const value = (raw ?? '').trim().toLowerCase();
  if (!value) return 'sandbox';
  if (isPayPalEnvironment(value)) return value;
  throw new Error(`NEXT_PUBLIC_PAYPAL_ENV must be one of: ${PAYPAL_ENVIRONMENTS.join(', ')}.`);
}

function normalizeHost(value: string): string {
  return value.trim().toLowerCase().replace(/\.$/, '');
}

/**
 * Protection contre la redirection ouverte.
 *
 * Refuse : `http:`, `javascript:`, `data:`, tout hôte hors liste, et les
 * domaines sosies (`paypal.com.attacker.tld`, `fakepaypal.com`).
 */
export function isTrustedApprovalUrl(
  value: string,
  environment: PayPalEnvironment = resolvePayPalEnvironment(),
): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }

  if (url.protocol !== 'https:') return false;

  const host = normalizeHost(url.hostname);
  if (!host) return false;

  return APPROVAL_HOSTS[environment].some((allowed) => normalizeHost(allowed) === host);
}
