# Audit final — Sprint 3, Vague 1 — Dashboard et Mes événements

Date : 9 août 2026  
Verdict : **VAGUE 1 VALIDÉE**

## 1. Contexte reçu de Claude Code

Le projet était déjà stabilisé autour du wizard six étapes, d’Access V2 et du design « Épure Événementielle ». La vague devait compléter uniquement les surfaces organisateur manquantes, sans refactorer le wizard ni mélanger découvrabilité, politique d’accès et admission. F-047 demeure un chantier DevOps parallèle hors périmètre.

## 2. État Git initial

Les deux dépôts étaient sur `dev`, alignés avec `origin/dev`, sans divergence :

- API : `ed725380d7876a2c9613b97b1d211b1377a44fd8`;
- Web : `9a3440d29baee0ede5bf675a7a60ee5450a3573e`.

Les artefacts locaux `graphify-out/` ont été conservés et ignorés. Aucun changement utilisateur existant n’a été supprimé.

## 3. Audit

Le préaudit est consigné dans `sprint-3-wave-1-preaudit.md`. Les routes existaient, mais le dashboard utilisait un contrat insuffisant et « Mes événements » chargeait jusqu’à 100 éléments avant de filtrer localement. Les lacunes confirmées étaient : KPI/action/priorité non centralisés, pagination et filtres non serveur, readiness non jointe, absence d’archive réversible et QA Sprint 3 incomplète.

## 4. Architecture

L’API est la source de vérité. Le frontend utilise TanStack Query pour une requête de résumé et une requête paginée, avec invalidation commune après mutation. Les enrichissements readiness, inventaires de billets et demandes d’accès sont agrégés en lots; aucun appel N+1 n’est émis par carte. Le wizard et `creationProgress` restent inchangés.

## 5. Dashboard

`/tableau-de-bord` propose désormais : salutation issue du vrai prénom, quatre KPI réels, quatre actions prioritaires maximum, trois prochains événements maximum, raccourcis vers des routes existantes, loading/empty/error/retry. La section activité n’invente aucun événement : elle annonce explicitement que les activités apparaîtront lorsqu’une source sera disponible.

## 6. KPI

- total et événements actifs hors archivés;
- événements dans les 30 prochains jours;
- brouillons;
- actions à compléter, incluant brouillons et événements avec demandes d’accès en attente.

Les comptes sont calculés par l’API pour l’utilisateur authentifié.

## 7. Mes événements

`/tableau-de-bord/evenements` charge 12 éléments par page et expose les vues Tous, Brouillons, À publier, Publiés, Terminés et Archivés. Les états loading, premier événement, aucun résultat filtré, error, retry et erreur de mutation sont explicites.

## 8. Grid / list

La grille sépare statut, découvrabilité, accès et admission, puis affiche progression et actions. La liste desktop expose date, statut, visibilité, accès, progression et modification; sur mobile elle devient une carte empilée, sans tableau horizontal. La publication reste désactivée tant que la readiness backend n’est pas valide.

## 9. Filtres / recherche

La recherche serveur couvre titre, type, nom de lieu et ville. Les filtres couvrent cycle de vie, type, découvrabilité, politique d’accès, progression et date. Les tris sont modification récente, date croissante et titre. La pagination est serveur et déterministe.

## 10. API

Contrats ajoutés :

- `GET /events/my/summary`;
- `GET /events/my` enrichi avec recherche, vues, filtres, tri, pagination, readiness et demandes en attente;
- `PATCH /events/:id/archive`;
- `PATCH /events/:id/restore`.

`archivedAt` reste orthogonal au statut métier. Les endpoints publics excluent les archives.

## 11. Ownership

L’organisateur provient exclusivement de `user.sub`; aucun `organizerId` de query n’est accepté. Liste, résumé, archive, restore, publish et suppression vérifient l’ownership. Les tests globaux IDOR et secrets confirment aussi qu’un tiers ne lit ni ne modifie les données et que `accessPolicy.codeHash` n’est jamais exposé.

## 12. Responsive

Les sept viewports demandés ont été capturés et testés : 320×720, 375×812, 390×844, 768×1024, 1024×768, 1440×900 et 1538×1100. Sidebar, navigation mobile, KPI, cartes, filtres, recherche, tabs, grille, liste, dropdowns et CTA restent utilisables; overflow horizontal global : 0.

## 13. Accessibilité

Les huit surfaces axe affichent 0 violation critical, 0 serious et 0 violation totale. Les tabs implémentent le roving focus et les flèches/Home/End. Menus, filtres, boutons icon-only, focus visible, reduced motion, reflow 200 % et cibles tactiles ≥ 44 px ont été validés en navigateur.

## 14. Performance

Mesure sur build de production local authentifié, médiane de trois runs chauds :

| Route | TTFB | FCP | LCP | CLS | JS initial | API | Doublons | Payload API |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Dashboard | 8 ms | 1 484 ms | 1 792 ms | 0,0545 | 488 Ko | 4 | 0 | 4,5 Ko |
| Mes événements | 6 ms | 1 576 ms | 1 576 ms | 0,0579 | 488 Ko | 4 | 0 | 11,4 Ko |

Aucune erreur console ou requête échouée. Le JSON reproductible est `sprint-3-wave-1-performance.json`.

## 15. Tests

- API unitaires/couverture : 541/541; couverture `events.service.ts` = 92,01 % statements, 77,06 % branches, 100 % fonctions, 95,83 % lignes;
- API E2E : 29/29;
- Web unitaires : 199/199;
- lint, typecheck et build : EXIT 0 dans les deux dépôts;
- Web lint conserve 11 warnings préexistants hors périmètre, sans erreur.

Total unique réussi : **863 tests**.

## 16. E2E

La suite fonctionnelle complète regroupe les tests historiques et Sprint 3 : 94 réussis, 2 captures Sprint 2 volontairement ignorées, EXIT 0. Les 18 scénarios minimum sont couverts, avec login, dashboard réel/empty/error, KPI, action, grid/list, recherche, filtres, tri, pagination, reprise, preview, publication readiness, archive/restore et mobile.

## 17. QA visuelle

Le dossier `../design-qa/sprint-3-wave-1/` contient quatre références Stitch, 23 captures d’implémentation, quatre comparaisons côte à côte, `axe.json` et `report.md`. La hiérarchie, les typographies, la palette, les rayons, les ombres et le responsive restent cohérents avec Elintys.

## 18. Commits

API :

- `341755b` — `feat(api): add organizer dashboard summaries`;
- `ccee085` — `test(api): cover organizer dashboard queries`.

Web :

- `7d5a70c` — `feat(web): implement organizer dashboard`;
- `dabc7a7` — `feat(web): complete event library views`;
- `d044362` — `test(web): cover dashboard and event library flows`;
- commit documentation/QA : ce rapport et les artefacts associés.

## 19. Push

Les commits fonctionnels API et Web ont été poussés sur `dev` uniquement, sans force push. Le commit documentation est poussé dans la même branche après génération du présent rapport. Les contrôles finaux exigent `HEAD == origin/dev` et un working tree propre.

## 20. Risques

- P0 : 0;
- P1 : 0;
- P2 : 0;
- P3 : 3 — scan de la vue « À publier » borné par lots de 100 mais linéaire, bundle authentifié initial d’environ 488 Ko, 11 warnings lint préexistants hors périmètre.

Ces risques ne bloquent pas la vague et disposent d’un mécanisme de mesure ou d’un périmètre clair.

## 21. Verdict

- note globale : **9,4/10**;
- score UX : **9,3/10**;
- score accessibilité : **10/10**;
- score performance : **8,8/10**;
- tests réussis : **863**;
- nouveaux P0/P1/P2 : **0/0/0**.

**VAGUE 1 VALIDÉE**
