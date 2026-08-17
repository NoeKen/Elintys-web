export default function PublicEventLoading() {
  return (
    <div className="public-event-shell" aria-busy="true" aria-label="Chargement de l’événement">
      <div className="h-[min(72dvh,720px)] min-h-[520px] animate-pulse bg-gradient-to-br from-navy via-teal-dark to-navy-dark" />
      <div className="container-public grid gap-6 py-12 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          <div className="premium-skeleton h-7 w-40 rounded-full" />
          <div className="premium-skeleton h-20 rounded-3xl" />
          <div className="premium-skeleton h-64 rounded-3xl" />
        </div>
        <div className="premium-skeleton h-80 rounded-3xl" />
      </div>
    </div>
  );
}
