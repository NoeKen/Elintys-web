'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/shared/lib/api';
import type { ReviewFeed } from '@/features/reviews/services/reviews.service';

export default function OrganizerReviewsPage() {
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ['organizer-received-reviews', page],
    queryFn: async () => (await api.get<ReviewFeed>('/reviews/me/received', { params: { page, limit: 10 } })).data,
  });
  const feed = query.data;
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <p className="section-eyebrow">Réputation privée</p>
      <h1 className="mt-2 font-serif text-4xl text-navy-dark">Avis reçus</h1>
      <p className="mt-3 max-w-2xl text-on-surface-variant">Retrouvez les retours vérifiés de vos collaborations avec des prestataires et des gestionnaires de lieux.</p>
      {query.isLoading && <p className="mt-8 animate-pulse" role="status">Chargement…</p>}
      {query.isError && <button className="premium-button-ghost mt-8 min-h-11" onClick={() => query.refetch()}>Réessayer</button>}
      {feed?.summary.count ? <p className="mt-8 text-lg font-bold text-navy">★ {feed.summary.average.toFixed(1)} / 5 · {feed.summary.count} avis</p> : null}
      {feed && feed.data.length === 0 && <div className="mt-8 rounded-[2rem] bg-white/75 p-8 shadow-[var(--shadow-soft-line)]"><p className="font-semibold text-on-surface">Aucun avis reçu pour le moment.</p></div>}
      {feed && feed.data.length > 0 && <ul className="mt-8 space-y-4">{feed.data.map((review) => <li key={review._id} className="rounded-[2rem] bg-white/75 p-6 shadow-[var(--shadow-soft-line)]"><p className="font-bold text-gold-dark" aria-label={`${review.rating} étoiles sur 5`}>{'★'.repeat(review.rating)}</p><p className="mt-3 whitespace-pre-wrap leading-7">{review.comment}</p><p className="mt-3 text-xs text-on-surface-variant">{review.author?.fullName ?? 'Partenaire Elintys'} · interaction vérifiée</p></li>)}</ul>}
      {feed && feed.total > feed.limit && <div className="mt-6 flex gap-3"><button className="premium-button-ghost min-h-11" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Précédent</button><button className="premium-button-ghost min-h-11" disabled={page * feed.limit >= feed.total} onClick={() => setPage((value) => value + 1)}>Suivant</button></div>}
    </main>
  );
}
