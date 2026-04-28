"use client";

import { Heart } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { useAuth } from "@/shared/hooks/useAuth";
import { useFavorite } from "@/shared/hooks/useFavorite";
import type { FavoriteTargetType } from "@/features/favorites/favorites.service";

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
  const { isFavorite, toggle, isLoading } = useFavorite(
    targetId,
    targetType,
    !!user
  );

  const sizeClass = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const iconSize = size === "sm" ? 15 : 18;

  if (!user) {
    return (
      <button
        type="button"
        title="Connectez-vous pour sauvegarder"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        className={cn(
          "flex items-center justify-center rounded-full",
          "bg-white/90 shadow-sm backdrop-blur-sm",
          "text-on-surface-variant transition-colors hover:text-primary",
          sizeClass,
          className
        )}
        aria-label="Ajouter aux favoris — connexion requise"
        data-testid="favorite-button"
      >
        <Heart size={iconSize} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle();
      }}
      disabled={isLoading}
      className={cn(
        "flex items-center justify-center rounded-full",
        "bg-white/90 shadow-sm backdrop-blur-sm",
        "transition-all active:scale-125",
        isFavorite
          ? "text-red-500 hover:text-red-600"
          : "text-on-surface-variant hover:text-primary",
        isLoading && "cursor-not-allowed opacity-50",
        sizeClass,
        className
      )}
      aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
      aria-pressed={isFavorite}
      data-testid="favorite-button"
    >
      <Heart
        size={iconSize}
        className={cn("transition-colors", isFavorite && "fill-current")}
      />
    </button>
  );
}
