'use client';

import { useEffect } from 'react';
import { CloudOff, RefreshCw } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="mx-auto mt-12 max-w-3xl rounded-3xl bg-terracotta-pale/70 p-8 text-center shadow-event-panel">
      <CloudOff className="mx-auto text-event-petrol" size={52} strokeWidth={1.3} aria-hidden="true" />
      <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-destructive">Connexion interrompue</p>
      <h2 className="mt-4 font-serif text-4xl text-event-petrol">Une brume passagère empêche l’accès à vos données</h2>
      <p className="mx-auto mt-4 max-w-xl leading-7 text-event-muted">Rien de grave. Votre travail est conservé; réessayez pour reprendre là où vous étiez.</p>
      <button type="button" onClick={reset} className="premium-button mt-7 px-6">
        <RefreshCw size={17} aria-hidden="true" /> Réessayer
      </button>
      {error.digest ? <p className="mt-6 text-xs text-event-muted">Référence : {error.digest}</p> : null}
    </section>
  );
}
