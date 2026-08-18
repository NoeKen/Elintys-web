# Sprint 3 — Vague 3 : Workspace événement organisateur

Date de validation : 17 août 2026

Branches : `dev` (`Elintys-web`, `Elintys-api`)

Workflow : Claude Code (`claude-opus-4-7`) implémentation, Codex senior review, corrections et QA UI/UX.

## Résumé

La vague introduit un workspace opérationnel distinct du wizard de création. Depuis « Mes événements → Gérer », le propriétaire accède désormais à un shell contextuel et aux sections Vue d’ensemble, Informations, Lieu, Prestataires, Accès et inscriptions, Billetterie, Invitations, Médias et Paramètres. Les modules reposent sur les contrats réels existants et déclarent honnêtement les fonctions non encore disponibles.

## Architecture

- Route racine : `/tableau-de-bord/evenements/:eventId`.
- Shell contextuel réutilisable : en-tête événement, statut, couverture, actions et navigation adaptative.
- État serveur : TanStack Query avec clés par événement, invalidation ciblée et chargement à la route plutôt que préchargement de tous les modules.
- Sécurité : guards NestJS et contrôle d’ownership serveur ; aucun `organizerId` fourni par le frontend n’est utilisé comme preuve.
- Readiness : unique source `GET /events/:id/publish-readiness`, sans seconde logique de progression frontend.
- Scroll : scroller interne natif unique du dashboard ; aucun Lenis ni moteur global.

## Implémentation Claude

Claude Code a audité les contrats existants puis construit le shell et les écrans de gestion, raccordé les informations, invitations, billets, médias et paramètres, complété les endpoints backend et préparé les états loading/empty/error. Aucun commit ni push n’a été effectué avant le handoff à Codex.

## Review Codex

La review a inspecté les diffs API/Web, les contrôleurs, services, DTO, projections, formulaires, clés de cache et écrans rendus. Les contrôles ont porté notamment sur IDOR, accès anonyme/cross-user, ObjectId, secrets d’invitation, contrats Mongo→frontend, pagination, invariants de billetterie, readiness, scroll interne, focus des dialogs et responsive.

## Corrections Codex

- Ajout de la route protégée `GET /ticket-types/events/:eventId/manage` pour gérer aussi les brouillons/événements privés sans détourner le catalogue public.
- Normalisation `_id/event/sold` vers `id/eventId/soldCount` à la frontière du service Web.
- Validation ObjectId et invariants billets : prix payant positif, quantité ≥ ventes, suppression refusée après vente.
- Endpoint invitations paginé, projection sans `token`, `tokenHash` ni `tokenPrefix`, ownership compatible avec les rôles serveur.
- Readiness mappée sur les codes backend réels ; état d’erreur avec retry, aucune fausse indication « prêt ».
- Dates Informations normalisées en local/ISO, limites alignées sur les DTO et validation fin ≥ début.
- Lieu manuel/en ligne rendu depuis les données Event réelles, en complément des demandes de réservation.
- Wording de suppression aligné sur le comportement réel et focus de dialog corrigé.
- Grille mobile du shell corrigée pour supprimer le contenu tronqué à 320 px.
- Listes de définitions `dl/dt/dd` corrigées après finding Axe serious.
- Libellés statut/découvrabilité localisés sans fusionner statut, découvrabilité, politique d’accès et admission.
- Erreurs de formulaire Invitations reliées aux champs ; feedback de succès annoncé par `aria-live`.

## Backend

- `GET /events/:id/invitations?page=&limit=` : liste participants paginée, owner/admin uniquement.
- `GET /ticket-types/events/:eventId/manage` : types de billets pour le propriétaire.
- Pipes ObjectId sur les routes TicketType de création, lecture, modification et suppression.
- Requêtes invitations bornées (limite maximale 100), triées et projetées sans secrets.
- Aucun changement de schéma, aucune migration et aucune opération destructive sur la base.

## Frontend

- Vue d’ensemble readiness-driven avec KPI provenant uniquement de données réelles.
- Informations avec persistance et réhydratation après refresh.
- Lieu, Prestataires et Accès réutilisent les modules existants.
- Billetterie administre uniquement les TicketTypes supportés aujourd’hui.
- Invitations paginées et création sécurisée.
- Médias réutilisent exclusivement le service Cloudinary existant.
- Paramètres séparent statut, archivage/restauration, configuration d’accès et zone dangereuse.

## Sécurité

Scénarios vérifiés : propriétaire A → événement A autorisé ; organisateur B → événement A refusé ; anonyme refusé ; ObjectId invalide → 400 ; événement absent → 404. Les payloads de gestion des invitations ont été inspectés et ne contiennent aucun token ou hash. Findings sécurité ouverts : P0 0, P1 0.

## Accessibilité

- Axe exécuté sur le workspace mobile, sur les sept viewports de l’overview et sur les modules capturés.
- Résultat final : 0 violation `critical`, 0 violation `serious`.
- Navigation clavier, focus visible, dialog destructif, labels/erreurs et cibles de 44 px vérifiés.
- Le finding Axe `definition-list`/`dlitem` a été corrigé avant validation.

## Responsive

Viewports validés : `320×720`, `375×812`, `390×844`, `768×1024`, `1024×768`, `1440×900`, `1538×1100`. Aucun overflow horizontal document. Les tabs événement sont scrollables sur mobile et la grille utilise une colonne `minmax(0,1fr)` afin d’empêcher tout clipping interne.

Captures : [`docs/design-qa/sprint-3-wave-3/implementations`](../design-qa/sprint-3-wave-3/implementations/).

## Scroll

Le dashboard conserve un seul scroller interne `main.overflow-y-auto`. `End` déplace ce scroller, tandis que `window.scrollY` reste à 0. Les assertions de la suite Scroll existante et du scénario workspace couvrent ce contrat.

## Performance

Les sous-modules sont chargés par route et non au premier rendu du workspace. Les appels indépendants de l’overview partent en parallèle. Les listes d’invitations sont paginées serveur et la requête KPI ne demande qu’un élément avec un total exact. Aucun N+1 n’a été introduit.

## Tests

### API

- Lint : vert.
- Typecheck : vert.
- Build NestJS : vert.
- Unitaires : **566/566** (48 suites).
- Coverage : **72,14 % statements**, **64,43 % branches**, **65,94 % functions**, **73,09 % lines**.
- E2E API : **29/29** (3 suites).

### Web

- Lint : vert.
- Typecheck : vert.
- Build Next.js : vert (67 pages générées).
- Unitaires : **203/203** (35 fichiers).
- Coverage : **44,36 % statements**, **41,53 % branches**, **36,91 % functions**, **45,45 % lines**.
- E2E workspace dédié : **10/10**, plus 2 scénarios de setup.
- E2E fonctionnels complets : **138 passés, 2 captures conditionnelles ignorées, 0 échec** (140 scénarios collectés).
- E2E visuels : **17/17** contre le stack local candidat ; Cloudinary, états, workspace et Axe couverts.
- Axe : 0 critical / 0 serious.
- Responsive : 7 viewports.

## Findings

| Niveau | Trouvés | Ouverts | État |
|---|---:|---:|---|
| P0 | 0 | 0 | Vert |
| P1 | 0 | 0 | Vert |
| P2 | 9 | 0 | Tous corrigés et retestés |
| P3 | 2 | 2 | Risques résiduels documentés |

Les P2 couvraient le contrat TicketType, l’accès management aux brouillons, les secrets/pagination invitation, la readiness en erreur, les dates, le lieu réel, le wording destructif, le clipping mobile et la sémantique `dl`.

## Commits

- API `0115c44` — `feat(event-workspace): secure invitations and ticket management`.
- Web `de5e26f` — `feat(event-workspace): build organizer management experience`.
- Web `30c436b` — `test(event-workspace): cover ownership responsive and visual QA`.
- Documentation et captures — commit contenant ce rapport.

État Git avant publication : branches `dev` alignées avec leurs `origin/dev` de départ, aucun stash, aucun fichier utilisateur supprimé. Push direct demandé vers `origin/dev`, sans force push.

## Risques résiduels

- P3 : plusieurs écrans workspace restent de grands Client Components ; une extraction progressive pourra améliorer la maintenabilité sans changer le contrat produit.
- P3 : les chaînes organisateur sont majoritairement centralisées en français mais la parité anglaise complète du nouveau workspace reste une vague i18n distincte.
- La billetterie avancée (paiement, remboursements, payouts, scanning complet) reste volontairement hors périmètre.

## Verdict

Verdict : **validé pour livraison sur `dev`**. Tous les gates techniques, fonctionnels et visuels sont verts ; P0/P1/P2 ouverts = 0. Note globale : **9,2/10**.
