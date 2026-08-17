# Sprint 3 — Vague 2 — Audit du scroll natif (Phase 24B)

Date de validation : 17 août 2026  
Périmètre : pages publiques, authentification, dashboard, menu mobile, modales et galerie.

## Verdict

Le scroll natif est rétabli. Les pages publiques et d'authentification utilisent le document comme
surface de défilement. Le dashboard conserve un unique conteneur interne intentionnel sous sa
topbar. Les overlays verrouillent le body seulement pendant leur ouverture et le restaurent à la
fermeture. Les 9 scénarios Playwright dédiés passent, ainsi que la suite fonctionnelle complète.

## Audit et causes racines

Trois causes distinctes concouraient au défaut :

1. `LenisProvider` remplaçait globalement le comportement du document par un moteur de smooth
   scroll piloté en `requestAnimationFrame`. Ce choix transversal n'était nécessaire à aucun flux
   produit et rendait le wheel/trackpad dépendant d'un cycle client supplémentaire.
2. `AuthSplitLayout` appliquait `overflow-hidden` sur un élément `min-h-screen`. Lorsque le contenu
   dépassait au zoom ou sur petit écran, le dépassement vertical était coupé.
3. Le menu mobile n'explicitait pas le cycle du body lock. Une navigation ou un démontage pendant
   l'ouverture pouvait donc laisser un état ambigu, et le drawer long n'avait pas de scroll interne
   déclaré.

Le dashboard utilise volontairement `h-screen overflow-hidden` au niveau du shell et
`main.overflow-y-auto` pour sa zone de travail. Ce modèle n'est pas la cause : il est conservé et
testé comme l'unique exception explicite au scroll du document.

Aucun listener global `wheel`/`touchmove` avec `preventDefault`, aucun `touch-action: none` et aucun
masquage global de scrollbar n'a été trouvé.

## Corrections

| Fichier | Correction |
|---|---|
| `src/shared/guards/Providers.tsx` | retrait du provider de smooth scroll global |
| `src/lib/lenis.tsx` | suppression de l'abstraction devenue inutile |
| `package.json`, `package-lock.json` | retrait de la dépendance `lenis` |
| `src/features/auth/components/AuthSplitLayout.tsx` | `overflow-hidden` remplacé par `overflow-x-clip` |
| `src/components/public/PublicNavbar.tsx` | body lock sauvegardé/restauré via cleanup React |
| `src/app/globals.css` | drawer mobile verticalement scrollable avec overscroll contenu |
| `src/components/tickets/PurchaseModal.tsx` | migration vers le Dialog partagé et contenu borné/scrollable |
| `src/shared/ui/Modal.tsx`, `Sheet.tsx` | cibles de fermeture portées à 44 px |
| `src/features/events/components/EventGallery.tsx` | lightbox Radix avec focus, clavier et restauration du scroll |

## Comportement vérifié

### Document principal

Les routes `/`, `/evenements`, `/prestataires`, `/lieux`, `/connexion` et `/inscription` sont
contrôlées en viewport mobile. Pour chaque page longue, le test mesure `scrollHeight` et
`innerHeight`, puis exige un déplacement réel de `window.scrollY` avec :

- wheel/trackpad synthétique ;
- `PageDown`, `Home`, `End`, `Space` et `Shift+Space` ;
- geste tactile vertical émis par le protocole Chromium.

Les pages qui tiennent entièrement dans le viewport restent acceptées, mais les contrôles de body
lock et d'overlay invisible leur sont tout de même appliqués.

### Dashboard

`/tableau-de-bord` garde un seul scroller interne visible. Le test vérifie que son
`scrollHeight > clientHeight`, que la molette modifie `scrollTop` et que `window.scrollY` reste à
zéro : aucune double scrollbar concurrente.

### Menu, modal et galerie

- avant ouverture du menu mobile, le style `overflow` du body est mémorisé ;
- pendant l'ouverture, le body est verrouillé et le drawer peut défiler ;
- après fermeture ou démontage, la valeur initiale est restaurée immédiatement ;
- la lightbox se ferme par `Escape`, navigue aux flèches, rend le focus et ne laisse aucun verrou ;
- les Dialog/Sheet et le parcours billet utilisent leurs zones internes scrollables si le contenu
  dépasse la hauteur disponible.

## Scrollbar, overlays et responsive

La scrollbar du document n'est pas masquée. Les carrousels restent les seules zones horizontales
locales. Le helper rejette tout overlay fixe, transparent, interactif et couvrant presque tout le
viewport. Les sept tailles QA `320×720`, `375×812`, `390×844`, `768×1024`, `1024×768`, `1440×900`
et `1538×1100` passent sans overflow horizontal sur la page événement.

## Automatisation

- `e2e/functional/scroll.helpers.ts` : assertions réutilisables document, conteneur interne et touch.
- `e2e/functional/scroll.spec.ts` : 9 scénarios Phase 24B, **9/9 verts**.
- `e2e/functional/sprint3-wave2-public-event.spec.ts` : scroll mobile et restauration du body après
  lightbox intégrés à la Vague 2.
- suite fonctionnelle complète : **129 réussis, 2 ignorés intentionnellement, 0 échec sur 131**.

## Critères de réussite

- [x] aucune route longue testée n'est figée ;
- [x] wheel/trackpad déplace la bonne surface ;
- [x] navigation clavier du document opérationnelle ;
- [x] geste tactile vertical opérationnel ;
- [x] scrollbar native non supprimée ;
- [x] aucun body lock résiduel ;
- [x] aucun double scroll gênant ;
- [x] aucun overlay invisible bloquant ;
- [x] sept viewports sans overflow horizontal ;
- [x] Axe reste à zéro violation critical/serious.

## Risque résiduel

L'inertie exacte d'un trackpad macOS dépend du navigateur et du matériel et ne peut pas être
reproduite bit à bit par Playwright. Le chemin technique sous-jacent est néanmoins natif : aucun
moteur de smooth scroll ni interception `wheel`/`touchmove` ne subsiste.
