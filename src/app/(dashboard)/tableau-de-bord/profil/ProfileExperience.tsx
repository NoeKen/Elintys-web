"use client";

import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarDays,
  Check,
  ChevronRight,
  CircleAlert,
  Crown,
  Mail,
  MapPin,
  ShieldCheck,
  Sparkles,
  Star,
  Ticket,
  UserRound,
  WalletCards,
} from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { useAuth } from "@/shared/hooks/useAuth";
import { Avatar } from "@/shared/ui/Avatar";
import type { User, UserRole } from "@/shared/types";
import { cn, formatDate, getInitials } from "@/shared/lib/utils";

type Tone = "petrol" | "turquoise" | "sand" | "sage";

interface RoleMeta {
  role: UserRole;
  label: string;
  shortLabel: string;
  description: string;
  href: string;
  Icon: ComponentType<{ size?: number; className?: string }>;
  tone: Tone;
}

const ROLE_META: Record<UserRole, RoleMeta> = {
  organisateur: {
    role: "organisateur",
    label: "Organisateur",
    shortLabel: "Organisation",
    description: "Evenements, invites, prestataires et lieux rattaches.",
    href: "/onboarding/organisateur",
    Icon: CalendarDays,
    tone: "turquoise",
  },
  prestataire: {
    role: "prestataire",
    label: "Prestataire",
    shortLabel: "Services",
    description: "Demandes qualifiees, fiche publique et ententes.",
    href: "/onboarding/prestataire",
    Icon: Star,
    tone: "sand",
  },
  gestionnaire_salle: {
    role: "gestionnaire_salle",
    label: "Gestionnaire de lieu",
    shortLabel: "Lieux",
    description: "Fiche lieu, reservations, disponibilites et calendrier.",
    href: "/onboarding/gestionnaire",
    Icon: Building2,
    tone: "petrol",
  },
  participant: {
    role: "participant",
    label: "Participant",
    shortLabel: "Participant",
    description: "Billets, favoris et experiences reservees.",
    href: "/billetterie",
    Icon: Ticket,
    tone: "sage",
  },
};

const ROLE_ORDER: UserRole[] = ["organisateur", "prestataire", "gestionnaire_salle", "participant"];
const SUBSCRIBABLE_ROLES: UserRole[] = ["organisateur", "prestataire", "gestionnaire_salle"];

const toneStyles: Record<Tone, { chip: string; icon: string; line: string; dot: string }> = {
  petrol: {
    chip: "border-primary/15 bg-primary/10 text-primary",
    icon: "bg-primary text-white",
    line: "from-primary/80 to-primary/10",
    dot: "bg-primary",
  },
  turquoise: {
    chip: "border-teal/20 bg-teal-pale text-teal-dark",
    icon: "bg-teal text-white",
    line: "from-teal/80 to-teal/10",
    dot: "bg-teal",
  },
  sand: {
    chip: "border-terracotta/20 bg-terracotta-pale text-terracotta-dark",
    icon: "bg-terracotta text-white",
    line: "from-terracotta/80 to-terracotta/10",
    dot: "bg-terracotta",
  },
  sage: {
    chip: "border-sage/20 bg-sage-pale text-sage-dark",
    icon: "bg-sage text-white",
    line: "from-sage/80 to-sage/10",
    dot: "bg-sage",
  },
};

function fullName(user: User): string {
  return [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || user.email;
}

function safeDate(value: string): string {
  if (!value) return "Non disponible";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Non disponible";
  return formatDate(date, "long");
}

function currency(value: number): string {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 2,
  }).format(value);
}

function completion(user: User): number {
  const checks = [
    Boolean(user.email),
    Boolean(user.firstName || user.lastName),
    user.roles.length > 0,
    user.isEmailVerified,
    user.onboardingCompleted,
    Object.keys(user.onboardingData ?? {}).length > 0,
  ];

  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function valueToText(value: string | string[] | number): string {
  return Array.isArray(value) ? value.join(", ") : String(value);
}

function onboardingDone(user: User, role: UserRole): boolean {
  return Boolean(user.onboardingByRole?.[role]);
}

export function ProfileExperience() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-[calc(100svh-3.5rem)] overflow-y-auto px-4 py-6 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="h-[420px] animate-pulse rounded-[28px] border border-white/50 bg-white/50" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-[calc(100svh-3.5rem)] overflow-y-auto px-4 py-10 sm:px-6">
        <section className="mx-auto max-w-xl rounded-[28px] border border-white/50 bg-white/70 p-8 text-center shadow-float backdrop-blur-2xl">
          <CircleAlert className="mx-auto text-terracotta" size={30} aria-hidden="true" />
          <h1 className="mt-5 font-serif text-3xl text-navy-dark">Session introuvable</h1>
          <p className="mt-3 text-sm leading-6 text-on-surface-variant">
            Reconnectez-vous pour consulter votre profil.
          </p>
          <Link href="/connexion" className="premium-button mt-6">
            Se connecter
          </Link>
        </section>
      </div>
    );
  }

  const name = fullName(user);
  const score = completion(user);
  const radius = 47;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (score / 100) * circumference;
  const activeRoles = ROLE_ORDER.filter((role) => user.roles.includes(role)).map((role) => ROLE_META[role]);
  const availableRoles = SUBSCRIBABLE_ROLES.filter((role) => !user.roles.includes(role)).map((role) => ROLE_META[role]);
  const onboardingEntries = Object.entries(user.onboardingData ?? {});

  return (
    <div className="h-[calc(100svh-3.5rem)] overflow-y-auto scroll-smooth bg-[radial-gradient(circle_at_0%_0%,rgba(136,196,208,0.22),transparent_34%),radial-gradient(circle_at_100%_0%,rgba(212,132,74,0.12),transparent_28%),linear-gradient(180deg,rgba(250,249,250,0.92),rgba(248,249,251,0.98))] px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-8 pb-12">
        <section className="relative overflow-hidden rounded-[28px] border border-white/50 bg-white/70 p-5 shadow-float backdrop-blur-2xl sm:p-8 lg:p-10">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-teal-pale/80 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-terracotta-pale/70 blur-3xl" />

          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
            <div className="flex flex-col gap-7 sm:flex-row sm:items-center">
              <div className="relative mx-auto h-36 w-36 shrink-0 sm:mx-0 lg:h-44 lg:w-44">
                <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
                  <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(30,61,79,0.08)" strokeWidth="3.5" />
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="none"
                    stroke="rgb(74,142,158)"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="round"
                    strokeWidth="3.5"
                  />
                </svg>
                <Avatar
                  src={user.avatarUrl}
                  fallback={getInitials(name)}
                  alt={name}
                  size="lg"
                  className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 border-4 border-white/80 text-2xl shadow-premium lg:h-36 lg:w-36"
                />
                <div className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white shadow-card">
                  <BadgeCheck size={18} aria-hidden="true" />
                </div>
              </div>

              <div className="min-w-0 text-center sm:text-left">
                <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/60 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-teal-dark shadow-card">
                  <Sparkles size={13} aria-hidden="true" />
                  Profil utilisateur
                </p>
                <h1 className="font-serif text-[clamp(34px,6vw,66px)] leading-[0.98] text-navy-dark">
                  {name}
                </h1>
                <div className="mt-5 flex flex-wrap justify-center gap-2 sm:justify-start">
                  <span className="inline-flex items-center gap-2 rounded-full border border-outline-variant/60 bg-white/70 px-3 py-1.5 text-sm font-semibold text-on-surface-variant">
                    <Mail size={14} aria-hidden="true" />
                    {user.email}
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-bold",
                      user.isEmailVerified
                        ? "border-sage/20 bg-sage-pale text-sage-dark"
                        : "border-terracotta/20 bg-terracotta-pale text-terracotta-dark",
                    )}
                  >
                    <ShieldCheck size={14} aria-hidden="true" />
                    {user.isEmailVerified ? "Courriel verifie" : "Courriel a verifier"}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-white/60 bg-white/60 p-5 shadow-card backdrop-blur-xl">
              <div className="flex items-end justify-between gap-5">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-on-surface-variant">
                    Profil complete
                  </p>
                  <p className="mt-2 text-5xl font-bold tracking-tight text-primary">{score}%</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal text-white">
                  <Check size={22} aria-hidden="true" />
                </div>
              </div>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-surface-container">
                <div className="h-full rounded-full bg-teal" style={{ width: `${score}%` }} />
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                <MiniStat label="Roles" value={String(user.roles.length)} />
                <MiniStat label="Onboarding" value={`${Object.values(user.onboardingByRole ?? {}).filter(Boolean).length}/${Math.max(user.roles.length, 1)}`} />
                <MiniStat label="Solde" value={currency(user.referralBalance)} />
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
          <div className="space-y-6">
            <Panel
              title="Identite"
              eyebrow="Compte"
              icon={UserRound}
              action={<Link href="/parametres" className="text-sm font-bold text-teal-dark hover:underline">Parametres</Link>}
            >
              <div className="divide-y divide-outline-variant/60">
                <DetailRow label="Identifiant" value={user.id || "Non disponible"} />
                <DetailRow label="Courriel" value={user.email} />
                <DetailRow label="Compte cree" value={safeDate(user.createdAt)} />
                <DetailRow label="Mise a jour" value={safeDate(user.updatedAt)} />
              </div>
            </Panel>

            <Panel title="Abonnements" eyebrow="Acces" icon={WalletCards}>
              {user.subscriptions.length > 0 ? (
                <div className="space-y-3">
                  {user.subscriptions.map((subscription, index) => (
                    <div key={index} className="rounded-2xl border border-outline-variant/60 bg-white/55 p-4">
                      <p className="text-sm font-bold text-primary">Abonnement {index + 1}</p>
                      <div className="mt-3 space-y-2">
                        {Object.entries(subscription).map(([key, value]) => (
                          <DetailRow
                            key={key}
                            compact
                            label={key}
                            value={
                              typeof value === "string" || typeof value === "number" || typeof value === "boolean"
                                ? String(value)
                                : "Donnee structuree"
                            }
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="Aucun abonnement actif"
                  description="Les souscriptions a un nouveau role apparaitront ici."
                  href="/tarification"
                  cta="Voir les offres"
                />
              )}
            </Panel>
          </div>

          <div className="space-y-6">
            <Panel title="Roles et progression" eyebrow="Workflow" icon={Crown}>
              <div className="space-y-4">
                {activeRoles.map((role, index) => (
                  <RoleTimelineItem
                    key={role.role}
                    role={role}
                    last={index === activeRoles.length - 1 && availableRoles.length === 0}
                    active
                    done={onboardingDone(user, role.role)}
                  />
                ))}
                {availableRoles.map((role, index) => (
                  <RoleTimelineItem
                    key={role.role}
                    role={role}
                    last={index === availableRoles.length - 1}
                    actionHref={`/tarification?role=${role.role}`}
                  />
                ))}
              </div>
            </Panel>

            <Panel title="Onboarding sauvegarde" eyebrow="Reponses" icon={MapPin}>
              {onboardingEntries.length > 0 ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  {onboardingEntries.map(([role, data]) => {
                    const roleMeta = ROLE_META[role as UserRole];
                    const Icon = roleMeta?.Icon ?? Sparkles;

                    return (
                      <div key={role} className="rounded-[22px] border border-outline-variant/60 bg-white/60 p-4">
                        <div className="mb-4 flex items-center gap-3">
                          <div className={cn("flex h-10 w-10 items-center justify-center rounded-2xl", toneStyles[roleMeta?.tone ?? "petrol"].icon)}>
                            <Icon size={18} aria-hidden="true" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-primary">{roleMeta?.label ?? role}</p>
                            <p className="text-xs text-on-surface-variant">Donnees de personnalisation</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {Object.entries(data).map(([key, value]) => (
                            <DetailRow key={key} compact label={key} value={valueToText(value)} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  title="Aucune reponse enregistree"
                  description="Completez l'onboarding de votre role principal pour personnaliser votre espace."
                  href={activeRoles[0]?.href}
                  cta="Continuer"
                />
              )}
            </Panel>
          </div>
        </section>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">{label}</p>
      <p className="mt-1 truncate text-sm font-bold text-primary">{value}</p>
    </div>
  );
}

function Panel({
  title,
  eyebrow,
  icon: Icon,
  action,
  children,
}: {
  title: string;
  eyebrow: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  action?: React.ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-white/50 bg-white/70 p-5 shadow-float backdrop-blur-2xl sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-teal-dark">{eyebrow}</p>
          <h2 className="mt-1 font-serif text-3xl leading-tight text-navy-dark">{title}</h2>
        </div>
        <div className="flex items-center gap-3">
          {action}
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white">
            <Icon size={19} aria-hidden="true" />
          </div>
        </div>
      </div>
      {children}
    </section>
  );
}

function DetailRow({ label, value, compact }: { label: string; value: string; compact?: boolean }) {
  return (
    <div className={cn("grid gap-2 py-3 sm:grid-cols-[150px_1fr]", compact && "py-2 sm:grid-cols-[120px_1fr]")}>
      <dt className="text-[11px] font-bold uppercase tracking-[0.1em] text-on-surface-variant">{label}</dt>
      <dd className="min-w-0 break-words text-sm font-semibold text-on-surface">{value}</dd>
    </div>
  );
}

function RoleTimelineItem({
  role,
  active,
  done,
  last,
  actionHref,
}: {
  role: RoleMeta;
  active?: boolean;
  done?: boolean;
  last?: boolean;
  actionHref?: string;
}) {
  const Icon = role.Icon;
  const tone = toneStyles[role.tone];

  return (
    <div className="grid grid-cols-[44px_1fr] gap-4">
      <div className="relative flex justify-center">
        <div className={cn("z-10 flex h-11 w-11 items-center justify-center rounded-2xl shadow-card", active ? tone.icon : "bg-surface-container text-on-surface-variant")}>
          <Icon size={19} aria-hidden="true" />
        </div>
        {!last && <div className={cn("absolute top-12 h-[calc(100%+1rem)] w-px bg-gradient-to-b", tone.line)} />}
      </div>
      <div className="pb-4">
        <div className="rounded-[22px] border border-outline-variant/60 bg-white/55 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold text-primary">{role.label}</h3>
                <span className={cn("rounded-full border px-2.5 py-1 text-[11px] font-bold", tone.chip)}>
                  {active ? "Actif" : "Disponible"}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">{role.description}</p>
              {active && (
                <p className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-on-surface-variant">
                  <span className={cn("h-2 w-2 rounded-full", done ? "bg-success" : tone.dot)} />
                  {done ? "Onboarding complete" : "Onboarding a completer"}
                </p>
              )}
            </div>
            {active && !done && (
              <Link href={role.href} className="premium-button-secondary min-h-10 shrink-0 px-4 py-2">
                Continuer
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
            )}
            {!active && actionHref && (
              <Link href={actionHref} className="premium-button-secondary min-h-10 shrink-0 px-4 py-2">
                Souscrire
                <ChevronRight size={15} aria-hidden="true" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  title,
  description,
  href,
  cta,
}: {
  title: string;
  description: string;
  href?: string;
  cta?: string;
}) {
  return (
    <div className="rounded-[22px] border border-dashed border-outline-variant bg-white/45 p-6 text-center">
      <Sparkles className="mx-auto text-teal" size={22} aria-hidden="true" />
      <h3 className="mt-4 font-serif text-2xl text-navy-dark">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-on-surface-variant">{description}</p>
      {href && cta && (
        <Link href={href} className="premium-button-secondary mt-5">
          {cta}
          <ChevronRight size={16} aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
