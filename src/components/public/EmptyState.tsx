import { Search } from 'lucide-react';

interface EmptyStateProps {
  message: string;
  onReset?: () => void;
  resetLabel?: string;
}

export function EmptyState({ message, onReset, resetLabel = 'Effacer les filtres' }: EmptyStateProps) {
  return (
    <div className="empty-state glass-card">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-teal-pale text-teal">
        <Search className="h-7 w-7" aria-hidden="true" />
      </div>
      <p className="mb-2 text-base font-semibold text-on-surface">
        Aucun résultat
      </p>
      <p className="max-w-xs text-sm leading-6 text-on-surface-variant">{message}</p>
      {onReset && (
        <button className="btn-secondary mt-5" onClick={onReset}>
          {resetLabel}
        </button>
      )}
    </div>
  );
}
