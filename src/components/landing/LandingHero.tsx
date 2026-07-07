'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import Link from 'next/link';
import {
  fadeSlideUp,
  staggerContainer,
  staggerItem,
  chipBounce,
  useReducedMotionVariants,
} from '@/lib/animations';

const JOURNEY_STEPS = [
  { label: 'Créer', desc: 'Configurez votre événement' },
  { label: 'Équiper', desc: 'Trouvez vos prestataires' },
  { label: 'Vendre', desc: 'Gérez la billetterie' },
  { label: 'Gérer', desc: 'Suivez les invités' },
  { label: 'Diffuser', desc: 'Promouvez votre événement' },
  { label: 'Valider', desc: 'Accueillez vos invités' },
];

const STATS = [
  { value: '1', label: 'Plateforme unique' },
  { value: '6', label: 'Étapes intégrées' },
  { value: '0', label: 'Fragmentation' },
];

interface StatCardProps {
  value: string;
  label: string;
  delay: number;
}

function StatCard({ value, label, delay }: StatCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      variants={fadeSlideUp}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      custom={delay}
      className="flex flex-col items-center gap-2"
    >
      <span className="font-serif text-6xl text-white leading-none">{value}</span>
      <span className="text-sm font-medium text-white/60 text-center">{label}</span>
    </motion.div>
  );
}

export function LandingHero() {
  const full = { container: staggerContainer, item: staggerItem };
  const reduced = { container: {}, item: {} };
  const { container, item } = useReducedMotionVariants(full, reduced);

  const statsRef = useRef<HTMLElement>(null);
  const statsInView = useInView(statsRef, { once: true });

  const journeyRef = useRef<HTMLElement>(null);
  const journeyInView = useInView(journeyRef, { once: true, margin: '-60px' });

  return (
    <div className="min-h-screen bg-primary overflow-x-hidden">
      {/* ── Header ── */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 md:px-12">
        <span className="font-serif text-2xl text-accent-light">Elintys</span>
        <div className="flex items-center gap-4">
          <Link
            href="/connexion"
            className="text-sm font-medium text-white/70 hover:text-white transition-colors"
          >
            Se connecter
          </Link>
          <Link
            href="/inscription"
            className="btn-primary text-sm"
          >
            Commencer
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-24 md:py-40 max-w-4xl mx-auto">
        <motion.div
          variants={container}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center gap-6"
        >
          <motion.div variants={item}>
            <span className="chip border border-accent/30 bg-accent/10 text-accent-light">
              Plateforme événementielle québécoise
            </span>
          </motion.div>

          <motion.h1
            variants={item}
            className="font-serif text-4xl md:text-6xl lg:text-7xl text-white leading-[1.05]"
          >
            L&apos;événementiel québécois,{' '}
            <span className="text-accent-light">réinventé.</span>
          </motion.h1>

          <motion.p
            variants={item}
            className="text-base md:text-lg text-white/60 max-w-lg leading-relaxed"
          >
            Créez, équipez, vendez, gérez et accueillez votre événement.
            Tout en un seul endroit.
          </motion.p>

          <motion.div variants={item} className="flex flex-col sm:flex-row items-center gap-3">
            <Link href="/inscription" className="btn-primary px-8 py-3 text-base">
              Commencer gratuitement
            </Link>
            <Link
              href="/evenements"
              className="text-sm font-semibold text-white/70 hover:text-white transition-colors flex items-center gap-1"
            >
              Voir les événements →
            </Link>
          </motion.div>

          {/* Journey Pills */}
          <motion.div
            variants={item}
            className="flex flex-wrap justify-center gap-2 mt-4"
          >
            {JOURNEY_STEPS.map((step, i) => (
              <motion.span
                key={step.label}
                variants={chipBounce}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.6 + i * 0.1 }}
                className="chip border border-white/10 bg-white/5 text-white/70"
                title={step.desc}
              >
                {i > 0 && <span className="mr-2 text-white/30">→</span>}
                {step.label}
              </motion.span>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ── Stats ── */}
      <section
        ref={statsRef}
        className="py-20 border-t border-white/5"
      >
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={statsInView ? 'visible' : 'hidden'}
          className="flex flex-col md:flex-row items-center justify-center gap-16 max-w-2xl mx-auto px-6"
        >
          {STATS.map((stat, i) => (
            <StatCard key={stat.label} value={stat.value} label={stat.label} delay={i * 0.1} />
          ))}
        </motion.div>
      </section>

      {/* ── Journey Cards ── */}
      <section ref={journeyRef} className="py-24 px-6 max-w-6xl mx-auto">
        <motion.h2
          variants={fadeSlideUp}
          initial="hidden"
          animate={journeyInView ? 'visible' : 'hidden'}
          className="font-serif text-3xl md:text-4xl text-white text-center mb-16"
        >
          Un parcours pensé de bout en bout
        </motion.h2>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={journeyInView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {JOURNEY_STEPS.map((step, i) => (
            <motion.div
              key={step.label}
              variants={staggerItem}
              className="rounded-[14px] bg-white/5 border border-white/[0.08] p-6 hover:bg-white/[0.08] transition-colors"
            >
              <span className="text-3xl font-serif text-accent-light opacity-40">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-3 font-serif text-xl text-white">{step.label}</h3>
              <p className="mt-1 text-sm text-white/50">{step.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── CTA Section ── */}
      <section className="py-24 px-6 text-center">
        <motion.div
          variants={fadeSlideUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="max-w-xl mx-auto flex flex-col items-center gap-6"
        >
          <h2 className="font-serif text-3xl md:text-4xl text-white">
            Prêt à transformer votre prochain événement ?
          </h2>
          <p className="text-white/60">
            Rejoignez les organisateurs qui font confiance à Elintys.
          </p>
          <Link href="/inscription" className="btn-primary px-10 py-4 text-base">
            Créer mon compte gratuitement
          </Link>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-8 px-6 text-center">
        <p className="text-xs text-white/30">
          © 2026 Elintys · Montréal, Québec ·{' '}
          <Link href="/confidentialite" className="hover:text-white/60 transition-colors">
            Confidentialité
          </Link>
          {' · '}
          <Link href="/conditions" className="hover:text-white/60 transition-colors">
            Conditions
          </Link>
        </p>
      </footer>
    </div>
  );
}
