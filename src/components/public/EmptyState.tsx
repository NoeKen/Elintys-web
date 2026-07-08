interface EmptyStateProps {
  message: string;
  onReset?: () => void;
  resetLabel?: string;
}

export function EmptyState({ message, onReset, resetLabel = 'Effacer les filtres' }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'var(--surface-low)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
          fontSize: 28,
        }}
      >
        🔍
      </div>
      <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--on-surface)', marginBottom: 8 }}>
        Aucun résultat
      </p>
      <p style={{ fontSize: 14, color: 'var(--on-surface-variant)', maxWidth: 320 }}>{message}</p>
      {onReset && (
        <button className="btn-secondary" onClick={onReset} style={{ marginTop: 20 }}>
          {resetLabel}
        </button>
      )}
    </div>
  );
}
