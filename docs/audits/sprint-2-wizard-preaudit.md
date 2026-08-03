# Sprint 2 — Pré-audit du wizard de création d'événement

> Audit **lecture seule** réalisé le 2026-08-03, après synchronisation confirmée des deux
> dépôts sur `dev` (API `6b24b8a`, Web `e56bcb3`).

---

## 1. Synchronisation Git initiale — confirmée ✅

| Dépôt | Branche | HEAD local | `origin/dev` | Non poussés | Working tree |
|---|---|---|---|---|---|
| Elintys-api | `dev` | `6b24b8a` | `6b24b8a` | 0 | propre |
| Elintys-web | `dev` | `e56bcb3` | `e56bcb3` | 0 | propre |

Les 4 commits Sprint 1 (`4b8abe5`, `5d7445c`, `a5a008c`, `e56bcb3`) sont bien des ancêtres de
`origin/dev`. **Sprint 1 définitivement terminé.**

## 2. Structure actuelle

Chaîne de rendu réelle :
```
src/app/(event-creation)/evenements/creer/page.tsx
  └── EventCreationWizard.tsx        (370 LOC) — orchestration, autosave, navigation
        ├── EventCreationChrome.tsx  (404 LOC) — chrome, en-tête, statut de sauvegarde
        └── EventCreationSteps.tsx  (1513 LOC) — les 6 étapes + sous-composants partagés
              └── EventMediaManager.tsx (604 LOC) — cover + galerie
  (logique métier) features/events/lib/event-creation.ts (526 LOC)
```

### 🔴 Découverte : `EventWizard.tsx` est du **code mort**
`src/components/events/EventWizard.tsx` (**314 LOC**) n'est **importé nulle part**
(`grep -rn "EventWizard"` hors auto-référence et hors `EventCreationWizard` → **0 résultat**).
Sa couverture de 0 % s'explique donc entièrement : il est superséder par
`EventCreationWizard`. → **à supprimer** (nouveau finding **F-034**, P3).

C'est aussi ce qui faussait le constat du Sprint 1 (« composants du wizard à 0 % ») : le
composant réellement utilisé est à 53 %, pas à 0 %.

## 3. Tailles et couverture

| Fichier | LOC | Stmts | Branches | Funcs |
|---|---|---|---|---|
| `EventCreationSteps.tsx` | **1513** | 53,3 % | 40,2 % | 45 % |
| `EventMediaManager.tsx` | 604 | *(testé)* | — | — |
| `event-creation.ts` (logique) | 526 | 65,1 % | 65,9 % | 88,2 % |
| `EventCreationChrome.tsx` | 404 | *(testé)* | — | — |
| `EventCreationWizard.tsx` | 370 | 63,7 % | 49,5 % | 31,8 % |
| **`EventWizard.tsx` (mort)** | **314** | **0 %** | **0 %** | **0 %** |

Tests existants : `EventCreationWizard.test.tsx` (211), `EventMediaManager.test.tsx` (174),
`EventCreationChrome.test.tsx`, `event-creation.test.ts` (212).

## 4. État réel des six étapes

`EventCreationSteps.tsx` est **déjà découpé en 6 composants d'étape exportés** — la
décomposition en fichiers est donc **mécanique**, sans réécriture :

| Étape | Composant | Lignes | Taille |
|---|---|---|---|
| 1 — Informations | `InformationStep` | 169-282 | 114 |
| 2 — Date et contexte | `ScheduleStep` | 287-457 | 171 |
| 3 — Lieu | `VenueStep` | 563-782 | 220 |
| 4 — Prestataires | `ProvidersStep` | 844-1137 | **294** |
| 5 — Identité/médias/accès | `IdentityAccessStep` | 1148-1358 | 211 |
| 6 — Récapitulatif | `ReviewStep` | 1368-1513 | 146 |

Sous-composants partagés à extraire : `StepHeading`, `FieldError`, `Label`, `VenueCard`,
`ManualVenueFields`, `FilterChips`.

## 5. Risques identifiés

1. **Zones non couvertes** — les plages `1028-1110` (ProvidersStep) et `1489` (ReviewStep)
   sont les principaux trous ; ce sont précisément les chemins d'erreur et de reprise.
2. **Branches à 40 %** — les états conditionnels (loading, empty, erreur, champs
   conditionnels d'accès/admission) sont peu testés.
3. **`EventWizard.tsx` mort** — risque de modification du mauvais fichier par un contributeur.
4. **Décomposition** — le principal risque est de **changer un comportement** en déplaçant du
   code ; à mitiger par une décomposition purement mécanique (déplacement sans réécriture) et
   une suite de tests exécutée avant/après.

## 6. Plan de décomposition (comportement inchangé)

```
components/events/create/
  steps/    InformationStep · ScheduleStep · VenueStep ·
            ProvidersStep · IdentityAccessStep · ReviewStep
  components/  StepHeading · FieldError · Label · VenueCard ·
               ManualVenueFields · FilterChips
```
`EventCreationSteps.tsx` devient un **baril de ré-export** pour ne casser aucun import
existant (les tests et `EventCreationWizard` importent depuis ce chemin).

## 7. Fichiers à modifier

- `src/components/events/create/EventCreationSteps.tsx` → éclaté en `steps/` + `components/`
- `src/components/events/EventWizard.tsx` → **suppression** (code mort)
- Nouveaux tests unitaires par étape
- Nouveaux E2E UI : `e2e/functional/wizard-ui.spec.ts`
- Captures : `docs/design-qa/event-wizard-sprint-2/`

## 8. Périmètre exclu (rappel)

Stripe, paiement réel, QR, scanner, check-in, analytics, PostgreSQL, workspace.
Pour `free_ticket` / `paid_ticket` : intention configurable, publication bloquée sans type de
billet, message explicite, **aucune simulation de vente**.
