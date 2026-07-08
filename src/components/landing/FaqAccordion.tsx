'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { staggerContainer, staggerItem } from '@/lib/animations';

const FAQ_ITEMS = [
  {
    q: "Est-ce gratuit pour rejoindre la liste d'attente ?",
    a: "Oui, totalement gratuit. L'inscription à la liste d'attente ne vous engage à rien. Vous serez parmi les premiers informés au lancement.",
  },
  {
    q: 'Quand la plateforme sera-t-elle disponible ?',
    a: "Nous visons un lancement bêta privé d'ici la fin de l'année. Les membres de la liste d'attente auront un accès prioritaire dès l'ouverture.",
  },
  {
    q: "Puis-je choisir les modules que j'utilise ?",
    a: 'Oui. Elintys est conçu de façon modulaire : vous pouvez activer uniquement la billetterie, la gestion invités, la marketplace ou le scan — selon vos besoins.',
  },
  {
    q: "La plateforme est-elle disponible en anglais ?",
    a: 'Oui. Elintys est une plateforme bilingue (français / anglais) pensée pour le marché québécois et canadien.',
  },
  {
    q: 'Je suis prestataire — comment ça fonctionne pour moi ?',
    a: "Créez votre profil prestataire et soyez visible au moment exact où un organisateur cherche à équiper son événement. Photographes, traiteurs, DJ, décorateurs, animateurs — tous les profils sont bienvenus. Autre avantage : même si vous n'êtes pas encore inscrit, un organisateur peut vous mentionner dans son événement et vous envoyer une invitation directe pour rejoindre la plateforme.",
  },
  {
    q: 'Je gère un espace événementiel — puis-je le lister sur Elintys ?',
    a: 'Oui. Créez votre profil de lieu — capacité, équipements, tarifs, photos. Votre espace devient visible dans notre catalogue public, consultable par n\'importe quel organisateur, même en dehors d\'un événement en cours. Vous recevez des demandes qualifiées avec date, nombre de participants et contexte. La visibilité est gratuite pendant la bêta.',
  },
  {
    q: 'Y aura-t-il des frais sur la billetterie et les paiements ?',
    a: 'Oui. Elintys prélève une commission de 6 % sur chaque billet vendu, plus des frais fixes de 1,49 CAD par billet pour couvrir les frais de traitement de paiement. Ces frais peuvent être absorbés par l\'organisateur ou répercutés sur le participant. Pour les événements gratuits et la gestion des invités : aucun frais.',
  },
];

export function FaqAccordion({ id }: { id?: string }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id={id} className="px-6 py-24 max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.5 }}
        className="mb-10 text-center"
      >
        <span className="mb-5 inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-xs font-medium text-white/60">
          Questions fréquentes
        </span>
        <h2 className="mt-4 font-serif text-3xl md:text-4xl leading-tight tracking-tight text-white">
          Tout ce que vous voulez savoir.
        </h2>
      </motion.div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        className="flex flex-col gap-2"
      >
        {FAQ_ITEMS.map((item, i) => (
          <motion.div
            key={item.q}
            variants={staggerItem}
            className="rounded-[10px] overflow-hidden transition-colors border"
            style={{ borderColor: open === i ? 'rgba(26,122,94,0.30)' : 'rgba(255,255,255,0.06)' }}
          >
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between px-5 py-4 text-left bg-white/[0.03]"
              aria-expanded={open === i}
            >
              <span className="text-sm font-medium text-white/80">{item.q}</span>
              <motion.span
                className="flex-shrink-0 ml-4 text-accent text-lg font-light"
                animate={{ rotate: open === i ? 45 : 0 }}
                transition={{ duration: 0.2 }}
                aria-hidden="true"
              >
                +
              </motion.span>
            </button>

            <AnimatePresence initial={false}>
              {open === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
                  style={{ overflow: 'hidden' }}
                  className="bg-white/[0.03]"
                >
                  <p className="px-5 pb-5 text-sm text-white/50 leading-relaxed">{item.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
