import { describe, expect, it } from 'vitest';
import {
  buildStepPayload,
  eventCreationSchema,
  getCompletionPercent,
  getDefaultEventCreationValues,
  getNextStep,
} from './event-creation';
import type { Event } from '../types';

const baseValues = getDefaultEventCreationValues();
const baseProgress = {
  currentStep: 2,
  completedSteps: [1],
  skippedSteps: [],
};

describe('eventCreationSchema', () => {
  it('refuse un titre vide', () => {
    const result = eventCreationSchema.safeParse({
      ...baseValues,
      title: '',
    });
    expect(result.success).toBe(false);
  });

  it('refuse une fin antérieure au début', () => {
    const result = eventCreationSchema.safeParse({
      ...baseValues,
      title: 'Gala Elintys',
      startDate: '2027-09-20',
      startTime: '20:00',
      endDate: '2027-09-20',
      endTime: '18:00',
    });
    expect(result.success).toBe(false);
  });

  it('accepte une date provisoire sans horaire', () => {
    const result = eventCreationSchema.safeParse({
      ...baseValues,
      title: 'Gala Elintys',
      dateIsTentative: true,
      venueMode: 'later',
    });
    expect(result.success).toBe(true);
  });

  it('refuse un domaine autorisé invalide', () => {
    const result = eventCreationSchema.safeParse({
      ...baseValues,
      title: 'Gala Elintys',
      dateIsTentative: true,
      accessPolicyType: 'email_domain',
      allowedDomains: 'entreprise',
    });
    expect(result.success).toBe(false);
  });
});

describe('buildStepPayload', () => {
  it('crée un brouillon minimal à l’étape 1', () => {
    const payload = buildStepPayload(
      1,
      {
        ...baseValues,
        title: 'Gala annuel Elintys',
        eventType: 'gala',
        capacity: '250',
      },
      [],
      baseProgress,
    );

    expect(payload).toMatchObject({
      title: 'Gala annuel Elintys',
      eventType: 'gala',
      capacity: 250,
      creationProgress: baseProgress,
    });
    expect(payload).not.toHaveProperty('startDate');
  });

  it('ne collecte aucune adresse à l’étape 2', () => {
    const payload = buildStepPayload(
      2,
      {
        ...baseValues,
        title: 'Gala',
        startDate: '2027-09-20',
        startTime: '18:00',
        venueMode: 'search',
      },
      [],
      { ...baseProgress, currentStep: 3, completedSteps: [1, 2] },
    );

    expect(payload.location).toEqual({ type: 'physical' });
    expect(payload).not.toHaveProperty('venueProfile');
    expect(payload).toMatchObject({
      venueMode: 'search',
      timezone: 'America/Toronto',
    });
  });

  it('persiste le lieu manuel sans créer de profil Venue', () => {
    const payload = buildStepPayload(
      3,
      {
        ...baseValues,
        title: 'Gala',
        venueMode: 'existing',
        venueChoice: 'manual',
        venueName: 'Le Belvédère',
        venueAddress: '100 rue Sainte-Catherine',
        venueCity: 'Montréal',
        venueProvince: 'Québec',
        venuePostalCode: 'H2X 1Y4',
      },
      [],
      { ...baseProgress, currentStep: 4, completedSteps: [1, 2, 3] },
    );

    expect(payload).toMatchObject({
      venueProfile: null,
      location: {
        name: 'Le Belvédère',
        city: 'Montréal',
        province: 'Québec',
      },
    });
  });

  it('marque le lieu comme différé sans formulaire vide', () => {
    const payload = buildStepPayload(
      3,
      {
        ...baseValues,
        title: 'Gala',
        venueMode: 'later',
      },
      [],
      { currentStep: 4, completedSteps: [1, 2], skippedSteps: [3] },
    );

    expect(payload).toMatchObject({
      venueMode: 'later',
      venueProfile: null,
      creationProgress: { skippedSteps: [3] },
    });
  });

  it('persiste séparément visibilité, accès et admission', () => {
    const payload = buildStepPayload(
      5,
      {
        ...baseValues,
        title: 'Gala',
        discoverability: 'public',
        accessPolicyType: 'email_domain',
        allowedDomains: '@entreprise.ca, partenaire.org',
        admissionModes: ['paid_ticket', 'invitation'],
      },
      [],
      { currentStep: 6, completedSteps: [1, 2, 3, 4, 5], skippedSteps: [] },
    );

    expect(payload).toMatchObject({
      discoverability: 'public',
      accessPolicy: {
        type: 'email_domain',
        allowedDomains: ['entreprise.ca', 'partenaire.org'],
      },
      admissionModes: ['paid_ticket', 'invitation'],
    });
  });

  it('n’envoie jamais un code vide lors de la mise à jour', () => {
    const payload = buildStepPayload(
      5,
      { ...baseValues, accessPolicyType: 'access_code', accessCodeValue: '', admissionModes: ['registration_only'] },
      [],
      { currentStep: 6, completedSteps: [1, 2, 3, 4, 5], skippedSteps: [] },
    );
    expect(payload).toMatchObject({ accessPolicy: { type: 'access_code' } });
    expect((payload.accessPolicy as { code?: string }).code).toBeUndefined();
  });
});

describe('draft progression', () => {
  const event = {
    _id: 'event-1',
    title: 'Gala',
    status: 'draft',
    createdAt: '2027-01-01T00:00:00.000Z',
    updatedAt: '2027-01-01T00:00:00.000Z',
    creationProgress: {
      currentStep: 4,
      completedSteps: [1, 2, 3],
      skippedSteps: [],
      lastSavedAt: '2027-01-01T00:00:00.000Z',
    },
  } satisfies Event;

  it('reprend à la dernière étape persistée', () => {
    expect(getNextStep(event)).toBe(4);
  });

  it('calcule la progression depuis les étapes réelles', () => {
    expect(getCompletionPercent(event)).toBe(50);
  });
});
