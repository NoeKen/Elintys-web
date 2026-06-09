"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, Star, Building2, Loader2 } from "lucide-react";
import { RoleCard } from "./RoleCard";
import { StepIndicator } from "./StepIndicator";
import { cn } from "@/shared/lib/utils";

interface RegisterStep2Props {
  onSubmit: (role: string) => Promise<void>;
}

const roleCards = [
  {
    value: "organisateur",
    icon: Calendar,
    iconBg: "#E6F5F0",
    iconColor: "#1A7A5E",
    title: "Organisateur",
    description: "Créez et gérez vos propres événements.",
  },
  {
    value: "prestataire",
    icon: Star,
    iconBg: "#EDE9FE",
    iconColor: "#7C3AED",
    title: "Prestataire",
    description: "Offrez vos services (traiteur, son, déco).",
  },
  {
    value: "gestionnaire_salle",
    icon: Building2,
    iconBg: "#FEF3C7",
    iconColor: "#C8862A",
    title: "Gestionnaire de lieu",
    description: "Mettez en avant vos espaces de réception.",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
};

export function RegisterStep2RoleSelector({ onSubmit }: RegisterStep2Props) {
  const [selectedRole, setSelectedRole] = useState("organisateur");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await onSubmit(selectedRole);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <StepIndicator
        steps={[{ label: "Compte" }, { label: "Rôle" }]}
        currentStep={2}
      />

      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        <motion.div variants={item}>
          <h2 className="font-serif text-[32px] text-on-surface leading-tight mb-1">
            Quel est votre rôle ?
          </h2>
          <p className="text-sm text-on-surface-variant">
            Personnalisez votre expérience selon vos besoins.
          </p>
        </motion.div>

        {/* Role cards */}
        <motion.div variants={container} className="space-y-3">
          {roleCards.map((card) => (
            <motion.div key={card.value} variants={item}>
              <RoleCard
                icon={card.icon}
                iconBg={card.iconBg}
                iconColor={card.iconColor}
                title={card.title}
                description={card.description}
                value={card.value}
                selected={selectedRole === card.value}
                onSelect={setSelectedRole}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Bouton créer */}
        <motion.div variants={item}>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className={cn(
              "w-full h-12 rounded-md bg-accent text-white text-sm font-semibold",
              "flex items-center justify-center gap-2 transition-opacity",
              "hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
            )}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Création du compte...
              </>
            ) : (
              "Créer mon compte"
            )}
          </button>
        </motion.div>

        {/* Mention légale */}
        <motion.p variants={item} className="text-center text-xs text-on-surface-variant">
          En créant un compte, vous acceptez nos{" "}
          <Link href="#" className="text-accent hover:underline">
            Conditions d&apos;utilisation
          </Link>{" "}
          et notre{" "}
          <Link href="#" className="text-accent hover:underline">
            Politique de confidentialité
          </Link>
          .
        </motion.p>
      </motion.div>
    </div>
  );
}
