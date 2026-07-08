"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/shared/lib/utils";

interface AuthorProps {
  name: string;
  title: string;
  avatarUrl?: string;
}

export interface AuthSplitLayoutProps {
  headline?: string;
  subheadline?: string;
  quote?: string;
  author?: AuthorProps;
  showSocialProof?: boolean;
  progressStep?: number;
  progressTotal?: number;
  backHref?: string;
  backLabel?: string;
  children: React.ReactNode;
}

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
};

const socialAvatarColors = ["bg-accent/40", "bg-on-primary-container/50", "bg-amber/40"];
const socialInitials = ["A", "B", "C"];

export function AuthSplitLayout({
  headline,
  subheadline,
  quote,
  author,
  showSocialProof,
  progressStep,
  progressTotal,
  backHref = "/",
  backLabel = "Retour à l'accueil",
  children,
}: AuthSplitLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* ── Panneau gauche ── */}
      <div
        className="hidden lg:flex w-1/2 relative overflow-hidden flex-col"
        style={{ background: "linear-gradient(160deg, #1E3D4F 0%, #162840 100%)" }}
      >
        {/* Grille overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            opacity: 0.08,
          }}
        />

        {/* Logo */}
        <div className="relative z-10 p-8">
          <span className="font-serif text-2xl text-white">Elintys</span>
        </div>

        {/* Contenu central */}
        <div className="relative z-10 flex-1 flex items-center px-12">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="w-full space-y-6"
          >
            {headline && (
              <motion.h2
                variants={itemVariants}
                className="font-serif italic text-white text-[44px] leading-[1.15]"
              >
                {headline}
              </motion.h2>
            )}

            {subheadline && (
              <motion.p
                variants={itemVariants}
                className="font-serif italic text-white/70 text-[22px] leading-[1.4]"
              >
                {subheadline}
              </motion.p>
            )}

            {quote && (
              <motion.p
                variants={itemVariants}
                className="font-serif italic text-white text-[44px] leading-[1.15]"
              >
                «{quote}
              </motion.p>
            )}

            {author && (
              <motion.div variants={itemVariants} className="flex items-center gap-3 pt-2">
                <div className="w-10 h-10 rounded-full bg-accent/30 flex items-center justify-center shrink-0 overflow-hidden">
                  {author.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={author.avatarUrl}
                      alt={author.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white text-sm font-bold">
                      {author.name.charAt(0)}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-white font-bold text-sm">{author.name}</p>
                  <p className="text-white/60 text-xs">{author.title}</p>
                </div>
              </motion.div>
            )}

            {showSocialProof && (
              <motion.div variants={itemVariants} className="flex items-center gap-3 pt-2">
                <div className="flex items-center">
                  {socialAvatarColors.map((color, i) => (
                    <div
                      key={i}
                      className={cn(
                        "w-8 h-8 rounded-full border-2 border-[#162840] flex items-center justify-center",
                        color,
                        i > 0 && "-ml-2"
                      )}
                    >
                      <span className="text-white text-[10px] font-bold">{socialInitials[i]}</span>
                    </div>
                  ))}
                  <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center -ml-2 border-2 border-[#162840]">
                    <span className="text-white text-[8px] font-bold leading-none">+200</span>
                  </div>
                </div>
                <p className="text-white text-sm">Plus de 200 professionnels nous font confiance</p>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Footer gauche */}
        <div className="relative z-10 px-8 pb-8 flex justify-between items-end">
          <span className="text-white/40 text-[10px] uppercase tracking-[0.15em]">
            CURATED WITH EXCELLENCE • QUEBEC
          </span>
          {progressStep != null && progressTotal != null && (
            <div className="flex flex-col items-end gap-1.5">
              <span className="text-white/40 text-[10px] uppercase tracking-[0.05em]">
                ÉTAPE {progressStep} SUR {progressTotal}
              </span>
              <div className="w-28 h-[3px] rounded-full bg-white/20 overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-500"
                  style={{ width: `${(progressStep / progressTotal) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Panneau droit ── */}
      <div className="flex-1 bg-surface flex flex-col min-h-screen">
        {/* Lien retour */}
        <div className="flex justify-end p-6">
          <Link
            href={backHref}
            className="text-sm text-on-surface-variant hover:text-on-surface transition-colors"
          >
            ← {backLabel}
          </Link>
        </div>

        {/* Contenu centré */}
        <div className="flex-1 flex items-center justify-center px-6 py-8">
          <div className="w-full max-w-[480px]">{children}</div>
        </div>
      </div>
    </div>
  );
}
