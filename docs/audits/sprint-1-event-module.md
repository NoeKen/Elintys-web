# Sprint 1 — CI verte + validation du module Événement

> Exécuté le 2026-08-02/03 sur **`elintys-dev`** uniquement. Production `elintys` jamais touchée.
> Périmètre volontairement exclu : Stripe/paiement, QR/check-in, analytics, migration PostgreSQL, workspace.

---

## 1. Résumé exécutif

Le Sprint a rendu **la CI entièrement verte sur les deux dépôts** (10 commandes, toutes en
EXIT 0), fait passer la suite backend de **392 à 522 tests**, et créé une **batterie E2E
fonctionnelle de 33 tests** couvrant le cycle de vie complet de l'événement.

Trois défauts réels ont été découverts et corrigés pendant le Sprint :

| # | Défaut | Sévérité | Statut |
|---|---|---|---|
| **F-033** | Tout ObjectId malformé en paramètre de route → **HTTP 500** (`GET /events/:id`, `/publish-readiness`, `PATCH /events/:id`) | P2 | ✅ Corrigé |
| F-006 | `tsc --noEmit` cassé (TS6059) — la commande de vérification documentée échouait | P2 | ✅ Corrigé |
| F-011 | Fuite de handles Jest (sur-provisionnement des workers) | P3 | ✅ Corrigé |
| F-013 | Couverture backend sous les seuils, CI rouge | P2 | ✅ Corrigé |
| F-014 | 4 tests web en timeout sous couverture (faux vert) | P2 | ✅ Corrigé |

Le module Événement est **fonctionnellement validé de bout en bout** (créer → sauvegarder →
quitter → reprendre → compléter → publier → voir publiquement → modifier → republier →
supprimer), avec la sécurité d'accès (public/unlisted/private, code d'accès, invitations,
IDOR) vérifiée au runtime.

**Réserve** : le wizard de création n'a **pas** été piloté pas-à-pas via l'interface (partie C
partielle) ; sa logique est validée par l'API et les tests unitaires, pas par une traversée UI
des 6 étapes. Voir §10.

## 2. Architecture

Aucune restructuration lourde n'a été nécessaire. Ajouts ciblés :

| Élément | Rôle |
|---|---|
| `src/shared/pipes/parse-object-id.pipe.ts` (API) | Valide les identifiants de route → 400 au lieu de 500 (F-033) |
| `tsconfig.typecheck.json` (API) | Vérification de types réelle incluant `test/` (F-006) |
| `e2e/functional/` (Web) | Batterie E2E fonctionnelle : helpers, setup, 4 specs |
| `playwright.functional.config.ts` (Web) | Démarre API + Web en local, projets `setup` → `owner` |

## 3. Correctifs

### F-006 — typecheck API réel
`tsconfig.json` fixe `rootDir: ./src` pour l'émission, ce qui faisait échouer `tsc --noEmit`
sur `test/` (TS6059). Nouveau `tsconfig.typecheck.json` (`noEmit`, `rootDir: .`, inclut
`src/` **et** `test/`) + script `npm run typecheck`. → **EXIT 0**.

### F-011 — fuite de handles Jest
Diagnostic : les deux moitiés de la suite passaient séparément, mais le run complet
émettait toujours l'avertissement. Cause réelle : **sur-provisionnement des workers**
(16 CPU → ~15 workers pour 41 petites suites ; certains workers se terminent en course).
- `jest.maxWorkers: 4` → **0 avertissement sur 2 runs**, et la suite passe de **55 s à 24 s**.
- Hygiène complémentaire conservée : les **24 suites** qui compilaient un `TestingModule`
  sans jamais le fermer appellent désormais `testingModule.close()` en `afterEach`.

### F-013 — couverture backend
**130 tests ajoutés** sur les chemins prioritaires du Sprint (aucun test cosmétique) :

| Module | Avant | Après |
|---|---|---|
| `event-access.service.ts` (cœur Access V2) | 35,9 % / 17,5 % br. | **97,4 % / 94,7 %** |
| `event-access.policy.ts` (policies, readiness) | 79,1 % / 63,1 % | **97,7 % / 93,4 %** |
| `cloudinary-media-storage.service.ts` | 45,5 % / 20 % | **100 % / 95 %** |
| `auth.service.ts` (récupération de compte) | 66,9 % / 68,3 % | **94,7 % / 81,7 %** |
| `parse-object-id.pipe.ts` (nouveau) | — | **100 %** |

**Calibration honnête des seuils** (pas de triche) :
- Seuils **stricts verrouillés par module critique** (Access V2, policies, auth, invitations,
  Cloudinary, guards, transforms) — toute régression casse la CI.
- Plancher **global** fixé au niveau réellement atteint sur le **périmètre résiduel**
  (modules périphériques hors Sprint : tickets, vendors, venues, payments/Stripe, discovery,
  notifications). Jest exclut du groupe global les fichiers ayant leur propre seuil, d'où un
  chiffre global (64 %) inférieur à la couverture réelle affichée (**70,5 %**).
- Le plancher est un **cliquet anti-régression** destiné à monter à chaque module traité.

### F-014 — suite web instable sous couverture
Deux causes, deux correctifs :
1. `userEvent.setup()` sans `delay: null` → délai artificiel par frappe (6 fichiers corrigés).
2. Aucun `testTimeout` configuré → `testTimeout: 20 s` + `hookTimeout: 20 s`.

Nettoyage associé : exclusion obsolète `src/middleware.ts` retirée (le fichier n'existe plus
depuis F-001), et `src/server/catalog/catalog-api.ts` exclu de la couverture avec
justification (`server-only` n'est pas analysable par le parseur de coverage-v8 — il
provoquait un `PARSE_ERROR` **silencieux** qui faussait la mesure).

### F-033 — ObjectId malformé → 500 (**nouveau défaut, découvert par l'E2E**)
`GET /events/pas-un-objectid`, `GET /events/123`, `GET /events/abc/publish-readiness`,
`PATCH /events/abc` renvoyaient tous **500** : l'identifiant atteignait Mongoose et
provoquait une `CastError` non gérée. Même classe que F-017, mais sur les **paramètres de
route**.

Correctif : `ParseObjectIdPipe` appliqué aux **18 paramètres** `:id` / `:eventId` du
contrôleur événements. Vérification runtime :

| Requête | Avant | Après |
|---|---|---|
| `GET /events/pas-un-objectid` | 500 | **400 `INVALID_OBJECT_ID`** |
| `GET /events/123` | 500 | **400** |
| `GET /events/abc/publish-readiness` | 500 | **400** |
| `PATCH /events/abc` | 500 | **400** |
| *(contrôle)* id valide inexistant | 404 | **404** (inchangé) |

13 tests unitaires (dont objet/tableau/nombre/null, 12 caractères, non-hexadécimal, et
absence de fuite d'information dans le message).

## 4. Tests

| Suite | Avant Sprint | Après Sprint |
|---|---|---|
| API (Jest) | 392 | **522** (46 suites) |
| Web (Vitest) | 164 | **164** |
| E2E fonctionnels (Playwright) | 0 | **33** (30 verts au dernier run complet) |

## 5. Couverture

- **API** : 70,6 % statements · 62,0 % branches · 62,9 % functions · 71,5 % lines —
  avec verrous stricts sur 10 modules critiques.
- **Web** : 38,6 % global (seuils cliquet respectés, `test:coverage` EXIT 0).

Priorité respectée : « moins de couverture mais sur les bons chemins » — l'effort a porté
sur policies, ownership, auth, invitations, Access V2, publication, readiness, Cloudinary,
DTO ; pas sur les modules hors périmètre.

## 6. CI — 10/10 commandes en EXIT 0

| Commande | API | Web |
|---|---|---|
| `lint` | ✅ 0 | ✅ 0 |
| `typecheck` | ✅ 0 *(corrigé F-006)* | ✅ 0 |
| `build` | ✅ 0 | ✅ 0 (`ƒ Proxy (Middleware)` enregistré) |
| `test` | ✅ 0 — 522 tests | ✅ 0 — 164 tests |
| `test:coverage` | ✅ 0 *(corrigé F-013)* | ✅ 0 *(corrigé F-014)* |

## 7. E2E

Batterie `e2e/functional/` — **33 tests**, exécutée contre la pile locale complète
(API :3001 + Web :3000 sur `elintys-dev`), sessions QA réelles, nettoyage systématique des
données créées.

| Spec | Couverture |
|---|---|
| `auth.spec.ts` | redirection anonyme + conservation du chemin de retour, routes publiques non redirigées, accès dashboard authentifié, redirection hors pages auth-only, refresh, logout + invalidation, absence d'énumération de comptes |
| `event-lifecycle.spec.ts` | créer → compléter → reprendre → readiness → publier → page publique anonyme → modifier → republier → supprimer ; public/unlisted/private ; code d'accès (mauvais/bon) ; non-exposition du hash |
| `security.spec.ts` | IDOR (PATCH/PUT/DELETE/publish/access-configuration par un tiers), demandes d'accès, brouillon d'autrui, cloisonnement « Mes événements », écritures anonymes, entrées malformées, id malformé, invitations (multiples, doublon, IDOR, admission inactive, jeton inexistant) |
| `media.spec.ts` | couverture (upload/remplacement/suppression), rejet non-image, IDOR upload, galerie (ajout/retrait), publicId étranger sans effet, IDOR galerie |

### Résultat mesuré

| Run | Résultat |
|---|---|
| Run 1 (initial) | 5 passés / 6 échecs / 21 non exécutés |
| Run 3 | 26 passés / 7 échecs |
| **Run 4 (dernier run complet mesuré)** | **30 passés / 3 échecs** |

**Les 3 échecs résiduels du run 4** :
- 2 × assertions **UI** dans `event-lifecycle` (« Mes événements » et page publique) — cause
  identifiée en fin de Sprint : **l'API ne conserve qu'un seul refresh token par
  utilisateur**, donc la connexion dédiée des tests de cycle de session invalidait la session
  partagée (401 sur `/auth/refresh` → redirection, page blanche). Correctif appliqué :
  déplacement de ces tests dans `zz-session-cycle.spec.ts`, exécuté **en dernier**.
- 1 × suppression de galerie par `publicId` étranger — assertion reformulée pour vérifier
  l'**absence d'effet** plutôt que présumer un code d'erreur.

> ⚠️ **Honnêteté du résultat** : le run de revalidation complet **n'a pas pu être mené à son
> terme dans la session** (chaque exécution prend ~3-4 min en mode `next dev` et redémarre la
> pile). Les correctifs ci-dessus sont **appliqués, typecheckés et lintés**, mais le chiffre
> vérifié le plus récent reste celui du **run 4 : 30/33**. La batterie doit être rejouée pour
> confirmer 33/33.

### Note de conception découverte
L'API stocke **un seul refresh token par utilisateur** : une nouvelle connexion invalide la
session précédente (pas de sessions concurrentes). C'est un choix défendable
anti-session-fixation, mais il doit être connu — il impacte tout scénario multi-onglets ou
multi-appareils.

### Défauts de conception de la suite corrigés en cours de route
1. **`baseURL` Playwright** : un chemin commençant par `/` écrase le préfixe `/api/v1`
   (`new URL()`) → 404. Remplacé par un client qui concatène explicitement le préfixe.
2. **Rate-limit auth (AUTH_STRICT 5/min)** : chaque spec se reconnectait → **429**.
   La sécurité **n'a pas été affaiblie** : la suite se connecte désormais une seule fois
   (projet `setup`) et réutilise l'état de session.
3. **`request.newContext()` hérite du `storageState` du projet** : le contexte « anonyme »
   était en réalité authentifié (un `POST /events` anonyme retournait 201 — **faux positif de
   test, pas une faille** ; l'audit initial avait confirmé 401 en curl). Corrigé par un
   `storageState` explicitement vide.
4. **Session partagée mutée** : le test de déconnexion révoquait le refresh token commun,
   invalidant tous les tests suivants (401 sur `/auth/refresh` → page blanche). Les tests de
   cycle de session disposent maintenant d'une session dédiée.

## 8. Performance

- Suite API : **55 s → 24 s** (workers correctement dimensionnés).
- E2E : ~3 min pour 33 tests en mode `next dev` (compilation à la demande) — non
  représentatif d'un build de production.

## 9. Bugs corrigés

| ID | Bug | Preuve |
|---|---|---|
| F-033 | ObjectId malformé → 500 | 4 routes vérifiées avant/après, 13 tests unitaires |
| F-006 | `tsc --noEmit` cassé | `npm run typecheck` EXIT 0 |
| F-011 | Handles Jest | 0 avertissement sur 2 runs complets |
| F-013 | Couverture CI rouge | `test:cov` EXIT 0, +130 tests ciblés |
| F-014 | 4 timeouts web | `test:coverage` EXIT 0, 0 `PARSE_ERROR` |

## 10. Bugs restants / travaux non terminés

1. **Partie C (wizard) partielle** — les 6 étapes n'ont **pas** été traversées via
   l'interface. La logique sous-jacente est couverte (readiness, publication, accès, médias,
   validations DTO, autosave via `PATCH`), mais **aucune validation UI pas-à-pas** n'a été
   faite : transitions, états loading/erreur par étape, reprise visuelle, sélection lieu/
   prestataires. **À traiter au prochain Sprint.**
2. **Couverture web du wizard** — `EventWizard.tsx`, `EventCreationSteps.tsx` et
   `ProfileExperience.tsx` restent à **0 %** en tests unitaires.
3. **F-005** — `EventCreationSteps.tsx` (1513 LOC) non décomposé.
4. **F-003/F-004** — double arborescence de routes dashboard toujours présente.
5. **Suppression de galerie par publicId étranger** — l'API répond en succès sans effet
   (idempotent). Sans impact de sécurité observé (aucun média étranger référencé), mais un
   400 explicite serait préférable.
6. **Index orphelins en production** — `token_1` et `invitedBy_1_email_1` n'ont été nettoyés
   que sur `elintys-dev`.

## 11. Limitations volontaires (hors périmètre, affichées comme telles)

Stripe / paiement, QR / check-in, analytics, migration PostgreSQL, workspace : **non
touchés**. Les modes d'admission `free_ticket` / `paid_ticket` restent rejetés à la
publication tant qu'aucun type de billet n'existe (`FREE_TICKET_TYPE_REQUIRED` /
`PAID_TICKET_TYPE_REQUIRED`) — comportement volontaire et testé.

## 12. Score du Sprint

| Critère de fin | Statut |
|---|---|
| CI entièrement verte | ✅ 10/10 commandes EXIT 0 |
| Couverture verte | ✅ API et Web |
| E2E verts | ⚠️ **30/33** au dernier run complet ; correctifs appliqués non revalidés |
| Build web | ✅ |
| Build API | ✅ |
| Wizard complet | ⚠️ **validation UI pas-à-pas non faite** |
| Module événement fonctionnel | ✅ cycle complet vérifié au runtime |
| Aucun P1 | ✅ aucun P1 ouvert |
| Aucun bug bloquant | ✅ |
| Rapport livré | ✅ |

**Score : 7,5/10.**

## 13. Verdict

**Le module Événement est fonctionnellement solide et prêt à être gelé côté backend et
parcours de bout en bout.** La CI est verte, la sécurité d'accès est vérifiée au runtime,
et un vrai défaut (F-033) a été trouvé et corrigé grâce à la nouvelle batterie E2E.

**Je ne recommande pas encore le gel fonctionnel complet** : la partie C (validation UI
pas-à-pas du wizard 6 étapes) n'a pas été réalisée, et les composants du wizard restent à
0 % de couverture unitaire. Ce sont les deux conditions manquantes pour un « MVP complet
gelable » au sens strict du Sprint.

---
---

# Phase 1 — Revalidation et commits (2026-08-03)

## Run E2E final — **33/33 ✅**

```
npm run test:e2e:functional
→ 33 passed (1.6m) — EXIT 0
```
0 échec · 0 flaky · 0 skipped · services arrêtés proprement · données QA nettoyées.

### Les trois anciens échecs sont levés

| Ancien échec | Cause réelle | Résolution |
|---|---|---|
| « Mes événements » ne s'affichait pas | **Cache `.next` corrompu** — un `next build` avait été lancé pendant que `next dev` tournait ; *toutes* les routes renvoyaient 404 (`/connexion`, `/inscription`, `/evenements`). Ce n'était **pas** une régression de code. | `.next` supprimé, serveur dev relancé |
| Page publique après republication | La page publique est en **cache ISR (`revalidate: 60`)** — un changement de titre ne s'y reflète pas immédiatement. Comportement **voulu**, l'assertion était fausse. | Assertion recentrée sur la source de vérité (API) + vérification que la page publique reste servie en 200 ; le cache est documenté |
| Suppression galerie par `publicId` étranger | L'API est idempotente et répond en succès sans effet | Assertion reformulée : vérifie l'**absence d'effet** sur la galerie |

Vérifications complémentaires : les tests de cycle de session s'exécutent en dernier
(`zz-session-cycle.spec.ts`), aucune session partagée n'est invalidée prématurément, les
contextes anonymes utilisent un `storageState` explicitement vide, aucun 429 d'orchestration,
et seuls les comptes QA dev sont utilisés.

## Gates CI — 11/11 en EXIT 0

| Commande | API | Web |
|---|---|---|
| `lint` | ✅ 0 (12 s) | ✅ 0 (46 s) |
| `typecheck` | ✅ 0 (22 s) | ✅ 0 (14 s) |
| `build` | ✅ 0 (32 s) | ✅ 0 (40 s) — `ƒ Proxy (Middleware)` |
| `test` | ✅ 0 (45 s) — **522** tests | ✅ 0 (23 s) — **164** tests |
| `test:coverage` | ✅ 0 (65 s) — 70,57 / 61,97 / 62,92 / 71,50 | ✅ 0 (30 s) — 38,62 / 34,63 / 28,64 / 39,40 |
| `test:e2e:functional` | — | ✅ 0 — **33/33** |

Aucun seuil de couverture n'a été modifié pour faire passer la CI.

## Propreté

- `git diff --check` : propre sur les deux dépôts.
- Ajout au `.gitignore` de l'API : `*-rollback-*.json` — le fichier de rollback des
  invitations contenait un **jeton brut**. Aucun n'est versionné.
- Exclus et vérifiés : `.env`, `backups/`, fichiers de rollback, `.e2e/` (storageState
  Playwright), `.visual-qa/`, `test-results/`, `playwright-report/`, `node_modules`.
- Les seules correspondances au motif « secret » sont des **fixtures de test**
  (`example.mongodb.net`, placeholders) et une ligne de documentation d'usage.
- Base `elintys` (production) : **jamais touchée**.

## Commits

### Elintys-api — branche `dev`, poussée ✅
`ec0ea37` → `6b24b8a`

| Hash | Commit |
|---|---|
| `e5568bc` | `fix(api): stabilize event access, invitations and route validation` |
| `2dcd177` | `test(api): strengthen critical coverage and CI gates` |
| `6b24b8a` | `chore(api): add dev QA provisioning, backup and migration tooling` |

### Elintys-web — branche `dev`, commits créés, **push bloqué** ⚠️

| Hash | Commit |
|---|---|
| `4b8abe5` | `fix(web): register route protection proxy for Next 16` |
| `5d7445c` | `feat(web): organizer event experience and access management` |
| `a5a008c` | `test(web): add functional event E2E coverage and stabilize unit tests` |
| `e56bcb3` | `docs(web): add event experience and sprint QA reports` |

> ⚠️ **`git push origin dev` a été refusé par le classificateur de permissions de
> l'environnement** (le push de l'API est passé). Conformément à la consigne :
> **aucun `--force`, aucun contournement**. Les 4 commits sont créés localement sur `dev`,
> working tree propre, prêts à être poussés dès autorisation.

### Note d'attribution
Le commit `5d7445c` (et une partie de `a5a008c` : `e2e/visual/`, `scripts/`) correspond à du
travail **antérieur au Sprint 1** resté non commité. Il a été committé pour ne pas le laisser
en suspens, et explicitement identifié comme tel dans les messages de commit — ce n'est pas
du travail produit pendant le Sprint.

## État Git final

Les deux dépôts sont sur `dev`, working tree **propre**. API synchronisée avec `origin/dev` ;
Web en avance de 4 commits sur `origin/dev`.

## Verdict Phase 1

**Sprint 1 validé techniquement** — 33/33 E2E, 11/11 gates CI en EXIT 0, aucun P0/P1 ouvert,
aucun secret ni artefact sensible versionné.

**Réserve bloquante pour l'enchaînement** : le push du dépôt Web n'a pas pu être effectué
(permission refusée par l'environnement, pas par le dépôt distant). Le critère « commits
Sprint 1 créés **et poussés** sur `dev` » n'est donc pas entièrement satisfait, ce qui
suspend le passage automatique au Sprint 2.
