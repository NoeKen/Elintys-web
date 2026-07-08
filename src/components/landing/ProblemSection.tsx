'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '@/lib/animations';

const PORTRAITS = [
  {
    title: "L'organisateur",
    description:
      'Jongle entre une plateforme de billetterie, un tableur d\'invités, des recherches Google pour ses prestataires, et une app de scan le jour J. Il gère des outils, pas son événement.',
  },
  {
    title: 'Le prestataire',
    description:
      "Talentueux et disponible, mais invisible. Il dépend du bouche-à-oreille et d'annuaires génériques — sans connexion directe aux événements qui ont besoin de lui.",
  },
  {
    title: 'Le gestionnaire de lieu',
    description:
      'Son espace est prêt. Mais les demandes arrivent par email, sans contexte, sans date claire, sans nombre de participants. Chaque réservation commence par une conversation floue.',
  },
  {
    title: 'Le participant',
    description:
      "Informé trop tard, il cherche l'événement sur plusieurs plateformes. Quand il trouve, l'achat est compliqué, le billet se perd dans sa boîte de réception. La découverte et l'expérience d'accueil méritent mieux.",
  },
];

function PersonaCard({ title, description }: { title: string; description: string }) {
  const [spot, setSpot] = useState({ x: 50, y: 50, visible: false });

  return (
    <motion.article
      className="premium-card relative cursor-default overflow-hidden p-6"
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        setSpot({
          x: ((e.clientX - r.left) / r.width) * 100,
          y: ((e.clientY - r.top) / r.height) * 100,
          visible: true,
        });
      }}
      onMouseLeave={() => setSpot((s) => ({ ...s, visible: false }))}
      whileHover={{ y: -3, borderColor: 'rgba(74,142,158,0.28)' }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      variants={staggerItem}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[14px] transition-opacity duration-300"
        style={{
          opacity: spot.visible ? 1 : 0,
          background: `radial-gradient(300px circle at ${spot.x}% ${spot.y}%, rgba(74,142,158,0.14) 0%, transparent 70%)`,
        }}
      />
      <h3 className="relative mb-3 font-serif text-xl text-navy-dark">{title}</h3>
      <p className="relative text-sm leading-relaxed text-on-surface-variant">{description}</p>
    </motion.article>
  );
}

export function ProblemSection({ id }: { id?: string }) {
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
          Le problème
        </span>
        <h2 className="premium-heading mt-4 md:text-[2.5rem]">
          Dans l&apos;événementiel, tout le monde subit la même fragmentation.
        </h2>
        <p className="premium-subtitle mt-4">
          L&apos;industrie événementielle est vivante, créative et en pleine croissance. Pourtant, les
          outils qui la soutiennent sont dispersés, déconnectés, et conçus en silos.
        </p>
      </motion.div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        {PORTRAITS.map((p) => (
          <PersonaCard key={p.title} {...p} />
        ))}
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="mt-10 text-center font-semibold text-on-surface-variant"
      >
        Quatre acteurs. Un même problème : ils ne sont pas connectés. Elintys change ça.
      </motion.p>
    </section>
  );
}
