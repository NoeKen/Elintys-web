'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { vendorRequestsService, type VendorRequest } from '@/features/vendors/services/vendor-requests.service';
import { cn } from '@/shared/lib/utils';

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  accepted: 'Accepté',
  declined: 'Refusé',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber/20 text-amber',
  accepted: 'bg-teal/20 text-teal',
  declined: 'bg-red-100 text-red-600',
};

export default function EventPrestatairesPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['vendor-requests', id],
    queryFn: () => vendorRequestsService.listByEvent(id),
    staleTime: 30_000,
  });

  const addMutation = useMutation({
    mutationFn: () => vendorRequestsService.create(id, {
      source: 'manual',
      externalContact: { name: manualName.trim(), email: manualEmail.trim() },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-requests', id] });
      setShowForm(false);
      setManualName('');
      setManualEmail('');
      setFormError(null);
    },
    onError: () => setFormError('Erreur lors de l\'ajout. Vérifiez les champs.'),
  });

  const cancelMutation = useMutation({
    mutationFn: (requestId: string) => vendorRequestsService.cancel(requestId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vendor-requests', id] }),
  });

  const handleAddManual = () => {
    if (!manualName.trim() || !manualEmail.trim()) {
      setFormError('Nom et courriel sont requis.');
      return;
    }
    addMutation.mutate();
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-serif text-xl font-bold text-navy">Prestataires</h1>
        <button
          onClick={() => setShowForm(f => !f)}
          className="bg-teal text-white px-4 py-2 rounded-lg text-sm hover:bg-teal/90 transition-colors font-medium"
        >
          + Ajouter externe
        </button>
      </div>

      {showForm && (
        <div className="border border-border rounded-xl p-4 mb-6 bg-surface space-y-3">
          <h3 className="font-medium text-navy">Prestataire hors-plateforme</h3>
          <div>
            <label htmlFor="manualName" className="block text-sm font-medium text-navy mb-1">Nom <span className="text-red-500">*</span></label>
            <input id="manualName" type="text" value={manualName} onChange={e => setManualName(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
              placeholder="DJ Max" />
          </div>
          <div>
            <label htmlFor="manualEmail" className="block text-sm font-medium text-navy mb-1">Courriel <span className="text-red-500">*</span></label>
            <input id="manualEmail" type="email" value={manualEmail} onChange={e => setManualEmail(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
              placeholder="dj@example.com" />
          </div>
          {formError && <p className="text-red-500 text-sm">{formError}</p>}
          <div className="flex gap-2">
            <button onClick={() => { setShowForm(false); setFormError(null); }}
              className="flex-1 border border-border py-2 rounded-lg text-sm text-navy hover:bg-surface transition-colors">
              Annuler
            </button>
            <button onClick={handleAddManual} disabled={addMutation.isPending}
              className={cn('flex-1 py-2 rounded-lg text-sm font-medium transition-colors',
                addMutation.isPending ? 'bg-surface text-muted cursor-not-allowed' : 'bg-teal text-white hover:bg-teal/90')}>
              {addMutation.isPending ? 'Ajout…' : 'Ajouter'}
            </button>
          </div>
        </div>
      )}

      {isLoading && <p className="text-muted">Chargement…</p>}
      {!isLoading && requests.length === 0 && (
        <p className="text-muted">Aucun prestataire ajouté pour cet événement.</p>
      )}

      <div className="space-y-3">
        {requests.map((req: VendorRequest) => {
          const vendorName = typeof req.vendor === 'object' && req.vendor
            ? req.vendor.businessName
            : req.externalContact?.name ?? '—';
          return (
            <div key={req._id} className="border border-border rounded-xl p-4 flex justify-between items-center bg-white">
              <div>
                <p className="font-medium text-navy">{vendorName}</p>
                <p className="text-sm text-muted">
                  {req.source === 'manual' ? 'Externe' : 'Plateforme'}
                  {req.externalContact?.email ? ` · ${req.externalContact.email}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={cn('text-xs px-2 py-0.5 rounded-full', STATUS_COLORS[req.status] ?? 'bg-surface text-muted')}>
                  {STATUS_LABELS[req.status] ?? req.status}
                </span>
                {req.status === 'pending' && (
                  <button
                    onClick={() => cancelMutation.mutate(req._id)}
                    disabled={cancelMutation.isPending}
                    aria-label="Annuler cette demande"
                    className="text-xs text-red-500 hover:underline disabled:opacity-50"
                  >
                    Annuler
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
