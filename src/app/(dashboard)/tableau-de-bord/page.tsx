'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { OrganizerDashboardExperience } from '@/components/events/organizer/OrganizerDashboardExperience';
import { useAuth } from '@/shared/hooks/useAuth';
import { getRoleHomePath } from '@/shared/layout/sidebar-nav';

/**
 * Racine du tableau de bord.
 *
 * Cet écran rend l'expérience ORGANISATEUR, dont la source de données est
 * protégée par `@Roles(ORGANISATEUR, ADMIN)`. Y laisser arriver un prestataire
 * ou un gestionnaire produisait un 403 : une panne apparente, alors que le
 * compte est parfaitement valide et que ses écrans existent ailleurs.
 *
 * On redirige donc vers l'accueil de son rôle, sans ajouter de requête : la
 * résolution est purement locale, à partir de la session déjà chargée.
 */
export default function TableauDeBordPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const roleHome = user ? getRoleHomePath(user.roles) : null;
  // `roleHome === '/tableau-de-bord'` pour un organisateur : ne jamais se
  // rediriger vers soi-même, ce serait une boucle.
  const shouldRedirect = Boolean(roleHome) && roleHome !== '/tableau-de-bord';

  useEffect(() => {
    if (!isLoading && shouldRedirect && roleHome) {
      router.replace(roleHome);
    }
  }, [isLoading, shouldRedirect, roleHome, router]);

  if (isLoading || shouldRedirect) {
    return (
      <div
        className="flex min-h-[50vh] items-center justify-center"
        role="status"
        aria-label="Ouverture de votre tableau de bord"
      >
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent"
          aria-hidden="true"
        />
      </div>
    );
  }

  return <OrganizerDashboardExperience />;
}
