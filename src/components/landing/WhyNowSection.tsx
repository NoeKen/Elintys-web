'use client';

import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '@/lib/animations';

const LEFT_ITEMS = [
  'Accès prioritaire à la bêta avant le lancement public',
  'Tarif fondateur réservé aux premiers inscrits',
  'Votre feedback influence directement les fonctionnalités',
  'Accès direct à l\'équipe — pas un ticket de support',
  'Vision Canada — Elintys commence à Montréal, mais l\'ambition est nationale',
];

const RIGHT_ITEMS = [
  'Un seul endroit pour tout votre événement',
  'Vos prestataires et votre lieu connectés à votre tableau de bord',
  "Billetterie, invités, scan d'entrée — sans changer d'onglet",
  'Plus de temps à organiser. Moins à synchroniser.',
];

function InfoCard({ title, items }: { title: string; items: readonly string[] }) {
  return (
    <motion.div
      variants={staggerItem}
      className="premium-card p-6"
    >
      <h3 className="mb-5 text-lg font-semibold text-navy-dark">{title}</h3>
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item} className="flex items-start gap-3">
            <span className="mt-2 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-accent" />
            <p className="text-sm leading-relaxed text-on-surface-variant">{item}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export function WhyNowSection() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-24">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl mb-10"
      >
        <span className="section-eyebrow mb-5">
          Pourquoi maintenant
        </span>
        <h2 className="mt-4 font-serif text-3xl leading-tight text-navy-dark md:text-[2.1rem]">
          Les premiers arrivés construisent quelque chose avec nous.
        </h2>
        <p className="premium-subtitle mt-4">
          Elintys n&apos;est pas encore lancé. C&apos;est une opportunité rare : celle d&apos;influencer
          une plateforme avant qu&apos;elle existe complètement. Les early adopters ne sont pas juste
          des utilisateurs — ils sont co-constructeurs.
        </p>
      </motion.div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        className="grid grid-cols-1 gap-4 md:grid-cols-2"
      >
        <InfoCard title="En rejoignant aujourd'hui" items={LEFT_ITEMS} />
        <InfoCard title="Avec le produit" items={RIGHT_ITEMS} />
      </motion.div>
    </section>
  );
}
