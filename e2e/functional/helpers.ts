import path from 'node:path';
import type { APIRequestContext, Page } from '@playwright/test';
import { request } from '@playwright/test';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';
export const E2E_DIR = path.resolve('.e2e');
export const OWNER_STATE = path.join(E2E_DIR, 'owner.json');
export const TIERS_STATE = path.join(E2E_DIR, 'tiers.json');
export const VENDOR_STATE = path.join(E2E_DIR, 'vendor.json');
export const VENUE_STATE = path.join(E2E_DIR, 'venue.json');
export const QA_TITLE_PREFIX = '[E2E]';

export interface Credentials {
  email: string;
  password: string;
}

export function ownerCredentials(): Credentials {
  const email = process.env.E2E_TEST_EMAIL;
  const password = process.env.E2E_TEST_PASSWORD;
  if (!email || !password) {
    throw new Error('E2E_TEST_EMAIL et E2E_TEST_PASSWORD sont requis.');
  }
  return { email, password };
}

/**
 * Comptes QA prestataire et gestionnaire.
 *
 * Provisionnés SANS profil métier par `npm run qa:provision` : c'est l'état
 * d'un utilisateur réel après son onboarding, celui que le parcours
 * « créer ma fiche » doit savoir traiter.
 */
export function vendorCredentials(): Credentials {
  const email = process.env.E2E_TEST_EMAIL_VENDOR ?? 'qa-prestataire@demo.elintys.com';
  const password = process.env.E2E_TEST_PASSWORD;
  if (!password) throw new Error('E2E_TEST_PASSWORD est requis.');
  return { email, password };
}

export function venueCredentials(): Credentials {
  const email = process.env.E2E_TEST_EMAIL_VENUE ?? 'qa-gestionnaire@demo.elintys.com';
  const password = process.env.E2E_TEST_PASSWORD;
  if (!password) throw new Error('E2E_TEST_PASSWORD est requis.');
  return { email, password };
}

/** Compte QA multi-rôles (organisateur + prestataire). */
export function multiRoleCredentials(): Credentials {
  const email = process.env.E2E_TEST_EMAIL_MULTI ?? 'qa-multi@demo.elintys.com';
  const password = process.env.E2E_TEST_PASSWORD;
  if (!password) throw new Error('E2E_TEST_PASSWORD est requis.');
  return { email, password };
}

export function secondaryCredentials(): Credentials {
  const email = process.env.E2E_TEST_EMAIL_SECONDARY;
  const password = process.env.E2E_TEST_PASSWORD;
  if (!email || !password) {
    throw new Error('E2E_TEST_EMAIL_SECONDARY et E2E_TEST_PASSWORD sont requis.');
  }
  return { email, password };
}

/**
 * Client API préfixé.
 *
 * `baseURL` de Playwright résout les URLs avec `new URL(path, baseURL)` : un
 * chemin commençant par « / » écrase donc le préfixe `/api/v1`. Ce client
 * concatène explicitement le préfixe pour éviter ce piège.
 */
export interface ApiClient {
  get(path: string, options?: Parameters<APIRequestContext['get']>[1]): ReturnType<APIRequestContext['get']>;
  post(path: string, options?: Parameters<APIRequestContext['post']>[1]): ReturnType<APIRequestContext['post']>;
  put(path: string, options?: Parameters<APIRequestContext['put']>[1]): ReturnType<APIRequestContext['put']>;
  patch(path: string, options?: Parameters<APIRequestContext['patch']>[1]): ReturnType<APIRequestContext['patch']>;
  delete(path: string, options?: Parameters<APIRequestContext['delete']>[1]): ReturnType<APIRequestContext['delete']>;
  /** Session courante, réinjectable dans un contexte navigateur. */
  storageState(): ReturnType<APIRequestContext['storageState']>;
  dispose(): Promise<void>;
}

function wrap(context: APIRequestContext): ApiClient {
  const url = (path: string) => `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
  return {
    get: (path, options) => context.get(url(path), options),
    post: (path, options) => context.post(url(path), options),
    put: (path, options) => context.put(url(path), options),
    patch: (path, options) => context.patch(url(path), options),
    delete: (path, options) => context.delete(url(path), options),
    storageState: () => context.storageState(),
    dispose: () => context.dispose(),
  };
}

/**
 * Client API à partir d'une session déjà enregistrée (aucune connexion).
 *
 * Le rate-limit AUTH_STRICT (5 tentatives/min) est volontairement conservé :
 * la suite se connecte donc UNE seule fois dans le projet `setup`, puis
 * chaque spec réutilise l'état de session sauvegardé.
 */
export async function apiFromState(statePath: string): Promise<ApiClient> {
  const context = await request.newContext({
    storageState: statePath,
    extraHTTPHeaders: { Origin: 'http://localhost:3000' },
  });
  return wrap(context);
}

/** Client API anonyme (aucune session). */
export async function anonymousApi(): Promise<ApiClient> {
  const context = await request.newContext({
    // `storageState: undefined` est indispensable : sans lui, Playwright hérite
    // du storageState défini au niveau du projet et le contexte serait authentifié.
    storageState: { cookies: [], origins: [] },
    extraHTTPHeaders: { Origin: 'http://localhost:3000' },
  });
  return wrap(context);
}

/**
 * Sessions déjà obtenues dans ce processus, par compte.
 *
 * Le tier AUTH_STRICT plafonne à 5 connexions par minute et par IP. Sans ce
 * cache, chaque `describe` qui appelle `apiContextFor` rouvre une session et
 * la suite complète sature le quota — les échecs deviennent alors des 429
 * indiscernables d'une vraie régression.
 */
type StorageState = Awaited<ReturnType<APIRequestContext['storageState']>>;
const sessionCache = new Map<string, Promise<StorageState>>();

async function loginAndCapture(credentials: Credentials) {
  const context = await request.newContext({
    extraHTTPHeaders: { Origin: 'http://localhost:3000' },
  });
  const response = await context.post(`${API_URL}/auth/login`, { data: credentials });
  if (!response.ok()) {
    throw new Error(`Connexion API échouée (${response.status()}) pour ${credentials.email}`);
  }
  const state = await context.storageState();
  await context.dispose();
  return state;
}

/**
 * Client API authentifié (cookies httpOnly) pour un compte donné.
 *
 * La connexion n'a lieu qu'UNE fois par compte et par processus : les appels
 * suivants réutilisent l'état de session capturé.
 */
export async function apiContextFor(credentials: Credentials): Promise<ApiClient> {
  let pending = sessionCache.get(credentials.email);
  if (!pending) {
    pending = loginAndCapture(credentials);
    sessionCache.set(credentials.email, pending);
  }

  const storageState = await pending;
  const context = await request.newContext({
    storageState,
    extraHTTPHeaders: { Origin: 'http://localhost:3000' },
  });
  return wrap(context);
}

/** Crée un événement brouillon via l'API et retourne son identifiant. */
export async function createDraft(
  api: ApiClient,
  overrides: Record<string, unknown> = {},
): Promise<{ id: string; title: string }> {
  const title = `${QA_TITLE_PREFIX} ${overrides.title ?? 'Brouillon'} ${Date.now()}`;
  const response = await api.post('/events', { data: { ...overrides, title } });
  if (response.status() !== 201) {
    throw new Error(`Création du brouillon échouée : ${response.status()} ${await response.text()}`);
  }
  const body = (await response.json()) as { _id?: string; id?: string };
  const id = body._id ?? body.id;
  if (!id) throw new Error("Réponse de création sans identifiant d'événement");
  return { id, title };
}

/** Supprime les événements E2E créés par ce compte (nettoyage QA). */
export async function cleanupEvents(api: ApiClient, ids: string[]): Promise<void> {
  await Promise.all(
    ids.map((id) => api.delete(`/events/${id}`).catch(() => undefined)),
  );
}

/** Attend que l'application React soit hydratée. */
export async function waitForHydration(page: Page): Promise<void> {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle').catch(() => undefined);
}

/** Petite image PNG valide (1×1) pour les tests d'upload. */
export const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);
