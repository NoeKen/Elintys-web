'use client';

import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Bell,
  Check,
  ChevronLeft,
  ChevronRight,
  KeyRound,
  MailCheck,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
} from 'lucide-react';
import { authService } from '@/features/auth/client/auth.service';
import { accountService, type PurchaseOrder } from '@/features/account/client/account.service';
import { useAuth } from '@/shared/hooks/useAuth';
import { ApiClientError, retryOnTransientError } from '@/shared/lib/api';
import { replaceDocument } from '@/shared/lib/hard-navigation';
import type { EmailNotificationPreferences, UserRole } from '@/shared/types';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import messages from '../../../../messages/fr.json';

const copy = messages.accountSettings;

const DEFAULT_PREFERENCES: EmailNotificationPreferences = {
  vendorRequestReceived: true,
  vendorResponse: true,
  venueBookingReceived: true,
  venueResponse: true,
};

const PREFERENCE_COPY: Array<{
  key: keyof EmailNotificationPreferences;
  label: string;
  description: string;
}> = [
  {
    key: 'vendorRequestReceived',
    label: copy.preferenceVendorRequest,
    description: copy.preferenceVendorRequestDescription,
  },
  {
    key: 'vendorResponse',
    label: copy.preferenceVendorResponse,
    description: copy.preferenceVendorResponseDescription,
  },
  {
    key: 'venueBookingReceived',
    label: copy.preferenceVenueRequest,
    description: copy.preferenceVenueRequestDescription,
  },
  {
    key: 'venueResponse',
    label: copy.preferenceVenueResponse,
    description: copy.preferenceVenueResponseDescription,
  },
];

const ADDABLE_ROLES: Array<{
  role: Exclude<UserRole, 'participant'>;
  label: string;
  description: string;
  onboarding: string;
  onboardingLabel: string;
}> = [
  {
    role: 'organisateur',
    label: copy.roleOrganizer,
    description: copy.roleOrganizerDescription,
    onboarding: '/onboarding/organisateur',
    onboardingLabel: copy.onboardOrganizer,
  },
  {
    role: 'prestataire',
    label: copy.roleVendor,
    description: copy.roleVendorDescription,
    onboarding: '/onboarding/prestataire',
    onboardingLabel: copy.onboardVendor,
  },
  {
    role: 'gestionnaire_salle',
    label: copy.roleVenue,
    description: copy.roleVenueDescription,
    onboarding: '/onboarding/gestionnaire',
    onboardingLabel: copy.onboardVenue,
  },
];

const ROLE_LABELS: Record<UserRole, string> = {
  organisateur: copy.roleOrganizer,
  prestataire: copy.roleVendor,
  gestionnaire_salle: copy.roleVenue,
  participant: copy.roleParticipant,
};

const STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: copy.statusPending,
  PAID: copy.statusPaid,
  FAILED: copy.statusFailed,
  EXPIRED: copy.statusExpired,
  CANCELLED: copy.statusCancelled,
};

function errorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    if (error.status === 400) return copy.errorValidation;
    if (error.status === 401) return copy.errorSession;
    if (error.status === 403) return copy.errorForbidden;
    if (error.status === 409) return copy.errorConflict;
    if (error.status === 429) return copy.errorRateLimit;
    if (error.status >= 500) return copy.errorServer;
  }
  return copy.errorNetwork;
}

function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat('fr-CA', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return copy.dateUnavailable;
  return date.toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' });
}

function Section({
  id,
  icon,
  title,
  description,
  children,
}: {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-6 rounded-[28px] bg-white/75 p-5 shadow-card backdrop-blur-xl sm:p-7">
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-pale text-teal-dark" aria-hidden="true">
          {icon}
        </span>
        <div>
          <h2 id={`${id}-title`} className="font-serif text-2xl text-navy-dark">{title}</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-on-surface-variant">{description}</p>
        </div>
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Feedback({ type, children }: { type: 'success' | 'error'; children: React.ReactNode }) {
  return (
    <p
      role={type === 'error' ? 'alert' : 'status'}
      className={`mt-4 rounded-2xl px-4 py-3 text-sm font-medium ${
        type === 'error' ? 'bg-destructive/10 text-destructive' : 'bg-sage-pale text-sage-dark'
      }`}
    >
      {children}
    </p>
  );
}

function PurchaseCard({ order }: { order: PurchaseOrder }) {
  const quantity = order.lines.reduce((sum, line) => sum + line.quantity, 0);
  const content = order.eventSummary ? (
    <Link href={`/evenements/${order.eventSummary.slug}`} className="font-semibold text-navy-dark underline-offset-4 hover:text-teal-dark hover:underline">
      {order.eventSummary.title}
    </Link>
  ) : (
    <p className="font-semibold text-navy-dark">{copy.eventUnavailable}</p>
  );

  return (
    <article className="rounded-2xl bg-surface-lowest p-4 shadow-soft-line" role="listitem">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          {content}
          <p className="mt-1 text-xs text-on-surface-variant">
            {copy.purchaseReference
              .replace('{reference}', order._id.slice(-8).toUpperCase())
              .replace('{date}', formatDate(order.createdAt))}
          </p>
        </div>
        <span className="rounded-full bg-teal-pale px-3 py-1 text-xs font-bold text-teal-dark">
          {STATUS_LABELS[order.status] ?? order.status}
        </span>
      </div>
      <div className="mt-4 flex flex-wrap justify-between gap-2 text-sm">
        <span className="text-on-surface-variant">{copy.ticketCount.replace('{count}', String(quantity))}</span>
        <strong className="text-navy-dark">{formatMoney(order.totalAmount, order.currency)}</strong>
      </div>
    </article>
  );
}

export function AccountSettings() {
  const { user, isLoading, login, clearSession } = useAuth();
  const [preferencesOverride, setPreferencesOverride] = useState<EmailNotificationPreferences | null>(null);
  const [profileState, setProfileState] = useState<{ pending: boolean; message?: string; error?: string }>({ pending: false });
  const [passwordState, setPasswordState] = useState<{ pending: boolean; message?: string; error?: string }>({ pending: false });
  const [preferencesState, setPreferencesState] = useState<{ pending: boolean; message?: string; error?: string }>({ pending: false });
  const [roleState, setRoleState] = useState<{ pending?: UserRole; added?: UserRole; error?: string }>({});
  const [verificationState, setVerificationState] = useState<{ pending: boolean; message?: string; error?: string }>({ pending: false });
  const [purchasePage, setPurchasePage] = useState(1);

  const preferences = preferencesOverride ?? {
    ...DEFAULT_PREFERENCES,
    ...(user?.emailNotifications ?? {}),
  };

  const purchases = useQuery({
    queryKey: ['account-purchases', purchasePage],
    queryFn: () => accountService.getPurchases({ page: purchasePage, limit: 10 }),
    enabled: Boolean(user),
    staleTime: 30_000,
    retry: retryOnTransientError,
  });

  const totalPurchasePages = useMemo(
    () => Math.max(1, Math.ceil((purchases.data?.total ?? 0) / (purchases.data?.limit ?? 10))),
    [purchases.data],
  );

  if (isLoading) {
    return <div className="mx-auto h-96 max-w-5xl animate-pulse rounded-[28px] bg-white/60 shadow-card" aria-label={copy.loading} />;
  }

  if (!user) return null;

  async function submitProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const profile = {
      firstName: String(form.get('firstName') ?? ''),
      lastName: String(form.get('lastName') ?? ''),
    };
    setProfileState({ pending: true });
    try {
      const session = await authService.updateProfile(profile);
      login(session);
      setProfileState({ pending: false, message: copy.profileSaved });
    } catch (error) {
      setProfileState({ pending: false, error: errorMessage(error) });
      document.getElementById('firstName')?.focus();
    }
  }

  async function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const currentPassword = String(form.get('currentPassword') ?? '');
    const newPassword = String(form.get('newPassword') ?? '');
    const confirmation = String(form.get('confirmation') ?? '');
    if (newPassword !== confirmation) {
      setPasswordState({ pending: false, error: copy.passwordMismatch });
      document.getElementById('confirmation')?.focus();
      return;
    }
    setPasswordState({ pending: true });
    try {
      await authService.changePassword(currentPassword, newPassword);
      // Le serveur a déjà révoqué les refresh tokens et effacé les cookies.
      // Oublier la session dans le même tour évite une course avec ProtectedRoute.
      clearSession();
      setPasswordState({ pending: false, message: copy.passwordChanged });
      replaceDocument('/connexion?reason=password_changed');
    } catch (error) {
      setPasswordState({ pending: false, error: errorMessage(error) });
      document.getElementById('currentPassword')?.focus();
    }
  }

  async function submitPreferences(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPreferencesState({ pending: true });
    try {
      const session = await authService.updateNotificationPreferences(preferences);
      login(session);
      setPreferencesOverride({ ...DEFAULT_PREFERENCES, ...(session.user.emailNotifications ?? {}) });
      setPreferencesState({ pending: false, message: copy.preferencesSaved });
    } catch (error) {
      setPreferencesState({ pending: false, error: errorMessage(error) });
    }
  }

  async function addRole(role: Exclude<UserRole, 'participant'>) {
    setRoleState({ pending: role });
    try {
      const session = await authService.addRole(role);
      login(session);
      setRoleState({ added: role });
    } catch (error) {
      setRoleState({ error: errorMessage(error) });
    }
  }

  async function resendVerification() {
    setVerificationState({ pending: true });
    try {
      await authService.resendMyVerification();
      setVerificationState({ pending: false, message: copy.verificationSent });
    } catch (error) {
      setVerificationState({ pending: false, error: errorMessage(error) });
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      <header className="relative overflow-hidden rounded-[32px] bg-[linear-gradient(135deg,rgba(30,61,79,0.96),rgba(32,94,105,0.9))] px-5 py-8 text-white shadow-float sm:px-8 sm:py-10">
        <div className="absolute -right-12 -top-20 h-56 w-56 rounded-full bg-teal/30 blur-3xl" aria-hidden="true" />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em]">
            <Sparkles size={14} aria-hidden="true" /> {copy.eyebrow}
          </span>
          <h1 className="mt-5 font-serif text-4xl leading-tight sm:text-5xl">{copy.pageTitle}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75 sm:text-base">
            {copy.pageDescription}
          </p>
        </div>
      </header>

      <nav aria-label={copy.sectionsNav} className="flex gap-2 overflow-x-auto rounded-2xl bg-white/65 p-2 shadow-soft-line">
        {[
          ['profil', copy.profile], ['securite', copy.security], ['notifications', copy.notifications],
          ['roles', copy.roles], ['achats', copy.purchases],
        ].map(([href, label]) => (
          <a key={href} href={`#${href}`} className="flex min-h-11 shrink-0 items-center rounded-xl px-4 text-sm font-semibold text-on-surface-variant hover:bg-white hover:text-primary focus-visible:outline-2 focus-visible:outline-accent">
            {label}
          </a>
        ))}
      </nav>

      {!user.isEmailVerified && (
        <aside className="rounded-[24px] bg-terracotta-pale p-5 shadow-card" aria-labelledby="verify-title">
          <div className="flex items-start gap-4">
            <MailCheck className="mt-0.5 shrink-0 text-terracotta-dark" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <h2 id="verify-title" className="font-semibold text-navy-dark">{copy.verifyTitle}</h2>
              <p className="mt-1 text-sm leading-6 text-on-surface-variant">{copy.verifyDescription}</p>
              <Button type="button" variant="secondary" className="mt-4 min-h-11" loading={verificationState.pending} onClick={() => void resendVerification()}>
                {copy.resend}
              </Button>
              {verificationState.message && <Feedback type="success">{verificationState.message}</Feedback>}
              {verificationState.error && <Feedback type="error">{verificationState.error}</Feedback>}
            </div>
          </div>
        </aside>
      )}

      <Section id="profil" icon={<UserRound size={20} />} title={copy.profile} description={copy.profileDescription}>
        <form onSubmit={(event) => void submitProfile(event)} className="grid gap-4 sm:grid-cols-2">
          <Input id="firstName" name="firstName" label={copy.firstName} defaultValue={user.firstName} minLength={1} maxLength={50} required aria-invalid={Boolean(profileState.error)} aria-describedby={profileState.error ? 'profile-feedback' : undefined} />
          <Input id="lastName" name="lastName" label={copy.lastName} defaultValue={user.lastName} minLength={1} maxLength={50} required aria-invalid={Boolean(profileState.error)} aria-describedby={profileState.error ? 'profile-feedback' : undefined} />
          <div className="sm:col-span-2">
            <p className="mb-4 text-sm text-on-surface-variant">{copy.currentEmail} <strong className="text-on-surface">{user.email}</strong></p>
            <Button type="submit" className="min-h-11" loading={profileState.pending}>{copy.saveProfile}</Button>
            {profileState.message && <Feedback type="success">{profileState.message}</Feedback>}
            {profileState.error && <div id="profile-feedback"><Feedback type="error">{profileState.error}</Feedback></div>}
          </div>
        </form>
      </Section>

      <Section id="securite" icon={<ShieldCheck size={20} />} title={copy.security} description={copy.securityDescription}>
        <form onSubmit={(event) => void submitPassword(event)} className="grid gap-4 sm:grid-cols-2">
          <Input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" label={copy.currentPassword} minLength={8} maxLength={72} required className="min-h-11" aria-invalid={Boolean(passwordState.error)} aria-describedby={passwordState.error ? 'password-feedback' : undefined} />
          <div className="hidden sm:block" aria-hidden="true" />
          <Input id="newPassword" name="newPassword" type="password" autoComplete="new-password" label={copy.newPassword} minLength={8} maxLength={72} required className="min-h-11" aria-invalid={Boolean(passwordState.error)} aria-describedby={passwordState.error ? 'password-feedback' : undefined} />
          <Input id="confirmation" name="confirmation" type="password" autoComplete="new-password" label={copy.confirmPassword} minLength={8} maxLength={72} required className="min-h-11" aria-invalid={Boolean(passwordState.error)} aria-describedby={passwordState.error ? 'password-feedback' : undefined} />
          <div className="sm:col-span-2">
            <Button type="submit" className="min-h-11" loading={passwordState.pending} icon={<KeyRound size={16} />}>{copy.changePassword}</Button>
            {passwordState.message && <Feedback type="success">{passwordState.message}</Feedback>}
            {passwordState.error && <div id="password-feedback"><Feedback type="error">{passwordState.error}</Feedback></div>}
          </div>
        </form>
      </Section>

      <Section id="notifications" icon={<Bell size={20} />} title={copy.emailNotificationsTitle} description={copy.emailNotificationsDescription}>
        <form onSubmit={(event) => void submitPreferences(event)}>
          <div className="space-y-2">
            {PREFERENCE_COPY.map((item) => (
              <label key={item.key} className="flex min-h-14 cursor-pointer items-center gap-4 rounded-2xl bg-surface-lowest px-4 py-3 shadow-soft-line">
                <input type="checkbox" className="h-5 w-5 shrink-0 accent-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent" checked={preferences[item.key]} onChange={(event) => setPreferencesOverride({ ...preferences, [item.key]: event.target.checked })} />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-on-surface">{item.label}</span>
                  <span className="mt-0.5 block text-xs leading-5 text-on-surface-variant">{item.description}</span>
                </span>
              </label>
            ))}
          </div>
          <Button type="submit" className="mt-5 min-h-11" loading={preferencesState.pending}>{copy.savePreferences}</Button>
          {preferencesState.message && <Feedback type="success">{preferencesState.message}</Feedback>}
          {preferencesState.error && <Feedback type="error">{preferencesState.error}</Feedback>}
        </form>
      </Section>

      <Section id="roles" icon={<UsersRound size={20} />} title={copy.roles} description={copy.rolesDescription}>
        <div className="flex flex-wrap gap-2" aria-label={copy.activeRoles}>
          {user.roles.map((role) => <span key={role} className="inline-flex items-center gap-1.5 rounded-full bg-sage-pale px-3 py-1.5 text-xs font-bold text-sage-dark"><Check size={14} aria-hidden="true" />{ROLE_LABELS[role]}</span>)}
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ADDABLE_ROLES.filter((item) => !user.roles.includes(item.role)).map((item) => (
            <article key={item.role} className="rounded-2xl bg-surface-lowest p-4 shadow-soft-line">
              <h3 className="font-semibold text-navy-dark">{item.label}</h3>
              <p className="mt-1 min-h-10 text-xs leading-5 text-on-surface-variant">{item.description}</p>
              <Button type="button" variant="secondary" className="mt-4 min-h-11 w-full" loading={roleState.pending === item.role} disabled={Boolean(roleState.pending)} onClick={() => void addRole(item.role)}>
                {copy.addRole.replace('{role}', item.label)}
              </Button>
            </article>
          ))}
        </div>
        {roleState.added && (() => {
          const added = ADDABLE_ROLES.find((item) => item.role === roleState.added);
          return added ? <Feedback type="success">{copy.roleAdded} <Link href={added.onboarding} className="font-bold underline">{added.onboardingLabel}</Link></Feedback> : null;
        })()}
        {roleState.error && <Feedback type="error">{roleState.error}</Feedback>}
      </Section>

      <Section id="achats" icon={<ReceiptText size={20} />} title={copy.purchaseHistory} description={copy.purchaseDescription}>
        {purchases.isLoading && <div className="space-y-3" aria-label={copy.purchasesLoading} aria-busy="true">{[1, 2].map((item) => <div key={item} className="h-28 animate-pulse rounded-2xl bg-surface-lowest" />)}</div>}
        {purchases.isError && <div><Feedback type="error">{errorMessage(purchases.error)}</Feedback><Button type="button" variant="secondary" className="mt-3 min-h-11" onClick={() => void purchases.refetch()}>{copy.retry}</Button></div>}
        {!purchases.isLoading && !purchases.isError && (purchases.data?.data.length ?? 0) === 0 && <div className="rounded-2xl bg-surface-lowest p-6 text-center shadow-soft-line"><ReceiptText className="mx-auto text-on-surface-variant" aria-hidden="true" /><p className="mt-3 font-semibold text-navy-dark">{copy.noPurchases}</p><p className="mt-1 text-sm text-on-surface-variant">{copy.noPurchasesDescription}</p><Link href="/billetterie" className="mt-4 inline-flex min-h-11 items-center text-sm font-bold text-teal-dark underline">{copy.viewTickets}</Link></div>}
        {purchases.data?.data.length ? <div className="space-y-3" role="list" aria-label={copy.purchaseList}>{purchases.data.data.map((order) => <PurchaseCard key={order._id} order={order} />)}</div> : null}
        {totalPurchasePages > 1 && <div className="mt-5 flex items-center justify-between"><Button type="button" variant="secondary" className="min-h-11" disabled={purchasePage <= 1} onClick={() => setPurchasePage((page) => page - 1)} icon={<ChevronLeft size={16} />}>{copy.previous}</Button><span className="text-xs font-semibold text-on-surface-variant">{copy.pageCount.replace('{page}', String(purchasePage)).replace('{total}', String(totalPurchasePages))}</span><Button type="button" variant="secondary" className="min-h-11" disabled={purchasePage >= totalPurchasePages} onClick={() => setPurchasePage((page) => page + 1)} icon={<ChevronRight size={16} />} iconPosition="right">{copy.next}</Button></div>}
      </Section>
    </div>
  );
}
