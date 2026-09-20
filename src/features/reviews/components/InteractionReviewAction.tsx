'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { reviewsService, type ReviewContextType } from '../services/reviews.service';

export function InteractionReviewAction({
  contextType,
  contextId,
}: {
  contextType: ReviewContextType;
  contextId: string;
}) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const queryClient = useQueryClient();
  const eligibility = useQuery({
    queryKey: ['review-context-eligibility', contextType, contextId],
    queryFn: () => reviewsService.contextEligibility(contextType, contextId),
    enabled: open,
    retry: 1,
  });
  const create = useMutation({
    mutationFn: () => {
      if (!eligibility.data?.canReview) throw new Error('REVIEW_NOT_ELIGIBLE');
      return reviewsService.create({
        targetType: eligibility.data.targetType,
        contextType,
        contextId,
        rating,
        comment,
      });
    },
    onSuccess: async () => {
      setSubmitted(true);
      await queryClient.invalidateQueries({
        queryKey: ['review-context-eligibility', contextType, contextId],
      });
    },
  });

  if (!open) {
    return (
      <button
        type="button"
        className="min-h-11 rounded-full bg-teal-pale px-4 text-sm font-semibold text-teal transition hover:bg-teal hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
        onClick={() => setOpen(true)}
      >
        Évaluer la collaboration
      </button>
    );
  }

  if (eligibility.isLoading) return <p className="text-sm text-muted" role="status">Vérification de l’admissibilité…</p>;
  if (eligibility.isError) {
    return <div className="space-y-2" role="alert"><p className="text-sm text-destructive">Impossible de vérifier cette collaboration.</p><button type="button" className="min-h-11 text-sm font-semibold text-teal underline" onClick={() => void eligibility.refetch()}>Réessayer</button></div>;
  }
  if (submitted || (eligibility.data && !eligibility.data.canReview && eligibility.data.reason === 'REVIEW_ALREADY_SUBMITTED')) {
    return <p className="text-sm font-semibold text-teal" role="status">Votre avis a déjà été transmis.</p>;
  }
  if (!eligibility.data?.canReview) {
    return <p className="text-sm text-muted">L’avis sera disponible lorsque la collaboration sera terminée.</p>;
  }

  return (
    <form
      className="space-y-4 rounded-3xl bg-teal-pale/45 p-4"
      onSubmit={(event) => { event.preventDefault(); create.mutate(); }}
    >
      <fieldset>
        <legend className="text-sm font-semibold text-navy">Votre note</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <label key={value} className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full bg-white px-3 shadow-sm">
              <input type="radio" name={`rating-${contextId}`} value={value} checked={rating === value} onChange={() => setRating(value)} />
              <span aria-hidden="true">★</span><span className="sr-only">{value} étoile{value > 1 ? 's' : ''}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label className="text-sm font-semibold text-navy" htmlFor={`interaction-review-${contextId}`}>Votre commentaire</label>
        <textarea
          id={`interaction-review-${contextId}`}
          className="mt-2 min-h-28 w-full rounded-2xl border border-border bg-white p-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
          required
          maxLength={2000}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          aria-invalid={create.isError || undefined}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="submit" className="premium-button min-h-11" disabled={create.isPending || !comment.trim()}>{create.isPending ? 'Publication…' : 'Publier mon avis'}</button>
        <button type="button" className="premium-button-ghost min-h-11" disabled={create.isPending} onClick={() => setOpen(false)}>Fermer</button>
      </div>
      {create.isError && <p className="text-sm text-destructive" role="alert">L’avis n’a pas pu être publié. Réessayez.</p>}
    </form>
  );
}
