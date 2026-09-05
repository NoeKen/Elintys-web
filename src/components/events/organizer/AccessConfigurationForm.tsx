'use client';

import { useMemo } from 'react';
import { useForm, useWatch, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Check, Loader2 } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { FormErrorAlert } from '@/shared/ui/FormErrorAlert';
import { getUserFacingError } from '@/shared/lib/user-facing-error';
import { organizerEventCopy as copy } from '@/features/events/i18n/organizer-event.copy';
import type {
  AdmissionMode,
  EventAccessPolicy,
  EventAccessPolicyType,
  EventDiscoverability,
} from '@/features/events/types';
import type { UpdateEventAccessConfigurationInput } from '@/features/events/services/events.service';

const DISCOVERABILITIES: readonly EventDiscoverability[] = ['public', 'unlisted', 'private'];
const POLICY_TYPES: readonly EventAccessPolicyType[] = [
  'open',
  'registration_required',
  'access_code',
  'email_domain',
  'manual_approval',
  'guest_list',
  'invitation_token',
];
const ADMISSION_MODES: readonly AdmissionMode[] = [
  'free',
  'registration_only',
  'free_ticket',
  'paid_ticket',
  'invitation',
];

/** Politiques dont le serveur accepte `requiresAuthentication`. */
const AUTH_AWARE_POLICIES: readonly EventAccessPolicyType[] = [
  'registration_required',
  'email_domain',
  'manual_approval',
  'guest_list',
];

const DISCOVERABILITY_LABELS: Record<EventDiscoverability, string> = {
  public: copy.access.publicVisibility,
  unlisted: copy.access.unlistedVisibility,
  private: copy.access.privateVisibility,
};

const DISCOVERABILITY_HINTS: Record<EventDiscoverability, string> = {
  public: copy.workspace.informationPublicDesc,
  unlisted: copy.workspace.informationUnlistedDesc,
  private: copy.workspace.informationPrivateDesc,
};

const POLICY_LABELS: Record<EventAccessPolicyType, string> = {
  open: copy.access.openAccess,
  registration_required: copy.access.registrationAccess,
  access_code: copy.access.codeAccess,
  email_domain: copy.access.domainAccess,
  manual_approval: copy.access.approvalAccess,
  guest_list: copy.access.guestListAccess,
  invitation_token: copy.access.inviteOnlyAccess,
};

const ADMISSION_LABELS: Record<AdmissionMode, string> = {
  free: copy.access.freeAdmission,
  registration_only: copy.access.registrationAdmission,
  free_ticket: copy.access.freeTicketAdmission,
  paid_ticket: copy.access.paidTicketAdmission,
  invitation: copy.access.invitationAdmission,
};

/** Découpe une saisie « a.ca, @b.qc.ca » en domaines normalisés. */
export function parseDomains(raw: string): string[] {
  return [
    ...new Set(
      raw
        .split(/[,\s;]+/)
        .map((domain) => domain.trim().toLowerCase().replace(/^@/, ''))
        .filter(Boolean),
    ),
  ];
}

const DOMAIN_PATTERN = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/;

/**
 * Miroir client de `validateEventAccessConfiguration` (Elintys-api).
 * Le serveur reste la source de vérité ; ce schéma évite un aller-retour 400.
 */
const accessConfigurationSchema = z
  .object({
    discoverability: z.enum(['public', 'unlisted', 'private']),
    policyType: z.enum([
      'open',
      'registration_required',
      'access_code',
      'email_domain',
      'manual_approval',
      'guest_list',
      'invitation_token',
    ]),
    requiresAuthentication: z.boolean(),
    accessCode: z.string(),
    hasExistingCode: z.boolean(),
    allowedDomains: z.string(),
    admissionModes: z.array(z.enum(['free', 'registration_only', 'free_ticket', 'paid_ticket', 'invitation'])),
  })
  .superRefine((values, ctx) => {
    if (values.admissionModes.length === 0) {
      ctx.addIssue({ code: 'custom', path: ['admissionModes'], message: copy.access.admissionRequired });
    }
    if (values.discoverability === 'private' && values.policyType === 'open') {
      ctx.addIssue({ code: 'custom', path: ['policyType'], message: copy.access.privateOpenForbidden });
    }
    if (values.policyType === 'invitation_token' && !values.admissionModes.includes('invitation')) {
      ctx.addIssue({ code: 'custom', path: ['admissionModes'], message: copy.access.invitationModeRequired });
    }
    if (values.policyType === 'access_code' && !values.hasExistingCode && values.accessCode.trim().length < 6) {
      ctx.addIssue({ code: 'custom', path: ['accessCode'], message: copy.access.accessCodeRequired });
    }
    if (values.policyType === 'access_code' && values.accessCode.trim() && values.accessCode.trim().length < 6) {
      ctx.addIssue({ code: 'custom', path: ['accessCode'], message: copy.access.accessCodeRequired });
    }
    if (values.policyType === 'email_domain') {
      const domains = parseDomains(values.allowedDomains);
      if (domains.length === 0 || domains.some((domain) => !DOMAIN_PATTERN.test(domain))) {
        ctx.addIssue({ code: 'custom', path: ['allowedDomains'], message: copy.access.domainsRequired });
      }
    }
  });

export type AccessConfigurationFormValues = z.infer<typeof accessConfigurationSchema>;

/** Reconstruit le payload d'union discriminée attendu par le serveur. */
export function toAccessConfigurationPayload(
  values: AccessConfigurationFormValues,
): UpdateEventAccessConfigurationInput {
  const code = values.accessCode.trim();
  const requiresAuthentication = AUTH_AWARE_POLICIES.includes(values.policyType)
    ? values.requiresAuthentication
    : undefined;

  let accessPolicy: EventAccessPolicy;
  switch (values.policyType) {
    case 'access_code':
      accessPolicy = { type: 'access_code', ...(code ? { code } : {}) };
      break;
    case 'email_domain':
      accessPolicy = {
        type: 'email_domain',
        allowedDomains: parseDomains(values.allowedDomains),
        ...(requiresAuthentication === undefined ? {} : { requiresAuthentication }),
      };
      break;
    case 'open':
    case 'invitation_token':
      accessPolicy = { type: values.policyType };
      break;
    default:
      accessPolicy = {
        type: values.policyType,
        ...(requiresAuthentication === undefined ? {} : { requiresAuthentication }),
      };
  }

  return {
    discoverability: values.discoverability,
    accessPolicy,
    admissionModes: values.admissionModes,
  };
}

interface AccessConfigurationFormProps {
  discoverability?: EventDiscoverability;
  accessPolicy?: EventAccessPolicy;
  admissionModes?: AdmissionMode[];
  isSaving: boolean;
  isSaved: boolean;
  saveError: unknown;
  onSubmit: (payload: UpdateEventAccessConfigurationInput) => void;
  onCancel: () => void;
}

export function AccessConfigurationForm({
  discoverability,
  accessPolicy,
  admissionModes,
  isSaving,
  isSaved,
  saveError,
  onSubmit,
  onCancel,
}: AccessConfigurationFormProps) {
  const defaultValues = useMemo<AccessConfigurationFormValues>(() => {
    const policy = accessPolicy ?? { type: 'open' as const };
    const withAuth = policy as { requiresAuthentication?: boolean };
    const withDomains = policy as { allowedDomains?: string[] };
    const withCode = policy as { hasAccessCode?: boolean };
    return {
      discoverability: discoverability ?? 'public',
      policyType: policy.type,
      requiresAuthentication: withAuth.requiresAuthentication ?? false,
      accessCode: '',
      hasExistingCode: policy.type === 'access_code' && withCode.hasAccessCode === true,
      allowedDomains: (withDomains.allowedDomains ?? []).join(', '),
      admissionModes: admissionModes?.length ? admissionModes : ['registration_only'],
    };
  }, [discoverability, accessPolicy, admissionModes]);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AccessConfigurationFormValues>({
    resolver: zodResolver(accessConfigurationSchema),
    defaultValues,
  });

  const policyType = useWatch({ control, name: 'policyType' });
  const selectedModes = useWatch({ control, name: 'admissionModes' });
  const hasExistingCode = defaultValues.hasExistingCode;

  return (
    <form
      onSubmit={handleSubmit((values) => onSubmit(toAccessConfigurationPayload(values)))}
      className="mt-6 space-y-7 rounded-3xl bg-white p-6 shadow-event-soft lg:p-8"
    >
      <div>
        <h2 className="font-serif text-3xl text-event-petrol">{copy.access.editTitle}</h2>
        <p className="mt-2 text-sm leading-6 text-event-muted">{copy.access.editDescription}</p>
      </div>

      <fieldset className="space-y-3">
        <legend className="section-eyebrow mb-3">{copy.access.visibilityLegend}</legend>
        <div className="grid gap-3 md:grid-cols-3">
          {DISCOVERABILITIES.map((value) => (
            <label
              key={value}
              className="flex cursor-pointer gap-3 rounded-2xl border border-event-outline-subtle/45 p-4 transition-colors has-[:checked]:border-event-teal has-[:checked]:bg-teal-pale"
            >
              <input
                type="radio"
                value={value}
                {...register('discoverability')}
                className="mt-1 h-4 w-4 shrink-0 accent-event-teal"
              />
              <span className="min-w-0">
                <span className="block font-bold text-event-petrol">{DISCOVERABILITY_LABELS[value]}</span>
                <span className="mt-1 block text-sm leading-5 text-event-muted">
                  {DISCOVERABILITY_HINTS[value]}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset
        className="space-y-3"
        aria-describedby={errors.policyType ? 'access-policy-error' : undefined}
      >
        <legend className="section-eyebrow mb-3">{copy.access.controlLegend}</legend>
        <div className="grid gap-3 md:grid-cols-2">
          {POLICY_TYPES.map((value) => (
            <label
              key={value}
              className="flex cursor-pointer items-center gap-3 rounded-2xl border border-event-outline-subtle/45 px-4 py-3 transition-colors has-[:checked]:border-event-teal has-[:checked]:bg-teal-pale"
            >
              <input
                type="radio"
                value={value}
                {...register('policyType')}
                className="h-4 w-4 shrink-0 accent-event-teal"
              />
              <span className="font-bold text-event-petrol">{POLICY_LABELS[value]}</span>
            </label>
          ))}
        </div>
        {errors.policyType?.message && (
          <p id="access-policy-error" role="alert" className="text-sm font-medium text-destructive">
            {errors.policyType.message}
          </p>
        )}

        {policyType === 'access_code' && (
          <div className="rounded-2xl bg-event-surface p-4">
            <label htmlFor="access-code" className="block text-sm font-bold text-event-petrol">
              {copy.access.accessCodeLabel}
            </label>
            <input
              id="access-code"
              type="text"
              autoComplete="off"
              placeholder={copy.access.accessCodePlaceholder}
              aria-invalid={Boolean(errors.accessCode)}
              aria-describedby={errors.accessCode ? 'access-code-error' : 'access-code-help'}
              {...register('accessCode')}
              className="mt-2 min-h-11 w-full rounded-xl border border-event-outline-subtle/60 bg-white px-4 text-event-petrol"
            />
            <p id="access-code-help" className="mt-2 text-sm text-event-muted">
              {hasExistingCode ? copy.access.accessCodeSet : copy.access.accessCodePlaceholder}
            </p>
            {errors.accessCode?.message && (
              <p id="access-code-error" role="alert" className="mt-1 text-sm font-medium text-destructive">
                {errors.accessCode.message}
              </p>
            )}
          </div>
        )}

        {policyType === 'email_domain' && (
          <div className="rounded-2xl bg-event-surface p-4">
            <label htmlFor="allowed-domains" className="block text-sm font-bold text-event-petrol">
              {copy.access.domainsLabel}
            </label>
            <input
              id="allowed-domains"
              type="text"
              autoComplete="off"
              placeholder={copy.access.domainsPlaceholder}
              aria-invalid={Boolean(errors.allowedDomains)}
              aria-describedby={errors.allowedDomains ? 'allowed-domains-error' : 'allowed-domains-help'}
              {...register('allowedDomains')}
              className="mt-2 min-h-11 w-full rounded-xl border border-event-outline-subtle/60 bg-white px-4 text-event-petrol"
            />
            <p id="allowed-domains-help" className="mt-2 text-sm text-event-muted">{copy.access.domainsHint}</p>
            {errors.allowedDomains?.message && (
              <p id="allowed-domains-error" role="alert" className="mt-1 text-sm font-medium text-destructive">
                {errors.allowedDomains.message}
              </p>
            )}
          </div>
        )}

        {AUTH_AWARE_POLICIES.includes(policyType) && (
          <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-event-surface px-4 py-3">
            <input type="checkbox" {...register('requiresAuthentication')} className="h-4 w-4 accent-event-teal" />
            <span className="font-medium text-event-petrol">{copy.access.requiresAuthentication}</span>
          </label>
        )}
      </fieldset>

      <fieldset
        className="space-y-3"
        aria-describedby={errors.admissionModes ? 'admission-modes-error' : 'admission-modes-help'}
      >
        <legend className="section-eyebrow mb-3">{copy.access.admissionLegend}</legend>
        <Controller
          control={control}
          name="admissionModes"
          render={({ field }) => (
            <div className="grid gap-3 md:grid-cols-2">
              {ADMISSION_MODES.map((mode) => {
                const checked = field.value.includes(mode);
                return (
                  <label
                    key={mode}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition-colors',
                      checked
                        ? 'border-event-teal bg-teal-pale'
                        : 'border-event-outline-subtle/45',
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) =>
                        field.onChange(
                          event.target.checked
                            ? [...field.value, mode]
                            : field.value.filter((value) => value !== mode),
                        )
                      }
                      className="h-4 w-4 accent-event-teal"
                    />
                    <span className="font-bold text-event-petrol">{ADMISSION_LABELS[mode]}</span>
                  </label>
                );
              })}
            </div>
          )}
        />
        <p id="admission-modes-help" className="text-sm text-event-muted">
          {selectedModes.includes('invitation') ? copy.access.admissionHint : copy.access.invitationUnlockHint}
        </p>
        {errors.admissionModes?.message && (
          <p id="admission-modes-error" role="alert" className="text-sm font-medium text-destructive">
            {errors.admissionModes.message}
          </p>
        )}
      </fieldset>

      {Boolean(saveError) && (
        <FormErrorAlert error={getUserFacingError(saveError, { fallback: copy.access.saveError })} />
      )}
      {isSaved && !saveError && (
        <p role="status" className="flex items-center gap-2 text-sm font-bold text-event-teal">
          <Check size={16} aria-hidden="true" />
          {copy.access.saved}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={isSaving} className="premium-button px-6 disabled:opacity-60">
          {isSaving ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              {copy.access.saving}
            </span>
          ) : (
            copy.access.save
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="inline-flex min-h-11 items-center rounded-full border border-event-outline-subtle/60 px-6 font-bold text-event-petrol disabled:opacity-60"
        >
          {copy.access.cancel}
        </button>
      </div>
    </form>
  );
}
