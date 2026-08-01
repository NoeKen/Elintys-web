'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CheckCircle2, ShieldCheck } from 'lucide-react';
import frMessages from '../../../../messages/fr.json';
import { invitationsService } from '@/features/invitations/services/invitations.service';

const copy = frMessages.invitationRedemption;

export function InvitationRedemption({ token }: { token?: string }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>(token ? 'idle' : 'error');
  const [message, setMessage] = useState(token ? undefined : copy.missing);

  const accept = async () => {
    if (!token || status === 'loading') return;
    setStatus('loading');
    setMessage(undefined);
    try {
      await invitationsService.accept(token);
      setStatus('success');
      setMessage(copy.success);
    } catch {
      setStatus('error');
      setMessage(copy.invalid);
    }
  };

  return (
    <main className="mesh-gradient flex min-h-screen items-center justify-center px-5 py-16">
      <section className="premium-card w-full max-w-xl p-7 text-center sm:p-10">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-teal-pale text-teal">
          {status === 'success' ? <CheckCircle2 aria-hidden="true" /> : <ShieldCheck aria-hidden="true" />}
        </div>
        <p className="section-eyebrow mb-3">{copy.eyebrow}</p>
        <h1 className="premium-heading text-4xl">{copy.title}</h1>
        <p className="premium-subtitle mx-auto mt-4 max-w-md">{copy.description}</p>

        {message && (
          <p className={`mt-6 rounded-2xl px-4 py-3 text-sm font-semibold ${status === 'success' ? 'bg-teal-pale text-event-petrol' : 'bg-red-50 text-destructive'}`} role="status">
            {message}
          </p>
        )}

        {status !== 'success' && (
          <button type="button" onClick={accept} disabled={!token || status === 'loading'} className="premium-button mt-7 w-full px-6 py-3 disabled:cursor-not-allowed disabled:opacity-50">
            {status === 'loading' ? copy.accepting : copy.accept}
          </button>
        )}
        <Link href="/evenements" className="mt-5 inline-flex text-sm font-semibold text-event-petrol underline-offset-4 hover:underline">
          {copy.back}
        </Link>
      </section>
    </main>
  );
}
