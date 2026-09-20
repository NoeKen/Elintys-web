'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import { useAuth } from '@/shared/hooks/useAuth';
import { reviewsCopy } from '../i18n/reviews.copy';
import { reviewsService, type PublicReviewTargetType } from '../services/reviews.service';

const copy = reviewsCopy.fr;

export function VerifiedReviews({ targetType, targetId }: { targetType: PublicReviewTargetType; targetId: string }) {
  const [page, setPage] = useState(1);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [message, setMessage] = useState('');
  const { isAuthenticated, isLoading: authLoading, isSessionUnavailable } = useAuth();
  const client = useQueryClient();
  const key = ['verified-reviews', targetType, targetId, page] as const;
  const feed = useQuery({ queryKey: key, queryFn: () => reviewsService.list(targetType, targetId, page), retry: 1 });
  const eligibility = useQuery({
    queryKey: ['review-eligibility', targetType, targetId],
    queryFn: () => reviewsService.eligibility(targetType, targetId),
    enabled: !authLoading && isAuthenticated,
    retry: 1,
  });
  const create = useMutation({
    mutationFn: () => {
      if (!eligibility.data?.canReview) throw new Error('NOT_ELIGIBLE');
      return reviewsService.create({ targetType, contextType: eligibility.data.contextType, contextId: eligibility.data.contextId, rating, comment });
    },
    onSuccess: async () => {
      setComment(''); setMessage(copy.success);
      await Promise.all([
        client.invalidateQueries({ queryKey: ['verified-reviews', targetType, targetId] }),
        client.invalidateQueries({ queryKey: ['review-eligibility', targetType, targetId] }),
      ]);
    },
    onError: () => setMessage(copy.error),
  });

  const authRequired = !authLoading && !isAuthenticated && !isSessionUnavailable;
  const data = feed.data;
  return (
    <section className="mt-10 rounded-[2rem] bg-white/75 p-6 shadow-[var(--shadow-soft-line)] sm:p-8" aria-labelledby={`reviews-${targetType}-${targetId}`}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-eyebrow">{copy.verified}</p>
          <h2 id={`reviews-${targetType}-${targetId}`} className="mt-2 font-serif text-3xl text-navy-dark">{copy.title}</h2>
        </div>
        {data?.summary.count ? <p className="text-sm font-bold text-navy"><Star className="mr-1 inline h-4 w-4 fill-gold text-gold" aria-hidden="true" />{data.summary.average.toFixed(1)} / 5 · {data.summary.count}</p> : null}
      </div>

      {feed.isLoading && <p className="mt-6 animate-pulse text-on-surface-variant" role="status">Chargement des avis…</p>}
      {feed.isError && <button className="premium-button-ghost mt-6 min-h-11" onClick={() => feed.refetch()}>Réessayer</button>}
      {data && data.data.length === 0 && <p className="mt-6 text-on-surface-variant">{copy.none}</p>}
      {data && data.data.length > 0 && (
        <ul className="mt-6 space-y-4">
          {data.data.map((review) => (
            <li key={review._id} className="rounded-3xl bg-surface-container-low p-5 shadow-[var(--shadow-soft-line)]">
              <p className="font-bold text-gold-dark" aria-label={`${review.rating} étoiles sur 5`}>{'★'.repeat(review.rating)}<span className="text-outline-variant">{'★'.repeat(5 - review.rating)}</span></p>
              <p className="mt-3 whitespace-pre-wrap leading-7 text-on-surface">{review.comment}</p>
              <p className="mt-3 text-xs text-on-surface-variant">{review.author?.fullName ?? 'Membre Elintys'} · {new Intl.DateTimeFormat('fr-CA', { dateStyle: 'medium' }).format(new Date(review.createdAt))}</p>
            </li>
          ))}
        </ul>
      )}
      {data && data.total > data.limit && <div className="mt-6 flex gap-3"><button className="premium-button-ghost min-h-11" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>{copy.previous}</button><button className="premium-button-ghost min-h-11" disabled={page * data.limit >= data.total} onClick={() => setPage((value) => value + 1)}>{copy.next}</button></div>}

      {authRequired && <p className="mt-7 text-sm"><Link className="font-bold text-teal underline-offset-4 hover:underline" href={`/connexion?returnTo=${encodeURIComponent(globalThis.location?.pathname ?? '/')}`}>{copy.login}</Link></p>}
      {eligibility.data?.canReview && (
        <form className="mt-8 rounded-3xl bg-teal-pale/50 p-5" onSubmit={(event) => { event.preventDefault(); setMessage(''); create.mutate(); }}>
          <h3 className="font-serif text-2xl text-navy-dark">{copy.leave}</h3>
          <fieldset className="mt-5"><legend className="font-semibold text-on-surface">Votre note</legend><div className="mt-2 flex flex-wrap gap-2">{[1, 2, 3, 4, 5].map((value) => <label key={value} className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full bg-white px-3 shadow-sm"><input type="radio" name="rating" value={value} checked={rating === value} onChange={() => setRating(value)} /><span aria-hidden="true">★</span><span className="sr-only">{value} étoile{value > 1 ? 's' : ''}</span></label>)}</div></fieldset>
          <label className="mt-5 block font-semibold text-on-surface" htmlFor={`review-comment-${targetId}`}>{copy.comment}</label>
          <textarea id={`review-comment-${targetId}`} className="mt-2 min-h-32 w-full rounded-2xl border border-outline-variant bg-white p-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal" required minLength={1} maxLength={2000} value={comment} onChange={(event) => setComment(event.target.value)} aria-invalid={create.isError || undefined} />
          <button className="premium-button mt-4 min-h-11" disabled={create.isPending || !comment.trim()}>{create.isPending ? copy.pending : copy.submit}</button>
          {message && <p className="mt-3 text-sm" role="status" aria-live="polite">{message}</p>}
        </form>
      )}
    </section>
  );
}
