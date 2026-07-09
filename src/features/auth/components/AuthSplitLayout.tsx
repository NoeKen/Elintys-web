"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, BadgeCheck, CalendarDays, Sparkles, Users } from "lucide-react";
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

const socialAvatarColors = [
  "bg-teal-pale text-teal",
  "bg-gold-pale text-gold-dark",
  "bg-terracotta-pale text-terracotta",
];
const socialInitials = ["A", "B", "C"];

const featureItems = [
  { icon: CalendarDays, label: "Événements structurés", tone: "bg-teal-pale text-teal" },
  { icon: Users, label: "Rôles connectés", tone: "bg-gold-pale text-gold-dark" },
  { icon: BadgeCheck, label: "Accès sécurisé", tone: "bg-sage-pale text-sage" },
];

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
    <main className="mesh-gradient premium-noise relative min-h-screen overflow-hidden px-4 py-5 text-on-surface sm:px-6 lg:px-8">
      <div
        className="pointer-events-none absolute left-[8%] top-[10%] h-64 w-64 rounded-full bg-teal-pale/70 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-[8%] right-[7%] h-72 w-72 rounded-full bg-terracotta-pale/70 blur-3xl"
        aria-hidden="true"
      />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between">
        <Link href="/" className="font-serif text-2xl text-primary transition-opacity hover:opacity-80">
          Elintys
        </Link>
        <Link href={backHref} className="premium-button-ghost min-h-10">
          <ArrowLeft size={16} aria-hidden="true" />
          {backLabel}
        </Link>
      </header>

      <div className="relative z-10 mx-auto grid min-h-[calc(100svh-92px)] w-full max-w-6xl items-center gap-8 py-8 lg:grid-cols-[0.88fr_1fr] lg:py-10">
        <aside className="hidden lg:block">
          <div className="glass-card overflow-hidden p-7">
            <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-pale text-teal">
              <Sparkles size={22} aria-hidden="true" />
            </div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="space-y-6"
            >
              {headline && (
                <motion.h2
                  variants={itemVariants}
                  className="font-serif text-[clamp(38px,4vw,58px)] leading-[1.03] text-navy-dark"
                >
                  {headline}
                </motion.h2>
              )}

              {subheadline && (
                <motion.p
                  variants={itemVariants}
                  className="max-w-md text-base leading-7 text-on-surface-variant"
                >
                  {subheadline}
                </motion.p>
              )}

              {quote && (
                <motion.blockquote variants={itemVariants} className="border-l-4 border-accent pl-5">
                  <p className="font-serif text-[clamp(34px,4vw,52px)] leading-[1.06] text-navy-dark">
                    « {quote} »
                  </p>
                </motion.blockquote>
              )}

              {author && (
                <motion.div variants={itemVariants} className="flex items-center gap-3 pt-2">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-teal-pale text-teal">
                    {author.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={author.avatarUrl}
                        alt={author.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-bold">{author.name.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-on-surface">{author.name}</p>
                    <p className="text-xs text-on-surface-variant">{author.title}</p>
                  </div>
                </motion.div>
              )}

              {showSocialProof && (
                <motion.div
                  variants={itemVariants}
                  className="flex items-center gap-3 rounded-2xl border border-outline-variant/60 bg-white/65 p-4"
                >
                  <div className="flex items-center">
                    {socialAvatarColors.map((color, i) => (
                      <div
                        key={i}
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-full border-2 border-white font-bold",
                          color,
                          i > 0 && "-ml-2"
                        )}
                      >
                        <span className="text-[10px]">{socialInitials[i]}</span>
                      </div>
                    ))}
                    <div className="-ml-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-accent text-white">
                      <span className="text-[8px] font-bold leading-none">+200</span>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-on-surface-variant">
                    Plus de 200 professionnels nous font confiance
                  </p>
                </motion.div>
              )}

              <motion.div variants={itemVariants} className="grid gap-3 pt-2">
                {featureItems.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <div
                      key={feature.label}
                      className="flex items-center gap-3 rounded-2xl border border-outline-variant/60 bg-white/65 p-3.5"
                    >
                      <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", feature.tone)}>
                        <Icon size={17} aria-hidden="true" />
                      </div>
                      <p className="text-sm font-semibold text-on-surface">{feature.label}</p>
                    </div>
                  );
                })}
              </motion.div>
            </motion.div>

            <div className="mt-8 flex items-end justify-between gap-5 border-t border-outline-variant/60 pt-5">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-on-surface-variant">
                Curated with excellence · Québec
              </span>
              {progressStep != null && progressTotal != null && (
                <div className="flex min-w-32 flex-col items-end gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-on-surface-variant">
                    ÉTAPE {progressStep} SUR {progressTotal}
                  </span>
                  <div className="h-1.5 w-28 overflow-hidden rounded-full bg-teal-pale">
                    <div
                      className="h-full rounded-full bg-accent transition-all duration-500"
                      style={{ width: `${(progressStep / progressTotal) * 100}%` }}
                    />
                  </div>
                </div>
              )}
              </div>
            </div>
        </aside>

        <div className="flex justify-center lg:justify-end">
          <div className="glass-card w-full max-w-[560px] p-5 sm:p-8 lg:p-9">
            {progressStep != null && progressTotal != null && (
              <div className="mb-6 flex items-center justify-between rounded-2xl border border-outline-variant/60 bg-white/65 px-4 py-3 lg:hidden">
                <span className="text-xs font-bold uppercase tracking-[0.1em] text-on-surface-variant">
                  Étape {progressStep} sur {progressTotal}
                </span>
                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-teal-pale">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${(progressStep / progressTotal) * 100}%` }}
                  />
                </div>
              </div>
            )}
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}
