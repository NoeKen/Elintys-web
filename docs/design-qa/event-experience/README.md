# QA visuelle — expérience événementielle

Date : 2 août 2026  
Référence : les dix `screen.png` de `stitch_elintys_cinematic_onboarding_experience-4.zip`, langage « Épure Événementielle ».

## Captures d’implémentation

| Capture | Référence Stitch | Vérification |
|---|---|---|
| `dashboard-1538.png` | `elintys_tableau_de_bord` | Hiérarchie éditoriale, KPI réels, actions et événements réels. |
| `events-grid-1538.png` | `elintys_mes_v_nements_grille` | Cover ou fallback premium, filtres, recherche, états et progression. |
| `events-list-1538.png` | `elintys_mes_v_nements_liste` | Vue compacte responsive, sans tableau horizontal mobile. |
| `event-workspace-1538.png` | `elintys_gestion_de_l_v_nement_vue_d_ensemble` | Shell événement, readiness et configuration réelle. |
| `event-access-1538.png` | `elintys_acc_s_et_inscriptions_gestion` | Capacité, trois concepts séparés et demandes réelles. |
| `events-grid-390.png` | adaptation mobile | Navigation compacte, filtres scrollables, carte lisible à 390 px. |

## Comparaison et écarts justifiés

- Le shell global Elintys existant est conservé pour éviter une navigation parallèle propre aux maquettes.
- Les métriques sans source métier fiable ne sont pas affichées. Il n’y a ni revenus, ni activité récente fictive, ni scans simulés.
- Les sections publiques sans données dans le schéma actuel — programme, intervenants, FAQ — sont masquées au lieu d’être remplies avec du contenu factice.
- Les cartes donnent la priorité aux médias persistés; le fallback `E` est utilisé lorsque le seed ne contient aucune cover.
- Les contrôles tactiles principaux font au moins 40 à 48 px selon le composant; la navigation latérale devient horizontale dans l’espace événement étroit.

## Résultat

La fidélité de ton, palette, typographie, rayon, densité et élévation est forte. Les captures desktop et 390 px ne montrent ni page blanche, ni débordement horizontal global, ni erreur réseau. Une passe axe automatisée n’a pas été exécutée car axe n’est pas présent dans le projet; les rôles, labels, titres et états ont été contrôlés dans le code et le parcours Playwright.
