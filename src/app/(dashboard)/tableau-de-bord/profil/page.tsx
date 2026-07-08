'use client';

import Link from 'next/link';
import {
  BadgeCheck,
  Building2,
  Calendar,
  ChevronRight,
  Clock3,
  Crown,
  Mail,
  ShieldCheck,
  Sparkles,
  Star,
  UserRound,
  WalletCards,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { useAuth } from '@/shared/hooks/useAuth';
import { Avatar } from '@/shared/ui/Avatar';
import type { User, UserRole } from '@/shared/types';
import { cn, formatDate, getInitials } from '@/shared/lib/utils';

type RoleTone = 'teal' | 'gold' | 'terracotta' | 'sage';

interface RoleDisplay {
  role: UserRole;
  label: string;
  description: string;
  Icon: ComponentType<{ size?: number; className?: string }>;
  tone: RoleTone;
  onboardingHref?: string;
}

const ROLE_DISPLAY: Record<UserRole, RoleDisplay> = {
  organisateur: {
    role: 'organisateur',
    label: 'Organisateur',
    description: 'Creation, publication et pilotage des evenements.',
    Icon: Calendar,
    tone: 'teal',
    onboardingHref: '/onboarding/organisateur',
  },
  prestataire: {
    role: 'prestataire',
    label: 'Prestataire',
    description: 'Services, demandes qualifiees et fiche publique.',
    Icon: Star,
    tone: 'gold',
    onboardingHref: '/onboarding/prestataire',
  },
  gestionnaire_salle: {
    role: 'gestionnaire_salle',
    label: 'Gestionnaire de lieu',
    description: 'Fiche lieu, reservations et calendrier.',
    Icon: Building2,
    tone: 'terracotta',
    onboardingHref: '/onboarding/gestionnaire',
  },
  participant: {
    role: 'participant',
    label: 'Participant',
    description: 'Billets, favoris et experiences reservees.',
    Icon: UserRound,
    tone: 'sage',
  },
};

const SUBSCRIBABLE_ROLES: UserRole[] = ['organisateur', 'prestataire', 'gestionnaire_salle'];

const toneClasses: Record<RoleTone, { badge: string; icon: string; ring: string }> = {
  teal: {
    badge: 'bg-teal-pale text-teal-dark border-teal/20',
    icon: 'bg-teal-pale text-teal',
    ring: 'shadow-[inset_0_0_0_1px_rgba(74,142,158,0.16)]',
  },
  gold: {
    badge: 'bg-gold-pale text-gold-dark border-gold/20',
    icon: 'bg-gold-pale text-gold-dark',
    ring: 'shadow-[inset_0_0_0_1px_rgba(196,165,88,0.18)]',
  },
  terracotta: {
    badge: 'bg-terracotta-pale text-terracotta-dark border-terracotta/20',
    icon: 'bg-terracotta-pale text-terracotta',
    ring: 'shadow-[inset_0_0_0_1px_rgba(212,132,74,0.16)]',
  },
  sage: {
    badge: 'bg-sage-pale text-sage-dark border-sage/20',
    icon: 'bg-sage-pale text-sage',
    ring: 'shadow-[inset_0_0_0_1px_rgba(110,127,88,0.16)]',
  },
};

function formatBoolean(value: boolean): string {
  return value ? 'Oui' : 'Non';
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(value);
}

function formatSafeDate(value: string): string {
  if (!value) return 'Non disponible';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Non disponible';
  return formatDate(date, 'long');
}

function getFullName(user: User): string {
  return [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.email;
}

function getOnboardingCount(user: User): number {
  return Object.values(user.onboardingByRole ?? {}).filter(Boolean).length;
}

function getOnboardingLabel(user: User, role: UserRole): string {
  return user.onboardingByRole?.[role] ? 'Onboarding complete' : 'Onboarding a completer';
}

function stringifyValue(value: string | string[] | number): string {
  return Array.isArray(value) ? value.join(', ') : String(value);
}

export default function UserProfilePage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="premium-card h-64 animate-pulse p-6" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center sm:px-6">
        <div className="premium-card p-8">
          <h1 className="font-serif text-3xl text-navy-dark">Session introuvable</h1>
          <p className="mt-3 text-sm text-on-surface-variant">
            Reconnectez-vous pour consulter votre profil.
          </p>
          <Link href="/connexion" className="premium-button mt-6">
            Se connecter
          </Link>
        </div>
      </div>
    );
  }

  const fullName = getFullName(user);
  const activeRoles = user.roles.map((role) => ROLE_DISPLAY[role]).filter(Boolean);
  const availableRoles = SUBSCRIBABLE_ROLES
    .filter((role) => !user.roles.includes(role))
    .map((role) => ROLE_DISPLAY[role]);
  const onboardingCount = getOnboardingCount(user);
  const hasOnboardingData = Object.keys(user.onboardingData ?? {}).length > 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <section className="glass-card overflow-hidden">
        <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1fr_320px]">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <Avatar
              src={user.avatarUrl}
              fallback={getInitials(fullName)}
              alt={fullName}
              size="lg"
              className="h-20 w-20 text-xl shadow-card"
            />
            <div className="min-w-0">
              <p className="section-eyebrow mb-3">Profil utilisateur</p>
              <h1 className="font-serif text-[clamp(32px,5vw,52px)] leading-none text-navy-dark">
                {fullName}
              </h1>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-on-surface-variant">
                <span className="inline-flex items-center gap-2 rounded-full border border-outline-variant bg-white/70 px-3 py-1.5">
                  <Mail size={14} aria-hidden="true" />
                  {user.email}
                </span>
                <span
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-semibold',
                    user.isEmailVerified
                      ? 'border-success/20 bg-sage-pale text-sage-dark'
                      : 'border-gold/20 bg-gold-pale text-gold-dark',
                  )}
                >
                  <ShieldCheck size={14} aria-hidden="true" />
                  {user.isEmailVerified ? 'Courriel verifie' : 'Courriel a verifier'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <MetricCard icon={Crown} label="Roles actifs" value={String(user.roles.length)} />
            <MetricCard icon={Sparkles} label="Onboarding" value={`${onboardingCount}/${user.roles.length}`} />
            <MetricCard icon={WalletCards} label="Abonnements" value={String(user.subscriptions.length)} />
            <MetricCard icon={BadgeCheck} label="Reference" value={formatCurrency(user.referralBalance)} />
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
        <section className="premium-card p-5 sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="font-serif text-2xl text-navy-dark">Informations du compte</h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                Donnees rattachees a votre session Elintys.
              </p>
            </div>
            <div className="rounded-2xl bg-teal-pale p-3 text-teal">
              <UserRound size={20} aria-hidden="true" />
            </div>
          </div>

          <dl className="grid gap-3 sm:grid-cols-2">
            <InfoItem label="Identifiant utilisateur" value={user.id || 'Non disponible'} />
            <InfoItem label="Adresse courriel" value={user.email} />
            <InfoItem label="Courriel verifie" value={formatBoolean(user.isEmailVerified)} />
            <InfoItem label="Onboarding global" value={user.onboardingCompleted ? 'Complete' : 'A completer'} />
            <InfoItem label="Compte cree le" value={formatSafeDate(user.createdAt)} />
            <InfoItem label="Derniere mise a jour" value={formatSafeDate(user.updatedAt)} />
          </dl>
        </section>

        <section className="premium-card p-5 sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="font-serif text-2xl text-navy-dark">Roles et acces</h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                Vos espaces actifs et les roles que vous pourrez ajouter.
              </p>
            </div>
            <div className="rounded-2xl bg-gold-pale p-3 text-gold-dark">
              <Crown size={20} aria-hidden="true" />
            </div>
          </div>

          <div className="space-y-3">
            {activeRoles.map((role) => (
              <RoleCard
                key={role.role}
                role={role}
                status={getOnboardingLabel(user, role.role)}
                active
              />
            ))}
          </div>

          {availableRoles.length > 0 && (
            <div className="mt-6 border-t border-outline-variant/70 pt-5">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-on-surface-variant">
                Roles disponibles
              </p>
              <div className="space-y-3">
                {availableRoles.map((role) => (
                  <RoleCard
                    key={role.role}
                    role={role}
                    status="Souscription depuis le profil"
                    actionHref={`/tarification?role=${role.role}`}
                  />
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="premium-card p-5 sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="font-serif text-2xl text-navy-dark">Onboarding sauvegarde</h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                Reponses conservees par role dans votre profil.
              </p>
            </div>
            <div className="rounded-2xl bg-terracotta-pale p-3 text-terracotta">
              <Sparkles size={20} aria-hidden="true" />
            </div>
          </div>

          {hasOnboardingData ? (
            <div className="space-y-4">
              {Object.entries(user.onboardingData).map(([role, data]) => (
                <div key={role} className="rounded-2xl border border-outline-variant/70 bg-white/65 p-4">
                  <h3 className="text-sm font-bold text-navy-dark">
                    {ROLE_DISPLAY[role as UserRole]?.label ?? role}
                  </h3>
                  <dl className="mt-3 grid gap-2">
                    {Object.entries(data).map(([key, value]) => (
                      <div key={key} className="grid gap-1 sm:grid-cols-[150px_1fr]">
                        <dt className="text-xs font-bold uppercase tracking-[0.08em] text-on-surface-variant">
                          {key}
                        </dt>
                        <dd className="break-words text-sm text-on-surface">{stringifyValue(value)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          ) : (
            <EmptyPanel
              title="Aucune reponse sauvegardee"
              description="Completez l'onboarding de votre role principal pour preconfigurer votre espace."
              href={activeRoles[0]?.onboardingHref}
            />
          )}
        </section>

        <section className="premium-card p-5 sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="font-serif text-2xl text-navy-dark">Abonnements</h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                Etats de souscription associes a votre compte.
              </p>
            </div>
            <div className="rounded-2xl bg-sage-pale p-3 text-sage">
              <WalletCards size={20} aria-hidden="true" />
            </div>
          </div>

          {user.subscriptions.length > 0 ? (
            <div className="space-y-3">
              {user.subscriptions.map((subscription, index) => (
                <div key={index} className="rounded-2xl border border-outline-variant/70 bg-white/65 p-4">
                  <p className="text-sm font-bold text-navy-dark">Abonnement {index + 1}</p>
                  <dl className="mt-3 grid gap-2">
                    {Object.entries(subscription).map(([key, value]) => (
                      <div key={key} className="grid gap-1 sm:grid-cols-[140px_1fr]">
                        <dt className="text-xs font-bold uppercase tracking-[0.08em] text-on-surface-variant">
                          {key}
                        </dt>
                        <dd className="break-words text-sm text-on-surface">
                          {typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
                            ? String(value)
                            : 'Donnee structuree'}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          ) : (
            <EmptyPanel
              title="Aucun abonnement actif"
              description="Les prochains roles ou forfaits souscrits apparaitront ici."
              href="/tarification"
            />
          )}
        </section>
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-outline-variant/70 bg-white/68 p-4 shadow-card">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-teal-pale text-teal">
        <Icon size={17} aria-hidden="true" />
      </div>
      <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-on-surface-variant">{label}</p>
      <p className="mt-1 text-xl font-bold text-navy-dark">{value}</p>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-outline-variant/70 bg-white/65 p-4">
      <dt className="text-[11px] font-bold uppercase tracking-[0.1em] text-on-surface-variant">{label}</dt>
      <dd className="mt-2 break-words text-sm font-semibold text-on-surface">{value}</dd>
    </div>
  );
}

function RoleCard({
  role,
  status,
  active,
  actionHref,
}: {
  role: RoleDisplay;
  status: string;
  active?: boolean;
  actionHref?: string;
}) {
  const tone = toneClasses[role.tone];
  const Icon = role.Icon;

  return (
    <div className={cn('rounded-2xl border border-outline-variant/70 bg-white/65 p-4', tone.ring)}>
      <div className="flex items-start gap-3">
        <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl', tone.icon)}>
          <Icon size={20} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-bold text-navy-dark">{role.label}</h3>
            <span className={cn('rounded-full border px-2.5 py-1 text-[11px] font-bold', tone.badge)}>
              {active ? 'Actif' : 'Disponible'}
            </span>
          </div>
          <p className="mt-1 text-sm leading-6 text-on-surface-variant">{role.description}</p>
          <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-on-surface-variant">
            <Clock3 size={13} aria-hidden="true" />
            {status}
          </p>
        </div>
        {actionHref && (
          <Link
            href={actionHref}
            className="premium-icon-button h-9 w-9 shrink-0"
            aria-label={`Souscrire au role ${role.label}`}
            title={`Souscrire au role ${role.label}`}
          >
            <ChevronRight size={16} aria-hidden="true" />
          </Link>
        )}
      </div>
    </div>
  );
}

function EmptyPanel({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href?: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-outline-variant bg-white/55 p-6 text-center">
      <h3 className="font-serif text-2xl text-navy-dark">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-on-surface-variant">{description}</p>
      {href && (
        <Link href={href} className="premium-button-secondary mt-5">
          Continuer
          <ChevronRight size={16} aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
