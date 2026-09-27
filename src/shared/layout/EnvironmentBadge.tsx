import type { ElintysEnvironment } from '@/shared/config/environment';
import messages from '../../../messages/fr.json';

const copy = messages.environment;

interface EnvironmentBadgeProps {
  environment: ElintysEnvironment;
}

/**
 * Repère visuel permanent de l'environnement de recette.
 *
 * Server Component : la valeur est figée au build, aucun JavaScript client.
 * `pointer-events-none` : le badge ne masque jamais une action de la page.
 */
export function EnvironmentBadge({ environment }: EnvironmentBadgeProps) {
  if (environment !== 'uat') return null;

  return (
    <div
      role="note"
      aria-label={copy.badgeLabel}
      title={copy.badgeLabel}
      data-testid="environment-badge"
      className="pointer-events-none fixed bottom-3 left-3 z-[60] rounded-full bg-amber px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-white shadow-card"
    >
      {copy.badge}
    </div>
  );
}
