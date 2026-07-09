'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { fadeSlideUp } from '@/lib/animations';

const STEPS = [
  {
    n: 1,
    label: 'Créer',
    desc: 'Donnez vie à votre événement en quelques minutes. Titre, date, lieu, description, visuel. Votre événement existe — le reste peut attendre.',
  },
  {
    n: 2,
    label: 'Équiper',
    desc: "Accédez à un catalogue de prestataires locaux. Ou ajoutez vos propres contacts — même s'ils ne sont pas encore sur Elintys. Invitez-les à rejoindre la plateforme en un clic.",
  },
  {
    n: 3,
    label: 'Trouver un lieu',
    desc: 'Capacité, quartier, demande directe — trouvez et réservez un espace qui correspond exactement à votre événement.',
  },
  {
    n: 4,
    label: 'Vendre',
    desc: 'Créez vos billets, encaissez en ligne. Chaque participant reçoit son QR code automatiquement.',
  },
  {
    n: 5,
    label: 'Gérer',
    desc: "Confirmations, liste d'invités, revenus en temps réel. Tout est là. Rien ne manque.",
  },
  {
    n: 6,
    label: 'Diffuser',
    desc: 'Votre événement reçoit automatiquement une page publique indexée dans le catalogue Elintys. Partagez, soyez trouvé, remplissez votre salle.',
  },
  {
    n: 7,
    label: 'Accueillir',
    desc: 'Scannez les entrées depuis votre téléphone. Votre événement commence. Vous y êtes pleinement.',
  },
];

const PROGRESS_BARS = [
  { label: 'Admission générale', pct: 78 },
  { label: 'VIP', pct: 42 },
  { label: 'Invités spéciaux', pct: 21 },
];

function ProgressBar({ label, pct }: { label: string; pct: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  return (
    <div ref={ref} className="flex flex-col gap-1.5">
      <div className="flex justify-between text-xs font-semibold text-on-surface-variant">
        <span>{label}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-teal-pale">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-accent to-on-primary-container"
          initial={{ width: 0 }}
          animate={inView ? { width: `${pct}%` } : {}}
          transition={{ duration: 1.2, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}

export function SolutionStepper({ id }: { id?: string }) {
  const [active, setActive] = useState(0);

  return (
    <section id={id} className="mx-auto max-w-6xl px-6 py-24">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl mb-14"
      >
        <span className="section-eyebrow mb-5">
          La solution Elintys
        </span>
        <h2 className="premium-heading mt-4 md:text-[2.5rem]">
          Un seul endroit. Chaque étape. Chaque acteur connecté.
        </h2>
        <p className="premium-subtitle mt-4">
          Avec Elintys, vous n&apos;avancez plus seul. Chaque étape est connectée à la suivante — et
          peut être effectuée maintenant ou plus tard depuis votre tableau de bord.
        </p>
      </motion.div>

      <div className="grid gap-8 md:grid-cols-[280px_1fr]">
        <div className="flex flex-col gap-1">
          {STEPS.map((s, i) => (
            <button
              key={s.n}
              onClick={() => setActive(i)}
              className="relative flex items-center gap-3 rounded-[8px] px-4 py-3 text-left transition-colors hover:bg-teal-pale/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {active === i && (
                <motion.div
                  layoutId="step-active-bg"
                  className="absolute inset-0 rounded-[8px] bg-white/75 shadow-card"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span
                className={`relative z-10 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  active === i ? 'bg-accent text-white' : 'bg-white/75 text-on-surface-variant'
                }`}
              >
                {s.n}
              </span>
              <span
                className={`relative z-10 text-sm font-medium transition-colors ${
                  active === i ? 'text-navy-dark' : 'text-on-surface-variant'
                }`}
              >
                {s.label}
              </span>
            </button>
          ))}
        </div>

        <div className="relative min-h-[200px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              variants={fadeSlideUp}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}
              className="glass-card p-6"
            >
              <span className="font-serif text-4xl text-teal/20">
                {String(STEPS[active].n).padStart(2, '0')}
              </span>
              <h3 className="mb-3 mt-2 font-serif text-2xl text-navy-dark">{STEPS[active].label}</h3>
              <p className="leading-relaxed text-on-surface-variant">{STEPS[active].desc}</p>

              {active === 3 && (
                <div className="mt-6 flex flex-col gap-3">
                  {PROGRESS_BARS.map((b) => (
                    <ProgressBar key={b.label} {...b} />
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <p className="mt-10 text-center">
        <span className="inline-flex items-center rounded-full border border-accent/20 bg-white/75 px-5 py-2 text-sm font-semibold text-teal-dark shadow-card">
          → Chaque étape à votre rythme. Tout connecté dans un seul tableau de bord.
        </span>
      </p>
    </section>
  );
}
