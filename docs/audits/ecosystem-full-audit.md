# Audit complet de l'écosystème Elintys

> **Audit en lecture seule** — aucun code modifié, aucune donnée écrite, aucune migration.
> Date : 2026-08-02 · Périmètre : `Elintys-web` (Next 16) + `Elintys-api` (NestJS 11).
> Toutes les conclusions sont sourcées (fichier/ligne, commande, réponse HTTP, requête Mongo).
> Détail des anomalies : [`findings.csv`](./findings.csv) (26 entrées, dont 2 positifs).

---

## 1. Résumé exécutif

L'écosystème Elintys est un **MVP fonctionnel de bonne facture technique** : les deux
projets compilent, 490 tests unitaires passent (155 web + 335 api), l'API applique une
posture de sécurité serveur solide (guards globaux, helmet complet, cookies httpOnly,
pas d'énumération d'utilisateur), et l'indexation MongoDB est soignée.

**Mais il n'est pas prêt pour la production.** Cinq problèmes structurels le disqualifient
en l'état :

1. **Le middleware de protection des routes du frontend est totalement inerte** (F-001,
   P1) — prouvé au runtime : toutes les routes « protégées » répondent **200 sans
   redirection** à un utilisateur non authentifié.
2. **La commande de couverture — celle qu'exécute la CI — échoue sur les deux repos**
   (F-013 backend 68/55/55/70 % < 80/70 ; F-014 web 4 timeouts). Un simple `npm test`
   au vert **masque** cet échec.
3. **La stratégie de rate-limiting est mal calibrée dans les deux sens** : trop laxe pour
   le brute-force login (F-002), trop stricte pour la navigation publique (F-019, la zone
   publique se fait 429 sous faible charge).
4. **Un pattern d'entrée provoque des 500 non gérés sur tous les POST publics** (F-017) —
   vecteur DoS applicatif léger et pollution des logs.
5. **Le modèle Access V2 tout juste livré tourne sur un dataset majoritairement legacy**
   (F-016 : 7 événements sur 8 sans `accessModelVersion`).

S'ajoute une **dérive documentation ⇄ réalité importante** (F-008) : les `CLAUDE.md`
décrivent Next 15 / Zustand / fetch-only / Node 20 / Railway, alors que le code tourne
sur Next 16 / axios / pas de Zustand / Node 22 / Render.

## 2. Niveau de maturité

**Niveau 3 — MVP fonctionnel** (sur une échelle 0→5).

Au-dessus d'une démo (parcours réels, tests, sécurité serveur de base), mais en dessous
d'un *production candidate* : gate d'auth front cassé, CI de couverture rouge, données
Access V2 non migrées, compte QA inutilisable, throttling mal calibré.

## 3. Note globale

**≈ 59 / 100** (somme pondérée des 16 dimensions ci-dessous : 95/160).

| Dimension | Note /10 | Base d'évaluation |
|---|---|---|
| Architecture frontend | 6.0 | features/app/shared/server clair, 0 `any` ; mais routes dupliquées (F-003) + monolithe 1513 LOC (F-005) |
| Architecture backend | 7.0 | modules NestJS propres, guards/DTO/couches ; drift process.env (F-009), 500 transform (F-017) |
| Sécurité | 5.5 | guards+helmet+cookies excellents (F-018) ; mais F-001, F-002, F-017, F-019, Swagger public (F-010) |
| Performance frontend | 6.0* | CLS excellent ; CWV mesurés en **dev** seulement (F-024) → provisoire |
| Performance backend | 6.0 | bons index ; throttle mal calibré (F-019), outliers 1s (F-021), Render free |
| Base de données | 7.0 | indexation soignée (F-026) ; Access V2 legacy (F-016), index token legacy (F-025) |
| API | 6.5 | 90 routes cohérentes, Swagger ; bug categories total (F-020), 500 sur mauvais input |
| Design UI | 6.0* | pages publiques rendues (14 captures) ; contraste AA échoué (F-023) ; dashboards non testés (creds) |
| UX | 5.5 | parcours présents ; gate d'auth cassé (F-001), double arborescence (F-003) |
| Responsive | 6.5* | captures mobile+desktop OK ; revue authentifiée bloquée (F-015) |
| Accessibilité | 6.0 | 5/7 pages publiques 0 violation ; 1 critical (F-022) + 1 serious (F-023) ; dashboard non testé |
| Tests | 5.0 | 490 tests verts **mais** couverture sous seuils + CI rouge (F-013/F-014), pas d'E2E exécuté, fuite handles (F-011) |
| DevOps | 6.0 | render.yaml + Vercel + health + logs structurés ; Render **free**, Swagger public, pas de CI vue |
| Observabilité | 6.0 | logging structuré request-id (positif) + health ; pas d'error-tracking/alertes détecté |
| Maintenabilité | 6.0 | 0 `any` web ; drift doc lourd (F-008), fichiers monolithes, cruft `{dto}` (F-007) |
| Production readiness | 4.0 | bloquée par F-001, CI couverture rouge, Access V2 non migré, QA cassé, throttle |

\* provisoire — nécessite mesure prod (perf) ou compte QA (design/UX/responsive/a11y authentifiés).

## 4. Architecture

Deux repos git indépendants sur branche `dev`, **working tree sale sur les deux**
(fonctionnalité « accès/inscriptions » en cours). Frontend Next 16 App Router avec
architecture hybride `app/` + `features/` + `shared/` + `server/`. Backend NestJS 11,
18 modules, 90 routes, guards globaux `JwtAuthGuard`+`RolesGuard`, `ValidationPipe`
strict. Détails : [`frontend-architecture-review.md`](./frontend-architecture-review.md),
[`backend-architecture-review.md`](./backend-architecture-review.md).

## 5. Frontend
274 fichiers, 155 tests, 49 `'use client'`, **0 `any`**. Points durs : double arborescence
`(dashboard)/<role>` vs `(dashboard)/tableau-de-bord/<role>` (F-003) ; monolithe
`EventCreationSteps.tsx` 1513 LOC (F-005) ; 11 warnings React-Compiler (F-012).

## 6. Backend
Couches respectées, DTO validés, messages FR. Dettes : 30 accès `process.env` directs
malgré la règle `ConfigService` (F-009) ; 10 dossiers vides `{dto}` (F-007) ; `tsc --noEmit`
casse hors build (F-006) ; 500 sur input objet via `@Transform(trim)` (F-017).

## 7. Sécurité
Voir [`security-review.md`](./security-review.md). **Positifs** (F-018/F-026) : guards
9/9 → 401, helmet complet (CSP/HSTS/COOP/CORP/nosniff), pas d'énumération login, cookies
`httpOnly+sameSite+secure`, tokens d'invitation `sha256(randomBytes32)`. **Négatifs** :
F-001 (middleware inerte, **P1**), F-002 (pas de rate-limit auth), F-017 (500 DoS), F-019
(throttle mal calibré), F-010 (Swagger public en dev-prod). Aucun P0 confirmé (F-001 = P1
car l'API protège toujours les données).

## 8. Performance
Voir [`performance-review.md`](./performance-review.md). k6 (charge réduite 10 VUs) :
p95≈235 ms sur 200 réels, outliers 1 s (F-021). CLS excellent (<0.01). CWV mesurés en
**dev** uniquement → à remesurer en prod (F-024). Throttle 100/60 s sature la zone publique
(F-019).

## 9. Base de données
Voir item 13. MongoDB Atlas, DB `elintys`. **Indexation soignée** (F-026). **Access V2 :
7/8 événements legacy non migrés** (F-016). Index `token` legacy à nettoyer (F-025).

## 10. API
90 routes, conventions REST cohérentes (`/api/v1`, kebab-case pluriel), Swagger `/api/docs`.
Incohérence `categories` (data vide / total 5, F-020).

## 11. Design UI/UX
Voir [`design-ux-review.md`](./design-ux-review.md) + 14 captures dans
`docs/design-qa/ecosystem/`. Pages publiques rendues et cohérentes ; contraste AA échoué
sur `/evenements` (F-023). **Écrans authentifiés (dashboard, wizard, organisateur) non
audités** — compte QA inutilisable (F-015).

## 12. Responsive
Captures mobile (375) + desktop (1440) pour 7 pages publiques. Pas de débordement majeur
observé. Multi-viewport authentifié bloqué (F-015).

## 13. Accessibilité
Voir [`accessibility-review.md`](./accessibility-review.md). axe WCAG2AA sur pages
publiques : 5/7 à **0 violation**, 1 critical `button-name` (F-022), 1 serious
`color-contrast` ×8 (F-023). Revue clavier manuelle + dashboards : à compléter (creds).

## 14. Tests
Voir [`test-coverage-review.md`](./test-coverage-review.md). 490 tests verts, **mais
couverture sous seuils sur les 2 repos et commande CI rouge** (F-013/F-014). E2E
Playwright non exécutés (dépendent d'un compte QA valide). Fuite de handles Jest (F-011).

## 15. DevOps
Voir [`devops-review.md`](./devops-review.md). Render (service dev, plan **free**, health
`/api/v1/health`, autoDeploy commit), Vercel (frontend). Secrets `sync:false` (bien).
Swagger activé en prod-dev (F-010). Aucun fichier CI (lint/test/build) détecté dans les repos.

## 16. Observabilité
**Positif** : logs structurés JSON avec `requestId` + middleware d'observabilité + header
`x-request-id` exposé + `@nestjs/terminus` health. **Manques** : pas d'error-tracking
(Sentry) ni d'alerting détecté ; états dégradés (Mongo/Cloudinary down) non éprouvés.

## 17. Déploiements
Web → Vercel (`elintys.com`, `.vercel/` présent). API → Render (`dev.elintys.com`,
region ohio). Séparation dev/prod à confirmer (DB nommée `elintys`, non suffixée par env).

## 18. Dette technique
Drift doc massif (F-008), `{dto}` ×10 (F-007), `process.env` ×30 (F-009), monolithes front
(F-005), index legacy (F-025), routes dupliquées (F-003).

## 19. P0 / P1 / P2 / P3

| Sévérité | Nombre | IDs |
|---|---|---|
| **P0** | 0 | — |
| **P1** | 1 | F-001 |
| **P2** | 13 | F-002, F-003, F-004, F-005, F-006, F-013, F-014, F-015, F-016, F-017, F-019, F-022, F-023 |
| **P3** | 10 | F-007, F-008, F-009, F-010, F-011, F-012, F-020, F-021, F-024, F-025 |
| Positifs | 2 | F-018, F-026 |

## 20. Plan de correction (par lots — à valider avant exécution)

| Lot | Thème | Findings | Effort | Risque |
|---|---|---|---|---|
| **1** | Sécurité / gate d'auth | F-001, F-002, F-017, F-019 | M | moyen (auth) |
| **2** | Tests / CI verte | F-013, F-014, F-011, F-006 | L | faible |
| **3** | Données Access V2 | F-016, F-025 | M | **élevé** (migration — dry-run obligatoire) |
| **4** | Architecture front | F-003, F-004, F-005, F-012 | L | moyen |
| **5** | Accessibilité / design | F-022, F-023, F-024 | M | faible |
| **6** | API / cohérence | F-020, F-010 | S | faible |
| **7** | Dette / doc | F-007, F-008, F-009 | S | faible |
| **Bloquant transverse** | QA/E2E | F-015 (compte QA) | S | — (débloque les phases authentifiées) |

Détail périmètre/fichiers/tests/rollback par lot : à produire à la validation.

## 21. Verdict production readiness

**NON VALIDÉ pour la production. Validé avec réserves comme MVP de développement.**

Un rendu visuel correct et des tests unitaires verts ne compensent pas : un gate d'auth
frontend inerte, une CI de couverture rouge sur les deux repos, un throttling mal calibré,
un pattern d'entrée qui provoque des 500, et un modèle d'accès livré sur données non
migrées. **Prochaine action recommandée** : fournir un compte QA valide (F-015) puis
traiter le Lot 1, avant toute mise en production publique.
