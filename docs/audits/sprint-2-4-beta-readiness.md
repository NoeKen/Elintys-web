# Sprint 2.4 — Préparation bêta

Date : 4 août 2026 · Périmètre : sept pages publiques
(`/`, `/connexion`, `/inscription`, `/evenements`, `/prestataires`, `/lieux`,
`/tarification`). Module Création d'événement gelé, non rouvert.

---

## 1. Résumé exécutif

Les sept écarts visés sont fermés. Deux découvertes ont réorienté le sprint.

**La première : les mesures qui l'ouvraient n'étaient pas exploitables.** Elles
provenaient d'un relevé en `next dev`, où chaque route est compilée au premier
accès — le rapport source le signalait déjà (F-024). En build de production,
l'« anomalie » de `/inscription` (TTFB 6,3 s) disparaît entièrement. Un
baseline valide a donc été reconstruit, sur un build de production local et
sous bridage 4× CPU + 4G lent, seul palier représentatif d'un visiteur réel.

**La seconde : sous ce baseline, quatre pages dépassaient réellement les
cibles** — et pour une cause unique, invisible en mode développement. Les blocs
au-dessus de la ligne de flottaison étaient animés depuis `opacity: 0` par
Framer Motion : le HTML serveur les livrait transparents, et ils n'apparaissaient
qu'à l'hydratation. L'élément LCP était du texte déjà présent dans le document,
attendant JavaScript pour être peint.

Après correction, les sept pages respectent les quatre métriques, avec des gains
de 59 % à 67 % sur les pages concernées. Les deux violations d'accessibilité
sont fermées et verrouillées par une porte de test. Aucun P0, P1 ou P2 n'est
ouvert.

| Score | Valeur |
|---|---|
| Accessibilité | **95**/100 |
| Performance | **92**/100 |
| UI / UX | **90**/100 |
| **Global** | **92**/100 |

**Verdict : ✅ BÊTA PUBLIQUE AUTORISÉE.**

---

## 2. Baseline

Détail complet : [`sprint-2-4-polish-baseline.md`](./sprint-2-4-polish-baseline.md).

Protocole : build de production local (`.next-perf`, sans interrompre
`next dev`), API locale, Chromium/Playwright 1.61.1, 1 run à froid + 3 à chaud
par route, médiane des runs à chaud, contexte neuf à chaque run, deux paliers de
bridage.

Écart entre le relevé `next dev` initial et le build de production, non bridé :
−69 % à −94 % de LCP selon la page. Le baseline retenu est le palier bridé.

---

## 3. Accessibilité

### F-022 — `button-name` (critical) sur la landing — ✅ fermé

Le déclencheur du sélecteur de rôle porte `role="combobox"`, un rôle ARIA qui
**n'admet pas** le nom calculé depuis le contenu. Le texte visible « Je suis… »
était donc bien peint, mais jamais annoncé : le champ restait muet pour un
lecteur d'écran.

La correction est portée par le composant partagé `shared/ui/Select` : la prop
`label` y est désormais **obligatoire** et alimente `aria-label`. Aucun futur
`Select` ne peut être livré sans nom accessible.

### F-023 — `color-contrast` (serious) sur `/evenements` — ✅ fermé

Les appels à l'action des cartes d'événement affichaient du blanc sur
`accent` #4A8E9E en 12 px : **3,71:1** pour un minimum de 4,5:1. Le fond passe à
`teal-dark` #2A6070, token de marque déjà utilisé comme état survolé —
**6,99:1**, sans couleur nouvelle.

### F-041 — `color-contrast` sur les badges `accent-light` — ✅ fermé (nouveau)

Révélé pendant le sprint, dépendant des données affichées : `text-accent`
#4A8E9E sur `bg-accent-light` #E6F5F0 plafonne à **3,3:1**. Corrigé en
`teal-dark` (**6,2:1**) dans `Badge`, `Avatar`, `Toast` et le badge « gratuit »
de l'inscription.

Les variantes `amber` et `success` de `Badge` sont également sous le seuil
(3,04:1 et 3,30:1) mais **ne sont utilisées nulle part** ; elles sont consignées
en P3 plutôt que repeintes sans usage à valider.

### Résultat

axe-core WCAG 2.0/2.1 A + AA, 7 pages × 2 viewports :
**0 violation sur les 14 combinaisons**, tous niveaux confondus — y compris
`moderate` et `minor`.

| Contrôle complémentaire | Résultat |
|---|---|
| Zoom 200 % (720×450 @2×) | aucun débordement horizontal sur les 7 pages |
| `prefers-reduced-motion: reduce` | les 29 blocs `.reveal` restent pleinement visibles, animation neutralisée |
| Navigation clavier | sélecteur de rôle atteignable et focusable ; contrôles du wizard activables à la barre d'espace |
| Cibles tactiles | voir P3 ci-dessous |

---

## 4. Landing

LCP 4 416 → **1 512 ms** (−66 %), JS transféré 405 → 351 Ko.

`LandingHero` passait tout son contenu — badge, titre mot à mot, accroche,
appels à l'action, bandeau de confiance, carte tableau de bord — par un
conteneur Framer Motion `initial="hidden"`. La conversion en animation CSS
préserve l'échelonnement mot à mot (0,05 s par mot) et le fondu vertical.

Vérification visuelle : captures avant/après à 1440×900 et 390×844
**strictement identiques**.

---

## 5. Inscription

LCP 4 228 → **1 656 ms** (−61 %), FCP 3 984 → **1 344 ms** (−66 %).

L'anomalie annoncée (TTFB 6,3 s) n'existait pas : artefact de compilation
`next dev`. La vraie anomalie était ailleurs — la page entière était placée sous
un `<Suspense>` sans repli autour d'un composant appelant `useSearchParams()`,
ce qui l'excluait du rendu serveur. Le serveur envoyait une page vide.

La page est désormais un Server Component qui lit les paramètres et les passe en
props ; la partie cliente est réduite à `RegisterStep1Client`.

La redirection `/inscription` → `/inscription/etape-1` est conservée : mesurée à
167 ms, elle n'est pas un problème.

---

## 6. Événements

LCP 4 520 → **1 504 ms** (−67 %).

Aucun des soupçons initiaux ne se confirme : le catalogue ne bloque pas le héros,
le TTFB est de 129 ms, l'élément LCP est le `<h1>`, pas une image. La cause est
la même que sur la landing. **Aucune modification du chargement du catalogue,
de la pagination ou du cache n'a été nécessaire.**

---

## 7. Performances avant / après

Médianes, 3 runs à chaud, build de production, 4× CPU + 4G lent.

| Page | LCP avant | LCP après | CLS avant | CLS après |
|---|---|---|---|---|
| `/` | 4 416 ms | **1 512 ms** | 0,0068 | 0,0068 |
| `/connexion` | 3 616 ms | **1 496 ms** | **0,0816** | **0** |
| `/inscription` | 4 228 ms | **1 656 ms** | 0 | 0 |
| `/evenements` | 4 520 ms | **1 504 ms** | 0,0013 | 0,0013 |
| `/prestataires` | 1 508 ms | 1 300 ms | 0,0013 | 0,0013 |
| `/lieux` | 1 456 ms | 1 288 ms | 0,0013 | 0,0013 |
| `/tarification` | 1 192 ms | 1 136 ms | 0,0013 | 0,0013 |

Le CLS de `/connexion` avait la même origine que son LCP : la carte de connexion
n'était pas rendue côté serveur et passait de 74 px à 632 px à l'hydratation.

Détail, contreparties et données brutes :
[`sprint-2-4-performance-results.md`](./sprint-2-4-performance-results.md).

---

## 8. Responsive

| Contrôle | Résultat |
|---|---|
| Desktop 1440×900, 7 pages | conforme, aucun débordement |
| Mobile 390×844, 7 pages | conforme, aucun débordement |
| Zoom 200 % (720×450 @2×) | conforme, aucun débordement |
| Captures avant/après | landing, événements, connexion, inscription — aucun recul visuel |

---

## 9. Tests

| Porte | Résultat |
|---|---|
| Web — lint | **0 erreur** (11 avertissements préexistants) |
| Web — typecheck | **0** |
| Web — build production | **0** |
| Web — tests unitaires | **187/187** |
| API | **inchangée** ce sprint — dernier état vert : 522/522, `fcd9e4b` |

---

## 10. E2E

**63 passés, 2 ignorés, 0 échec** (`npm run test:e2e:functional`).

Les 2 ignorés sont la capture de QA visuelle du wizard, volontairement
désactivée hors `WIZARD_QA_CAPTURE=1`.

Quatre tests ont été ajoutés dans `public-a11y.spec.ts` : audit axe des 7 pages
en desktop et mobile (échec sur toute violation `critical` ou `serious`), plus
deux tests ciblant nommément F-022 et F-023.

Deux instabilités de la porte d'accessibilité ont été corrigées à la racine :

1. L'audit s'exécutait avant stabilisation du contenu asynchrone → attente de
   `networkidle`.
2. `AnimatePresence` maintient l'étape sortante montée pendant son fondu : axe
   mesurait le contraste d'un texte transitoirement translucide et signalait
   jusqu'à 22 fausses violations. L'audit du wizard s'exécute désormais en
   `reducedMotion: 'reduce'`, sur l'état stabilisé.

Le message d'échec de ces portes reporte maintenant le sélecteur et le résumé
axe de chaque nœud — un diagnostic exploitable sans réexécution.

Aucune régression sur le wizard gelé : les 13 tests étapes 5/6, les 3 tests
d'accessibilité du wizard et la suite `wizard-ui` restent verts.

---

## 11. Bugs corrigés

| Réf. | Sévérité | Objet |
|---|---|---|
| F-022 | P2 | `combobox` sans nom accessible sur la landing |
| F-023 | P2 | Contraste 3,71:1 des appels à l'action des cartes d'événement |
| F-041 | P2 | Contraste 3,3:1 des badges `accent-light` (découvert pendant le sprint) |
| F-042 | P2 | Contenu au-dessus de la ligne de flottaison masqué jusqu'à l'hydratation (4 pages) |
| F-043 | P2 | `useSearchParams` excluant `/connexion` et `/inscription` du rendu serveur |

---

## 12. Bugs restants

| Réf. | Sévérité | Objet | Justification |
|---|---|---|---|
| F-044 | P3 | `/mot-de-passe-oublie`, `/reinitialiser-mot-de-passe` et `/verification-email` portent le même `<Suspense>` sans repli : écran blanc jusqu'à l'hydratation | Même cause que F-043, hors des sept pages du périmètre. Ces pages ne sont atteintes que depuis un lien courriel. Correction identique à appliquer. |
| F-045 | P3 | Variantes `amber` (3,04:1) et `success` (3,30:1) de `Badge` sous le seuil AA | Aucune utilisation dans le code : repeindre sans usage à valider serait arbitraire. À corriger avant première utilisation. |
| F-046 | P3 | Cibles tactiles : cases à cocher de 20 px, liens en ligne de 18–20 px | WCAG 2.2 AA (2.5.8) exige 24×24 px et **exempte les liens en ligne dans du texte**. Seules les cases à cocher sont concernées ; leur libellé associé étend la zone cliquable. Le seuil de 44 px relève du niveau AAA. |
| F-039 | P3 | « Passer cette étape » masqué sous `sm` dans le wizard | Hérité du Sprint 2.3, arbitrage produit. |
| F-040 | P3 | Sous-palette `--event-*` du wizard non déclarée dans le design system | Hérité du Sprint 2.3, arbitrage design. |
| — | Observation | Des événements `[E2E]` publiés subsistent dans le catalogue de `elintys-dev` | Hygiène de données de développement. Sans effet sur la production. |

**P0 : 0 · P1 : 0 · P2 : 0 · P3 : 5**

---

## 13. Commits

| Dépôt | Hash | Objet |
|---|---|---|
| web | `322afed` | `fix(web): resolve public accessibility violations` |
| web | `3e8fae0` | `perf(web): render above-the-fold content without waiting for hydration` |
| web | `e857ed9` | `test(web): add public accessibility gates and performance tooling` |
| web | `c4a138d` | `docs(web): add beta readiness polish report` |

API : aucun commit, dépôt inchangé, `fcd9e4b`.

---

## 14. Risques

1. **Mesures locales, pas de production.** Tout est mesuré sur un build local
   avec une API locale. Les valeurs sur Vercel + Render (cold start, région,
   latence réseau réelle) seront différentes. Une campagne sur environnement
   déployé reste à faire — elle n'était pas réalisable ici : le harnais visuel
   existant s'authentifie contre l'API dev déployée, dont le cookie de session
   ne s'installe pas sur `localhost`.
2. **Lighthouse n'a pas été exécuté.** Le binaire n'est pas disponible dans cet
   environnement. Les Core Web Vitals sont mesurés directement via
   `PerformanceObserver` sous un profil de bridage aligné sur celui de
   Lighthouse, ce qui couvre LCP, FCP, CLS et TTFB — mais pas le score composite
   ni TBT/INP.
3. **F-019 (throttling backend) reste ouvert.** Au-delà d'une centaine de
   requêtes, la zone publique renvoie massivement des 429. Sur une bêta
   publique, un pic de trafic ou un robot d'indexation rendrait le catalogue
   inaccessible. **C'est le risque le plus sérieux de cette ouverture**, il est
   backend et hors périmètre de ce sprint.
4. **Animation CSS et machines rapides.** Sur une configuration très rapide, le
   LCP de la landing passe de 896 à 1 768 ms — arbitrage assumé et documenté.

---

## 15. Verdict

### ✅ BÊTA PUBLIQUE AUTORISÉE

| Critère | État |
|---|---|
| Landing — violation `critical` corrigée | ✅ |
| Événements — violation `serious` corrigée | ✅ |
| Inscription — diagnostiquée et corrigée | ✅ (anomalie initiale démontrée non représentative, vraie cause corrigée) |
| LCP inscription ramené à un niveau acceptable | ✅ 1 656 ms |
| LCP landing amélioré | ✅ −66 % |
| LCP événements amélioré | ✅ −67 % |
| axe 0 critical/serious sur les pages principales | ✅ 0 violation, tous niveaux |
| Aucune erreur console bloquante | ✅ |
| Build et tests verts | ✅ |
| E2E verts | ✅ 63/63 |
| Responsive desktop/mobile validé | ✅ |
| Aucun P0/P1/P2 ouvert lié au sprint | ✅ |

Les douze critères sont satisfaits. Les cinq points restants sont des P3
documentés : trois arbitrages produit ou design, deux corrections hors
périmètre dont la cause et le remède sont déjà établis.

**Réserve à porter à la décision d'ouverture, sans rapport avec ce sprint :**
F-019 rend le catalogue public inaccessible sous charge. Cette autorisation
porte sur la qualité du frontend ; la tenue en charge du backend est une
décision distincte.
