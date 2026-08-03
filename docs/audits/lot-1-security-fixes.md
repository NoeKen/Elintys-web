# Lot 0 + Lot 1 — Corrections sécurité / gate d'auth

> Phase de correction validée par le propriétaire (ordre : Lot 0 → Lot 1).
> Aucune donnée de production touchée. Toutes les écritures QA ciblent **`elintys-dev`**
> (garde dure `elintys-dev` dans le script de provisioning). Mot de passe QA jamais loggé.
> Après ce lot : **arrêt et attente de validation avant le Lot 3.**

---

## Lot 0 — Compte QA dev (débloque F-015)

### Cause racine
`E2E_TEST_EMAIL` (`@elintys.com`) inexistant dans le cluster ; de plus, l'environnement
local pointait sur une base fantôme (`elintys-test`) à côté d'une base **production
`elintys`** et de la base dev **`elintys-dev`**. Risque de toucher des comptes réels.

### Décisions (validées)
- Cible = **`elintys-dev`** ; **`elintys` = production intouchable**.
- **2 comptes seulement** (pas de seed complet).

### Actions
- Repointage de `Elintys-api/.env` → base `elintys-dev` (secret non exposé) + `ELINTYS_ENV=dev`.
- Nouveau script **`src/scripts/provision-qa-users.ts`** (npm `qa:provision`) :
  - **Garde dure** : refuse si `ELINTYS_ENV !== 'dev'` ou si la base connectée ≠ `elintys-dev`.
  - Upsert idempotent de 2 comptes **organisateur, email vérifié, sans admin** :
    - `qa-organisateur@demo.elintys.com` (propriétaire)
    - `qa-tiers@demo.elintys.com` (tiers, pour IDOR)
  - Mot de passe via `E2E_TEST_PASSWORD` (bcrypt rounds 12), **jamais hardcodé ni loggé**.
  - Procédure de rotation documentée en tête de script.
- Identifiants écrits dans `Elintys-web/.env` (gitignoré) : `E2E_TEST_EMAIL`,
  `E2E_TEST_EMAIL_SECONDARY`, `E2E_TEST_PASSWORD`.

### Validation runtime (élintys-dev)
| Test | Résultat |
|---|---|
| login propriétaire | **200**, cookies `access_token`+`refresh_token` **HttpOnly** |
| GET /auth/me | **200** (organisateur, vérifié) |
| refresh | **200** |
| login tiers | **200** |
| logout puis /auth/me | **200** puis **401** |
| owner crée un événement | **201** |
| **tiers PATCH / DELETE l'événement du owner** | **403 `EVENT_NOT_OWNER`** (ownership OK) |
| owner lit / supprime son événement | 200 / 204 (nettoyé) |

➡️ **F-015 corrigé**. Ownership/IDOR serveur **confirmé robuste** (positif).

---

## Lot 1 — Sécurité / gate d'auth

### F-001 — Protection frontend (P1) — CORRIGÉ
**Cause racine (prouvée au niveau source)** : `next/dist/build/index.js` ne scanne la
convention middleware/proxy qu'au **niveau `src/`** (`rootDir = parent de app/`), et
n'accepte que `fileDir === '/'` ou `'/src'`. Le fichier était à la **racine du dépôt**
(`proxy.ts`) → jamais scanné. Next 16 a renommé la convention `middleware` → **`proxy`**
(l'ancien nom est déprécié).

**Correctif** :
- `proxy.ts` (racine) → **`src/proxy.ts`** (import cookies ajusté).
- Ajout des préfixes manquants (**F-004**) : `/organisateur`, `/prestataire`,
  `/gestionnaire`, `/scan`.
- **Matching par segment** (`=== p || startsWith(p + '/')`) pour ne pas confondre le
  catalogue public `/prestataires` avec le dashboard `/prestataire`.
- **Garde open-redirect** : le paramètre `redirect` n'accepte qu'un chemin interne.

**Preuves** :
- Build : log `ƒ Proxy (Middleware)` + `functions-config-manifest.json` contient
  `/_middleware` avec le bon matcher (là où l'ancien build montrait un manifest vide).
- Runtime (build prod, `next start`) :

| Requête | Avant | Après |
|---|---|---|
| anonyme `/tableau-de-bord`, `/organisateur`, `/prestataire`, `/gestionnaire`, `/scan/*` | 200 | **307 → /connexion?redirect=…** |
| public `/`, `/evenements`, `/lieux`, **`/prestataires`** | 200 | **200** (pas de faux positif) |
| authentifié `/tableau-de-bord` | 200 | **200** |
| connecté sur `/connexion` | 200 | **307 → /tableau-de-bord** |

- Tests : `src/proxy.test.ts` — **9 tests** (anonyme, authentifié, session expirée, public,
  segment, auth-only, open-redirect). Verts.

> Note doc : la référence `src/middleware.ts` du `CLAUDE.md` web est obsolète (→ `src/proxy.ts`).
> Non modifiée ici (documentation générale → Lot 7).

### F-002 — Rate-limit auth (P2) — CORRIGÉ
- Tiers centralisés dans **`src/config/throttle.config.ts`** (`PUBLIC_READ`, `AUTH_STRICT`,
  `FORGOT_PASSWORD`, `ACCESS_CODE`, `INVITATION_ACCEPT`).
- Global : `default` = **PUBLIC_READ (300/60 s)** (auparavant 100/60 s unique).
- `@Throttle({ default: AUTH_STRICT (5/60 s) })` sur `register`, `login`, `reset-password`,
  `verify-email`, `resend-verification` ; `FORGOT_PASSWORD (5/15 min)` sur `forgot-password`.
- Les endpoints `access/code/verify` et `invitations/accept/:token` avaient **déjà** un
  throttle dédié (5–10/min) — conservé (pas de doublon).

**Preuve runtime** : burst sur un endpoint AUTH_STRICT → **5 passent puis 429** dès le 6e.

### F-017 — DTO transforms type-safe (P2) — CORRIGÉ
**Cause racine** : `@Transform(({value}) => value?.trim().toLowerCase())` s'exécute avant
la validation ; `value?.` ne protège pas contre un **objet** → `value.trim` indéfini →
TypeError → **500**.

**Correctif** : helpers **`src/shared/utils/transform.ts`** (`trimValue`, `trimLowerValue`)
type-safe (`typeof value === 'string' ? … : value`). **26 DTO** migrés (58 usages).

**Preuves** :
- Unit : `transform.spec.ts` — **13 tests** adversariaux (objet, tableau, nombre, booléen,
  null, undefined, chaîne vide, espaces). Verts.
- Runtime : `login`, `forgot-password`, `register`, `waitlist` avec `email` = objet /
  tableau / nombre → **400 structuré** (auparavant **500**).

### F-019 — Throttling public (P2) — CORRIGÉ
Tier public relevé (100 → 300/min par route).
- Navigation légitime : 25 GET publics séquentiels → **25×200, 0×429**.
- Load-test rejoué (`k6`, débit soutenu **4 req/s**, charge réduite documentée) :
  **0 % d'échec**, 81/81 checks 200, p95 = 132 ms.
- *(Un flood mono-IP à 500 req/s déclenche toujours le throttle — comportement anti-abus
  attendu, ce n'est pas de la « charge légitime ».)*

---

## Vérification globale (avant/après)

| Gate | Avant | Après |
|---|---|---|
| API `npm test` | 335 | **348** (41 suites) ✓ |
| API `nest build` / lint | ✓ / ✓ | **✓ / ✓ (0)** |
| Web `npm test` | 155 | **164** (26 fichiers) ✓ |
| Web `typecheck` | ✓ | **✓** |
| Web `next build` | ✓ | **✓** (`ƒ Proxy (Middleware)`) |

## Fichiers modifiés
**API** : `app.module.ts`, `auth/auth.controller.ts`, **26 DTO**, `package.json` (+`qa:provision`).
Nouveaux : `config/throttle.config.ts`, `shared/utils/transform.ts` (+`.spec`),
`scripts/provision-qa-users.ts`. (`.env` repointé — gitignoré.)
**Web** : `proxy.ts` (racine) → `src/proxy.ts` (+`src/proxy.test.ts`). (`.env` E2E — gitignoré.)

## Risques & rollback
- **Risque throttle** : 300/min public pourrait être trop bas derrière un NAT à fort trafic ;
  ajustable via `throttle.config.ts` sans toucher aux contrôleurs.
- **Risque proxy** : la protection edge est de l'UX ; l'API reste la barrière réelle
  (ownership 403 confirmé). Aucune règle d'autorisation déplacée hors backend.
- **Rollback** : `git checkout` des fichiers listés + `git mv src/proxy.ts proxy.ts` ;
  restaurer `ThrottlerModule.forRoot([{ttl:60000,limit:100}])` ; les comptes QA (dev) et le
  script sont sans impact prod.

## Findings — statut
| Finding | Sévérité | Statut |
|---|---|---|
| F-001 | P1 | **Corrigé (Lot 1)** — testé unit + runtime |
| F-002 | P2 | **Corrigé (Lot 1)** — 429 après 5 |
| F-004 | P2 | **Corrigé (Lot 1)** — préfixes ajoutés |
| F-015 | P2 | **Corrigé (Lot 0)** — 2 comptes QA dev |
| F-017 | P2 | **Corrigé (Lot 1)** — 400 au lieu de 500 |
| F-019 | P2 | **Corrigé (Lot 1)** — 0 % échec à charge légitime |

**Reste ouvert** (lots suivants, non commencés) : F-003, F-005, F-006, F-007–F-014 (hors
F-015), F-016, F-020–F-025.
