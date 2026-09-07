'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { FavoriteButton } from '@/components/favorites/FavoriteButton';
import { useFavorites } from '@/features/favorites/hooks/useFavorites';
import type { Favorite, FavoriteTargetType } from '@/features/favorites/favorites.service';

const GROUP_LABELS: Record<FavoriteTargetType, string> = {
  event: 'Événements',
  vendor: 'Prestataires',
  venue: 'Lieux',
};

const GROUP_ORDER: FavoriteTargetType[] = ['event', 'vendor', 'venue'];

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('fr-CA', { dateStyle: 'long' }).format(new Date(iso));
}

function FavoriteRow({ favorite }: { favorite: Favorite }) {
  const { target } = favorite;

  // La cible a disparu depuis la mise en favori. On le dit, au lieu d'afficher
  // un identifiant technique ou de masquer silencieusement la ligne.
  if (!target) {
    return (
      <li className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-low p-4">
        <p className="text-sm text-muted">Cet élément n’est plus disponible.</p>
        <FavoriteButton
          targetId={favorite.targetId}
          targetType={favorite.targetType}
          size="sm"
        />
      </li>
    );
  }

  const body = (
    <>
      {target.imageUrl ? (
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg">
          <Image src={target.imageUrl} alt="" fill unoptimized className="object-cover" sizes="56px" />
        </div>
      ) : (
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-teal/10 font-serif text-xl text-teal"
          aria-hidden="true"
        >
          {target.label.charAt(0)}
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate font-semibold text-navy">{target.label}</p>
        {target.startDate && (
          <p className="text-xs text-muted">{formatDate(target.startDate)}</p>
        )}
        {target.subtitle && <p className="truncate text-xs text-muted">{target.subtitle}</p>}
      </div>
    </>
  );

  return (
    <li className="flex items-center justify-between gap-3 rounded-xl border border-border bg-white p-4">
      {/* Lien seulement si le serveur en a fourni un : un événement sans slug
          n'a pas de page publique, et un lien mort vaut moins que pas de lien. */}
      {target.href ? (
        <Link
          href={target.href}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
        >
          {body}
        </Link>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-3">{body}</div>
      )}
      <FavoriteButton targetId={favorite.targetId} targetType={favorite.targetType} size="sm" />
    </li>
  );
}

export default function DashboardFavorisPage() {
  const { data: favorites = [], isLoading, isError, refetch } = useFavorites();

  if (isLoading) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="mb-8 font-serif text-3xl text-navy">Mes favoris</h1>
        <div className="space-y-3" aria-busy="true" aria-label="Chargement des favoris">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-20 animate-pulse rounded-xl bg-surface-low" />
          ))}
        </div>
      </main>
    );
  }

  // Une erreur de chargement N'EST PAS un état vide : la confondre avec
  // « aucun favori » est exactement le défaut corrigé par cette vague.
  if (isError) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="mb-8 font-serif text-3xl text-navy">Mes favoris</h1>
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4" role="alert">
          <p className="text-sm text-destructive">
            Impossible de charger vos favoris pour le moment.
          </p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-2 min-h-11 text-sm font-medium text-teal underline"
          >
            Réessayer
          </button>
        </div>
      </main>
    );
  }

  const grouped = GROUP_ORDER.map((type) => ({
    type,
    items: favorites.filter((favorite) => favorite.targetType === type),
  })).filter((group) => group.items.length > 0);

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-8 font-serif text-3xl text-navy">Mes favoris</h1>

      {favorites.length === 0 && (
        <div
          className="rounded-xl border border-border bg-white p-8 text-center"
          data-testid="empty-state"
        >
          <Heart className="mx-auto mb-3 h-10 w-10 text-muted" aria-hidden="true" />
          <p className="font-medium text-navy">Aucun favori pour le moment.</p>
          <Link
            href="/evenements"
            className="mt-4 inline-flex min-h-11 items-center text-sm font-medium text-teal underline"
          >
            Découvrir les événements
          </Link>
        </div>
      )}

      {grouped.map((group) => (
        <section key={group.type} className="mb-8">
          <h2 className="mb-3 font-serif text-xl text-navy">{GROUP_LABELS[group.type]}</h2>
          <ul className="space-y-2">
            {group.items.map((favorite) => (
              <FavoriteRow key={favorite._id} favorite={favorite} />
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
