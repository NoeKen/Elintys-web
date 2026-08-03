# Sprint 2 — Wizard de création d'événement

> Exécuté le 2026-08-03 sur `elintys-dev`. Production `elintys` jamais touchée.
> Périmètre exclu et respecté : Stripe, paiement, QR, check-in, analytics, PostgreSQL, workspace.

---

## 1. Synchronisation Git initiale

| Dépôt | Branche | HEAD = `origin/dev` | Working tree |
|---|---|---|---|
| Elintys-api | `dev` | `6b24b8a` ✓ | propre |
| Elintys-web | `dev` | `e56bcb3` ✓ | propre |

Les 4 commits Sprint 1 confirmés ancêtres de `origin/dev`. **Sprint 1 clos.**

## 2. Migration des rapports (Phase 1)

Les rapports transversaux vivaient dans `Elintys/docs/audits/` — **hors de tout dépôt git**,
donc jamais versionnés. 26 fichiers déplacés dans `Elintys-web/docs/audits/`.

Assainissement avant versionnement : chemins absolus locaux remplacés par un placeholder.
Vérifié absent : secrets, jetons, mots de passe, URI MongoDB réelles, backups, rollbacks.
Les seules correspondances au motif « secret » sont des fixtures (`example.mongodb.net`).

## 3. Code mort supprimé (Phase 2)

**`src/components/events/EventWizard.tsx` (314 LOC)** — supprimé.
Aucun import nulle part, aucun test dédié ; la route de création rend `EventCreationWizard`.

> **Ce fichier faussait le constat du Sprint 1.** Le wizard « à 0 % de couverture » n'était
> pas le wizard réel : le composant utilisé était déjà à 53 %. La réserve du Sprint 1 était
> donc moins grave qu'annoncée. → finding **F-034 fermé**.

## 4. Architecture avant / après (Phase 3)

Décomposition **strictement mécanique** — déplacement de blocs, aucune réécriture métier.

| | Avant | Après |
|---|---|---|
| `EventCreationSteps.tsx` | **1513 LOC** | **14 LOC** (baril de ré-export) |
| Étapes | toutes dans un fichier | `steps/` — 6 fichiers de 147 à 358 LOC |
| Sous-composants | inline | `components/` — StepHeading, FieldError, Label, VenueCard, ManualVenueFields, FilterChips |
| Constantes / types | inline | `components/step-constants.ts`, `components/step-types.ts` |

Le baril préserve **tous les imports existants** — aucun appelant modifié.

**Absence de régression prouvée avant/après** : typecheck 0 erreur, lint 0 erreur
(11 avertissements préexistants, inchangés), 164 tests verts, build réussi.

> Effet de bord traité : l'extraction avait laissé **219 imports inutilisés** (230 warnings
> au lieu de 11). Retirés automatiquement à partir du rapport ESLint, retour à l'état initial.

## 5. Tests unitaires ajoutés (Phase 4)

**23 tests** sur les deux étapes identifiées comme les moins couvertes.

| Composant | Avant | Après |
|---|---|---|
| `ReviewStep` (étape 6) | 0 % | **100 %** (branches 82,6 %) |
| `ProvidersStep` (étape 4) | 0 % | **68,6 %** |
| `IdentityAccessStep` (étape 5) | — | **100 %** (branches 93,8 %) |

**ReviewStep — 11 tests** : données réellement persistées, navigation « Modifier » par
section, readiness (chargement / publiable / erreurs bloquantes / code inconnu affiché en
clair), et intention `paid_ticket` qui **bloque la publication sans simuler de vente**.

**ProvidersStep — 12 tests** : étape franchissable sans besoin (skip), remontée au parent,
reprise depuis un brouillon, **absence de doublon de catégorie**, idempotence, catalogue
peuplé / vide / en échec, prestataires sélectionnés et manuels, absence de donnée sensible.

Fixtures alignées sur le schéma réel (`capacity`, `venueName`, `accessPolicyType`) et sur
les rôles ARIA réels (les catégories sont des **cases à cocher**, pas des boutons).

## 6. E2E UI réels (Phase 5)

`e2e/functional/wizard-ui.spec.ts` — **9 tests pilotant réellement l'interface**
(clics, saisie, navigation). Appels API réservés au nettoyage.

| Scénario | Résultat |
|---|---|
| Validation bloquante sans titre, puis passage à l'étape 2 | ✅ |
| Anti-double-soumission (double clic → un seul brouillon) | ✅ |
| Navigation étapes 1→2→3 et retour arrière | ✅ |
| Saut de l'étape prestataires | ✅ |
| Persistance backend vérifiée dès l'étape 1 | ✅ |
| Survie au rafraîchissement | ✅ |
| Reprise du brouillon depuis « Mes événements » | ✅ |
| Mobile 390×844 — aucun débordement horizontal | ✅ |
| Mobile — exposition du contrôle « Continuer » | ⚠️ **F-035** |

**Comportements produit confirmés** : la validation des dates bloque bien le passage de
l'étape 2, et le brouillon est persisté côté API dès l'étape 1 — le backend reste la source
de vérité.

## 7. Findings

| ID | Sévérité | Description | Statut |
|---|---|---|---|
| **F-034** | P3 | `EventWizard.tsx` code mort (314 LOC) faussant la mesure de couverture | ✅ **Fermé** |
| **F-035** | **P2** | À 390 px, le contrôle « Continuer » n'est pas exposé de façon fiable via son rôle/nom accessible — plusieurs contrôles homonymes coexistent, dont certains masqués par des classes `sm:`. Impact **accessibilité mobile** (navigation au lecteur d'écran). | ⏳ **Ouvert** |

Aucun P0/P1 découvert.

## 8. État des critères de gel MVP

| Critère | Statut |
|---|---|
| `EventWizard.tsx` mort supprimé | ✅ |
| `EventCreationSteps` décomposé | ✅ 1513 → 14 LOC |
| Composants critiques couverts | ✅ Review 100 %, Identity 100 %, Providers 68,6 % |
| Étapes 1→3 traversées via l'UI réelle | ✅ |
| Sauvegarde, refresh, reprise testés | ✅ |
| Prestataires facultatifs (skip) testé | ✅ |
| **Étapes 4→6 traversées via l'UI réelle** | ⚠️ **partiel** — testées unitairement, pas de bout en bout dans le navigateur |
| **Trois branches lieu testées** | ❌ non fait |
| **Cover et galerie testées via l'UI** | ❌ non fait (couvert en E2E API au Sprint 1) |
| **Visibilité / accès / admission via l'UI** | ❌ non fait (couvert en E2E API au Sprint 1) |
| **Publication refusée / réussie via l'UI** | ❌ non fait (couvert en E2E API au Sprint 1) |
| **QA visuelle Stitch** | ❌ non fait |
| **Responsive 7 viewports + axe + revue clavier** | ⚠️ partiel — seul 390×844 vérifié |
| CI verte | ✅ (voir §9) |
| Aucun P0/P1 | ✅ |

## 9. CI

| Commande | Web |
|---|---|
| `lint` | ✅ 0 (11 avertissements préexistants) |
| `typecheck` | ✅ 0 |
| `build` | ✅ 0 — `ƒ Proxy (Middleware)` |
| `test` | ✅ **187 tests** (164 → 187) |
| `test:coverage` | ✅ 0 — 39,47 % global |
| `test:e2e` wizard UI | ⚠️ 8/9 (F-035) |

API inchangée (aucune modification nécessaire) — gates Sprint 1 toujours valides :
522 tests, 5/5 EXIT 0.

## 10. Commits

| Hash | Commit |
|---|---|
| `c152a91` | `docs(web): version project audit history` |
| `e458b6b` | `refactor(web): split event creation steps and drop obsolete wizard` |
| `9a622f6` | `test(web): cover event creation review and providers steps` |
| `345830e` | `test(web): drive event creation wizard through the real UI` |

Branche `dev`, working tree propre. **Non poussés** au moment de la rédaction.

## 11. Limitations et travail restant

Le Sprint 2 a livré **les fondations** (nettoyage, décomposition, tests unitaires ciblés,
premiers E2E UI réels) mais **n'a pas couvert l'intégralité du programme demandé** :

1. **Étapes 4, 5 et 6 non traversées de bout en bout dans le navigateur** — leur logique est
   couverte unitairement et par les E2E API du Sprint 1, mais pas par un parcours UI complet.
2. **Trois branches lieu** (existant / recherche / plus tard) non testées via l'UI.
3. **Médias, visibilité, accès, admission, publication** : non pilotés via l'UI (validés en
   E2E API au Sprint 1).
4. **QA visuelle Stitch** non réalisée — aucune capture produite.
5. **Responsive** : un seul viewport sur sept ; **axe et revue clavier non exécutés**.
6. **F-035** ouvert.

## 12. Verdict

**Note : 6/10.**

- Tests : **187** unitaires web (+23) · **9** E2E UI wizard · 33 E2E fonctionnels (Sprint 1)
- Couverture web : 38,62 % → **39,47 %** ; étapes critiques du wizard à 68–100 %
- Findings : **P0 : 0 · P1 : 0 · P2 : 1 (F-035) · P3 : 0 ouvert** (F-034 fermé)

### ❌ Gel MVP refusé

**Raisons** :
1. Les six étapes ne sont **pas** toutes traversées via l'UI réelle (1→3 seulement).
2. Les trois branches lieu, les médias, l'accès/admission et la publication ne sont pas
   validés via l'interface.
3. La QA visuelle et la validation responsive/accessibilité complètes n'ont pas été faites.
4. F-035 (accessibilité mobile du contrôle principal) reste ouvert.

**Ce qui est acquis** : le module est nettement plus sain qu'au début du Sprint — code mort
éliminé, monolithe décomposé sans régression, étapes critiques réellement testées, et le
premier harnais E2E pilotant l'UI est en place. Le travail restant est **additif** : il
s'appuie sur `wizard-ui.spec.ts` et les helpers existants, sans refonte.

**Prochaine action recommandée** : étendre `wizard-ui.spec.ts` aux étapes 4→6 et aux branches
lieu, puis traiter F-035 et la QA visuelle.
