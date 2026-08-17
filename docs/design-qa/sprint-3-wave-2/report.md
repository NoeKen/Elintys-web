# Sprint 3 — Vague 2 — Rapport de QA visuelle

Date de validation : 17 août 2026  
Route : `/evenements/[slug]`  
Référence principale : `references/reference-event-public-desktop.png`

## Verdict visuel

La page publique forme désormais une destination participant complète, cohérente avec le langage
visuel premium d'Elintys : hero éditorial, hiérarchie nette, informations essentielles immédiatement
lisibles, colonne d'action contextuelle, sections réelles et rythme responsive. Aucun contenu absent
du modèle n'a été inventé pour reproduire une maquette.

## Comparaison à la référence

La comparaison côte à côte est disponible dans `comparisons/index.html`.

### Éléments repris fidèlement

- hero immersif sombre, typographie éditoriale et couverture pleine largeur ;
- information date/lieu visible avant le premier scroll ;
- contenu principal et carte d'action structurés en deux colonnes sur desktop ;
- cartes à rayons généreux, bordures fines, ombres basses et accents teal/terracotta ;
- galerie dense et accessible ;
- empilement mobile avec CTA accessible sans sidebar desktop forcée.

### Écarts assumés

- le programme, les intervenants et la FAQ de certaines références ne sont pas rendus : aucune donnée
  structurée correspondante n'existe dans le contrat Event ;
- les prestataires affichés viennent exclusivement de demandes acceptées et de profils actifs ;
- les billets affichés sont exclusivement des types réels associés à un mode d'admission billet ;
- l'accès et l'admission sont séparés, même si certaines maquettes anciennes les fusionnaient ;
- un événement sans couverture utilise un fallback graphique de marque au lieu d'une image fictive.

## Captures

Le dossier `implementations/` contient notamment :

- responsive complet : `public-complete-{320x720,375x812,390x844,768x1024,1024x768,1440x900,1538x1100}.png` ;
- états principaux : `public-desktop-1440x900.png`, `public-mobile-390x844.png`,
  `no-cover-1440x900.png`, `open-access-1440x900.png` ;
- accès : `access-code-1440x900.png`, `email-domain-1440x900.png`,
  `manual-approval-1440x900.png`, `invitation-1440x900.png` ;
- admission : `ticketing-1440x900.png` ;
- galerie : `public-cover-gallery-1538x1100.png`, `public-cover-gallery-390x844.png`,
  `gallery-lightbox-390x844.png` ;
- états de route : `private-not-found-1440x900.png`, `loading-1440x900.png`,
  `error-1440x900.png`.

Les captures des fixtures E2E sont produites avec animations désactivées. Les états loading et error
ont été capturés sur de vraies frontières Next : réponse retardée pour le squelette et build isolé
avec API indisponible pour l'erreur.

## Responsive

| Viewport | Résultat |
|---|---|
| 320×720 | empilement compact, CTA et galerie utilisables, aucun overflow |
| 375×812 | contenu et actions lisibles, scroll document natif |
| 390×844 | lightbox clavier/touch et sticky action validés |
| 768×1024 | transition tablette équilibrée |
| 1024×768 | grille desktop compacte sans troncature |
| 1440×900 | composition de référence et densité validées |
| 1538×1100 | largeur maximale, galerie et sections longues validées |

Pour chaque viewport, `scrollWidth - clientWidth <= 1 px`. Les captures sont pleine page et aucune
table ni sidebar rigide n'est imposée sur mobile.

## Accessibilité

`axe.json` recense **11 surfaces** sans aucune violation : public desktop, public mobile, sans
couverture, code d'accès, domaine courriel, approbation manuelle, invitation, billetterie,
private/not-found, galerie ouverte et erreur serveur réelle.

Le contrôle de la vraie erreur a d'abord révélé un titre de document absent parce que
`generateMetadata` propageait la panne API. La metadata de repli noindex a été ajoutée. Un écart
modéré d'ordre des headings dans le footer a ensuite été supprimé en donnant aux titres de colonnes
le niveau `h2`. Le recontrôle final renvoie zéro violation.

Contrôles manuels/automatisés complémentaires :

- ordre des headings et landmarks ;
- labels, erreurs et régions `aria-live` des actions d'accès ;
- lightbox Dialog, focus, flèches et `Escape` ;
- cibles principales et fermetures de 44 px minimum ;
- reduced motion, clavier, zoom et restauration du body lock.

## Performance en build production local

Méthode : médiane de trois contextes Chromium froids par scénario, viewport 1440×900,
`next start` sur le port 3002. Le détail reproductible est dans `performance.json`.

| Scénario | TTFB | FCP | LCP | CLS | JS initial | Images | Payload API |
|---|---:|---:|---:|---:|---:|---:|---:|
| sans couverture | 26 ms | 228 ms | 392 ms | 0,0013 | 438,4 Ko | 0 Ko | 1 583 o |
| avec couverture | 23 ms | 144 ms | 384 ms | 0,0013 | 438,4 Ko | 80,9 Ko | 3 996 o |
| avec galerie | 22 ms | 148 ms | 360 ms | 0,0013 | 438,4 Ko | 80,9 Ko | 3 996 o |

Le hero est présent dans le HTML initial dans les trois cas. Le payload événement est chargé côté
serveur et n'est pas redemandé à l'hydratation. Les deux appels API navigateur observés sont les
sondes globales existantes `/auth/me` et `/auth/refresh`. Aucune URL de ressource dupliquée et aucune
image brute non optimisée n'ont été observées.

## Résultat

- fidélité au système Elintys : **9,2/10** ;
- hiérarchie et compréhension participant : **9,4/10** ;
- responsive : **7/7 viewports** ;
- Axe : **11/11 surfaces, 0 violation** ;
- performance : LCP maximal **392 ms**, CLS maximal **0,0013** ;
- finding visuel bloquant : **0**.
