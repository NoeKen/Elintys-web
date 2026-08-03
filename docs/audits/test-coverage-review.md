# Revue tests & couverture — Elintys

> Commandes exécutées avec code de sortie réel. **Principe** : une commande n'est « verte »
> que si son exit code est 0. Un `npm test` au vert ne prouve pas la CI.

## Verdict : 5/10 — beaucoup de tests, mais la CI de couverture est **rouge** sur les 2 repos

## Résultats mesurés
| Commande | Repo | Résultat | Exit |
|---|---|---|---|
| `npm run lint` | web | 0 erreur, **11 warnings** | 0 |
| `npm run typecheck` | web | propre (0 `any`) | 0 |
| `npm test` (vitest) | web | **155/155** | 0 |
| `npm run test:coverage` | web | **4 tests échouent** (timeouts 5 s) | **1** |
| `next build` | web | OK | 0 |
| `npm run lint` | api | 0 problème | 0 |
| `npx tsc --noEmit` | api | **échoue** (TS6059) | **≠0** |
| `nest build` | api | OK | 0 |
| `npm test` (jest) | api | **335/335** (fuite handles) | 0 |
| `npm run test:cov` | api | **seuils non atteints** | **1** |

## Findings

### F-013 — P2 — Couverture backend sous les seuils (CI rouge)
`jest --coverage` : **statements 68.48 %** (seuil 80), **branches 55.38 %** (seuil 70),
**functions 55 %** (seuil 80), **lines 70.15 %** (seuil 80). Les 335 tests passent mais les
seuils du `package.json:93` ne sont pas atteints → `test:cov` **exit 1**. Branches/functions
faibles = **chemins d'erreur et guards peu testés**. *Reco* : cibler les branches d'erreur /
policies d'accès, ou ajuster les seuils sciemment. *Effort* : L.

### F-014 — P2 — Suite web instable sous couverture (faux vert)
`npm run test:coverage` **exit 1** : 4 timeouts (`EventCreationWizard.test.tsx` ×2,
`RegisterStep1Form.test.tsx` ×2, « Test timed out in 5000ms »). `npm test` seul passe →
le vert simple **masque** l'échec de la commande utilisée en CI. L'instrumentation V8
ralentit les tests `userEvent` sur composants lourds (corrèle avec F-005). *Reco* : augmenter
`testTimeout`, alléger/découper les composants. *Effort* : M.

### F-011 — P3 — Fuite de handles Jest
« A worker process has failed to exit gracefully… tests leaking due to improper teardown. »
Timers/connexions non fermés → CI lente/instable. *Reco* : teardown `afterAll`, `--detectOpenHandles`.

### F-006 — P2 — Pas de script `typecheck` fiable côté API (cf. backend-architecture-review)

## Non exécuté
- **E2E Playwright** (`test:e2e` web, `jest-e2e` api) : dépendent d'un compte QA valide →
  **bloqués par F-015**. Le mandat insiste : « des tests unitaires ne compensent pas
  l'absence d'E2E ». Les E2E authentifiés restent donc **non prouvés**.
- Détection de code mort outillée (au-delà des `{dto}` et routes dupliquées repérés).

## Synthèse
490 tests unitaires est un bon socle, **mais** : (1) la couverture réelle backend est loin
des 80 % affichés, (2) la commande de couverture échoue sur les deux repos, (3) aucun E2E
n'a pu être exécuté. La confiance « tests » doit être revue à la baisse tant que la CI de
couverture n'est pas verte et que les E2E authentifiés ne tournent pas.
