'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Eye, Pencil, ShieldCheck, Ticket, UserCheck, X } from 'lucide-react';
import { eventsService } from '@/features/events/services/events.service';
import type { UpdateEventAccessConfigurationInput } from '@/features/events/services/events.service';
import { AccessConfigurationForm } from '@/components/events/organizer/AccessConfigurationForm';
import type { EventAccessRequestStatus } from '@/features/events/types';
import { organizerCopy, organizerEventCopy as copy } from '@/features/events/i18n/organizer-event.copy';
import { getUserFacingError } from '@/shared/lib/user-facing-error';
import { FormErrorAlert } from '@/shared/ui/FormErrorAlert';
import { guestsService } from '@/features/guests/services/guests.service';
import { guestKeys } from '@/features/guests/query-keys';

export default function EventAccessManagementPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const eventQuery = useQuery({ queryKey: ['event', id], queryFn: () => eventsService.get(id), staleTime: 30_000 });
  const requestsQuery = useQuery({ queryKey: ['event-access-requests', id], queryFn: () => eventsService.listAccessRequests(id), staleTime: 10_000 });
  const guestsQuery = useQuery({ queryKey: guestKeys.page(id, 1), queryFn: () => guestsService.list(id), staleTime: 15_000 });
  const [isEditing, setIsEditing] = useState(false);
  const saveConfiguration = useMutation({
    mutationFn: (payload: UpdateEventAccessConfigurationInput) => eventsService.updateAccessConfiguration(id, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(['event', id], updated);
      void queryClient.invalidateQueries({ queryKey: ['event', id] });
      setIsEditing(false);
    },
  });
  const review = useMutation({ mutationFn: ({ requestId, status }: { requestId: string; status: EventAccessRequestStatus }) => eventsService.reviewAccessRequest(id, requestId, status), onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['event-access-requests', id] }) });
  if (eventQuery.isLoading || requestsQuery.isLoading) return <div className="p-6"><div className="premium-skeleton h-80 rounded-3xl" /></div>;
  if (eventQuery.isError || requestsQuery.isError || !eventQuery.data) return <section className="m-6 rounded-3xl bg-terracotta-pale/70 p-7 text-center shadow-event-soft"><h1 className="font-serif text-3xl text-event-petrol">{copy.access.loadError}</h1><button type="button" onClick={() => { void eventQuery.refetch(); void requestsQuery.refetch(); }} className="premium-button mt-5 px-6">{copy.access.retry}</button></section>;
  const event = eventQuery.data;
  const pending = (requestsQuery.data ?? []).filter((request) => request.status === 'pending');
  const reserved = guestsQuery.data?.data.filter((guest) => guest.status === 'confirmed' || guest.status === 'present').length ?? 0;
  const remaining = Math.max(0, (event.capacity ?? 0) - reserved);
  return <div className="p-4 sm:p-6 lg:p-8">
    <section className="grid gap-6 rounded-3xl bg-white p-6 shadow-event-soft lg:grid-cols-[minmax(0,1.4fr)_repeat(2,minmax(180px,0.5fr))] lg:p-8">
      <div><p className="section-eyebrow mb-4">{copy.access.eyebrow}</p><h1 className="font-serif text-[clamp(2.6rem,6vw,4.8rem)] leading-none text-event-petrol">{copy.access.title}</h1><p className="mt-5 max-w-2xl text-lg leading-8 text-event-muted">{organizerCopy(copy.access.subtitle, { title: event.title })}</p></div>
      <AccessMetric label={copy.access.reserved} value={reserved} icon={<UserCheck size={22} />} />
      <AccessMetric label={copy.access.remaining} value={remaining} icon={<Ticket size={22} />} strong />
    </section>
    {isEditing ? (
      <AccessConfigurationForm
        discoverability={event.discoverability}
        accessPolicy={event.accessPolicy}
        admissionModes={event.admissionModes}
        isSaving={saveConfiguration.isPending}
        isSaved={saveConfiguration.isSuccess}
        saveError={saveConfiguration.isError ? saveConfiguration.error : null}
        onSubmit={(payload) => saveConfiguration.mutate(payload)}
        onCancel={() => { saveConfiguration.reset(); setIsEditing(false); }}
      />
    ) : <>
      <div className="mt-5 flex justify-end">
        <button type="button" onClick={() => { saveConfiguration.reset(); setIsEditing(true); }} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-event-outline-subtle/60 px-5 font-bold text-event-petrol">
          <Pencil size={16} aria-hidden="true" />{copy.access.edit}
        </button>
      </div>
      <section className="mt-3 grid gap-4 md:grid-cols-3"><PolicyCard icon={<Eye size={21} />} title={copy.access.visibility} value={visibilityLabel(event.discoverability)} description={copy.access.visibilityDescription} /><PolicyCard icon={<ShieldCheck size={21} />} title={copy.access.control} value={accessLabel(event.accessPolicy?.type)} description={copy.access.controlDescription} warm /><PolicyCard icon={<Ticket size={21} />} title={copy.access.admission} value={(event.admissionModes?.length ? event.admissionModes : ['registration_only']).map(admissionLabel).join(', ')} description={copy.access.admissionDescription} /></section>
      {saveConfiguration.isSuccess ? <p role="status" className="mt-3 text-sm font-bold text-event-teal">{copy.access.saved}</p> : null}
    </>}
    <section className="mt-6 overflow-hidden rounded-3xl bg-white shadow-event-soft">
      <div className="flex flex-col gap-2 border-b border-event-outline-subtle/40 p-6 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="font-serif text-3xl text-event-petrol">{copy.access.pending}</h2><p className="mt-2 text-sm text-event-muted">{organizerCopy(copy.access.pendingDescription, { count: pending.length })}</p></div></div>
      {review.isError ? <FormErrorAlert className="m-5" error={getUserFacingError(review.error, { fallback: copy.access.reviewError })} /> : null}
      {pending.length === 0 ? <p className="p-10 text-center text-event-muted">{copy.access.noRequests}</p> : <ul>{pending.map((request) => { const person = typeof request.userId === 'string' ? { fullName: copy.access.participantFallback, email: request.userId } : request.userId; return <li key={request._id} className="grid gap-4 border-b border-event-outline-subtle/35 p-5 last:border-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-6"><div className="flex min-w-0 items-center gap-4"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-pale font-bold text-event-teal">{person.fullName.split(' ').map((part) => part[0]).slice(0,2).join('')}</span><span className="min-w-0"><span className="block truncate font-bold text-event-petrol">{person.fullName}</span><span className="block truncate text-sm text-event-muted">{person.email}</span><span className="mt-1 block text-xs text-event-muted">{new Date(request.requestedAt).toLocaleString('fr-CA')}</span></span></div><div className="flex gap-2"><button type="button" aria-label={`${copy.access.reject} ${person.fullName}`} disabled={review.isPending} onClick={() => review.mutate({ requestId: request._id, status: 'rejected' })} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-terracotta-pale px-4 text-sm font-bold text-terracotta-dark"><X size={16} />{copy.access.reject}</button><button type="button" aria-label={`${copy.access.approve} ${person.fullName}`} disabled={review.isPending} onClick={() => review.mutate({ requestId: request._id, status: 'approved' })} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-event-petrol px-4 text-sm font-bold text-white"><Check size={16} />{copy.access.approve}</button></div></li>; })}</ul>}
    </section>
  </div>;
}

function AccessMetric({ label, value, icon, strong = false }: { label: string; value: number; icon: React.ReactNode; strong?: boolean }) { return <article className={`rounded-3xl p-5 ${strong ? 'bg-event-petrol text-white' : 'bg-event-surface text-event-petrol'}`}><span className={strong ? 'text-event-orange' : 'text-event-teal'} aria-hidden="true">{icon}</span><p className="mt-5 font-serif text-5xl">{value}</p><p className={`mt-2 text-xs font-bold uppercase tracking-[0.12em] ${strong ? 'text-white/70' : 'text-event-muted'}`}>{label}</p></article>; }
function PolicyCard({ icon, title, value, description, warm = false }: { icon: React.ReactNode; title: string; value: string; description: string; warm?: boolean }) { return <article className={`rounded-3xl bg-white p-6 shadow-event-soft ${warm ? 'shadow-[0_20px_50px_-35px_rgba(194,96,58,0.45)]' : ''}`}><span className={`flex h-11 w-11 items-center justify-center rounded-full ${warm ? 'bg-terracotta-pale text-terracotta-dark' : 'bg-teal-pale text-event-teal'}`} aria-hidden="true">{icon}</span><p className="mt-5 font-serif text-2xl text-event-petrol">{title}</p><p className="mt-4 text-lg font-bold text-event-petrol">{value}</p><p className="mt-2 text-sm leading-6 text-event-muted">{description}</p></article>; }

function visibilityLabel(value?: string): string {
  return ({ public: copy.access.publicVisibility, unlisted: copy.access.unlistedVisibility, private: copy.access.privateVisibility } as Record<string, string>)[value ?? 'public'] ?? value ?? copy.access.publicVisibility;
}

function accessLabel(value?: string): string {
  return ({
    open: copy.access.openAccess,
    registration_required: copy.access.registrationAccess,
    access_code: copy.access.codeAccess,
    email_domain: copy.access.domainAccess,
    manual_approval: copy.access.approvalAccess,
    guest_list: copy.access.guestListAccess,
    invitation_token: copy.access.inviteOnlyAccess,
  } as Record<string, string>)[value ?? 'open'] ?? value ?? copy.access.openAccess;
}

function admissionLabel(value: string): string {
  return ({
    free: copy.access.freeAdmission,
    registration_only: copy.access.registrationAdmission,
    free_ticket: copy.access.freeTicketAdmission,
    paid_ticket: copy.access.paidTicketAdmission,
    invitation: copy.access.invitationAdmission,
  } as Record<string, string>)[value] ?? value;
}
