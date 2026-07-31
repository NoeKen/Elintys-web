import Link from 'next/link';
import { TriangleAlert } from 'lucide-react';

interface CatalogErrorStateProps {
  message?: string;
  retryHref: string;
}

export function CatalogErrorState({
  message = 'Le catalogue est temporairement indisponible. Réessayez dans quelques instants.',
  retryHref,
}: CatalogErrorStateProps) {
  return (
    <div className="empty-state glass-card" role="alert">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-destructive">
        <TriangleAlert className="h-7 w-7" aria-hidden="true" />
      </div>
      <p className="mb-2 text-base font-semibold text-on-surface">Impossible de charger les données</p>
      <p className="max-w-md text-sm leading-6 text-on-surface-variant">{message}</p>
      <Link className="btn-secondary mt-5" href={retryHref}>
        Réessayer
      </Link>
    </div>
  );
}
