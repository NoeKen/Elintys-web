'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
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
        <div className="mx-auto flex max-w-md items-center gap-3 rounded-[14px] border border-accent/20 bg-accent/[0.06] px-6 py-5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white">
            ✓
          </span>
          <p className="text-sm text-white/80">
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
      style={{
        background: `
          radial-gradient(ellipse 65% 55% at 50% 45%, rgba(26,122,94,0.16) 0%, transparent 65%),
          radial-gradient(ellipse 100% 80% at 50% 110%, rgba(13,30,53,0.85) 0%, transparent 55%)
        `,
      }}
    >
      <div className="relative mx-auto max-w-2xl text-center">
        <motion.span
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
          className="mb-6 inline-flex items-center rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-xs font-medium text-on-primary-container"
        >
          Accès bêta limité
        </motion.span>

        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="mb-4 font-serif text-[clamp(2rem,5vw,3rem)] leading-tight tracking-tight text-white"
        >
          L&apos;événementiel se réinvente. Faites-en partie.
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.14 }}
          className="mb-10 text-base text-white/50"
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
            className="text-white border-white/15 focus:border-accent"
            disabled={mutation.isPending}
          />

          <div className="flex flex-col gap-1.5">
            <Select
              options={ROLE_OPTIONS}
              value={role}
              onValueChange={(v) => setValue('role', v as WaitlistInput['role'], { shouldValidate: true })}
              placeholder="Je suis..."
              disabled={mutation.isPending}
              className="text-white border-white/15 focus:border-accent"
            />
            {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
          </div>

          <Input
            {...register('email')}
            type="email"
            label="votre@email.com"
            floatingLabel
            error={errors.email?.message}
            className="text-white border-white/15 focus:border-accent"
            disabled={mutation.isPending}
          />

          <div className="mt-2 flex flex-col gap-3">
            <label className="flex items-start gap-2.5 cursor-pointer text-white/60">
              <input
                type="checkbox"
                {...register('consentTerms')}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/20 accent-accent cursor-pointer"
              />
              <span className="text-xs leading-relaxed">
                J&apos;accepte la{' '}
                <Link href="/confidentialite" className="underline hover:text-accent transition-colors">
                  Politique de confidentialité
                </Link>{' '}
                et les{' '}
                <Link href="/conditions" className="underline hover:text-accent transition-colors">
                  Conditions d&apos;utilisation
                </Link>{' '}
                d&apos;Elintys. Je confirme avoir 18 ans ou plus.
              </span>
            </label>
            {errors.consentTerms && (
              <p className="text-xs text-destructive">{errors.consentTerms.message}</p>
            )}

            <label className="flex items-start gap-2.5 cursor-pointer text-white/60">
              <input
                type="checkbox"
                {...register('consentMarketing')}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/20 accent-accent cursor-pointer"
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
            whileHover={mutation.isPending ? undefined : { boxShadow: '0 0 48px rgba(26,122,94,0.40)', scale: 1.02, y: -2 }}
            whileTap={mutation.isPending ? undefined : { scale: 0.97 }}
            className="mt-1 flex w-full items-center justify-center gap-2 rounded-[10px] px-5 py-3.5 text-sm font-semibold text-white disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, var(--accent) 0%, var(--on-primary-container) 100%)' }}
          >
            {mutation.isPending ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              'Rejoindre le mouvement →'
            )}
          </motion.button>
        </motion.form>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.28 }}
          className="text-center text-xs text-white/30"
        >
          Gratuit · Aucun engagement · Désabonnement en un clic
        </motion.div>
      </div>
    </section>
  );
}
