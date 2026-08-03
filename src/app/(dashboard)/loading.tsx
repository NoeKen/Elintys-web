export default function DashboardLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-2 py-8" role="status" aria-label="Chargement du tableau de bord">
      <div className="premium-skeleton h-64 rounded-3xl" />
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => <div key={item} className="premium-skeleton h-40 rounded-3xl" />)}
      </div>
    </div>
  );
}
