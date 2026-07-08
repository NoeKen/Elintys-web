'use client';

import { motion } from 'framer-motion';
import { ArrowDown, ArrowRight, Building2, CalendarDays, Check, ScanLine, Ticket, Users } from 'lucide-react';
import {
  staggerContainer,
  staggerItem,
  chipBounce,
  useReducedMotionVariants,
} from '@/lib/animations';

const TRUST = [
  'Accès bêta gratuit',
  'Aucun engagement',
  'Vous construisez le produit avec nous',
];

const HEADLINE = "L'événementiel mérite mieux que des outils qui ne se parlent pas.";

const HERO_MODULES = [
  { label: 'Billetterie', value: '78%', icon: Ticket, tone: 'bg-teal-pale text-teal', width: 'w-[78%]' },
  { label: 'Invités', value: '1 248', icon: Users, tone: 'bg-gold-pale text-gold-dark', width: 'w-[62%]' },
  { label: 'Lieu', value: 'Confirmé', icon: Building2, tone: 'bg-terracotta-pale text-terracotta', width: 'w-[88%]' },
  { label: 'Scan', value: 'Prêt', icon: ScanLine, tone: 'bg-sage-pale text-sage', width: 'w-[44%]' },
];

function AnimatedHeadline({ text }: { text: string }) {
  const words = text.split(' ');
  return (
    <h1 className="font-serif text-4xl leading-[1.06] text-navy-dark md:text-6xl lg:text-[4.5rem]">
      <motion.span className="inline" variants={staggerContainer} initial="hidden" animate="visible">
        {words.map((word, i) => (
          <motion.span
            key={`${word}-${i}`}
            className={`inline-block ${i < words.length - 1 ? 'mr-[0.16em]' : ''}`}
            style={{ transformOrigin: 'bottom center' }}
            variants={{
              hidden: { opacity: 0, y: 28, rotateX: -12 },
              visible: {
                opacity: 1,
                y: 0,
                rotateX: 0,
                transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: i * 0.05 },
              },
            }}
          >
            {word}
            {i < words.length - 1 ? ' ' : ''}
          </motion.span>
        ))}
      </motion.span>
    </h1>
  );
}

export function LandingHero() {
  const { container, item } = useReducedMotionVariants(
    { container: staggerContainer, item: staggerItem },
    { container: {}, item: {} },
  );

  return (
    <section className="relative flex min-h-[100svh] items-start px-6 pb-20 pt-[calc(var(--navbar-height)+80px)] lg:pt-[calc(var(--navbar-height)+104px)]">
      <motion.div
        variants={container}
        initial="hidden"
        animate="visible"
        className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1fr_0.86fr]"
      >
        <div className="flex flex-col items-start gap-7 text-left">
          <motion.div variants={item}>
            <motion.span
              className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-white/70 px-4 py-1.5 text-xs font-bold tracking-wider text-teal-dark [box-shadow:var(--shadow-soft-line)] backdrop-blur-md"
              animate={{
                boxShadow: ['0 0 0 0 rgba(74,142,158,0.24)', '0 0 0 10px rgba(74,142,158,0)'],
              }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
            >
              Écosystème bêta — Montréal, Québec
            </motion.span>
          </motion.div>

          <motion.div variants={item} style={{ perspective: 900 }}>
            <AnimatedHeadline text={HEADLINE} />
          </motion.div>

          <motion.p
            variants={item}
            className="max-w-2xl text-lg leading-relaxed text-on-surface-variant md:text-xl"
          >
            Elintys réunit organisateurs, prestataires et gestionnaires de lieux dans un seul
            écosystème — pour que chaque événement soit vécu pleinement, pas seulement géré.
          </motion.p>

          <motion.div variants={item} className="flex flex-col gap-4 sm:flex-row">
            <motion.a
              href="#cta"
              className="premium-button px-8 py-4 text-base"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              Rejoindre le mouvement
              <ArrowRight size={18} aria-hidden="true" />
            </motion.a>

            <motion.a
              href="#probleme"
              className="premium-button-secondary px-6 py-4 text-base"
            >
              Découvrir la plateforme
              <ArrowDown size={18} aria-hidden="true" />
            </motion.a>
          </motion.div>

          <motion.div variants={item} className="flex flex-wrap gap-x-6 gap-y-2">
            {TRUST.map((t, i) => (
              <motion.span
                key={t}
                className="flex items-center gap-2 text-sm font-semibold text-on-surface-variant"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + i * 0.1, duration: 0.35 }}
              >
                <motion.span
                  className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-pale text-teal"
                  variants={chipBounce}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.85 + i * 0.1 }}
                >
                  <Check size={13} aria-hidden="true" />
                </motion.span>
                {t}
              </motion.span>
            ))}
          </motion.div>
        </div>

        <motion.div
          variants={item}
          className="glass-card relative w-full max-w-[460px] justify-self-center overflow-hidden p-4 sm:p-5 lg:justify-self-end"
        >
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-teal-pale/80 to-transparent"
          />
          <div className="relative rounded-[18px] border border-white/70 bg-white/75 p-5 [box-shadow:var(--shadow-soft-line)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="section-eyebrow">Tableau de bord</p>
                <h2 className="mt-3 font-serif text-3xl leading-tight text-navy-dark">
                  Gala Montréal
                </h2>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-pale text-teal">
                <CalendarDays size={22} aria-hidden="true" />
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {HERO_MODULES.map((module) => {
                const Icon = module.icon;
                return (
                  <div key={module.label} className="rounded-2xl border border-outline-variant/60 bg-white/70 p-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${module.tone}`}>
                        <Icon size={17} aria-hidden="true" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <p className="truncate text-xs font-bold uppercase tracking-[0.1em] text-on-surface-variant">
                            {module.label}
                          </p>
                          <p className="shrink-0 text-sm font-semibold text-on-surface">{module.value}</p>
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-teal-pale/80">
                          <motion.div
                            className={`h-full rounded-full bg-teal ${module.width}`}
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ duration: 0.9, delay: 0.65, ease: [0.22, 1, 0.36, 1] }}
                            style={{ transformOrigin: 'left center' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 rounded-2xl border border-outline-variant/60 bg-gradient-to-br from-white/80 to-teal-pale/45 p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal text-white">
                  <Check size={15} aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-navy-dark">Espace prêt à publier</p>
                  <p className="mt-1 text-xs leading-5 text-on-surface-variant">
                    Billets, invités, lieu et scan restent connectés dans le même flux.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
