# Elintys — Rapport d'état initial (pré-audit)

> **Phase 1 — Audit en lecture seule.** Aucun fichier applicatif n'a été modifié
> pour produire ce rapport. Il documente l'état réel de l'écosystème avant toute
> exécution de commande ou correction.
>
> - **Date** : 2026-08-02
> - **Auditeur** : équipe d'audit (architecture / sécurité / perf / QA / design / DevOps)
> - **Méthode** : inspection filesystem + git + configuration. Chaque affirmation
>   ci-dessous est traçable à un fichier/ligne ou à une sortie de commande.

---

## 0. Périmètre réellement présent sur disque

Racine : `<racine du projet>/`

| Projet | Présent | Rôle | Git |
|---|---|---|---|
| `Elintys-web` | ✅ | Frontend Next.js (App Router) | repo git, branche `dev` |
| `Elintys-api` | ✅ | Backend NestJS | repo git, branche `dev` |
| `Elintys-LP` | ✅ | Landing page (hors périmètre de cet audit) | — |
| `elintys-video`, `iphone-flyer`, `elintys_design`, `elintys-web-ex` | ✅ | Assets / prototypes (hors périmètre) | — |

> ⚠️ La racine `<racine du projet>/` **n'est pas** un repo git ;
> `Elintys-web` et `Elintys-api` sont deux repos git **indépendants**.

---

## 1. Versions des frameworks (installées vs documentées)

| Élément | package.json | **Réellement installé** | CLAUDE.md dit | Verdict |
|---|---|---|---|---|
| Node (runtime local) | — | **v24.14.1** | Web: n/a · API: « Node 20 LTS » | ⚠️ API doc obsolète (`engines.node=22.x`) ; local sur 24 |
| npm | — | 11.11.0 | — | — |
| Next.js | `16.2.12` | **16.2.12** | « Next.js 15 App Router » | ⚠️ **Doc obsolète** (Next 16) |
| React | `19.2.8` | **19.2.8** | React 19 implicite | ✅ |
| NestJS core | `^11.1.19` | **11.1.19** | NestJS 11 | ✅ |
| Mongoose | `^8.23.0` | **8.24.2** | Mongoose 8 | ✅ |
| TypeScript | `^5.9.3` | 5.9.x | strict | ✅ |

### Dérives documentation ⇄ réalité déjà confirmées (findings préliminaires)

- **PRE-01** — `Elintys-web/CLAUDE.md` interdit **axios** (« utiliser fetch natif »)
  mais `axios@1.19.0` est **installé et déclaré** en dépendance
  (`package.json:35`). → drift + violation de règle interne.
- **PRE-02** — `Elintys-web/CLAUDE.md` déclare **Zustand** comme couche d'état
  cliente ; `zustand` **n'est pas installé** (`node_modules/zustand` absent) et
  absent de `package.json`. → stack documentée ≠ stack réelle.
- **PRE-03** — `Elintys-web/CLAUDE.md` annonce « Next.js 15 » ; le projet tourne
  sur **Next 16.2.12** (rupture de convention *middleware → proxy*, cf. §7).
- **PRE-04** — `Elintys-api/CLAUDE.md` : « Runtime Node 20 LTS » + « Déployé sur
  **Railway** » ; réalité : `engines.node="22.x"` (`package.json:74`) et
  déploiement **Render** (`render.yaml`). → doc obsolète.
- **PRE-05** — `Elintys-web/CLAUDE.md` (référence rapide) pointe
  `src/middleware.ts` : **ce fichier n'existe pas** (ni `src/middleware.ts` ni
  `middleware.ts` racine). La logique vit dans `proxy.ts` racine (Next 16).

---

## 2. État git (branches, commits, travail non commité)

### Elintys-web — branche `dev`
Dernier commit : `1a9c76f feat: surface event access policies and form errors`

**Fichiers modifiés non commités (working tree sale) :**
```
 M .gitignore, package.json, package-lock.json
 M src/app/(dashboard)/error.tsx, loading.tsx
 M src/app/(dashboard)/organisateur/{evenements/page,page}.tsx
 M src/app/(dashboard)/tableau-de-bord/{evenements/[id]/page,evenements/page,page}.tsx
 M src/components/events/DashboardEventCard.tsx
 M src/features/events/components/EventPageClient.tsx
 M src/features/events/services/events.service.ts
 M src/features/events/types/index.ts
 M src/shared/layout/{MobileNav,Topbar}.tsx
?? docs/audits/*.md (3 audits non suivis)
?? e2e/visual/, playwright.visual.config.ts, scripts/
?? src/app/(dashboard)/tableau-de-bord/evenements/[id]/acces-et-inscriptions/
?? src/app/(dashboard)/tableau-de-bord/evenements/[id]/layout.tsx
?? src/components/events/organizer/
?? src/features/events/i18n/organizer-event.copy(.test).ts
?? src/features/events/services/events.service.test.ts
```

### Elintys-api — branche `dev`
Dernier commit : `ec0ea37 feat: enforce event access and admission policies`

**Fichiers modifiés non commités :**
```
 M src/modules/events/event-access.service.spec.ts
 M src/modules/events/event-access.service.ts
```

> ⚠️ **Les deux repos ont du travail non commité et non poussé.** Toute mesure
> (tests, build) reflète cet état de working tree, pas un commit reproductible.
> La couverture fonctionnelle « accès/inscriptions événement » est en cours
> d'implémentation (fichiers `??` récents), donc **partielle par définition**.

---

## 3. Architecture globale

### Elintys-web (Next.js 16 App Router — 274 fichiers `.ts/.tsx`, 29 fichiers de test)
Organisation **hybride** : App Router (`src/app`) **+ architecture par features**
(`src/features/*`) **+ `src/shared/*`** **+ un dossier `src/server/*`** (auth,
api, catalog server-side). Zones de routes :

```
(auth)/          connexion, inscription (étapes 1-2), onboarding {organisateur,
                 prestataire, gestionnaire}, mot-de-passe-oublié, vérification-email
(public)/        évènements[/slug], lieux[/id], prestataires[/id], checkout,
                 paiement {succès,annulé}, invitation, légal (×6), landing
(dashboard)/     tableau-de-bord/*, organisateur/*, prestataire/*, gestionnaire/*,
                 billetterie, invites, parametres
(event-creation)/ wizard de création + configuration [id]
(scan)/          scan[eventId] (QR)
```

- `'use client'` : **49 fichiers** (à corréler avec la règle « pousser le plus bas
  possible » — cf. audit archi frontend).
- **`: any` / `as any` / `@ts-ignore` : 0 occurrence** dans `src/` → discipline TS
  forte (à confirmer au typecheck).
- Duplication apparente de routes : `tableau-de-bord/gestionnaire/*` **et**
  `gestionnaire/*`, `tableau-de-bord/prestataire/*` **et** `prestataire/*` →
  suspicion de **double arborescence** organisateur (à investiguer, potentiel
  code mort / routes fantômes).

### Elintys-api (NestJS 11 — 168 fichiers `.ts`, 40 `.spec.ts`, 15 controllers)
Modules présents : `ai, auth, discovery, emails, events, favorites, guests,
health, invitations, media, notifications, payments, reviews, tickets, vendors,
venues, waitlist`.

- **`process.env` en accès direct : 30 occurrences** alors que
  `CLAUDE.md` impose `ConfigService.getOrThrow()` (ex. `main.ts:27,30,36`). → dette/règle violée.
- `@Public()` : **26 routes publiques** (à cartographier pour l'audit IDOR/autz).
- `: any` : **1 occurrence** (à localiser).
- **Artefact `{dto}`** : 10 dossiers littéralement nommés `{dto}` **vides**
  (`src/modules/{ai,events,tickets,vendors,payments,favorites,discovery,venues,reviews,guests}/{dto}`)
  — résidu d'un `mkdir` avec brace-expansion échoué, à côté des vrais `dto/`.
  → **code mort / bruit de repo** (PRE-06).

---

## 4. Sécurité — posture de base observée (à approfondir en Phase 6)

**Points positifs confirmés (`Elintys-api/src/main.ts`) :**
- `helmet()` actif (`main.ts:32`).
- CORS à **origines explicites** + `credentials:true`, refus par défaut
  (`main.ts:45-64`) ; assouplissement réseau local **uniquement hors production**.
- Guards **globaux** `JwtAuthGuard` + `RolesGuard` (`main.ts:69`).
- `ValidationPipe` strict : `whitelist + forbidNonWhitelisted + transform`
  (`main.ts:71-77`).
- Stripe : `rawBody:true` configuré (`main.ts:21`) → vérif signature webhook possible.
- Cookies auth : `httpOnly:true, sameSite:'lax', secure:config`
  (`auth.controller.ts:38-40`).
- `.env` / `.env.local` **gitignorés** ; `.env.example` ne contient que des
  **placeholders** (`sk_test_...`, `whsec_...`, `mongodb+srv://<user>...`) → pas
  de secret commité détecté.

**Risques / à vérifier (findings préliminaires) :**
- **PRE-07 (P2)** — **Pas de rate-limit dédié sur l'auth.** `ThrottlerGuard`
  global = **100 req / 60 s** (`app.module.ts:47,65`) ; `grep '@Throttle'
  src/modules/auth` = **0**. → ~100 tentatives de mot de passe/min possibles.
  Le CLAUDE.md exige explicitement un rate-limit sur `/auth/login` et
  `/auth/forgot-password`.
- **PRE-08 (P3/observabilité)** — **Swagger exposé sur le déploiement dev.**
  `render.yaml` fixe `NODE_ENV=production` **et** `ENABLE_SWAGGER="true"` →
  `/api/docs` publiquement servi (surface d'API énumérable). Acceptable en dev,
  à cloisonner avant prod publique.
- **PRE-09 (P1 — à VÉRIFIER au build)** — **Protection des routes dashboard
  potentiellement inactive.** Web sur Next 16 utilise `proxy.ts` (nouveau nom du
  middleware) ; or `.next/server/middleware-manifest.json` montre une **map
  `middleware` vide (`{}`)**. Si `proxy.ts` n'est pas enregistré, les redirections
  d'auth côté edge ne s'appliquent pas. À confirmer par un build propre.
  *Note : l'enforcement réel des données reste côté API (guards), donc impact
  probable = UX/redirection, pas fuite de données — à qualifier.*
- IDOR / ownership / cross-role : **non encore testés** (Phase 6).

---

## 5. Environnement de test, URLs et base réellement utilisée

| Élément | Valeur observée | Source |
|---|---|---|
| API locale attendue | `http://localhost:4000/api/v1` | web CLAUDE.md / `.env` |
| Web local | `http://localhost:3000` | CLAUDE.md |
| Déploiement web | Vercel — `elintys.com` (dossier `.vercel/` présent) | CLAUDE.md |
| Déploiement API | **Render** — service `elintys-api-dev`, branche `dev`, region ohio, **plan free**, health `/api/v1/health` | `render.yaml` |
| API prod URL (dev deploy) | `FRONTEND_URL=https://dev.elintys.com` | `render.yaml:47` |
| **Base de données** | **MongoDB Atlas** (`MONGODB_URI`, `sync:false` sur Render) | `render.yaml:26`, `.env` |
| Migration cible | PostgreSQL évoquée (Phase 2, `TICKET_PURCHASE`) | CLAUDE.md |
| Media | **Cloudinary** (`res.cloudinary.com` autorisé dans `next.config.ts:15-18`) | `next.config.ts` |
| Compte QA E2E | `E2E_TEST_EMAIL` / `E2E_TEST_PASSWORD` (via `.env`, **non hardcodés**) | `.env` |

**Outillage de test disponible :**
- Web : **Vitest** (unit + coverage v8), **Playwright** (`test:e2e` + `test:visual`
  via `playwright.visual.config.ts`), **@axe-core/playwright** (a11y).
- API : **Jest** (+ ts-jest), **Supertest**, seuils de couverture **imposés**
  (statements/lines/functions 80 %, branches 70 % — `package.json:93-100`).
- Scripts de migration API : `media:migrate`, `event-access:migrate`, `seed:dev`
  (ts-node).

---

## 6. Couverture fonctionnelle (déclarée) — statut réel à valider

| Domaine | Routes/modules présents | Statut présumé |
|---|---|---|
| Auth (inscription/login/refresh/reset) | web `(auth)/*` + api `auth` | à tester end-to-end |
| Création d'événement (wizard 6 étapes) | `(event-creation)/*` + api `events` | **en cours** (fichiers `??` récents) |
| Accès & inscriptions événement | `.../[id]/acces-et-inscriptions/` (non commité) | **partiel/en cours** |
| Espace organisateur | `organisateur/*`, `.../evenements/[id]/*` | à tester |
| Pages publiques (event/lieu/prestataire) | `(public)/*` | à tester |
| Billetterie / paiement Stripe | web `checkout`, `paiement/*` + api `payments` | à tester (dépend Stripe) |
| Invitations | web `invitation` + api `invitations` | à tester |
| Media/Cloudinary | api `media` | à tester (dépend creds) |
| Chat / ententes / offres (Phase 2) | — | **non implémenté (attendu)** |

> **Principe appliqué** (cf. mandat) : une fonctionnalité dont l'UI existe mais
> dont la persistance/l'enforcement backend n'est pas prouvé sera classée
> **partielle**, pas validée.

---

## 7. Risques immédiats (synthèse à ce stade)

1. **PRE-09 (P1 à confirmer)** — middleware `proxy.ts` possiblement non
   enregistré → gate d'auth edge inopérant.
2. **PRE-07 (P2)** — absence de rate-limit dédié anti-brute-force sur l'auth.
3. **Working tree sale sur les 2 repos** — build/tests non reproductibles depuis
   un commit ; fonctionnalité « accès/inscriptions » en cours.
4. **Drift doc ⇄ code** (PRE-01→06) — CLAUDE.md décrit une stack/déploiement
   partiellement faux (axios, zustand, Next 15, Railway, Node 20) → risque de
   décisions basées sur de fausses hypothèses.
5. **Plan Render `free`** — cold starts, pas d'autoscaling, coupures →
   résilience/observabilité à évaluer (Phase 14-15).

---

## 8. Commandes qui SERONT exécutées (Phase 3+ — lecture/CI, non destructives)

> Aucune ne modifie le code source. `build` écrit dans `.next/`/`dist/`
> (artefacts gitignorés). Aucun script de migration/seed ne sera lancé sans
> dry-run et validation explicite.

**Elintys-web :**
```bash
npm run lint            # eslint
npm run typecheck       # tsc --noEmit
npm run test            # vitest run
npm run test:coverage   # vitest run --coverage
npm run build           # next build  (+ vérif middleware-manifest → PRE-09)
npm audit --omit=dev    # vulnérabilités dépendances (lecture)
# E2E/visuels (Playwright) et Lighthouse : Phase ultérieure, nécessitent web+api lancés
```

**Elintys-api :**
```bash
npm run lint            # eslint
npx tsc --noEmit        # typecheck
npm run test            # jest (unit + mongodb-memory-server)
npm run test:cov        # jest --coverage (seuils 80/70)
npm run build           # nest build
npm audit --omit=dev
# test:e2e (jest-e2e), load testing (k6/autocannon), inspection Mongo : Phase ultérieure
```

**Phases nécessitant infrastructure lancée + validation (NON exécutées ici) :**
E2E authentifiés + storageState, captures visuelles multi-viewports,
Lighthouse/Core Web Vitals, load testing k6, inspection MongoDB live,
`/design-review`, `/qa`, `/code-review`.

---

## 9. Ce qui n'a PAS encore été fait (transparence)

- Aucune commande de build/test encore exécutée à l'écriture de ce rapport
  (§8 = plan). Les résultats seront consignés dans les rapports dédiés.
- Aucun test de sécurité actif (IDOR, injection, upload) — Phase 6.
- Aucune mesure de performance réelle — Phase 7.
- Aucune inspection de la base MongoDB — Phase 13.
- Aucune correction appliquée — conforme au mandat (audit lecture seule d'abord).

---

*Fin du pré-audit. Étape suivante : exécution des gates statiques (§8) puis
consignation des résultats.*
