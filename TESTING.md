# Tests — Elintys-web

100% de couverture de test est l'objectif : les tests permettent d'avancer vite
et de shipper avec confiance. Sans tests, on code au hasard ; avec des tests
complets, c'est une garantie de non-régression.

## Stack

- **Vitest** (`vitest.config.ts`) — tests unitaires et composants, environnement `jsdom`
- **@testing-library/react** + **@testing-library/user-event** — tests de composants
- **@testing-library/jest-dom** — matchers DOM (chargés dans `vitest.setup.ts`)
- **@playwright/test** (`playwright.config.ts`) — tests end-to-end (Chromium)

## Lancer les tests

```bash
npm test              # suite Vitest complète (unitaire + composants)
npm run test:watch    # mode watch
npm run test:coverage # avec rapport de couverture (v8)
npm run test:e2e      # suite Playwright (démarre automatiquement `npm run dev`)
```

## Couverture

`vitest.config.ts` définit :
- un **plancher global** = couverture actuelle du dépôt (garde-fou anti-régression :
  toute baisse fait échouer `npm run test:coverage`)
- des **seuils à 100%** par fichier pour chaque module déjà entièrement couvert

Pour ajouter un nouveau module à la liste 100% : écrire les tests, vérifier
`npx vitest run --coverage --coverage.include="<fichier>" --coverage.thresholds.100=true`,
puis ajouter l'entrée dans `coverage.thresholds` de `vitest.config.ts`. Augmenter
le plancher global en conséquence.

## Conventions

- Fichiers de test : `*.test.ts` / `*.test.tsx`, colocalisés avec le code source
- Nommage des `it()` : `'devrait [comportement attendu]'` en français
- Mock des modules Next.js (`next/navigation`, `next/headers`) via `vi.mock()`
- Aucun `localStorage`/token réel dans les tests — utiliser des fixtures
- Sélecteurs E2E : `data-testid` uniquement (à instrumenter au fur et à mesure —
  voir « Travail restant » ci-dessous)

## Couches de tests

- **Unitaire** — logique pure (`src/lib/**`, `src/shared/lib/**`, schémas Zod)
- **Intégration serveur** — guards, session, cookies (`src/server/auth/**`),
  mocks de `next/headers` / `next/navigation`
- **Composants** — formulaires et UI interactive avec React Testing Library
- **E2E** — parcours utilisateur complets avec Playwright (`e2e/`)

## Travail restant vers 100%

La base d'infra est en place et les modules critiques (auth, redirections,
sessions, schémas de validation, formulaires de login/inscription) sont
couverts à 100%. Le reste du dépôt (221 fichiers source) reste à couvrir
progressivement — priorité recommandée :

1. `src/features/*/services/*.service.ts` — appels API, faciles à mocker
2. `src/shared/ui/**` — composants UI atomiques (tests RTL courts)
3. `src/shared/lib/api.ts` — client fetch central
4. Parcours E2E métier : achat billet invité, scan QR, onboarding par rôle
   (nécessite d'ajouter des `data-testid` sur les éléments concernés)

Chaque nouveau module testé à 100% doit être ajouté à `coverage.thresholds`
dans `vitest.config.ts` pour verrouiller sa couverture.
