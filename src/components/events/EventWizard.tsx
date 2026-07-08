'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/shared/lib/utils';
import { eventsService } from '@/features/events/services/events.service';

const step1Schema = z.object({
  title: z.string().min(1, 'Le titre est requis').max(200),
  description: z.string().max(5000).optional(),
  startDate: z.string().min(1, 'La date de début est requise'),
  endDate: z.string().optional(),
});

const step2Schema = z.object({
  location: z.string().max(300).optional(),
});

const step3Schema = z.object({
  visibility: z.enum(['public', 'private', 'invite_only']),
  capacityRaw: z.string().optional(),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;

export function EventWizard() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
  const [step2Data, setStep2Data] = useState<Step2Data | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form1 = useForm<Step1Data>({ resolver: zodResolver(step1Schema) });
  const form2 = useForm<Step2Data>({ resolver: zodResolver(step2Schema) });
  const form3 = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
    defaultValues: { visibility: 'public' },
  });

  const handleStep1 = form1.handleSubmit((data) => {
    setStep1Data(data);
    setStep(2);
  });

  const handleStep2 = form2.handleSubmit((data) => {
    setStep2Data(data);
    setStep(3);
  });

  const handleStep3 = form3.handleSubmit(async (data) => {
    if (!step1Data || !step2Data) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const capacity = data.capacityRaw ? parseInt(data.capacityRaw, 10) : undefined;
      const location = step2Data.location?.trim()
        ? { type: 'physical' as const, address: step2Data.location.trim() }
        : undefined;
      const event = await eventsService.create({
        title: step1Data.title,
        description: step1Data.description,
        startDate: step1Data.startDate,
        ...(step1Data.endDate ? { endDate: step1Data.endDate } : {}),
        ...(location ? { location } : {}),
        visibility: data.visibility,
        ...(capacity !== undefined && !isNaN(capacity) ? { capacity } : {}),
      });
      router.push(`/tableau-de-bord/evenements/${event._id}`);
    } catch {
      setSubmitError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setSubmitting(false);
    }
  });

  const inputClass =
    'w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal text-navy';
  const errorClass = 'text-red-500 text-xs mt-1';

  return (
    <div>
      {/* Progress bar */}
      <div
        className="flex gap-1.5 mb-8"
        role="progressbar"
        aria-valuenow={step}
        aria-valuemin={1}
        aria-valuemax={3}
      >
        {([1, 2, 3] as const).map(s => (
          <div
            key={s}
            className={cn(
              'flex-1 h-1.5 rounded-full transition-colors',
              s <= step ? 'bg-teal' : 'bg-surface border border-border'
            )}
          />
        ))}
      </div>

      {/* Step 1 — Informations de base */}
      {step === 1 && (
        <form onSubmit={handleStep1} className="space-y-4">
          <h2 className="font-serif text-xl font-semibold text-navy">Informations de base</h2>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-navy mb-1">
              Titre <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              {...form1.register('title')}
              className={inputClass}
              placeholder="Gala de charité 2025"
            />
            {form1.formState.errors.title && (
              <p className={errorClass}>{form1.formState.errors.title.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-navy mb-1">
              Description
            </label>
            <textarea
              id="description"
              {...form1.register('description')}
              rows={4}
              className={cn(inputClass, 'resize-none')}
              placeholder="Décrivez votre événement…"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-navy mb-1">
                Date de début <span className="text-red-500">*</span>
              </label>
              <input
                id="startDate"
                type="datetime-local"
                {...form1.register('startDate')}
                className={inputClass}
              />
              {form1.formState.errors.startDate && (
                <p className={errorClass}>{form1.formState.errors.startDate.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-navy mb-1">
                Date de fin
              </label>
              <input
                id="endDate"
                type="datetime-local"
                {...form1.register('endDate')}
                className={inputClass}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-teal text-white py-2.5 rounded-lg hover:bg-teal/90 font-medium transition-colors"
          >
            Suivant →
          </button>
        </form>
      )}

      {/* Step 2 — Lieu */}
      {step === 2 && (
        <form onSubmit={handleStep2} className="space-y-4">
          <h2 className="font-serif text-xl font-semibold text-navy">Lieu</h2>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-navy mb-1">
              Adresse ou nom du lieu
            </label>
            <input
              id="location"
              {...form2.register('location')}
              className={inputClass}
              placeholder="1000 rue de la Montagne, Montréal"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 border border-border py-2.5 rounded-lg text-navy hover:bg-surface transition-colors"
            >
              ← Retour
            </button>
            <button
              type="submit"
              className="flex-1 bg-teal text-white py-2.5 rounded-lg hover:bg-teal/90 font-medium transition-colors"
            >
              Suivant →
            </button>
          </div>
        </form>
      )}

      {/* Step 3 — Visibilité */}
      {step === 3 && (
        <form onSubmit={handleStep3} className="space-y-4">
          <h2 className="font-serif text-xl font-semibold text-navy">Visibilité</h2>

          <div>
            <label htmlFor="visibility" className="block text-sm font-medium text-navy mb-1">
              Visibilité
            </label>
            <select id="visibility" {...form3.register('visibility')} className={inputClass}>
              <option value="public">Public</option>
              <option value="private">Privé</option>
              <option value="invite_only">Sur invitation uniquement</option>
            </select>
          </div>

          <div>
            <label htmlFor="capacity" className="block text-sm font-medium text-navy mb-1">
              Capacité maximale
            </label>
            <input
              id="capacity"
              type="number"
              {...form3.register('capacityRaw')}
              className={inputClass}
              placeholder="0 = illimitée"
              min="0"
            />
          </div>

          {submitError && <p className="text-red-500 text-sm">{submitError}</p>}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="flex-1 border border-border py-2.5 rounded-lg text-navy hover:bg-surface transition-colors"
            >
              ← Retour
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={cn(
                'flex-1 py-2.5 rounded-lg font-medium transition-colors',
                submitting
                  ? 'bg-surface text-muted cursor-not-allowed'
                  : 'bg-teal text-white hover:bg-teal/90'
              )}
            >
              {submitting ? 'Création…' : "Créer l'événement"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
