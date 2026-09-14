import messages from '../../../../../messages/fr.json';

const copy = messages.publicSearch;

export default function PublicSearchLoading() {
  return (
    <main className="min-h-screen bg-background pb-20 pt-28" aria-busy="true" aria-label={copy.loadingLabel}>
      <div className="container-public animate-pulse">
        <div className="mx-auto h-12 max-w-xl rounded-2xl bg-surface-container" />
        <div className="mx-auto mt-6 h-20 max-w-4xl rounded-3xl bg-white shadow-[var(--shadow-soft-line)]" />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => <div key={index} className="h-80 rounded-3xl bg-white shadow-[var(--shadow-soft-line)]" />)}
        </div>
      </div>
      <p className="sr-only" role="status">{copy.loadingResults}</p>
    </main>
  );
}
