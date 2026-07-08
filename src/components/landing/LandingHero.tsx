'use client';

import { motion } from 'framer-motion';
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

function AnimatedHeadline({ text }: { text: string }) {
  const words = text.split(' ');
  return (
    <h1 className="font-serif text-4xl md:text-6xl lg:text-[4.5rem] text-white leading-[1.06] tracking-[-0.02em]">
      <motion.span className="inline" variants={staggerContainer} initial="hidden" animate="visible">
        {words.map((word, i) => (
          <motion.span
            key={`${word}-${i}`}
            className="inline-block mr-[0.22em] last:mr-0"
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
    <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-28 pb-20">
      <motion.div
        variants={container}
        initial="hidden"
        animate="visible"
        className="flex flex-col items-center gap-7 max-w-4xl mx-auto"
      >
        <motion.div variants={item}>
          <motion.span
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold tracking-wider text-on-primary-container border border-accent/30 bg-accent/[0.08]"
            animate={{
              boxShadow: ['0 0 0 0 rgba(74,142,158,0.35)', '0 0 0 10px rgba(74,142,158,0)'],
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
          className="text-lg md:text-xl max-w-2xl leading-relaxed"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.80) 0%, rgba(255,255,255,0.42) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Elintys réunit organisateurs, prestataires et gestionnaires de lieux dans un seul
          écosystème — pour que chaque événement soit vécu pleinement, pas seulement géré.
        </motion.p>

        <motion.div variants={item} className="flex flex-col sm:flex-row gap-4">
          <motion.a
            href="#cta"
            className="group relative overflow-hidden rounded-[10px] px-8 py-4 text-base font-semibold text-white"
            style={{ background: 'var(--gradient-warm)' }}
            whileHover={{ scale: 1.02, y: -2, boxShadow: '0 12px 40px rgba(212,132,74,0.35)' }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <span className="absolute inset-0 -translate-x-full skew-x-[-12deg] bg-gradient-to-r from-transparent via-white/12 to-transparent group-hover:translate-x-[200%] transition-transform duration-500" />
            <span className="relative flex items-center gap-2.5">
              Rejoindre le mouvement
              <motion.span
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 1, ease: 'easeInOut' }}
              >
                →
              </motion.span>
            </span>
          </motion.a>

          <motion.a
            href="#probleme"
            className="flex items-center gap-2 rounded-[10px] px-6 py-4 text-base font-medium border border-white/20 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-all"
          >
            Découvrir la plateforme ↓
          </motion.a>
        </motion.div>

        <motion.div variants={item} className="flex flex-wrap justify-center gap-x-6 gap-y-2">
          {TRUST.map((t, i) => (
            <motion.span
              key={t}
              className="flex items-center gap-1.5 text-sm text-white/50"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + i * 0.1, duration: 0.35 }}
            >
              <motion.span
                className="text-accent font-bold text-base"
                variants={chipBounce}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.85 + i * 0.1 }}
              >
                ✓
              </motion.span>
              {t}
            </motion.span>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
