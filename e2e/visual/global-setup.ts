import fs from 'node:fs';
import path from 'node:path';
import { request } from '@playwright/test';
import { API_URL, credentials, QA_DIR, QA_METADATA, QA_PREFIX, type QaEventRef, type QaMetadata } from './qa-data';

type JsonObject = Record<string, unknown>;

export default async function globalSetup() {
  fs.mkdirSync(QA_DIR, { recursive: true });
  const api = await request.newContext({ baseURL: `${API_URL}/`, extraHTTPHeaders: { origin: 'https://dev.elintys.com', referer: 'https://dev.elintys.com/' } });
  const login = await api.post('auth/login', { data: credentials() });
  if (!login.ok()) throw new Error(`Connexion QA impossible (${login.status()}).`);
  const onboarding = await api.patch('auth/onboarding/organisateur', {
    data: { eventTypes: ['Conférences', 'Galas'], frequency: '6–12/an', displayName: 'QA Elintys', city: 'Montréal' },
  });
  if (!onboarding.ok()) throw new Error(`Préparation onboarding QA impossible (${onboarding.status()}).`);

  const current = await api.get('events/my?page=1&limit=100');
  if (!current.ok()) throw new Error(`Inventaire QA impossible (${current.status()}).`);
  const currentJson = await current.json() as { data?: Array<{ _id: string; title: string }> };
  for (const event of currentJson.data ?? []) {
    if (event.title.startsWith(QA_PREFIX)) await api.delete(`events/${event._id}`);
  }

  const future = {
    eventType: 'conference',
    shortDescription: 'Une expérience QA stable dédiée à la validation visuelle Elintys.',
    description: 'Cette fiche isolée valide la hiérarchie éditoriale, les médias, l’accès et le responsive sans utiliser de données personnelles.',
    startDate: '2027-11-12T18:00:00.000Z',
    endDate: '2027-11-12T22:00:00.000Z',
    timezone: 'America/Toronto',
    location: { type: 'physical', name: 'Maison Elintys QA', address: '100 Rue du Test', city: 'Montréal', province: 'Québec', postalCode: 'H2X 1Y4' },
    venueMode: 'existing', capacity: 180,
    admissionModes: ['free'],
    creationProgress: { currentStep: 6, completedSteps: [1, 2, 3, 4, 5, 6], skippedSteps: [] },
  };

  const events: Record<string, QaEventRef> = {};
  const create = async (key: string, title: string, overrides: JsonObject = {}, publish = false) => {
    const response = await api.post('events', { data: { ...future, title: `${QA_PREFIX} ${title}`, ...overrides } });
    if (!response.ok()) throw new Error(`Création ${key} impossible (${response.status()}).`);
    let event = await response.json() as { _id: string; slug?: string; title: string };
    if (publish) {
      const published = await api.patch(`events/${event._id}/publish`);
      if (!published.ok()) throw new Error(`Publication ${key} impossible (${published.status()}).`);
      event = await published.json() as typeof event;
    }
    events[key] = { id: event._id, slug: event.slug, title: event.title };
    return event;
  };

  await create('draft', 'Brouillon incomplet', {
    shortDescription: 'Brouillon sans lieu ni média.', location: undefined, venueMode: 'later',
    creationProgress: { currentStep: 3, completedSteps: [1, 2], skippedSteps: [] },
  });
  await create('step1', 'Wizard étape 1', { creationProgress: { currentStep: 1, completedSteps: [], skippedSteps: [] } });
  await create('step2', 'Wizard étape 2', { creationProgress: { currentStep: 2, completedSteps: [1], skippedSteps: [] } });
  await create('step4', 'Wizard étape 4', { creationProgress: { currentStep: 4, completedSteps: [1, 2, 3], skippedSteps: [] } });
  await create('step5', 'Wizard étape 5', { creationProgress: { currentStep: 5, completedSteps: [1, 2, 3, 4], skippedSteps: [] } });
  await create('locationExisting', 'Lieu existant', { venueMode: 'existing', creationProgress: { currentStep: 3, completedSteps: [1, 2], skippedSteps: [] } });
  await create('locationSearch', 'Recherche de lieu', { venueMode: 'search', venueProfile: undefined, creationProgress: { currentStep: 3, completedSteps: [1, 2], skippedSteps: [] } });
  await create('ready', 'Prêt à publier');
  const publicEvent = await create('public', 'Événement public', { discoverability: 'public', accessPolicy: { type: 'open' } }, true);
  await create('noMedia', 'Public sans média', { discoverability: 'public', accessPolicy: { type: 'open' } }, true);
  await create('code', 'Accès par code', { discoverability: 'unlisted', accessPolicy: { type: 'access_code', code: 'QaCode-2027' } }, true);
  await create('domain', 'Accès domaine', { discoverability: 'public', accessPolicy: { type: 'email_domain', allowedDomains: ['elintys.com'], requiresAuthentication: true } }, true);
  await create('approval', 'Approbation manuelle', { discoverability: 'private', accessPolicy: { type: 'manual_approval', requiresAuthentication: true } }, true);
  await create('invitation', 'Sur invitation', { discoverability: 'unlisted', accessPolicy: { type: 'invitation_token' }, admissionModes: ['invitation'] }, true);
  await create('withoutVenue', 'Sans lieu', { location: undefined, venueMode: 'later', creationProgress: { currentStep: 3, completedSteps: [1, 2], skippedSteps: [3] } });

  const coverPath = path.resolve('docs/design-qa/event-experience/references/reference-event-public-desktop.png');
  const cover = await api.post(`events/${publicEvent._id}/cover`, { multipart: { file: { name: 'qa-cover.png', mimeType: 'image/png', buffer: fs.readFileSync(coverPath) } } });
  if (!cover.ok()) throw new Error(`Upload cover QA impossible (${cover.status()}).`);
  const galleryPath = path.resolve('docs/design-qa/event-experience/references/reference-dashboard-desktop.png');
  const gallery = await api.post(`events/${publicEvent._id}/gallery`, { multipart: { files: { name: 'qa-gallery.png', mimeType: 'image/png', buffer: fs.readFileSync(galleryPath) } } });
  if (!gallery.ok()) throw new Error(`Upload galerie QA impossible (${gallery.status()}).`);

  const metadata: QaMetadata = { createdAt: new Date().toISOString(), events };
  fs.writeFileSync(QA_METADATA, JSON.stringify(metadata, null, 2), { mode: 0o600 });
  await api.dispose();
}
