# Revue d'architecture backend — Elintys-api

> NestJS 11.1.19 · Mongoose 8.24 · 168 fichiers `.ts` · 40 `.spec.ts` · 18 modules · 90 routes.

## Verdict : 7/10 — structure propre et disciplinée, quelques dettes ciblées

## Points forts
- **Découpage modulaire net** : `auth, events, vendors, venues, tickets, guests, payments,
  reviews, favorites, discovery, ai, invitations, notifications, media, emails, health,
  waitlist`. Couches respectées (controller → service → schema/DTO).
- **Guards globaux** `JwtAuthGuard` + `RolesGuard` (`main.ts:69`), `@Public()` explicite
  sur 26 routes.
- **`ValidationPipe` strict** : `whitelist + forbidNonWhitelisted + transform` (`main.ts:71`).
- **Observabilité** : middleware `request-observability` + logs JSON avec `requestId`.
- **Bootstrap soigné** : `rawBody` pour webhook Stripe, `helmet`, CORS explicite, Swagger
  conditionnel.
- **Fichiers de taille raisonnable** : plus gros service métier `auth.service.ts` 500 LOC,
  `events.controller.ts` 359 LOC (acceptable, à surveiller).

## Dettes / findings
- **F-009 (P3)** — 30 accès `process.env` directs malgré la règle `ConfigService.getOrThrow()`
  (ex. `main.ts:27,30,36`). Config non centralisée/typée.
- **F-007 (P3)** — 10 dossiers vides `{dto}` (artefact `mkdir` brace-expansion) à côté des
  vrais `dto/`. Bruit de repo.
- **F-006 (P2)** — `npx tsc --noEmit` échoue (TS6059, `test/` hors `rootDir`) alors que c'est
  la commande de vérif documentée. `nest build` (tsconfig.build) passe. Ajouter un script
  `typecheck` avec config dédiée.
- **F-017 (P2)** — pattern `@Transform(trim)` non type-safe → 500 (voir security-review).
- **F-020 (P3)** — `/events/categories` renvoie `{data:[], total:5}` (incohérence contrat).

## Préparation PostgreSQL (migration Phase 2 évoquée)
Couplage Mongoose fort (`.lean()`, `Types.ObjectId`, `$group`/agrégations, index déclarés
dans les schémas). Une migration PG impliquerait : réécriture des schémas → entités
relationnelles, remplacement des agrégations, gestion des `ObjectId` → UUID/BIGINT, et des
`Mixed`/champs polymorphes. **Aucune couche d'abstraction (repository pattern) n'isole
aujourd'hui Mongoose du domaine** → effort de migration élevé. Recommandation : introduire
des interfaces de repository avant d'entamer la migration.

## Cohérence des contrats front/back
`NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1` côté web ↔ `setGlobalPrefix('api/v1')`
côté API : cohérent. Les services front (`features/*/services`) consomment les 90 routes.
Le port réel (3001) diverge de la doc (« 4000 ») — cf. F-008.
