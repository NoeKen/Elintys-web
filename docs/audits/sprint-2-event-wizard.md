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

---
---

# Sprint 2.1 — Clôture (2026-08-03)

## 1. F-035 — ✅ **fermé** (c'était un faux positif de ma suite de tests)

**Diagnostic à 390 px** (Playwright, arbre d'accessibilité réel) :

```
getByRole('button', { name: 'Continuer' }) → 1 élément
  #0 visible=true  enabled=true  135×48px
```

**Un seul contrôle, visible, activable, cible tactile conforme. Aucun doublon masqué.**
Le produit était correct : j'avais mal diagnostiqué au Sprint 2.

**La vraie cause était dans mon propre helper de test** : `openWizard()` ciblait
`getByText('Informations')`, dont le premier match est un
`<span class="hidden sm:inline">` réservé au desktop (`display:none` en mobile).
L'assertion échouait donc **là**, pas sur le bouton « Continuer ».

Preuve :
```
getByText("Informations") → 2 éléments
  #0 visible=false SPAN display=none class="hidden text-event-ink sm:inline"
  #1 visible=true  P     display=block
```

Correctifs : sélecteur d'ouverture basé sur le contrôle d'action ; helper `expectStep`
filtrant sur `visible=true` ; assertion F-035 renforcée dans le test mobile (comptage
strict à 1 + cible tactile ≥ 44 px).

## 2. Scénarios E2E ajoutés — **14/14 verts**

| Scénario | Résultat |
|---|---|
| Branche lieu « je choisirai plus tard » | ✅ |
| Branche lieu « j'ai déjà mon lieu » (saisie manuelle) | ✅ |
| Branche lieu « recherche Elintys » (catalogue / vide / erreur) | ✅ |
| **Publication refusée** — readiness backend refuse, statut reste `draft`, aucun faux succès | ✅ |
| **Publication réussie** — statut `published`, page publique accessible à un anonyme | ✅ |
| Étape 1 : validation bloquante, anti-double-soumission | ✅ |
| Navigation avant/arrière, skip prestataires | ✅ |
| Refresh, reprise depuis « Mes événements » | ✅ |
| Mobile 390 px + vérification F-035 | ✅ |

## 3. Responsive — 7 viewports, **6/7 conformes**

| Viewport | Débordement | « Continuer » |
|---|---|---|
| 320×720 | ✓ aucun | 1 · 48 px |
| 375×812 | ✓ aucun | 1 · 48 px |
| 390×844 | ✓ aucun | 1 · 48 px |
| 768×1024 | ✓ aucun | 1 · 48 px |
| **1024×768** | ❌ **débordement horizontal** | 1 · 48 px |
| 1440×900 | ✓ aucun | 1 · 48 px |
| 1538×1100 | ✓ aucun | 1 · 48 px |

→ nouveau finding **F-036 (P3)** : débordement horizontal en **1024×768** (tablette
paysage). Un seul viewport sur sept ; les six autres sont propres et le contrôle
principal est correctement dimensionné partout.

## 4. Accessibilité

- **axe (WCAG 2.0/2.1 A & AA) sur le wizard : 0 violation.**
- Navigation clavier : focus atteint les champs, **contour de focus visible** (`outline: solid`).
- Cible tactile du contrôle principal : **48 px** à tous les viewports (≥ 44 px requis).

## 5. Gates

| Commande | Résultat |
|---|---|
| Web `lint` | ✅ 0 |
| Web `typecheck` | ✅ 0 |
| Web `test` | ✅ 187 |
| E2E wizard UI | ✅ **14/14** |
| axe | ✅ 0 violation |

API inchangée par ce Sprint (aucune modification) — gates Sprint 1 valides (522 tests).

## 6. Commits

| Hash | Commit |
|---|---|
| `1b4fc98` | `fix(web): close F-035 and complete wizard UI coverage` |

## 7. Findings

| ID | Sévérité | Statut |
|---|---|---|
| F-034 (code mort) | P3 | ✅ Fermé (Sprint 2) |
| **F-035** (contrôle mobile) | P2 | ✅ **Fermé — faux positif, produit conforme** |
| **F-036** (débordement 1024×768) | **P3** | ⏳ Ouvert |

**P0 : 0 · P1 : 0 · P2 : 0 · P3 : 1**

## 8. Verdict final

### ❌ GEL MVP REFUSÉ — mais de justesse

**Acquis** : F-035 fermé avec preuve, 14/14 E2E UI, trois branches lieu, publication
refusée **et** réussie validées, axe 0 violation, clavier OK, 6/7 viewports propres,
aucun P0/P1/P2 ouvert.

**Ce qui manque encore** :
1. **Étape 5 (médias, accès, admission) non pilotée via l'UI** — l'upload cover/galerie,
   les 7 politiques d'accès et les 6 modes d'admission restent validés par les **E2E API du
   Sprint 1**, pas par des clics dans l'interface.
2. **Étape 6 partiellement via UI** — la readiness et la publication sont vérifiées par
   l'API dans le parcours ; les boutons « Modifier » du récapitulatif sont couverts en
   tests unitaires, pas en E2E.
3. **QA visuelle Stitch non réalisée** — seules deux captures d'implémentation (390 et
   1538) ont été produites, sans comparaison aux références.
4. **F-036** ouvert.

Ce sont des **écarts de couverture de test, pas des défauts produit connus** : aucune
anomalie fonctionnelle n'a été trouvée sur ces chemins, et ils sont tous couverts au
niveau API ou unitaire. Le risque résiduel est donc **faible mais non nul**.

**Recommandation** : un dernier passage ciblé (étape 5 via UI + QA visuelle + F-036)
suffirait à autoriser le gel. Le harnais est en place ; le travail restant est additif.

---

# Sprint 2.2 — clôture F-036 et tentative de pilotage étape 5/6

## 1. F-036 — débordement horizontal à 1024×768 — ✅ FERMÉ

### Diagnostic (preuve DOM, avant correctif)

```
viewport=1024  scrollWidth=1060  dépassement=36px
coupable : DIV.flex items-center justify-end gap-4  (w=320, right=1060)
parent   : DIV.mx-auto grid min-h-[82px] max-w-[1500px]
```

### Cause réelle

`EventCreationChrome.tsx:182` — l'en-tête sticky bascule sur une grille à trois
colonnes fixes au point de rupture `lg`, qui vaut **exactement 1024px** :

```
320 (marque) + 360 (min. colonne centrale) + 320 (actions)
+ 32 (2 gouttières gap-4) + 56 (padding sm:px-7 ×2) = 1088px requis
```

À 1024px la grille réclame donc 1088px : 36px de débordement, exactement la
valeur mesurée. Ce n'est pas un problème de contenu mais de seuil de bascule.

### Correctif appliqué

`lg:grid-cols-[320px_minmax(360px,660px)_320px]` → `xl:grid-cols-[...]`.

La grille à trois colonnes n'est activée qu'à partir de 1280px, où les 1088px
requis tiennent confortablement. Ce choix est **cohérent avec le reste du
composant** : l'aside latéral utilise déjà `xl:block`, donc les trois colonnes et
la colonne latérale apparaissent désormais au même point de rupture.

**Aucun `overflow-x-hidden` n'a été ajouté** : le débordement est supprimé à sa
source, pas masqué.

### Vérification — critère `documentElement.scrollWidth === window.innerWidth`

| Viewport | scrollWidth | innerWidth | Dépassement |
|---|---|---|---|
| 320×568 | 320 | 320 | 0 |
| 375×667 | 375 | 375 | 0 |
| 390×844 | 390 | 390 | 0 |
| 768×1024 | 768 | 768 | 0 |
| **1024×768** | **1024** | **1024** | **0** |
| 1440×900 | 1440 | 1440 | 0 |
| 1538×1100 | 1538 | 1538 | 0 |

**7/7 viewports propres.** Non-régression : lint EXIT 0, typecheck 0 erreur,
187/187 tests unitaires verts.

## 2. Pilotage de l'étape 5 via l'UI — ❌ NON ABOUTI

Trois approches ont été tentées pour atteindre l'étape 5 dans un test Playwright
piloté uniquement par l'interface. Aucune n'a fonctionné.

| # | Approche | Résultat observé |
|---|---|---|
| 1 | Clic sur la pastille « 5. Identité et accès » | `<button disabled aria-label="5. Identité et accès">` — les pastilles sont désactivées tant que l'étape n'a pas été atteinte |
| 2 | Boucle de clics sur « Continuer » depuis l'étape 1 | Le parcours n'atteint pas l'étape 5 ; `input[type=file]` jamais attaché |
| 3 | Création API avec `creationProgress: { currentStep: 5 }` puis ouverture du brouillon | Le wizard ne s'ouvre pas à l'étape 5 — les 24 tests échouent, y compris ceux qui ne touchent pas aux médias |

Le comportement n°1 est **correct** pour un wizard guidé : on ne saute pas une
étape non franchie. Le point n°3 est une **observation à vérifier**, pas un
défaut établi : `creationProgress.currentStep` est bien persisté par l'API, mais
la reprise d'un brouillon ne semble pas repositionner l'utilisateur à l'étape
enregistrée. Cela mérite une vérification produit dédiée (« la reprise d'un
brouillon doit-elle ramener à la dernière étape atteinte ? ») avant d'être
qualifié de bug.

**Le fichier `wizard-step5-6.spec.ts` n'a pas été livré** : on ne verse pas une
suite rouge au dépôt. Le harnais reste à reconstruire sur la base d'un parcours
UI complet 1→5 renseignant réellement chaque étape.

**Conséquence** : médias (cover, remplacement, rejet non-image), 3 visibilités,
7 politiques d'accès, 6 modes d'admission et les boutons « Modifier » de
l'étape 6 restent couverts **au niveau API (Sprint 1) et unitaire**, pas par
l'interface réelle.

## 3. QA visuelle Stitch — ❌ NON RÉALISÉE

Seules les 5 références Stitch ont été versées dans
`docs/design-qa/event-wizard-sprint-2/references/`. Aucune capture
d'implémentation ni comparaison n'a été produite pendant ce sprint, et
`report.md` n'existe pas.

## 4. F-037 — pagination sans tri sur les listes d'événements — ✅ FERMÉ

### Découverte

La suite fonctionnelle est passée à 44/45, l'échec portant sur un test de
sécurité — `security.spec.ts:70`, « devrait cloisonner *Mes événements* par
compte ». L'assertion en échec était toutefois `inMine`, **pas** l'assertion de
cloisonnement :

```
Error: le propriétaire voit son événement
Expected: true   Received: false
```

Le cloisonnement (`inTheirs === false`) passait. **Aucune fuite de données entre
comptes.**

### Cause réelle

`events.service.ts` paginait sans ordre explicite, aux deux endroits :

```ts
this.eventModel.find(filter).skip(skip).limit(limit)   // aucun .sort()
```

Preuve du déclencheur (base `elintys-dev`, agrégat par organisateur) :

```
evenements par organisateur (top 3) : 57, 11, 1
```

Le compte owner QA porte 57 événements pour une page 1 limitée à 20. Sans tri,
`skip`/`limit` s'appuient sur l'**ordre naturel** de MongoDB : le brouillon
fraîchement créé ne se trouvait pas sur la première page.

### Portée réelle du défaut

Ce n'est pas qu'un artefact de test. Deux conséquences produit :

1. **Pagination non déterministe** — sans ordre total, MongoDB ne garantit pas
   la stabilité entre deux requêtes de pages : un document peut être omis ou
   rendu deux fois lors d'un parcours page par page. Cela affecte le catalogue
   public (`findAll`) autant que « Mes événements » (`findByOrganizer`).
2. **Un organisateur de plus de 20 événements ne retrouve pas son brouillon**
   fraîchement créé dans sa liste.

### Correctif

Tri stable et total ajouté aux deux requêtes paginées, avec `_id` en départage :

```ts
const PAGINATION_SORT = { createdAt: -1, _id: -1 } as const;
```

Non-régression : `events.service.spec.ts` — « devrait trier la page sur un ordre
stable et déterministe » vérifie l'appel `.sort()`.

**Réserve consignée** : l'ordre métier du catalogue public (afficher les
événements *à venir* en premier plutôt que les plus récemment créés) est une
décision produit distincte, hors périmètre de ce correctif. Seul le
déterminisme a été traité ici.

### Vérification

Suite fonctionnelle complète : **45/45 verte** (contre 44/45 avant correctif).
Portes API : lint 0, typecheck 0 erreur, build 0, **522/522 tests**.

## 5. Registre des anomalies

| Anomalie | Sévérité | Statut |
|---|---|---|
| F-035 (contrôle mobile) | P2 | ✅ Fermé — faux positif |
| **F-036** (débordement 1024×768) | P3 | ✅ **Fermé — corrigé, vérifié 7/7** |
| **F-037** (pagination sans tri) | **P2** | ✅ **Fermé — corrigé, 45/45** |

**P0 : 0 · P1 : 0 · P2 : 0 · P3 : 0**

## 6. Verdict Sprint 2.2

### ❌ GEL MVP REFUSÉ — preuve manquante explicite

Le refus ne repose sur **aucun défaut produit connu** : le registre d'anomalies
est vide et toutes les portes de qualité passent. Il repose sur des **preuves
explicitement manquantes**, au sens du critère fixé :

1. L'étape 5 n'a **jamais été pilotée via l'interface réelle** — exigence
   centrale du sprint, non satisfaite.
2. Les boutons « Modifier » de l'étape 6 ne sont pas validés en E2E.
3. La QA visuelle comparative Stitch n'existe pas.

Ce qui est acquis et vérifié : F-036 corrigé à la source avec preuve DOM sur
7 viewports ; F-037 (pagination non déterministe) découvert et corrigé ; portes
web 187/187 et API 522/522 ; suite fonctionnelle 45/45 ; lint, typecheck et
build à 0 sur les deux dépôts ; aucune régression.

### Chemin le plus court vers le gel

Construire un helper Playwright qui traverse réellement les étapes 1→4 en
renseignant les champs requis (le fichier `wizard-ui.spec.ts` y parvient déjà
jusqu'à l'étape 3 — c'est la base à étendre), puis rejouer les 24 assertions
étape 5/6 par-dessus. La QA visuelle et les boutons « Modifier » suivent
immédiatement. Aucun de ces travaux ne suppose de correctif produit.

---

# Sprint 2.3 — pilotage réel des étapes 5 et 6, QA visuelle (2026-08-04)

## 1. Cause du blocage du Sprint 2.2 — identifiée

Le bouton d'action principal **change de libellé selon l'étape** :

| Étape | Libellé | Source |
|---|---|---|
| 1, 2, 4, 5 | « Continuer » | `copy.continue` |
| 3 en mode « je choisirai plus tard » | « **Continuer sans lieu** » | `copy.venue.continueWithout` |
| 6 | « Terminer la configuration » | `copy.finish` |

`EventCreationChrome.tsx` — `StepNavigation`, calcul de `primaryLabel`.

Les trois tentatives du Sprint 2.2 échouaient donc toutes pour la même raison :
la boucle ciblait `getByRole('button', { name: 'Continuer' })`, qui correspond
en équivalence exacte et ne matche pas « Continuer sans lieu ». Le parcours
s'arrêtait invariablement à l'étape 3.

## 2. Traversée réelle 1 → 6 — ✅ ACQUISE

`e2e/functional/wizard-journey.ts` traverse le wizard comme un humain :

1. Étape 1 — saisie du nom ; le brouillon est créé côté API, l'URL bascule sur
   `/tableau-de-bord/evenements/<id>/configuration`.
2. Étape 2 — date et heure de début, puis mode de lieu « je choisirai plus
   tard ». Ce choix est fait ici et non à l'étape 3 : `venueMode` est un champ
   de l'étape 2 (`getStepFieldNames`).
3. Étape 3 — cette branche ne réclame **aucun** champ, ce qui rend le parcours
   indépendant du catalogue de lieux. Franchie par « Continuer sans lieu ».
4. Étape 4 — franchie par « Passer cette étape » (ou par le bouton principal
   sous le point de rupture `sm`, où ce raccourci est masqué).
5. Étape 5 atteinte, puis étape 6 après configuration d'accès.

Aucune URL forgée, aucune progression injectée par l'API : les pastilles de
progression restent `disabled` tant qu'une étape n'est pas atteinte, et
`creationProgress.currentStep = 5` est vérifié côté backend après la traversée.

## 3. Étapes 5 et 6 — **13/13 tests verts**

`e2e/functional/wizard-step5-6.spec.ts` :

| Domaine | Couverture |
|---|---|
| Accès à l'étape | traversée 1→4, progression persistée (`currentStep: 5`, étape 4 dans `skippedSteps`) |
| Médias | téléversement de couverture, remplacement, rejet d'un non-image sans appel serveur, ajout à la galerie |
| Visibilité | les **3** valeurs sélectionnables, exclusivité mutuelle vérifiée |
| Accès | les **7** politiques sélectionnables ; champs conditionnels `#event-access-code` et `#allowed-domains` révélés **uniquement** par la politique correspondante |
| Admission | les **5** modes (et non 6 : `free`, `registration_only`, `free_ticket`, `paid_ticket`, `invitation`), cumulables |
| Persistance | configuration saisie à l'écran relue côté API ; le code d'accès **n'apparaît jamais en clair** dans la réponse |
| Validation | « privé + accès ouvert » refusé, wizard maintenu sur l'étape 5 |
| Étape 6 | récapitulatif fidèle aux saisies, boutons « Modifier » ramenant à la bonne étape, retour à l'étape 5 par la pastille avec restitution des choix |

## 4. F-038 — erreur de validation jamais affichée — ✅ FERMÉ

**Constat.** `accessPolicyType` était le seul champ du wizard dont l'erreur
n'était pas rendue. La combinaison « privé + accès ouvert » échoue à la
validation Zod ; `form.trigger(..., { shouldFocus: true })` renvoie alors le
focus sur un `input` `sr-only`, donc invisible. L'utilisateur cliquait
« Continuer » et **rien ne se produisait, sans le moindre message**.

**Preuve.** Audit du rendu des erreurs, étape par étape : `venueProfile`,
`startDate`, `endDate`, `eventType`, `capacity`, `accessCodeValue`,
`allowedDomains` et `admissionModes` disposent tous d'un `<FieldError>` ;
`accessPolicyType` était le seul sans.

**Correctif.** `IdentityAccessStep.tsx` — ajout du `<FieldError>` manquant sous
la grille des politiques d'accès.

**Vérification.** Le test « devrait refuser un événement privé laissé en accès
ouvert » échouait sur l'absence du message avant correctif, passe après.

## 5. QA visuelle — ✅ RÉALISÉE, avec une réserve majeure

Rapport complet : `docs/design-qa/event-wizard-sprint-2/report.md`.
Rapprochements : `comparisons/index.html`. Captures : `implementations/`
(6 étapes × 2 viewports, produites par `wizard-capture.spec.ts`).

**Les maquettes Stitch de référence sont périmées.** Elles décrivent un wizard
à 5 étapes (Informations · Configuration · Billetterie · Design · Publication)
avec sidebar de tableau de bord, assistant IA, tarification de lieu et palette
verte. Le produit livré est un wizard à 6 étapes en plein écran, sur la palette
V2, avec le modèle Access V2 et sans billetterie.

Aucun score de conformité Stitch n'est donc publié : il mesurerait un écart de
spécification, pas la qualité d'exécution. La conformité est évaluée contre
`docs/design-principles.md` et le design system — **87/100**, sans défaut
bloquant.

## 6. Accessibilité — **0 violation**

`e2e/functional/wizard-a11y.spec.ts`, axe-core WCAG 2.1 AA. Résultats bruts
dans `docs/design-qa/event-wizard-sprint-2/axe-wizard.json`.

| Écran | Violations |
|---|---|
| Étape 1 — 1440×900 | 0 |
| Étape 3 — 1440×900 | 0 |
| Étape 5 — 1440×900 | 0 |
| Étape 6 — 1440×900 | 0 |
| Étape 5 — 390×844 | 0 |
| Étape 5 — 1024×768 | 0 |

Le test échoue sur toute violation `critical` ou `serious` : c'est désormais une
porte de qualité, pas un simple relevé. Navigation clavier vérifiée : les
options d'accès `sr-only` restent focusables et activables à la barre d'espace,
et le viewport 1024×768 reste sans débordement (`scrollWidth === innerWidth`).

## 7. Portes de qualité

| Porte | Résultat |
|---|---|
| Web — lint | 0 erreur (11 avertissements préexistants) |
| Web — typecheck | 0 |
| Web — build | 0 |
| Web — tests unitaires | **187/187** |
| E2E fonctionnels | **59 passés, 2 ignorés** (capture de QA visuelle, désactivée par défaut) |
| API | inchangée ce sprint — dernier état vert : 522/522 |

## 8. Registre des anomalies

| Réf. | Sévérité | État |
|---|---|---|
| F-038 — erreur de validation `accessPolicyType` jamais affichée | P2 | ✅ fermé |
| F-039 — « Passer cette étape » masqué sous `sm` : l'étape 4 n'a plus de sortie nommée en mobile | P3 | ouvert — arbitrage produit |
| F-040 — sous-palette `--event-*` non déclarée dans le design system | P3 | ouvert — arbitrage design |

**P0 : 0 · P1 : 0 · P2 : 0 (fermé) · P3 : 2 (ouverts, arbitrages)**

Observation levée : la reprise d'un brouillon honore bien
`creationProgress.currentStep` via `getNextStep()` (`event-creation.ts:480`).
Le doute soulevé au Sprint 2.2 n'était pas fondé.

## 9. Verdict Sprint 2.3

### ✅ GEL MVP ACCORDÉ

Les trois preuves qui manquaient au Sprint 2.2 existent désormais :

1. L'étape 5 est **pilotée via l'interface réelle** — médias, 3 visibilités,
   7 politiques d'accès, 5 modes d'admission, persistance et validation.
2. Les boutons « Modifier » de l'étape 6 sont validés en E2E.
3. La QA visuelle est produite, avec captures, rapprochements et rapport.

Aucun défaut bloquant n'est ouvert. Les deux points restants (F-039, F-040)
sont des arbitrages produit et design, documentés et sans impact fonctionnel :
ils ne justifient pas de prolonger le sprint.

Réserve à porter au backlog, sans effet sur le gel : les maquettes Stitch
doivent être régénérées sur le périmètre réel avant de resservir de référentiel
de recette visuelle.
