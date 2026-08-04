import { expect, type Locator, type Page } from '@playwright/test';
import { waitForHydration } from './helpers';

/**
 * Traversée réelle du wizard de création d'événement.
 *
 * Le wizard est guidé : les pastilles de progression restent `disabled` tant
 * qu'une étape n'a pas été atteinte, et aucune URL ne permet de sauter la
 * validation. Les étapes 5 et 6 ne sont donc atteignables qu'en franchissant
 * réellement les étapes 1 à 4 — ce module est le seul chemin honnête, partagé
 * entre les tests d'étape et la capture de QA visuelle.
 */

export const SKIP_STEP = 'Passer cette étape';
export const CONTINUE_WITHOUT_VENUE = 'Continuer sans lieu';
export const IDENTITY_TITLE = /Donnez une identité unique/;
export const REVIEW_TITLE = /Votre événement prend forme/;

/**
 * Bouton d'action principal du pied de page.
 *
 * Son libellé change selon l'étape : « Continuer », « Continuer sans lieu »
 * (étape 3 en mode « je choisirai plus tard ») puis « Terminer la
 * configuration » (étape 6). Ne cibler que « Continuer » bloque le parcours à
 * l'étape 3.
 */
export function primaryAction(page: Page): Locator {
  return page.getByRole('button', {
    name: /^(Continuer|Continuer sans lieu|Terminer la configuration)$/,
  });
}

/** Contrôle de formulaire ciblé par son nom react-hook-form et sa valeur. */
export function control(page: Page, name: string, value: string): Locator {
  return page.locator(`input[name="${name}"][value="${value}"]`);
}

/** Coche une option en cliquant son étiquette visible, comme le ferait un humain. */
export async function selectOption(
  page: Page,
  name: string,
  value: string,
): Promise<void> {
  // Les `input` sont `sr-only` : c'est l'étiquette qui porte la surface cliquable.
  await page.locator(`label:has(input[name="${name}"][value="${value}"])`).click();
  await expect(control(page, name, value)).toBeChecked();
}

/** Appelé à chaque étape affichée — utilisé par la capture de QA visuelle. */
export type StepHook = (step: number) => Promise<void>;

/** Ouvre le wizard vierge sur l'étape 1. */
export async function openWizard(page: Page): Promise<void> {
  await page.goto('/evenements/creer');
  await waitForHydration(page);
  await expect(primaryAction(page)).toBeVisible({ timeout: 20_000 });
}

/**
 * Traverse les étapes 1 → 4 et s'arrête sur l'étape 5.
 *
 * Le mode de lieu « je choisirai plus tard » est choisi dès l'étape 2 : c'est
 * la seule branche qui ne réclame aucun champ à l'étape 3
 * (`getStepFieldNames` renvoie une liste vide), ce qui rend le parcours
 * indépendant du catalogue de lieux.
 *
 * @returns l'identifiant du brouillon créé, à nettoyer par l'appelant.
 */
export async function reachIdentityStep(
  page: Page,
  titre: string,
  onStep?: StepHook,
): Promise<string> {
  await openWizard(page);
  await onStep?.(1);

  // Étape 1 — informations essentielles.
  await page.getByLabel(/Nom de l.événement/i).fill(titre);
  await primaryAction(page).click();
  await expect(page.getByText(/Où en êtes-vous concernant le lieu/)).toBeVisible({
    timeout: 20_000,
  });

  // `goToStep` réécrit l'URL après le rendu : on attend la redirection plutôt
  // que de lire `page.url()` au moment où l'étape 2 s'affiche.
  await page.waitForURL(/\/evenements\/[0-9a-f]{24}\/configuration/, { timeout: 20_000 });
  const eventId = /\/evenements\/([0-9a-f]{24})\//.exec(page.url())?.[1] ?? '';
  expect(eventId, 'le brouillon doit être créé à la fin de l’étape 1').not.toBe('');

  // Étape 2 — dates et mode de lieu.
  await page.getByLabel(/Date de début/i).fill('2026-12-01');
  await page.getByLabel(/Heure de début/i).fill('18:00');
  await selectOption(page, 'venueMode', 'later');
  await onStep?.(2);
  await primaryAction(page).click();

  // Étape 3 — aucune donnée de lieu requise sur cette branche.
  await expect(page.getByRole('button', { name: CONTINUE_WITHOUT_VENUE })).toBeVisible({
    timeout: 20_000,
  });
  await onStep?.(3);
  await page.getByRole('button', { name: CONTINUE_WITHOUT_VENUE }).click();

  // Étape 4 — prestataires. Le raccourci « Passer cette étape » est masqué
  // sous le point de rupture `sm` : en mobile, on franchit l'étape par le
  // bouton principal, qui n'exige aucun champ ici.
  const skip = page.getByRole('button', { name: SKIP_STEP });
  await expect(primaryAction(page)).toBeVisible({ timeout: 20_000 });
  await onStep?.(4);
  if (await skip.isVisible()) {
    await skip.click();
  } else {
    await primaryAction(page).click();
  }

  // Étape 5 atteinte.
  await expect(page.getByText(IDENTITY_TITLE).first()).toBeVisible({ timeout: 20_000 });
  await onStep?.(5);
  return eventId;
}

/** Valide l'étape 5 avec une configuration d'accès minimale et passe à l'étape 6. */
export async function reachReviewStep(page: Page): Promise<void> {
  await selectOption(page, 'discoverability', 'public');
  await selectOption(page, 'accessPolicyType', 'open');
  await primaryAction(page).click();
  await expect(page.getByText(REVIEW_TITLE).first()).toBeVisible({ timeout: 20_000 });
}
