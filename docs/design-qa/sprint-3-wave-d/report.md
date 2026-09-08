# Sprint 3 — Vague corrective D — QA visuelle

## Périmètre observé

La revue a couvert les catalogues publics, la recherche non disponible, les cards événement/prestataire/lieu, le dashboard organisateur, le workspace événement, la participation, la billetterie, les invitations et les profils. Les surfaces ont été vérifiées sur 320×720, 375×812, 390×844, 768×1024, 1024×768, 1440×900 et 1538×1100.

## Résultat

- contours visibles sur les cards canoniques auditées : 0 ;
- débordements horizontaux bloquants : 0 ;
- violations Axe `critical` : 0 ;
- violations Axe `serious` : 0 ;
- erreurs console inattendues sur les surfaces représentatives : 0 ;
- réponses réseau inattendues `>= 500` : 0.

Les surfaces restent hiérarchisées par contraste de fond, espacement, rayon et ombre diffuse. Les focus fonctionnels, bordures de champs, séparateurs, badges et zones de dépôt restent présents lorsqu’ils portent une information utile.

## Preuves conservées

- `implementations/before/catalog-1440.png`
- `implementations/after/catalog-1440.png`
- `implementations/after/catalog-390.png`
- `implementations/after/vendors-1440.png`
- `implementations/after/search-1440.png`
- `implementations/after/search-390.png`

Les autres captures produites par les suites historiques ont été restaurées afin de ne pas polluer le diff.
