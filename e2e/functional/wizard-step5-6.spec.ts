import { expect, test } from '@playwright/test';
import {
  ApiClient,
  apiFromState,
  cleanupEvents,
  OWNER_STATE,
  TINY_PNG,
} from './helpers';
import {
  control,
  IDENTITY_TITLE,
  primaryAction,
  reachIdentityStep as traverseToIdentityStep,
  REVIEW_TITLE,
  selectOption,
} from './wizard-journey';

/**
 * Wizard — étapes 5 (identité et accès) et 6 (récapitulatif), pilotées par
 * l'interface réelle (Sprint 2.3).
 *
 * Ces étapes n'étaient jusqu'ici couvertes qu'au niveau API et unitaire : le
 * wizard est guidé, les pastilles de progression sont `disabled` tant que
 * l'étape n'a pas été atteinte, et aucun raccourci d'URL ne saute la
 * validation. Le seul chemin honnête est donc de traverser réellement les
 * étapes 1 → 4 (voir `wizard-journey.ts`).
 */

let api: ApiClient;
const created: string[] = [];

test.beforeAll(async () => {
  api = await apiFromState(OWNER_STATE);
});

test.afterAll(async () => {
  await cleanupEvents(api, created);
  await api.dispose();
});

/** Traverse les étapes 1 à 4 et enregistre le brouillon pour le nettoyage. */
async function reachIdentityStep(page: Parameters<typeof traverseToIdentityStep>[0], titre: string) {
  const eventId = await traverseToIdentityStep(page, titre);
  created.push(eventId);
  return eventId;
}

test.describe('Wizard — étape 5 : accès à l’étape', () => {
  test('devrait atteindre l’étape 5 par la traversée réelle des étapes 1 à 4', async ({ page }) => {
    const eventId = await reachIdentityStep(page, `[E2E] Traversée 1-5 ${Date.now()}`);

    // Les contrôles propres à l'étape 5 sont montés.
    await expect(page.getByText(/Qui peut s.inscrire ou demander à participer/)).toBeVisible();
    await expect(page.getByText(/Comment les participants obtiennent-ils/)).toBeVisible();

    // Le backend a bien enregistré la progression jusqu'à l'étape 5.
    const doc = await (await api.get(`/events/${eventId}`)).json();
    expect(doc.creationProgress?.currentStep).toBe(5);
    expect(doc.creationProgress?.skippedSteps, 'l’étape 4 est marquée passée').toContain(4);
  });
});

test.describe('Wizard — étape 5 : médias', () => {
  test('devrait téléverser une couverture puis la remplacer depuis l’interface', async ({ page }) => {
    const eventId = await reachIdentityStep(page, `[E2E] Couverture UI ${Date.now()}`);

    // Le badge de confirmation existe aussi dans la pile de notifications :
    // on cible celui de la section couverture pour lever l'ambiguïté.
    const section = page.getByLabel('Image de couverture');
    const cover = section.locator('input[type=file]');
    await cover.setInputFiles({ name: 'couverture.png', mimeType: 'image/png', buffer: TINY_PNG });

    await expect(section.getByText('Image enregistrée')).toBeVisible({ timeout: 30_000 });
    const withCover = await (await api.get(`/events/${eventId}`)).json();
    expect(withCover.coverImage?.url, 'la couverture doit être persistée').toBeTruthy();

    // Une couverture présente expose l'action de remplacement.
    await expect(section.getByText('Remplacer')).toBeVisible();
    await cover.setInputFiles({ name: 'couverture-2.png', mimeType: 'image/png', buffer: TINY_PNG });
    await expect(section.getByText('Image enregistrée')).toBeVisible({ timeout: 30_000 });
    const replaced = await (await api.get(`/events/${eventId}`)).json();
    expect(replaced.coverImage?.url).toBeTruthy();
  });

  test('devrait refuser un fichier non-image sans rien envoyer au serveur', async ({ page }) => {
    const eventId = await reachIdentityStep(page, `[E2E] Couverture invalide ${Date.now()}`);

    await page.locator('input[type=file]').first().setInputFiles({
      name: 'malveillant.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('ceci nest pas une image'),
    });

    await expect(page.getByText('Choisissez une image JPG, PNG ou WebP.')).toBeVisible();
    const doc = await (await api.get(`/events/${eventId}`)).json();
    expect(doc.coverImage?.url ?? null, 'aucun média ne doit être créé').toBeNull();
  });

  test('devrait ajouter une image à la galerie depuis l’interface', async ({ page }) => {
    const eventId = await reachIdentityStep(page, `[E2E] Galerie UI ${Date.now()}`);

    const section = page.getByLabel('Galerie de l’événement');
    await section.locator('input[type=file]').setInputFiles({
      name: 'galerie.png',
      mimeType: 'image/png',
      buffer: TINY_PNG,
    });

    // La galerie confirme par une notification, pas par un badge de section.
    await expect(page.getByText('Galerie enregistrée').first()).toBeVisible({ timeout: 30_000 });
    await expect(section.getByText('1/10 images')).toBeVisible();
    const doc = await (await api.get(`/events/${eventId}`)).json();
    expect((doc.gallery ?? []).length, 'la galerie doit contenir une image').toBeGreaterThan(0);
  });
});

test.describe('Wizard — étape 5 : visibilité, accès et admission', () => {
  test('devrait proposer et sélectionner les trois visibilités', async ({ page }) => {
    await reachIdentityStep(page, `[E2E] Visibilités ${Date.now()}`);

    for (const value of ['public', 'unlisted', 'private'] as const) {
      await selectOption(page, 'discoverability', value);
      // Une seule visibilité à la fois : les autres sont décochées.
      const autres = ['public', 'unlisted', 'private'].filter((item) => item !== value);
      for (const autre of autres) {
        await expect(control(page, 'discoverability', autre)).not.toBeChecked();
      }
    }
  });

  test('devrait proposer et sélectionner les sept politiques d’accès', async ({ page }) => {
    await reachIdentityStep(page, `[E2E] Politiques accès ${Date.now()}`);

    const politiques = [
      'open',
      'registration_required',
      'access_code',
      'email_domain',
      'manual_approval',
      'guest_list',
      'invitation_token',
    ] as const;

    for (const value of politiques) {
      await selectOption(page, 'accessPolicyType', value);
    }

    // Deux politiques révèlent un champ conditionnel : la révélation est bien
    // conditionnée par la sélection, et non affichée en permanence.
    await selectOption(page, 'accessPolicyType', 'access_code');
    await expect(page.locator('#event-access-code')).toBeVisible();
    await expect(page.locator('#allowed-domains')).toHaveCount(0);

    await selectOption(page, 'accessPolicyType', 'email_domain');
    await expect(page.locator('#allowed-domains')).toBeVisible();
    await expect(page.locator('#event-access-code')).toHaveCount(0);

    await selectOption(page, 'accessPolicyType', 'open');
    await expect(page.locator('#event-access-code')).toHaveCount(0);
    await expect(page.locator('#allowed-domains')).toHaveCount(0);
  });

  test('devrait proposer les cinq modes d’admission et les cumuler', async ({ page }) => {
    await reachIdentityStep(page, `[E2E] Modes admission ${Date.now()}`);

    const modes = ['free', 'registration_only', 'free_ticket', 'paid_ticket', 'invitation'] as const;
    for (const value of modes) {
      const item = control(page, 'admissionModes', value);
      if (!(await item.isChecked())) {
        await page.locator(`label:has(input[name="admissionModes"][value="${value}"])`).click();
      }
      await expect(item).toBeChecked();
    }

    // Les modes sont cumulables : cocher le dernier ne décoche pas les autres.
    for (const value of modes) {
      await expect(control(page, 'admissionModes', value)).toBeChecked();
    }
  });

  test('devrait persister la configuration d’accès saisie dans l’interface', async ({ page }) => {
    const eventId = await reachIdentityStep(page, `[E2E] Persistance accès ${Date.now()}`);

    await page.getByLabel(/Description complète/i).fill('Description saisie via l’interface.');
    await selectOption(page, 'discoverability', 'unlisted');
    await selectOption(page, 'accessPolicyType', 'access_code');
    await page.locator('#event-access-code').fill('code-e2e-2026');
    await page.locator('label:has(input[name="admissionModes"][value="free_ticket"])').click();

    await primaryAction(page).click();
    await expect(page.getByText(REVIEW_TITLE).first()).toBeVisible({ timeout: 20_000 });

    const doc = await (await api.get(`/events/${eventId}`)).json();
    expect(doc.discoverability).toBe('unlisted');
    expect(doc.accessPolicy?.type).toBe('access_code');
    expect(doc.admissionModes).toContain('free_ticket');
    expect(doc.description).toContain('interface');
    // Le code d'accès est hashé : il ne doit jamais revenir en clair.
    expect(JSON.stringify(doc)).not.toContain('code-e2e-2026');
  });

  test('devrait refuser un événement privé laissé en accès ouvert', async ({ page }) => {
    await reachIdentityStep(page, `[E2E] Privé sans restriction ${Date.now()}`);

    await selectOption(page, 'discoverability', 'private');
    await selectOption(page, 'accessPolicyType', 'open');
    await primaryAction(page).click();

    // La combinaison est invalide : le wizard doit rester sur l'étape 5.
    await expect(page.getByText(IDENTITY_TITLE).first()).toBeVisible();
    await expect(page.getByText(REVIEW_TITLE)).toHaveCount(0);

    // Et l'utilisateur doit comprendre pourquoi il est bloqué.
    await expect(
      page.getByText('Un événement privé doit utiliser une règle d’accès restreinte.'),
    ).toBeVisible();
  });
});

test.describe('Wizard — étape 6 : récapitulatif', () => {
  test('devrait afficher le récapitulatif et ramener à l’étape choisie', async ({ page }) => {
    const titre = `[E2E] Récapitulatif ${Date.now()}`;
    await reachIdentityStep(page, titre);

    await selectOption(page, 'discoverability', 'public');
    await selectOption(page, 'accessPolicyType', 'open');
    await primaryAction(page).click();
    await expect(page.getByText(REVIEW_TITLE).first()).toBeVisible({ timeout: 20_000 });

    // Le récapitulatif reprend les données saisies au fil du parcours.
    await expect(page.getByText(titre, { exact: false }).first()).toBeVisible();
    await expect(page.getByText('Aucun lieu pour le moment').first()).toBeVisible();

    // Chaque carte offre un retour direct vers son étape.
    const modifier = page.getByRole('button', { name: 'Modifier' });
    expect(await modifier.count(), 'chaque section doit être modifiable').toBeGreaterThan(0);

    await modifier.first().click();
    // Le premier bouton « Modifier » ramène à l'étape 1.
    await expect(page.getByLabel(/Nom de l.événement/i)).toHaveValue(titre, { timeout: 20_000 });
  });

  test('devrait permettre de revenir à l’étape 5 depuis le récapitulatif', async ({ page }) => {
    await reachIdentityStep(page, `[E2E] Retour étape 5 ${Date.now()}`);

    await selectOption(page, 'discoverability', 'unlisted');
    await selectOption(page, 'accessPolicyType', 'registration_required');
    await primaryAction(page).click();
    await expect(page.getByText(REVIEW_TITLE).first()).toBeVisible({ timeout: 20_000 });

    // La pastille de l'étape 5, désormais franchie, redevient actionnable.
    const pastille = page.getByRole('button', { name: /5\./ });
    await expect(pastille).toBeEnabled();
    await pastille.click();

    await expect(page.getByText(IDENTITY_TITLE).first()).toBeVisible({ timeout: 20_000 });
    // Les choix précédents sont restitués, pas réinitialisés.
    await expect(control(page, 'discoverability', 'unlisted')).toBeChecked();
    await expect(control(page, 'accessPolicyType', 'registration_required')).toBeChecked();
  });
});
