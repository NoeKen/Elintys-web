# QA visuelle — Sprint 3, Vague 1

Date : 9 août 2026  
Périmètre : tableau de bord organisateur et bibliothèque « Mes événements ».

## Références

Les références Stitch existantes ont été reprises dans `references/` pour le dashboard, la grille, la liste et l’erreur. Elles fixent la hiérarchie éditoriale, la palette, les proportions et la densité. L’implémentation conserve le shell de navigation Elintys actuel et remplace toute métrique illustrative par des données métier.

## Captures produites

- Dashboard, grille et liste : `320x720`, `375x812`, `390x844`, `768x1024`, `1024x768`, `1440x900`, `1538x1100`.
- États explicites : `events-empty-1440x900.png` et `events-error-1440x900.png`.
- Comparaisons côte à côte : dashboard, grille, liste et erreur dans `comparisons/`.

Toutes les captures ont été prises sur la pile locale réelle avec un compte QA et des événements créés par API puis nettoyés. Aucun débordement horizontal n’a été détecté.

## Comparaison

| Critère | Résultat |
|---|---|
| Structure | Dashboard éditorial, KPI, colonne d’actions et événements à venir cohérents avec Stitch. |
| Hiérarchie | Titres DM Serif Display, contrôles Inter, CTA principal et actions secondaires clairement ordonnés. |
| Couleurs | Palette Elintys respectée, alertes terracotta réservées aux actions et erreurs. |
| Espacements | Cartes 20–24 px, grands espaces négatifs et ombres diffuses conservés. |
| Proportions | Grille trois colonnes desktop, liste compacte desktop et cartes empilées mobile. |
| Responsive | Sidebar desktop et navigation mobile existantes préservées sur les sept viewports. |
| Données | KPI, readiness, accès, admission et progression réels; aucun historique fictif. |

Écarts justifiés : la navigation globale du produit remplace celle des maquettes isolées; les covers absentes utilisent le fallback `E`; l’activité récente reste un état informatif vide tant qu’aucune source métier fiable n’existe.

## Accessibilité

Le rapport `axe.json` couvre exactement les huit surfaces demandées : dashboard desktop/mobile, grille desktop/mobile, liste desktop/mobile, empty et error.

- violations critical : 0;
- violations serious : 0;
- violations totales : 0 sur les huit surfaces;
- clavier : tabs avec flèches/Home/End, filtres et menu Radix validés;
- focus visible, noms accessibles et boutons icon-only validés;
- reflow équivalent zoom 200 %, reduced motion et cibles tactiles de 44 px validés.

## Verdict visuel

Fidélité et qualité UX : **9,3/10**.  
Accessibilité : **10/10**.  
Verdict : **VALIDÉ**.
