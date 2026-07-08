'use client';

import { motion } from 'framer-motion';

export function FounderQuote() {
  return (
    <section className="px-6 py-24">
      <motion.blockquote
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.55 }}
        className="glass-card mx-auto max-w-3xl px-6 py-8"
      >
        <div className="border-l-4 border-accent pl-5">
          <p className="text-lg leading-relaxed text-on-surface">
            &quot;J&apos;ai construit Elintys parce que l&apos;événementiel mérite mieux. Mieux que des
            outils déconnectés, mieux que des heures perdues à synchroniser ce qui devrait couler de
            source. Notre ambition est de devenir la plateforme de référence de toute une industrie —
            en commençant par Montréal.&quot;
          </p>
          <footer className="mt-4 text-sm font-semibold text-on-surface-variant">
            — Noe Kenfack, fondateur d&apos;Elintys · Montréal, Québec
          </footer>
        </div>
      </motion.blockquote>

      <motion.p
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.15, duration: 0.5 }}
        className="mx-auto mt-8 max-w-3xl text-center text-sm leading-relaxed text-on-surface-variant"
      >
        Déjà rejoint par des organisateurs de mariages, conférences, galas, festivals et soirées
        corporatives — ainsi que par des prestataires et gestionnaires d&apos;espaces.
      </motion.p>
    </section>
  );
}
