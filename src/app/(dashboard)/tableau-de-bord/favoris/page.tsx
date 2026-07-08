'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useAuthToken } from '@/server/auth/use-auth-token';
import {
  favoritesAuthService,
  type Favorite,
  type FavoriteTargetType,
} from '@/features/favorites/services/favorites.service';

const GROUP_LABELS: Record<FavoriteTargetType, string> = {
  event: 'Evenements',
  vendor: 'Prestataires',
  venue: 'Lieux',
};

const GROUP_PATHS: Record<FavoriteTargetType, string> = {
  event: '/evenements',
  vendor: '/prestataires',
  venue: '/lieux',
};

const GROUP_ORDER: FavoriteTargetType[] = ['event', 'vendor', 'venue'];

export default function DashboardFavorisPage() {
  const token = useAuthToken();

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => favoritesAuthService.list(token),
    enabled: !!token,
  });

  const grouped = GROUP_ORDER.reduce<Record<FavoriteTargetType, Favorite[]>>(
    (acc, type) => {
      acc[type] = favorites.filter((fav) => fav.targetType === type);
      return acc;
    },
    { event: [], vendor: [], venue: [] },
  );

  const hasAny = favorites.length > 0;

  if (isLoading) {
    return (
      <div className="p-6 text-sm text-muted">Chargement des favoris...</div>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-serif text-3xl text-navy mb-8">Mes favoris</h1>

      {!hasAny && (
        <div className="text-sm text-muted">
          <p className="mb-4">Aucun favori pour le moment.</p>
          <Link href="/evenements" className="text-teal hover:underline">
            Decouvrir les evenements
          </Link>
        </div>
      )}

      {hasAny &&
        GROUP_ORDER.filter((type) => grouped[type].length > 0).map((type) => (
          <section key={type} className="mb-8">
            <h2 className="font-serif text-xl text-navy mb-3">
              {GROUP_LABELS[type]}
            </h2>
            <ul className="space-y-2">
              {grouped[type].map((fav) => (
                <li key={fav._id}>
                  <Link
                    href={`${GROUP_PATHS[fav.targetType]}/${fav.targetId}`}
                    className="text-sm text-teal hover:underline"
                  >
                    {fav.targetId}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
    </main>
  );
}
