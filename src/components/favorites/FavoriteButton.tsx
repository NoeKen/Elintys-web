"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Heart } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { useAuth } from "@/shared/hooks/useAuth";
import { getLoginPath } from "@/lib/auth/redirects";
import { getUserFacingError } from "@/shared/lib/user-facing-error";
import { useFavorite } from "@/features/favorites/hooks/useFavorites";
import type { FavoriteTargetType } from "@/features/favorites/favorites.service";

const LABELS: Record<FavoriteTargetType, { add: string; remove: string }> = {
  event: { add: "Ajouter cet événement aux favoris", remove: "Retirer cet événement des favoris" },
  vendor: { add: "Ajouter ce prestataire aux favoris", remove: "Retirer ce prestataire des favoris" },
  venue: { add: "Ajouter ce lieu aux favoris", remove: "Retirer ce lieu des favoris" },
};

interface FavoriteButtonProps {
  targetId: string;
  targetType: FavoriteTargetType;
  size?: "sm" | "md";
  className?: string;
}

export function FavoriteButton({
  targetId,
  targetType,
  size = "md",
  className,
}: FavoriteButtonProps) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isFavorite, toggle, isPending, error } = useFavorite(targetId, targetType);

  const sizeClass = size === "sm" ? "h-11 w-11" : "h-11 w-11";
  const iconSize = size === "sm" ? 15 : 18;
  const labels = LABELS[targetType];

  /**
   * Anonyme : on emmène vers la connexion en conservant le retour.
   *
   * Un bouton qui n'appelle que `preventDefault` est une affordance mensongère :
   * il annonce une action au lecteur d'écran puis n'en déclenche aucune.
   */
  const handleClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (!user) {
      const query = searchParams.toString();
      router.push(getLoginPath(query ? `${pathname}?${query}` : pathname));
      return;
    }

    toggle();
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className={cn(
          "flex items-center justify-center rounded-full",
          "bg-white/90 shadow-sm backdrop-blur-sm",
          "transition-all active:scale-110",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal",
          isFavorite
            ? "text-red-500 hover:text-red-600"
            : "text-on-surface-variant hover:text-primary",
          isPending && "cursor-progress opacity-60",
          sizeClass,
          className
        )}
        aria-label={
          user
            ? isFavorite
              ? labels.remove
              : labels.add
            : `${labels.add} — connexion requise`
        }
        aria-pressed={user ? isFavorite : undefined}
        title={user ? undefined : "Connectez-vous pour sauvegarder"}
        data-testid="favorite-button"
      >
        {/* `pointer-events-none` : l'icône ne doit jamais être la cible du
            clic, sinon elle intercepte l'événement destiné au bouton. */}
        <Heart
          size={iconSize}
          className={cn("pointer-events-none transition-colors", isFavorite && "fill-current")}
          aria-hidden="true"
        />
      </button>

      {/* L'échec d'une bascule doit être perceptible, y compris au lecteur
          d'écran : sans cela l'UI revient silencieusement à son état initial. */}
      {error ? (
        <p role="alert" className="mt-1 text-xs font-medium text-destructive">
          {getUserFacingError(error, {
            fallback: "Impossible de mettre à jour ce favori. Réessayez.",
          }).message}
        </p>
      ) : null}
    </>
  );
}
