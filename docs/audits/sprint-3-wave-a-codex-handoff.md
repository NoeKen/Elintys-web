# Sprint 3 — Vague A + durcissement pré-Codex — Handoff

**Destinataire** : revue Codex
**Branches** : `fix/s3-wave-a-critical-integration-recovery` (API et Web), poussées
**PR** : API #55 · Web #102 — **ouvertes, non fusionnées**
**Base** : `origin/dev` @ `7950c96`

---

## 1. État en un coup d'œil

| Porte | API | Web |
|---|---|---|
| lint | ✅ | ✅ |
| typecheck | ✅ | ✅ |
| build | ✅ | ✅ |
| tests unitaires | ✅ **1179** | ✅ **382** |
| tests E2E | ✅ **70** (Jest) | ✅ **223** (Playwright, 2 ignorés, **0 échec**) |
| concurrence MongoDB réel | ✅ Vague A **7/7** · Vague 5 **10/10** | — |
| Axe (surfaces touchées) | — | ✅ 0 critical / 0 serious |
| responsive 320→1440 | — | ✅ aucun débordement |
| secret scan / `git diff --check` | ✅ | ✅ |

Worktrees propres, branches synchronisées avec l'origine.

---

## 2. Ce qui a été livré

### Vague A — les sept P1 de l'audit

| ID | Défaut | Correction |
|---|---|---|
| F-01 | Favoris : 3 routes fantômes, 2 clients concurrents | Client unique sur le contrat canonique ; état dérivé d'une liste partagée (N+1 supprimé) ; liste enrichie serveur ; les trois types de cibles branchés |
| F-02 | Prestataire/gestionnaire : `PUT` + `message` au lieu de `PATCH` + `responseMessage` | Écrans destinataires migrés sur les services canoniques ; clients divergents supprimés |
| F-03 | Scan QR : `400 property eventId should not exist` | `eventId` ajouté au contrat **et utilisé** : autorisation sur l'événement, refus d'un billet d'un autre événement |
| F-04 | `PUT /vendors/me` capté par `PUT /:id` ⇒ 500 | Routes `/me` explicites, déclarées avant `:id`, identité issue du JWT |
| F-05 | Aucun profil prestataire/lieu jamais créé | Parcours créer-ou-éditer, préremplissage depuis l'onboarding là où la donnée est canonique |
| F-12 | Catégorie prestataire en saisie libre vs enum | Liste fermée dérivée de l'énumération backend |
| F-15/16 | Scan et transitions de rôle non atomiques | `findOneAndUpdate` conditionnels ; effets de bord réservés à la transition gagnante |

### Durcissement pré-Codex

| Sujet | Correction |
|---|---|
| **F-06 PayPal** | Environnement entièrement piloté par configuration. `PAYPAL_ENV` dérive hôte API et hôtes d'approbation en un seul endroit ; l'adaptateur ne sait plus quel environnement il sert. Bascule sandbox ↔ live **sans modification de code**, prouvée par test. **Live non activé.** |
| **F-14 navigation mobile** | `MobileNav` devient une projection de `buildNavSections` ; 4 emplacements + panneau « Plus ». Prestataires et gestionnaires atteignent enfin leurs écrans sous 768 px. |
| Dashboard / post-login | Destination dérivée du rôle dominant ; la racine redirige au lieu de servir un 403. Priorité de rôle reprise de `getFirstOnboardingPath`. |
| Faux logout | `/auth/me` renvoie un état à trois branches : seul un 401 déconnecte ; 429/5xx/réseau donnent un état dégradé avec réessai manuel. |
| ObjectId | Six routes passaient encore 500 (l'audit en citait deux) — toutes en 400 stable. |
| Harnais Playwright | Projet `setup` + dépendance : `auth.setup.ts` ne s'exécutait **jamais**. Specs exécutés : 55 → **225**. |
| E2E Vague 2 | **Cause prouvée** : symptôme du harnais, pas un bug produit. Vert sans toucher au produit. |

---

## 3. Points d'attention pour la revue

**Trois décisions argumentées** (détail dans le rapport d'implémentation, section « Pre-Codex hardening ») :

1. **Correspondance d'hôte EXACTE** pour PayPal. La frontière de label demandée par le mandat ne suffisait pas : `www.sandbox.paypal.com` étant un sous-domaine de `paypal.com`, une règle par domaine acceptait les URL Sandbox en configuration Live. Une première implémentation par frontière a été écrite puis mise en défaut par ses propres tests.

2. **Allow-list d'approbation côté build, pas côté réponse.** Le mandat préférait que le backend l'expose ; écarté, car une allow-list transmise dans la réponse qu'elle est censée valider n'apporte aucune garantie.

3. **Trois assertions du spec de diagnostic retournées, aucune supprimée.** Rédigées pendant l'audit, elles supposaient l'ajout des routes fantômes côté API ; la résolution retenue est l'inverse. Elles vérifient désormais que ces routes n'existent pas.

**Défauts trouvés en cours de route et corrigés** — non listés dans l'audit initial :

- `typeof null === 'object'` : un événement supprimé faisait planter l'écran prestataire.
- `scrollable-region-focusable` : le `<main>` du dashboard était inatteignable au clavier sur les pages sans élément focalisable.
- Le bouton flottant des devtools TanStack recouvrait la barre de navigation mobile sous 400 px.

---

## 4. Risques ouverts

| Risque | Sévérité | Note |
|---|---|---|
| Prérequis produit du passage PayPal Live | Bloquant avant activation | Politique de règlement tardif, `PAID_TICKET_HOLD_MINUTES`, remboursement. **Décisions produit.** |
| Écrans placeholders | P3 | Marqués comme tels dans la source de navigation, écartés du mobile. |
| Arbre de routes legacy `/(dashboard)/organisateur\|prestataire\|gestionnaire` | P3 | Atteignable par URL, cinq pages en squelette infini. Candidat Vague C. |
| 3 copies d'`authFetch` restantes | P3 | Aucun module touché ne les utilise ; aucune nouvelle copie créée. Candidat Vague C. |
| Suite E2E ~12 min en `--workers=1` | — | Parallélisation limitée par `AUTH_STRICT` (5 connexions/min/IP). |

---

## 5. Reproduire localement

```bash
# API
cd Elintys-api
npm run lint && npm run typecheck && npm run build
npx jest && npm run test:e2e
npm run wave-a:concurrency        # 7/7, MongoDB réel, base elintys-dev
E2E_TEST_PASSWORD=… npm run qa:provision   # 5 comptes QA

# Web
cd Elintys-web
npx eslint src e2e --quiet && npx tsc --noEmit && npm run build
npx vitest run
npx playwright test e2e/functional --workers=1
```

`--workers=1` est requis : le tier `AUTH_STRICT` plafonne les connexions.

---

## 6. Documents

| Fichier | Contenu |
|---|---|
| `docs/audits/system-wide-integration-contract-audit.md` | Audit d'origine (Web) |
| `docs/audits/sprint-3-wave-a-critical-integration-recovery-implementation.md` | Rapport complet + section « Pre-Codex hardening » (Web) |
| `Elintys-api/docs/runbooks/paypal-payments.md` | Runbook Sandbox **et** Live, matrice de configuration, bascule, rollback |
| `e2e/functional/system-wide-integration-audit.spec.ts` | Filet de non-régression transversal (15/15) |
