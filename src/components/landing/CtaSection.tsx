'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Input } from '@/shared/ui/Input';
import { Select } from '@/shared/ui/Select';
import { waitlistSchema, type WaitlistInput } from '@/features/waitlist/schemas';
import { waitlistService } from '@/features/waitlist/services/waitlist.service';

const ROLE_OPTIONS = [
  { value: 'organisateur', label: "Organisateur d'événements" },
  { value: 'prestataire', label: 'Prestataire de services' },
  { value: 'gestionnaire', label: 'Gestionnaire de lieu / espace' },
  { value: 'visiteur', label: 'Visiteur / participant' },
];

export function CtaSection({ id }: { id?: string }) {
  const [result, setResult] = useState<'success' | 'exists' | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<WaitlistInput>({
    resolver: zodResolver(waitlistSchema),
    defaultValues: { consentMarketing: false },
  });

  const mutation = useMutation({
    mutationFn: (input: WaitlistInput) =>
      waitlistService.join({
        firstName: input.firstName,
        email: input.email,
        role: input.role,
        source: 'cta',
        consentMarketing: input.consentMarketing,
      }),
    onSuccess: (data) => setResult(data.alreadyExists ? 'exists' : 'success'),
  });

  const role = watch('role');

  if (result) {
    return (
      <section id={id} className="relative px-6 py-28 text-center">
        <div className="glass-card mx-auto flex max-w-md items-center gap-3 px-6 py-5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white">
            <Check size={16} aria-hidden="true" />
          </span>
          <p className="text-sm font-medium text-on-surface">
            {result === 'exists'
              ? 'Vous êtes déjà sur la liste ! On vous contacte bientôt.'
              : 'Bienvenue ! Vous êtes sur la liste.'}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      id={id}
      className="relative overflow-hidden px-6 py-28"
    >
      <div className="glass-card relative mx-auto max-w-2xl px-5 py-10 text-center sm:px-10">
        <motion.span
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
          className="mb-6 inline-flex items-center rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-xs font-bold text-teal-dark"
        >
          Accès bêta limité
        </motion.span>

        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="mb-4 font-serif text-[clamp(2rem,5vw,3rem)] leading-tight text-navy-dark"
        >
          L&apos;événementiel se réinvente. Faites-en partie.
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.14 }}
          className="mb-10 text-base leading-relaxed text-on-surface-variant"
        >
          Les accès bêta sont limités. Inscrivez-vous maintenant — organisateurs, prestataires et
          gestionnaires de lieux bienvenus.
        </motion.p>

        <motion.form
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          onSubmit={handleSubmit((data) => mutation.mutate(data))}
          className="mx-auto mb-6 flex max-w-md flex-col gap-4 text-left"
        >
          <Input
            {...register('firstName')}
            label="Votre prénom"
            floatingLabel
            error={errors.firstName?.message}
            className="text-on-surface"
            disabled={mutation.isPending}
          />

          <div className="flex flex-col gap-1.5">
            <Select
              options={ROLE_OPTIONS}
              value={role}
              onValueChange={(v) => setValue('role', v as WaitlistInput['role'], { shouldValidate: true })}
              placeholder="Je suis..."
              disabled={mutation.isPending}
              className="text-on-surface"
            />
            {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
          </div>

          <Input
            {...register('email')}
            type="email"
            label="votre@email.com"
            floatingLabel
            error={errors.email?.message}
            className="text-on-surface"
            disabled={mutation.isPending}
          />

          <div className="mt-2 flex flex-col gap-3">
            <label className="flex cursor-pointer items-start gap-2.5 text-on-surface-variant">
              <input
                type="checkbox"
                {...register('consentTerms')}
                className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-outline-variant accent-accent"
              />
              <span className="text-xs leading-relaxed">
                J&apos;accepte la{' '}
                <Link href="/confidentialite" className="underline transition-colors hover:text-accent">
                  Politique de confidentialité
                </Link>{' '}
                et les{' '}
                <Link href="/conditions" className="underline transition-colors hover:text-accent">
                  Conditions d&apos;utilisation
                </Link>{' '}
                d&apos;Elintys. Je confirme avoir 18 ans ou plus.
              </span>
            </label>
            {errors.consentTerms && (
              <p className="text-xs text-destructive">{errors.consentTerms.message}</p>
            )}

            <label className="flex cursor-pointer items-start gap-2.5 text-on-surface-variant">
              <input
                type="checkbox"
                {...register('consentMarketing')}
                className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-outline-variant accent-accent"
              />
              <span className="text-xs leading-relaxed">
                J&apos;accepte de recevoir les nouvelles, mises à jour et offres d&apos;Elintys par
                courriel. Je peux me désabonner à tout moment.
              </span>
            </label>
          </div>

          {mutation.isError && (
            <p className="text-xs text-destructive">{(mutation.error as Error).message}</p>
          )}

          <motion.button
            type="submit"
            disabled={mutation.isPending}
            whileHover={mutation.isPending ? undefined : { scale: 1.02, y: -2 }}
            whileTap={mutation.isPending ? undefined : { scale: 0.97 }}
            className="premium-button mt-1 w-full px-5 py-3.5 disabled:opacity-60"
          >
            {mutation.isPending ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                Rejoindre le mouvement
                <ArrowRight size={16} aria-hidden="true" />
              </>
            )}
          </motion.button>
        </motion.form>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.28 }}
          className="text-center text-xs font-semibold text-on-surface-variant"
        >
          Gratuit · Aucun engagement · Désabonnement en un clic
        </motion.div>
      </div>
    </section>
  );
}
