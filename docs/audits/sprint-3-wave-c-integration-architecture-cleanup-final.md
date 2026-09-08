# Sprint 3 — Vague corrective C — Integration & Architecture Cleanup

Date : 7 septembre 2026

Périmètre : `Elintys-web` et validation de non-régression `Elintys-api`

Verdict technique : prêt pour pull request vers `dev`

## 1. Git baseline

| Dépôt | `origin/dev` au départ | Branche de travail | État initial |
|---|---|---|---|
| Web | `c07dd5f` — merge PR #103 Wave B | `refactor/s3-wave-c-integration-architecture-cleanup` | propre, aucun stash inattendu |
| API | `453bd1f` — merge PR #56 Wave B | `refactor/s3-wave-c-integration-architecture-cleanup` | propre, aucun stash inattendu |

Les deux commits Wave B sont bien des ancêtres de `origin/dev`. Aucun reset, rebase destructif, secret production ou environnement production n'a été utilisé.

## 2. Scope

La vague traite exclusivement C-01 à C-10 : consolidation des transports et contrats frontend, suppression prouvée de code d'intégration mort, cohérence locale des caches et canonicalisation technique de routes dashboard. Aucun écran Reviews, moteur de recherche, parcours Payment Readiness, migration de données ou E2E système transversal n'a été construit.

## 3. Inventory initial

L'état courant, revalidé contre le code après Waves A/B, contenait :

- un client navigateur canonique `shared/lib/api.ts` ;
- un client serveur/SSR canonique `server/catalog/catalog-api.ts` ;
- deux copies locales de `authFetch` (Guests et Notifications) ;
- un `fetch` navigateur local dans Waitlist ;
- six fonctions de hooks exportées mais sans consommateur ;
- six méthodes API frontend mortes ou invalides ;
- deux conteneurs de types concurrents ;
- deux clés Guests pour la même page de données et deux familles abrégées Notifications ;
- quatorze implémentations de routes dashboard top-level historiques, dont douze avaient une destination canonique certaine.

Les appels `fetch` restants dans les pages publiques, le sitemap et le client catalogue serveur ont été relus. Ils portent des responsabilités SSR, cache Next, métadonnées ou statut 404 spécifiques et ne constituent pas des clients navigateur concurrents.

## 4. C-01 — HTTP clients

Guests, Notifications et Waitlist utilisent maintenant le client navigateur partagé : cookies HTTP-only, refresh 401 sérialisé, réponse 204 uniforme et erreurs `ApiClientError`. Le paramètre sentinelle `cookie-session`, `useAuthToken` et les deux implémentations `authFetch` ont disparu.

Le client SSR reste distinct volontairement : il gère `server-only`, timeout, cache/revalidation et observabilité. Aucun « God HTTP Client » n'a été introduit.

## 5. C-02 — Services

Le service Guests porte désormais le contrat canonique et ses types feature. Notifications et Waitlist n'ont plus de transport privé. `vendorsService` reste le propriétaire du catalogue public uniquement ; `vendorProfileService`, `vendorRequestsService` et `venueProfileService` restent séparés car leurs ressources et responsabilités diffèrent.

Favorites, déjà canonicalisé en Wave A autour de `/api/v1/favorites`, n'a pas été réécrit.

## 6. C-03 — Stale contracts

Suppression, après preuve d'absence de consommateurs, de :

- `vendorsService.get/create/update/delete` ;
- `ticketsService.validate` qui visait la route inexistante `/tickets/validate` ;
- `waitlistService.count`, jamais appelé ;
- l'ancien shape Guests (`firstName`, `lastName`, `pending`, `no_show`) contraire au schéma runtime.

Le normalizer TicketType actif conserve maintenant `isFree` et `reserved` (`reservedCount` côté UI). Les documents historiques sans ces champs sont normalisés vers `false` et `0`. `currency` n'a pas été ajouté : le schéma API TicketType actuel ne possède pas ce champ.

## 7. C-04 — Dead hooks

Les recherches de noms de fichiers, symboles, imports directs/indirects, tests et routes ont confirmé l'absence de consommateurs pour six fonctions réparties dans quatre hooks :

- `useDiscovery`, `useFeaturedEvents` ;
- `useGuests` ;
- `useEvents`, `useEvent` ;
- `useVendors`.

L'intégration Discovery cliente morte a été retirée. L'endpoint Discovery et son utilisation SSR réelle sur la page publique restent intacts.

## 8. C-05 — Types

Le fichier global mort `shared/types/domain.types.ts` (203 lignes) a été supprimé au profit des types proches de chaque feature. Les deux définitions Guests conflictuelles ont été remplacées par un contrat unique aligné sur l'API. Les projections publiques Event/Vendor/Venue ont été conservées : elles ne sont pas sémantiquement identiques aux modèles dashboard.

## 9. C-06 — Legacy routes

| Ancienne route | Route canonique | Rôle | Stratégie | Risque |
|---|---|---|---|---|
| `/organisateur` | `/tableau-de-bord` | organisateur | redirect statique permanent | faible |
| `/organisateur/evenements` | `/tableau-de-bord/evenements` | organisateur | redirect statique permanent | faible |
| `/organisateur/invites` | `/tableau-de-bord/invitations` | organisateur | redirect statique permanent | faible |
| `/organisateur/prestataires` | `/tableau-de-bord/prestataires` | organisateur | redirect statique permanent | faible |
| `/prestataire` | `/tableau-de-bord/prestataire/profil` | prestataire | redirect statique permanent | faible |
| `/prestataire/profil` | `/tableau-de-bord/prestataire/profil` | prestataire | redirect statique permanent | faible |
| `/prestataire/demandes` | `/tableau-de-bord/prestataire/demandes` | prestataire | redirect statique permanent | faible |
| `/prestataire/avis` | `/tableau-de-bord/prestataire/avis` | prestataire | redirect statique permanent | faible |
| `/gestionnaire` | `/tableau-de-bord/gestionnaire/fiche` | gestionnaire | redirect statique permanent | faible |
| `/gestionnaire/lieux` | `/tableau-de-bord/gestionnaire/fiche` | gestionnaire | redirect statique permanent | faible |
| `/gestionnaire/reservations` | `/tableau-de-bord/gestionnaire/reservations` | gestionnaire | redirect statique permanent | faible |
| `/gestionnaire/calendrier` | `/tableau-de-bord/gestionnaire/calendrier` | gestionnaire | redirect statique permanent | faible |

Les destinations sont une liste interne constante. Les tests garantissent l'absence d'URL externe et de boucle. Les paramètres de requête sont conservés par Next. La garde cliente s'applique ensuite sur la route canonique.

## 10. C-07 — Cache/query

`guestKeys` possède un propriétaire unique. Les deux vues qui lisent la page 1 utilisent exactement `guestKeys.page(eventId, 1)`, supprimant le double cache. `notificationKeys` remplace `notif-count` et `notifs`; l'invalidation de mutation vise la racine `notifications` et couvre liste et compteur.

Aucun optimistic update ou cache transverse non lié au scope n'a été modifié.

## 11. C-08 — Payment legacy

Le composant `TicketSelector.tsx` (217 lignes) était sans import, embarquait un ancien checkout client et a été supprimé. La méthode morte `/tickets/validate` a également disparu.

L'architecture active `TicketOrder` / `TicketHold` / `reserved` / `PaymentProvider` / PayPal et Stripe n'a pas été modifiée. Les routes `/checkout/[eventId]`, `/paiement/succes`, `/paiement/annule` et `/stripe-connect` ont des consommateurs, tests ou responsabilités runtime et restent en place. Aucun nettoyage backend n'était justifié.

## 12. C-09 — Route-tree analysis

Douze pages top-level dupliquées ou skeletons ont été remplacées par des redirects centralisés dans `next.config.ts`. Les routes `/organisateur/analytiques` et `/organisateur/billetterie` restent des pages : leur destination produit n'est pas déductible avec certitude. Les supprimer ou les rediriger aurait dépassé le refactor behavior-preserving.

La navigation desktop et mobile utilise déjà exclusivement les routes `/tableau-de-bord/**`.

## 13. C-10 — Dependency cleanup

Les exports de barrels Events, Vendors, Guests et Shared Types ont été ajustés avec les suppressions. Les recherches statiques post-suppression ne trouvent plus d'import vers les hooks, services, types ou composants retirés. Aucun package npm n'a dû être ajouté ou supprimé.

## 14. Before/after metrics

| Mesure | Avant | Après |
|---|---:|---:|
| implémentations de clients HTTP navigateur/SSR | 4 | 2 |
| copies locales `authFetch` | 2 | 0 |
| transports navigateur raw non justifiés | 3 | 0 |
| propriétaire service Discovery client mort | 1 | 0 |
| fonctions de hooks mortes | 6 | 0 |
| méthodes API frontend legacy mortes | 6 | 0 |
| conteneurs de types dupliqués/morts | 2 | 0 |
| familles de cache Guests page 1 | 2 | 1 |
| familles de clés Notifications | 2 | 1 |
| pages dashboard legacy exécutables | 14 | 2 |
| redirects legacy sûrs centralisés | 0 | 12 |

Diff global avant rapport : 449 insertions, 881 suppressions, incluant le design, le plan et les nouveaux tests.

## 15. Behavior-preservation evidence

- routes et verbes Guests inchangés ;
- paramètres `page=1`, `limit=50` inchangés ;
- Notifications conserve filtre, pagination et réponses 204 ;
- Waitlist conserve le DTO exact ;
- SSR public inchangé ;
- route de gestion TicketTypes inchangée ;
- 57 pages du build production générées ;
- redirects vérifiés en HTTP 307/308 avant garde, puis auth validée sur les destinations.

## 16. Security

Les transports consolidés utilisent les cookies HTTP-only et ne reconstruisent plus d'en-tête Bearer depuis le frontend. Les redirects sont statiques, internes, sans entrée utilisateur et sans boucle. Ownership, guards, DTO et backend ne sont pas modifiés.

`npm audit` : 0 vulnérabilité dans chaque dépôt. Scan haute confiance du diff : aucun secret. `git diff --check` : vert dans les deux dépôts.

## 17. Auth

Les tests de non-régression couvrent : `/auth/me` 401 → anonymous ; 429/500/502/503/réseau → état dégradé retryable, sans faux logout ; restauration et retry depuis `AuthContext`. Le premier passage E2E a révélé uniquement des sessions QA expirées. Le provisionneur idempotent dev a recréé les cinq comptes, mot de passe masqué, puis tous les scénarios ont réussi.

## 18. Mobile/navigation

La navigation mobile n'a pas été redessinée. Régressions vérifiées à 320, 375, 390 et 768 px : rôles organisateur, prestataire, gestionnaire et multi-rôles ; ouverture/fermeture ; Escape ; restitution du focus ; clavier ; cible tactile de 44 px ; absence d'overflow. Axe critical/serious : 0 sur la barre et le panneau.

## 19. Performance

Le retrait de 881 lignes avant rapport, de deux transports dupliqués, de six hooks et du sélecteur Ticket legacy diminue le code maintenu et les chemins de fetch concurrents. La clé Guests partagée évite un cache parallèle entre deux écrans. Le build Turbopack production compile en 14,6 s, sans anomalie bundle signalée.

## 20. Tests

### API

- lint : vert ;
- typecheck : vert ;
- build : vert ;
- unit + coverage : 77 suites, 1 198 tests, tous verts ;
- E2E complet : 7 suites, 110 tests, tous verts ;
- `npm audit` : 0 vulnérabilité.

### Web

- lint : vert avec 9 warnings historiques hors diff, 0 erreur ;
- typecheck : vert ;
- build production : vert, 57 routes ;
- unit + coverage : 61 fichiers, 390 tests, tous verts ;
- tests ciblés transport/auth/Ticket/routes : 30/30 ;
- E2E auth + redirects : 12/12 exécutions ;
- E2E multi-rôles + mobile : 28/28 exécutions ;
- total E2E rejoué pour C : 40 exécutions, dont 36 scénarios et 4 setups ;
- `npm audit` : 0 vulnérabilité.

## 21. Coverage

API : 73,37 % statements, 68,37 % branches, 69,89 % functions, 74,07 % lines, tous les seuils existants respectés.

Web : 51,89 % statements, 47,34 % branches, 45,82 % functions, 53,41 % lines. Le dépôt Web n'impose pas de seuil global ; aucun test critique n'a été supprimé pour obtenir le vert.

## 22. Codex independent findings

La seconde lecture de `git diff origin/dev...HEAD` n'a trouvé aucun consumer indirect supprimé, import cassé, régression SSR, modification de règle métier ou scope creep D/E/Product.

Findings après review : P0 = 0, P1 = 0, P2 = 0, P3 = 0.

## 23. Corrections after review

Aucune correction de code supplémentaire n'a été nécessaire après le checkpoint `IMPLEMENTATION COMPLETE — BEGIN INDEPENDENT REVIEW`. Le provisionnement QA concernait uniquement l'état de test dev, pas le produit ni le diff.

## 24. P0/P1/P2/P3

| Sévérité | Ouverts | Corrigés dans C |
|---|---:|---:|
| P0 | 0 | 0 |
| P1 | 0 | 0 |
| P2 | 0 | 1 — perte `isFree/reserved` du normalizer actif |
| P3 | 0 | 1 — double propriété de cache Guests |

## 25. Out-of-scope register

| Finding | Severity | Location | Candidate wave | Reason deferred |
|---|---|---|---|---|
| UI Reviews absente | P2 produit | module Reviews | Future Product | nécessite une conception et un parcours utilisateur |
| recherche publique encore placeholder | P2 produit | `/evenements/recherche` | Future Product | l'intégration SSR Featured active ne doit pas être confondue avec une recherche complète |
| destination de deux routes organisateur incertaine | P3 architecture | `/organisateur/analytiques`, `/organisateur/billetterie` | Dedicated Architecture Wave | aucune destination canonique exacte et validée |
| chemins Stripe/checkout historiques encore actifs | P3 dette | Payments Web/API | Payment Readiness | imports, routes, tests et fallback runtime actifs ; critères de suppression C non remplis |
| 9 warnings ESLint historiques | P3 dette | Auth/UI/shared hooks | D | hors des fichiers fonctionnels refactorés et non bloquants |

## 26. Remaining risks

Les redirects permanents seront mémorisables par les navigateurs ; ce comportement est voulu pour des routes dont la destination est stable. Les deux routes organisateur ambiguës maintiennent temporairement la double arborescence. Le niveau de couverture Web global reste modeste, bien que les chemins C modifiés disposent de tests ciblés et E2E.

Le serveur API présent avant la vague sur le port 3001 a été réutilisé ; les serveurs Web lancés par Playwright ont été arrêtés automatiquement. Aucun service de test supplémentaire n'est resté actif.

## 27. Commits

Web :

- `dbf79d6` — `docs(plan): define Sprint 3 Wave C cleanup` ;
- `a8fc0ec` — `refactor(web): consolidate browser API clients` ;
- `78d2b44` — `refactor(web): retire stale vendor client methods` ;
- `b4a70be` — `fix(web): preserve canonical ticket type fields` ;
- `3a67c0e` — `chore(web): remove proven dead integration code` ;
- `22a6ad2` — `refactor(web): canonicalize legacy dashboard routes`.

API : aucun fichier modifié ; la branche correspond exactement à `origin/dev`. Créer un commit ou une PR vide pour l'API fabriquerait artificiellement un changement.

## 28. PR readiness

P0/P1/P2 bloquants = 0. C-01 à C-10 sont traités ou explicitement N/A avec preuve. Les gates API/Web, auth, navigation, sécurité, audit dépendances, scan secrets et whitespace sont vertes. Le dépôt Web est prêt à être poussé et à ouvrir une PR vers `dev`. Aucune PR API n'est nécessaire faute de diff.

**SPRINT 3 / VAGUE CORRECTIVE C — VALIDÉE — IMPLEMENTED, INDEPENDENTLY REVIEWED — PR OUVERTE VERS DEV**
