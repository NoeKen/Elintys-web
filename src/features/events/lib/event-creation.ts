import { z } from 'zod';
import { eventCreationCopy as copy } from '../i18n/event-creation.copy';
import type {
  CreateEventInput,
  Event,
  EventLocationType,
  EventType,
  EventDiscoverability,
  EventAccessPolicyType,
  AdmissionMode,
  ProviderSelectionMode,
  UpdateEventInput,
  VenueMode,
  EventAccessPolicy,
} from '../types';

export const EVENT_STEPS = [1, 2, 3, 4, 5, 6] as const;
export type EventCreationStep = (typeof EVENT_STEPS)[number];

export const EVENT_TYPES = [
  'conference',
  'wedding',
  'gala',
  'concert',
  'festival',
  'workshop',
  'corporate',
  'birthday',
  'networking',
  'other',
] as const satisfies readonly EventType[];

export const PROVIDER_CATEGORIES = [
  'photographer',
  'videographer',
  'caterer',
  'dj',
  'musician',
  'decorator',
  'host',
  'sound',
  'lighting',
  'security',
  'transport',
  'equipment',
  'other',
] as const;

export type ProviderCategory = (typeof PROVIDER_CATEGORIES)[number];

export const PROVIDER_MODES = [
  'elintys',
  'manual',
  'later',
] as const satisfies readonly ProviderSelectionMode[];

const optionalEmail = z.union([
  z.literal(''),
  z.string().email(copy.validation.emailInvalid),
]);

export const eventCreationSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, copy.validation.titleRequired)
      .max(200, copy.validation.titleMax),
    eventType: z.enum(EVENT_TYPES, {
      error: copy.validation.typeRequired,
    }),
    shortDescription: z.string().trim().max(500).optional(),
    capacity: z.union([
      z.literal(''),
      z
        .string()
        .regex(/^[1-9]\d*$/, copy.validation.capacityPositive),
    ]),
    startDate: z.string(),
    startTime: z.string(),
    endDate: z.string(),
    endTime: z.string(),
    dateIsTentative: z.boolean(),
    format: z.enum(['physical', 'hybrid', 'online']),
    venueMode: z.enum(['existing', 'search', 'later']),
    venueChoice: z.enum(['catalog', 'manual']),
    venueProfile: z.string(),
    venueName: z.string().trim().max(200),
    venueAddress: z.string().trim().max(300),
    venueCity: z.string().trim().max(100),
    venueProvince: z.string().trim().max(100),
    venuePostalCode: z.string().trim().max(20),
    venueContactName: z.string().trim().max(100),
    venueContactEmail: optionalEmail,
    venueContactPhone: z.string().trim().max(50),
    venueSearchRegion: z.string().trim().max(100),
    venueSearchRadius: z.string(),
    venueSearchCapacity: z.string(),
    venueSearchBudget: z.string(),
    description: z.string().trim().max(5000),
    discoverability: z.enum(['public', 'unlisted', 'private']),
    accessPolicyType: z.enum([
      'open',
      'registration_required',
      'access_code',
      'email_domain',
      'manual_approval',
      'guest_list',
      'invitation_token',
    ]),
    accessCodeValue: z.string().max(128),
    hasPersistedAccessCode: z.boolean(),
    allowedDomains: z.string().trim().max(1000),
    admissionModes: z.array(z.enum([
      'free',
      'registration_only',
      'free_ticket',
      'paid_ticket',
      'invitation',
    ])).min(1, copy.validation.admissionRequired),
  })
  .superRefine((values, context) => {
    if (!values.dateIsTentative && (!values.startDate || !values.startTime)) {
      context.addIssue({
        code: 'custom',
        path: ['startDate'],
        message: copy.validation.startRequired,
      });
    }

    const start = toIsoDate(values.startDate, values.startTime);
    const end = toIsoDate(values.endDate, values.endTime);
    if (start && end && new Date(end) < new Date(start)) {
      context.addIssue({
        code: 'custom',
        path: ['endDate'],
        message: copy.validation.endAfterStart,
      });
    }

    if (
      values.venueMode === 'existing' &&
      values.venueChoice === 'manual'
    ) {
      const requiredManualFields: Array<
        [
          keyof Pick<
            EventCreationFormValues,
            | 'venueName'
            | 'venueAddress'
            | 'venueCity'
            | 'venueProvince'
            | 'venuePostalCode'
          >,
          string,
        ]
      > = [
        ['venueName', copy.validation.venueNameRequired],
        ['venueAddress', copy.validation.addressRequired],
        ['venueCity', copy.validation.cityRequired],
        ['venueProvince', copy.validation.provinceRequired],
        ['venuePostalCode', copy.validation.postalRequired],
      ];

      requiredManualFields.forEach(([field, message]) => {
        if (!values[field]) {
          context.addIssue({ code: 'custom', path: [field], message });
        }
      });
    }

    if (
      values.venueMode !== 'later' &&
      values.venueChoice === 'catalog' &&
      !values.venueProfile
    ) {
      context.addIssue({
        code: 'custom',
        path: ['venueProfile'],
        message: copy.validation.venueRequired,
      });
    }

    if (
      values.accessPolicyType === 'email_domain' &&
      (!values.allowedDomains || values.allowedDomains.split(',').some(
        (domain) => !/^@?[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(domain.trim()),
      ))
    ) {
      context.addIssue({
        code: 'custom',
        path: ['allowedDomains'],
        message: copy.validation.domainInvalid,
      });
    }
    if (
      values.accessPolicyType === 'access_code' &&
      !values.hasPersistedAccessCode &&
      values.accessCodeValue.length < 6
    ) {
      context.addIssue({ code: 'custom', path: ['accessCodeValue'], message: copy.validation.accessCodeMin });
    }
    if (values.accessPolicyType === 'access_code' && values.accessCodeValue.length > 0 && values.accessCodeValue.length < 6) {
      context.addIssue({ code: 'custom', path: ['accessCodeValue'], message: copy.validation.accessCodeMin });
    }
    if (values.accessPolicyType === 'invitation_token' && !values.admissionModes.includes('invitation')) {
      context.addIssue({ code: 'custom', path: ['admissionModes'], message: copy.validation.invitationAdmissionRequired });
    }
    if (values.discoverability === 'private' && values.accessPolicyType === 'open') {
      context.addIssue({ code: 'custom', path: ['accessPolicyType'], message: copy.validation.privateRestrictionRequired });
    }
  });

export type EventCreationFormValues = z.infer<typeof eventCreationSchema>;

export function normalizeLegacyEventAccess(event?: Event): {
  discoverability: EventDiscoverability;
  accessPolicyType: EventAccessPolicyType;
  allowedDomains: string;
  admissionModes: AdmissionMode[];
} {
  if (event?.discoverability && event.accessPolicy && event.admissionModes?.length) {
    return {
      discoverability: event.discoverability,
      accessPolicyType: event.accessPolicy.type,
      allowedDomains: event.accessPolicy.type === 'email_domain' ? event.accessPolicy.allowedDomains.join(', ') : '',
      admissionModes: event.admissionModes,
    };
  }
  if (event?.visibility === 'invite_only') {
    return { discoverability: 'unlisted', accessPolicyType: 'invitation_token', allowedDomains: '', admissionModes: ['invitation'] };
  }
  if (event?.visibility === 'private') {
    if (event.accessRules?.manualApproval) return { discoverability: 'private', accessPolicyType: 'manual_approval', allowedDomains: '', admissionModes: ['registration_only'] };
    if (event.accessRules?.allowedEmailDomain) return { discoverability: 'unlisted', accessPolicyType: 'email_domain', allowedDomains: event.accessRules.allowedEmailDomain, admissionModes: ['registration_only'] };
    return { discoverability: 'private', accessPolicyType: 'registration_required', allowedDomains: '', admissionModes: ['registration_only'] };
  }
  return { discoverability: 'public', accessPolicyType: 'open', allowedDomains: '', admissionModes: ['registration_only'] };
}

export interface ProviderNeedState {
  category: ProviderCategory;
  mode: ProviderSelectionMode;
}

export interface ManualProviderDraft {
  name: string;
  category: ProviderCategory;
  email: string;
  phone: string;
  invite: boolean;
}

export function getDefaultEventCreationValues(
  event?: Event,
): EventCreationFormValues {
  const start = splitIsoDate(event?.startDate);
  const end = splitIsoDate(event?.endDate);
  const hasManualVenue = Boolean(
    event?.location?.name || event?.location?.address,
  );
  const access = normalizeLegacyEventAccess(event);

  return {
    title: event?.title ?? '',
    eventType: event?.eventType ?? 'conference',
    shortDescription: event?.shortDescription ?? '',
    capacity:
      event?.capacity && event.capacity > 0 ? String(event.capacity) : '',
    startDate: start.date,
    startTime: start.time,
    endDate: end.date,
    endTime: end.time,
    dateIsTentative: event?.dateIsTentative ?? false,
    format: event?.location?.type ?? 'physical',
    venueMode: event?.venueMode ?? 'existing',
    venueChoice: event?.venueProfile
      ? 'catalog'
      : hasManualVenue
        ? 'manual'
        : 'catalog',
    venueProfile: event?.venueProfile ?? '',
    venueName: event?.location?.name ?? '',
    venueAddress: event?.location?.address ?? '',
    venueCity: event?.location?.city ?? '',
    venueProvince: event?.location?.province ?? 'Québec',
    venuePostalCode: event?.location?.postalCode ?? '',
    venueContactName: event?.location?.contactName ?? '',
    venueContactEmail: event?.location?.contactEmail ?? '',
    venueContactPhone: event?.location?.contactPhone ?? '',
    venueSearchRegion: '',
    venueSearchRadius: '25',
    venueSearchCapacity:
      event?.capacity && event.capacity > 0 ? String(event.capacity) : '',
    venueSearchBudget: '',
    description: event?.description ?? '',
    discoverability: access.discoverability,
    accessPolicyType: access.accessPolicyType,
    accessCodeValue: '',
    hasPersistedAccessCode: event?.accessPolicy?.type === 'access_code' && Boolean(event.accessPolicy.hasAccessCode),
    allowedDomains: access.allowedDomains,
    admissionModes: access.admissionModes,
  };
}

export function buildStepPayload(
  step: EventCreationStep,
  values: EventCreationFormValues,
  providerNeeds: ProviderNeedState[],
  progress: {
    currentStep: number;
    completedSteps: number[];
    skippedSteps: number[];
  },
): CreateEventInput | UpdateEventInput {
  const creationProgress = {
    currentStep: progress.currentStep,
    completedSteps: uniqueSorted(progress.completedSteps),
    skippedSteps: uniqueSorted(progress.skippedSteps),
  };

  if (step === 1) {
    return {
      title: values.title.trim(),
      eventType: values.eventType,
      shortDescription: cleanOptional(values.shortDescription),
      capacity: values.capacity === '' ? undefined : Number(values.capacity),
      creationProgress,
    };
  }

  if (step === 2) {
    return {
      startDate: toIsoDate(values.startDate, values.startTime),
      endDate: toIsoDate(values.endDate, values.endTime),
      dateIsTentative: values.dateIsTentative,
      timezone: 'America/Toronto',
      venueMode: values.venueMode as VenueMode,
      location: {
        type: values.format as EventLocationType,
      },
      creationProgress,
    };
  }

  if (step === 3) {
    if (values.venueMode === 'later') {
      return {
        venueMode: 'later',
        venueProfile: null,
        location: { type: values.format },
        creationProgress,
      };
    }

    if (values.venueChoice === 'catalog') {
      return {
        venueMode: values.venueMode,
        venueProfile: values.venueProfile,
        location: { type: values.format },
        creationProgress,
      };
    }

    return {
      venueMode: values.venueMode,
      venueProfile: null,
      location: {
        type: values.format,
        name: values.venueName.trim(),
        address: values.venueAddress.trim(),
        city: values.venueCity.trim(),
        province: values.venueProvince.trim(),
        postalCode: values.venuePostalCode.trim(),
        contactName: cleanOptional(values.venueContactName),
        contactEmail: cleanOptional(values.venueContactEmail),
        contactPhone: cleanOptional(values.venueContactPhone),
      },
      creationProgress,
    };
  }

  if (step === 4) {
    return {
      providerNeeds,
      creationProgress,
    };
  }

  if (step === 5) {
    return {
      description: cleanOptional(values.description),
      discoverability: values.discoverability,
      accessPolicy: buildAccessPolicy(values),
      admissionModes: values.admissionModes,
      creationProgress,
    };
  }

  return { creationProgress };
}

export function getStepFieldNames(
  step: EventCreationStep,
  values: EventCreationFormValues,
): Array<keyof EventCreationFormValues> {
  if (step === 1) {
    return ['title', 'eventType', 'shortDescription', 'capacity'];
  }
  if (step === 2) {
    return [
      'startDate',
      'startTime',
      'endDate',
      'endTime',
      'dateIsTentative',
      'format',
      'venueMode',
    ];
  }
  if (step === 3 && values.venueMode !== 'later') {
    return values.venueChoice === 'catalog'
      ? ['venueProfile']
      : [
          'venueName',
          'venueAddress',
          'venueCity',
          'venueProvince',
          'venuePostalCode',
          'venueContactName',
          'venueContactEmail',
          'venueContactPhone',
        ];
  }
  if (step === 5) {
    return [
      'description',
      'discoverability',
      'accessPolicyType',
      'accessCodeValue',
      'allowedDomains',
      'admissionModes',
    ];
  }
  return [];
}

export function getCompletionPercent(event: Event): number {
  const completed = new Set(event.creationProgress?.completedSteps ?? []);
  const skipped = new Set(event.creationProgress?.skippedSteps ?? []);
  const completedCount = EVENT_STEPS.filter(
    (step) => completed.has(step) || skipped.has(step),
  ).length;
  return Math.round((completedCount / EVENT_STEPS.length) * 100);
}

function buildAccessPolicy(values: EventCreationFormValues): EventAccessPolicy {
  switch (values.accessPolicyType) {
    case 'registration_required':
      return { type: 'registration_required', requiresAuthentication: true };
    case 'access_code':
      return { type: 'access_code', ...(values.accessCodeValue ? { code: values.accessCodeValue } : {}) };
    case 'email_domain':
      return {
        type: 'email_domain',
        requiresAuthentication: true,
        allowedDomains: values.allowedDomains.split(',').map((domain) => domain.trim().replace(/^@/, '').toLowerCase()).filter(Boolean),
      };
    case 'manual_approval':
      return { type: 'manual_approval', requiresAuthentication: true };
    case 'guest_list':
      return { type: 'guest_list', requiresAuthentication: true };
    case 'invitation_token':
      return { type: 'invitation_token' };
    default:
      return { type: 'open' };
  }
}

export function getNextStep(event: Event): EventCreationStep {
  const persisted = event.creationProgress?.currentStep;
  if (
    persisted &&
    EVENT_STEPS.includes(persisted as EventCreationStep)
  ) {
    return persisted as EventCreationStep;
  }

  const completed = new Set(event.creationProgress?.completedSteps ?? []);
  return EVENT_STEPS.find((step) => !completed.has(step)) ?? 6;
}

function splitIsoDate(value?: string): { date: string; time: string } {
  if (!value) return { date: '', time: '' };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: '', time: '' };

  const localDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Toronto',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
  const localTime = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Toronto',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
  return { date: localDate, time: localTime };
}

function toIsoDate(date: string, time: string): string | undefined {
  if (!date || !time) return undefined;
  const parsed = new Date(`${date}T${time}:00`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

function cleanOptional(value?: string): string | undefined {
  const cleaned = value?.trim();
  return cleaned ? cleaned : undefined;
}

function uniqueSorted(values: number[]): number[] {
  return [...new Set(values)].sort((a, b) => a - b);
}
