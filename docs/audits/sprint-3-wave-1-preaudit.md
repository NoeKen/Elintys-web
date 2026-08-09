# Sprint 3 — Vague 1 — Préaudit dashboard organisateur et Mes événements

Date de vérification : 9 août 2026  
Périmètre : `Elintys-web` et `Elintys-api`, branches `dev`.  
Mission : dashboard organisateur et bibliothèque opérationnelle « Mes événements » uniquement.

## Verdict de préaudit

Le socle existe et doit être complété, pas remplacé. Les routes `/tableau-de-bord` et
`/tableau-de-bord/evenements` consomment déjà `GET /events/my`; les états loading,
empty et error, une première grille/liste et les références Stitch sont présents.
L’implémentation reste toutefois insuffisante pour la Vague 1 : elle charge jusqu’à
100 événements avant filtrage et pagination locale, ne consomme pas la source de
vérité de readiness dans le catalogue, ne propose pas les filtres Access V2 demandés,
ne possède pas d’archive réversible et calcule plusieurs KPI/actions avec des règles
frontend partielles.

La Vague 1 étendra donc le contrat existant de façon rétrocompatible et conservera
le wizard six étapes gelé, Event Access V2, Cloudinary, l’authentification et F-047
inchangés.

## État Git initial

Après `git fetch origin dev --prune` :

| Dépôt | Branche | HEAD | `origin/dev` | Divergence | État suivi |
|---|---|---|---|---|---|
| `Elintys-web` | `dev` | `9a3440d` | `9a3440d` | `0 / 0` | propre |
| `Elintys-api` | `dev` | `ed72538` | `ed72538` | `0 / 0` | propre |

Les deux dépôts contenaient seulement `graphify-out/` non suivi. L’inspection montre
des rapports HTML/JSON/Markdown et caches d’analyse générés. Les dossiers sont
préservés sur disque et ajoutés à `.gitignore`; aucun reset, stash, nettoyage ou
force-push n’a été effectué.

## Documentation et références vérifiées

- `CLAUDE.md` web et API, `docs/design-principles.md` ;
- rapports Sprint 1, Sprint 2, Sprint 2.4, sécurité, architecture, performance,
  accessibilité et `findings.csv` ;
- modèle Event Access V2 et rapports Sprint 2.5 / smoke test F-047 ;
- préaudit et rapport de clôture de l’expérience événementielle du 2 août ;
- références Stitch dashboard, grille, liste, loading, empty et error, comparées aux
  captures d’implémentation existantes.

En cas de divergence, les spécifications présentes, Access V2 et
`design-principles.md` priment sur les anciennes maquettes.

## Frontend actuel

### Routes

- `/tableau-de-bord` → `OrganizerDashboardExperience` ;
- `/tableau-de-bord/evenements` → `OrganizerEventsExperience` ;
- `/tableau-de-bord/evenements/[id]` → espace événement existant ;
- `/tableau-de-bord/evenements/[id]/configuration` → wizard six étapes gelé ;
- `/tableau-de-bord/evenements/[id]/acces-et-inscriptions` → demandes d’accès ;
- `/organisateur` et `/organisateur/evenements` → aliases historiques à préserver.

### Composants et services réutilisables

- `OrganizerDashboardExperience`, `OrganizerEventsExperience` ;
- `DashboardEventCard`, shell dashboard, `Sidebar`, `Topbar`, `MobileNav` ;
- `eventsService`, TanStack Query, types Event et helpers `creationProgress` ;
- `next/image`, transformations Cloudinary et tokens Elintys ;
- suites Vitest, Playwright fonctionnelles/visuelles et axe déjà installées.

### Gaps frontend

1. `GET /events/my?page=1&limit=100` est chargé en bloc puis filtré, trié et paginé
   côté client.
2. Les onglets sont limités à Tous/Brouillons/Publiés/Terminés/Annulés ; « À
   publier » et « Archivés » manquent.
3. Les filtres discoverability, type, date, progression et accessPolicy manquent.
4. La carte ne sépare pas clairement statut, visibilité, accès et admission et ne
   propose pas toutes les actions conditionnelles.
5. La liste desktop omet visibilité, accès, dernière modification et actions.
6. Le dashboard compte tous les événements futurs, affiche une capacité planifiée
   au lieu d’un KPI demandé et calcule les actions depuis la seule progression du
   wizard.
7. Le prénom utilise un fallback textuel au lieu de n’afficher que la vraie donnée.
8. Les raccourcis et l’état vide d’activité récente demandés manquent.
9. Les tests unitaires du catalogue ne couvrent que recherche et empty.

## Backend actuel

### Contrats disponibles

- `GET /events/my` : ownership par `user.sub`, pagination `page`/`limit` bornée à
  100 et filtre de statut réel ;
- `GET /events/:id/publish-readiness` et `PATCH /events/:id/publish` : même policy
  `validateEventPublishability` ;
- CRUD Event, demandes d’accès, médias et politique Access V2 ;
- index `organizer + status`, `startDate`, type et discoverability.

### Gaps backend

1. `/events/my` n’offre ni recherche, ni tri demandé, ni filtres Access V2/date/
   progression, et ne joint pas la readiness.
2. Aucun résumé organisateur borné ne centralise les KPI, les actions prioritaires,
   les demandes d’accès en attente et les prochains événements.
3. Le contrat Event ne possède pas d’archive réversible. Réutiliser `cancelled`
   serait sémantiquement faux.
4. Le frontend déclare une réponse paginée `meta`, tandis que l’API renvoie
   actuellement `{ data, total, page, limit }`; le nouveau client normalisera le
   contrat sans casser les consommateurs existants.

## Données réellement calculables

- événements actifs : événements non terminés, non annulés et non archivés ;
- événements à venir : date de début comprise dans les 30 prochains jours ;
- brouillons et actions de complétion ;
- readiness de publication depuis `validateEventPublishability` et inventaire de
  billets ;
- demandes d’accès en attente depuis `EventAccessRequest` ;
- progression depuis `creationProgress` ;
- covers, lieu, discoverability, accessPolicy, admissionModes et dates.

Les inscriptions ne sont pas affichées comme KPI : les sources existantes couvrent
des preuves d’admission différentes et leur somme serait trompeuse. Aucune activité
récente n’est simulée, faute d’EventActivity/audit log métier.

## Architecture retenue

1. Enrichir `QueryEventDto` de filtres strictement validés et appliquer recherche,
   filtre, tri et pagination côté MongoDB.
2. Enrichir chaque événement de la page avec la readiness calculée par la policy
   backend, en agrégeant l’inventaire de billets pour éviter un N+1.
3. Ajouter `GET /events/my/summary`, réponse dashboard bornée : KPI, maximum cinq
   événements à venir et maximum quatre actions prioritaires. Aucun organizerId
   client n’est accepté.
4. Ajouter `archivedAt` et des actions archive/restaure propriétaires. L’archive est
   un état opérationnel indépendant du cycle `draft/published/completed/cancelled`,
   pas un nouveau statut artificiel.
5. Garder les libellés et descriptions dans la copie FR/EN ; l’API retourne des
   codes d’action, jamais du contenu UI localisé.
6. Remanier les deux expériences existantes autour des mêmes primitives Elintys,
   avec requêtes TanStack paginées, mutations invalidées et états explicites.
7. Étendre les suites unitaires et ajouter une suite E2E Sprint 3 Vague 1, axe,
   captures sur sept viewports et mesures sur build production.

## Risques et parades

| Risque | Parade |
|---|---|
| divergence entre readiness catalogue et publication | appeler exclusivement `validateEventPublishability` côté API |
| N+1 de types de billets | agrégation groupée par IDs de la page |
| IDOR dashboard/archive | `user.sub` uniquement, ownership vérifié dans le service |
| fuite de `codeHash` | projection sûre `toSafeEvent`, aucune policy brute sensible |
| régression Access V2 | concepts affichés séparément, enums réutilisés |
| collection illimitée | `limit` borné à 100, défaut 12, pagination serveur |
| incohérence archive/statut | `archivedAt` orthogonal, restauration explicite |
| F-047 | aucune modification de throttling ou `TRUSTED_PROXY_HOPS` |

## Fichiers prévus

API : schéma Event, DTO de requête, service/controller/module Event, tests service et
controller, tests E2E dédiés si le harness le permet.  
Web : types/service Event, copie FR/EN, dashboard, bibliothèque, carte/actions,
helpers métier testables, tests Vitest, E2E fonctionnels/visuels, rapports audit et
QA.  
Documentation : `docs/design-qa/sprint-3-wave-1/` et rapport final
`docs/audits/sprint-3-wave-1-dashboard-events.md`.

## Décision de départ

Le périmètre est implémentable sans toucher au wizard, à la page publique complète,
à PostgreSQL, Stripe réel, QR/check-in, analytics avancées ou F-047. Aucun P0/P1
produit nouveau n’a été découvert pendant ce préaudit.
