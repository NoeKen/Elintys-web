'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthToken } from '@/server/auth/use-auth-token';
import {
  vendorProfileService,
  type VendorRequest,
} from '@/features/vendors/services/vendor-profile.service';
import { cn } from '@/shared/lib/utils';

const STATUS_LABELS: Record<VendorRequest['status'], string> = {
  pending: 'En attente',
  accepted: 'Accepté',
  declined: 'Refusé',
  cancelled: 'Annulé',
};

const STATUS_CLASSES: Record<VendorRequest['status'], string> = {
  pending: 'bg-amber text-white',
  accepted: 'bg-teal text-white',
  declined: 'bg-red-500 text-white',
  cancelled: 'bg-muted text-white',
};

interface ReplyState {
  message: string;
}

export default function PrestataireDemandesPage() {
  const token = useAuthToken();
  const queryClient = useQueryClient();
  const [openReplyId, setOpenReplyId] = useState<string | null>(null);
  const [replyState, setReplyState] = useState<ReplyState>({ message: '' });

  const { data: requests, isLoading, isError } = useQuery({
    queryKey: ['vendor-requests-mine'],
    queryFn: () => vendorProfileService.getMyRequests(token),
    enabled: !!token,
  });

  const { mutate: respond, isPending: isResponding } = useMutation({
    mutationFn: ({
      id,
      status,
      message,
    }: {
      id: string;
      status: 'accepted' | 'declined';
      message?: string;
    }) => vendorProfileService.respondToRequest(token, id, status, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-requests-mine'] });
      setOpenReplyId(null);
      setReplyState({ message: '' });
    },
  });

  const handleRespond = (id: string, status: 'accepted' | 'declined') => {
    respond({ id, status, message: replyState.message || undefined });
  };

  const handleOpenReply = (id: string) => {
    setOpenReplyId(id);
    setReplyState({ message: '' });
  };

  if (isLoading) {
    return (
      <div className="p-8 text-muted text-sm">Chargement des demandes...</div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 text-red-500 text-sm">
        Une erreur est survenue lors du chargement des demandes.
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-serif text-navy">Demandes reçues</h1>
      <p className="text-muted text-sm">
        Suivez les demandes envoyées par les organisateurs pour vos services.
      </p>

      {!requests || requests.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-8 text-center text-muted text-sm">
          Aucune demande pour le moment.
        </div>
      ) : (
        <ul className="space-y-4">
          {requests.map((req) => (
            <li
              key={req._id}
              className="bg-surface border border-border rounded-xl p-5 space-y-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-navy">{req.event.title}</p>
                  <p className="text-sm text-muted">
                    {req.organizer.firstName} {req.organizer.lastName}
                  </p>
                  {req.message && (
                    <p className="mt-2 text-sm text-navy border-l-2 border-border pl-3 italic">
                      {req.message}
                    </p>
                  )}
                </div>
                <span
                  className={cn(
                    'shrink-0 rounded-full px-3 py-1 text-xs font-medium',
                    STATUS_CLASSES[req.status],
                  )}
                >
                  {STATUS_LABELS[req.status]}
                </span>
              </div>

              {req.status === 'pending' && (
                <>
                  {openReplyId === req._id ? (
                    <div className="space-y-3 pt-2 border-t border-border">
                      <label htmlFor={`reply-msg-${req._id}`} className="block text-sm font-medium text-navy">
                        Message (optionnel)
                      </label>
                      <textarea
                        id={`reply-msg-${req._id}`}
                        className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-navy placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-teal resize-none"
                        rows={3}
                        placeholder="Message optionnel..."
                        value={replyState.message}
                        onChange={(e) =>
                          setReplyState({ message: e.target.value })
                        }
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={isResponding}
                          onClick={() => handleRespond(req._id, 'accepted')}
                          className={cn(
                            'rounded-lg px-4 py-2 text-sm font-medium bg-teal text-white',
                            'disabled:opacity-50',
                          )}
                        >
                          Accepter
                        </button>
                        <button
                          type="button"
                          disabled={isResponding}
                          onClick={() => handleRespond(req._id, 'declined')}
                          className={cn(
                            'rounded-lg px-4 py-2 text-sm font-medium bg-red-500 text-white',
                            'disabled:opacity-50',
                          )}
                        >
                          Refuser
                        </button>
                        <button
                          type="button"
                          onClick={() => setOpenReplyId(null)}
                          className="rounded-lg px-4 py-2 text-sm font-medium border border-border text-muted"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleOpenReply(req._id)}
                      className="rounded-lg px-4 py-2 text-sm font-medium border border-teal text-teal"
                    >
                      Repondre
                    </button>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
