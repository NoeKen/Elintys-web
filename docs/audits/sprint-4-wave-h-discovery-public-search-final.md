# Sprint 4 / Wave H — Discovery & Public Search

Date : 2026-09-14
Branche API/Web : `feat/s4-wave-h-discovery-public-search`

## 1. Executive summary

Wave H remplace le placeholder public par une recherche SSR multi-entités réelle, fondée sur le module Discovery existant. Le parcours public permet désormais de rechercher, filtrer, paginer et ouvrir les fiches Event, Vendor et Venue avec une URL partageable. Les filtres sont propres au type, les projections restent publiques, les erreurs ne deviennent jamais de faux résultats vides et la recherche est bornée et limitée en débit.

Aucun moteur externe, système de recommandation, nouvelle famille de cartes ou client HTTP parallèle n'a été ajouté. Aucun changement de schéma Mongo ni migration n'a été nécessaire.

## 2. Wave G merge evidence

- API PR #59 : fusionnée vers `dev`, merge commit `b7f7282`; commits `8bd3ee8` et `bff752b` présents.
- Web PR #108 : fusionnée vers `dev`, merge commit `d963a52`; commits `ef0530e`, `8bd2efb` et `486f44f` présents; preview Vercel vérifiée SUCCESS avant la baseline H.

## 3. Post-merge smoke

| Surface | Résultat |
|---|---:|
| API lint / typecheck / build | GREEN |
| API Auth, Account, Notifications, Emails | 6 suites, 82 tests GREEN |
| Web lint / typecheck / build Webpack | GREEN, 57 routes |
| Web composants ciblés | 36 tests GREEN |
| Browser Auth, Notifications, Wave G | 35/35 GREEN |

## 4. Git baseline

| Repository | Baseline | Branche H |
|---|---:|---|
| API | `b7f7282` | `feat/s4-wave-h-discovery-public-search` |
| Web | `d963a52` | `feat/s4-wave-h-discovery-public-search` |

## 5. Pre-implementation inventory

| Capability | Backend avant H | Frontend avant H | Integrated | E2E | Gap | Decision H |
|---|---|---|---:|---:|---|---|
| Catalogue Event | Public, paginé, q/ville | Catalogue réel | Oui | Partiel | Pas de date/type dans Discovery | Ajouter type + plage UTC bornée |
| Catalogue Vendor | Public, paginé, catégorie | Catalogue réel avec ville/prix via `/vendors` | Partiel | Partiel | Discovery moins riche que catalogue | Aligner catégorie/ville/palier existant |
| Catalogue Venue | Public, paginé, q/ville | Catalogue réel avec type/capacité via `/venues` | Partiel | Partiel | Discovery moins riche que catalogue | Aligner type/ville/capacité |
| Search multi-entités | `/discovery/search`, q + pagination | Route placeholder, SearchBar morte | Non | API contrat uniquement | Aucun parcours public | Route SSR canonique + barre réutilisée |
| Résultats typés | 3 tableaux, sans totaux | Aucun consommateur | Non | Non | Pagination non représentable | Ajouter totaux par famille, page, limit |
| Projections | Sûres mais trop minimales | Cards publiques existantes | Non | Unit seulement | Images/descriptions/prix absents | Projections publiques canoniques enrichies |
| Date Event | Absent dans Discovery | Champ mort envoyant `date` ignoré | Non | Non | Contrat mensonger | `dateFrom/dateTo` calendrier UTC inclusif |
| Prix | Palier Vendor réel | Filtre catalogue Vendor | Partiel | Partiel | Aucun sens cross-entity | Vendor uniquement; Event/Venue masqués |
| Capacité | Venue réel sur catalogue | Filtre catalogue Venue | Partiel | Partiel | Absent de Discovery | Venue uniquement, entier positif |
| URL / pagination | page/limit bornés API | Aucun état Search | Non | Non | Back/reload/partage absents | URL source de vérité, 12/page |
| Empty/error/loading | Réponses HTTP propres | Placeholder | Non | Non | Panne confondable avec vide | États distincts + retry conservant l’URL |
| SEO | Fiches publiques principales | Aucun metadata Search dédié | Non | Non | Risque d’indexation combinatoire | `noindex,follow`, canonical stable |
| A11y/mobile | N/A | Aucun écran | Non | Non | Parcours absent | Form search, labels, live count, 44 px |

## 6. Search contract

| Route | Paramètres | Résultat |
|---|---|---|
| `GET /api/v1/discovery/search` | `q`, `type`, `page`, `limit` | Tableaux typés `events/vendors/venues`, totaux par type, page et limite |
| `GET /api/v1/discovery/events` | `q`, `city`, `type`, `dateFrom`, `dateTo`, `page`, `limit` | Catalogue Event public paginé |
| `GET /api/v1/discovery/vendors` | `q`, `category`, `city`, `price`, `page`, `limit` | Catalogue Vendor actif paginé |
| `GET /api/v1/discovery/venues` | `q`, `city`, `type`, `capacity`, `page`, `limit` | Catalogue Venue actif paginé |

`q` est échappé, de longueur 2 à 120. `page` est bornée à 1–10 000 et `limit` à 1–50. Les dates sont des jours calendrier UTC stricts `YYYY-MM-DD`, inclusifs et ordonnés. `capacity` est un entier positif borné. Les catégories, types et paliers de prix sont des enums fermées.

## 7. Backend changes

- Extension additive des DTO Discovery, sans casser les clients existants.
- Recherche agrégée restreignable à une famille et dotée de totaux.
- Requêtes data/count parallélisées, tri stable avec `_id`, pagination serveur.
- Projections explicites nécessaires aux cartes publiques.
- Filtre date Event, palier de prix Vendor, type/capacité Venue.
- Plafond de page ajouté pendant la review indépendante pour éviter un `skip` Mongo arbitraire.
- Sémantique de `q` alignée entre recherche agrégée et catalogues typés (ville Event, zone Vendor, description Venue).

## 8. Frontend changes

- `/evenements/recherche` devient une page App Router SSR réelle avec metadata.
- `SearchBar` existante refactorée en formulaire clavier et montée dans le Hero du catalogue.
- `DiscoveryFilters` rend uniquement les contrôles supportés par le type choisi.
- `DiscoveryResults` réutilise `EventCard`, `VendorCard` et `VenueCard`.
- Ajout des états loading, featured/discovery, empty, error/retry et pagination.
- Aucun nouveau client HTTP : la page réutilise `fetchCatalogJson` côté serveur.

## 9. Multi-entity search

La recherche agrégée conserve trois tableaux distincts et trois totaux : aucun objet polymorphe ambigu. Le sélecteur `all/event/vendor/venue` évite les requêtes inutiles lorsqu'une seule famille est demandée. Sans critère, l'écran affiche les événements featured réels ; avec un critère sans résultat, il affiche un vide explicite.

## 10. Event search

Recherche sur titre, description courte/longue et ville. Filtres Event : ville, `EventType`, `dateFrom`, `dateTo`. Seuls les événements publiés, non archivés et découvrables `public` apparaissent. Les événements `unlisted` restent accessibles par URL directe mais absents de Search ; privés, drafts et archivés restent exclus.

## 11. Vendor search

Recherche sur identité, description et zone de service. Filtres : catégorie canonique, ville/zone de service et paliers `$` à `$$$$` appliqués au prix de départ persistant. Seuls les profils actifs sont inclus.

## 12. Venue search

Recherche sur nom, description et ville. Filtres : type canonique de lieu, ville et capacité minimale. Seuls les profils actifs sont inclus. Le résultat ouvre la fiche publique existante `/lieux/:id`.

## 13. Filters

Les filtres visibles ont tous un contrat API réel. Les filtres incompatibles disparaissent au changement de type et ne sont pas propagés silencieusement. Les listes proviennent du module canonique `catalog-filters`; aucune saisie libre de catégorie/type n'atteint Mongo.

## 14. Pagination

Taille UI fixe : 12 par famille. Précédent/suivant reposent sur les totaux serveur. Toute modification de recherche, type ou filtre remet la page à 1. L'API refuse les limites supérieures à 50 et les pages supérieures à 10 000.

## 15. URL state

L'URL est la source de vérité (`q`, `type`, filtres, `page`). Reload, partage, bookmark et back/forward conservent l'état. Le parseur frontend nettoie les valeurs inconnues, dates invalides, capacités négatives et filtres hors type avant de construire l'appel API.

## 16. Public projections/privacy

Projections allow-listées. Aucun `organizer`, identifiant propriétaire, contact privé, code d'accès, hash, token d'invitation ou metadata interne n'est sélectionné. Les E2E créent simultanément un Event public, unlisted et privé avec le même marqueur : seul le public est retourné.

## 17. SEO

Décision : `noindex, follow` avec canonical stable `/evenements/recherche`. Les combinaisons query-string ne produisent pas de surface indexable infinie. Les fiches Event/Vendor/Venue restent les pages SEO principales.

## 18. Performance/query safety

- SSR avec revalidation 30 s ; featured à 60 s.
- Aucun waterfall navigateur ni double hydratation de données.
- Recherche agrégée : maximum six opérations Mongo indépendantes en `Promise.all`; deux pour un type ciblé.
- Aucun N+1.
- Regex utilisateur échappée, longueur bornée, enums validées, pagination bornée.
- Rate-limit existant `PUBLIC_SEARCH` : 120 requêtes/minute par identité/IP.

Limite assumée MVP : la recherche partielle insensible à la casse repose encore sur regex Mongo. Un index texte ou moteur dédié devra être évalué uniquement après mesure réelle de volumétrie ; aucun besoin actuel ne justifie Elasticsearch/Algolia.

## 19. Responsive

Interactions validées aux viewports : 320×720, 375×812, 390×844, 768×1024, 1024×768, 1440×900 et 1538×1100. Barre, tabs, filtres, cartes et CTA restent utilisables, sans overflow horizontal ; CTA principaux ≥44 px. Une tentative de lien Search supplémentaire dans la navigation a été retirée pendant QA car elle créait un overflow à 768 px ; le Hero du catalogue demeure le point d'entrée public clair.

## 20. Accessibility

Landmark `search`, labels, formulaire GET, navigation de types/pagination, loading `aria-busy`, erreur `role=alert`, résultat `aria-live`, focus clavier et noms accessibles vérifiés. Axe : **0 critical, 0 serious** sur le parcours Search desktop/mobile testé.

## 21. i18n impact

Toutes les nouvelles chaînes Wave H existent avec parité FR/EN dans les catalogues actuels. Le runtime public demeure francophone conformément à l'architecture existante ; aucune refonte i18n globale n'a été engagée. La review a rattaché au catalogue les derniers libellés du sélecteur et du loading.

## 22. Design/card-border audit

Les trois familles de cartes publiques existantes sont réutilisées. L'écran respecte les surfaces chaudes, la hiérarchie éditoriale, les rayons et les ombres Elintys. Test CSS calculé : **0 contour décoratif visible** sur les cartes représentatives. Les bordures fonctionnelles des inputs, focus et séparateurs restent intactes.

## 23. API tests

| Gate | Résultat |
|---|---:|
| Lint | GREEN, 0 erreur/warning |
| Typecheck | GREEN |
| Build | GREEN |
| Unit + coverage | 78 suites, 1 238 tests GREEN |
| E2E complet | 10 suites, 153 tests GREEN |
| Concurrence historique | 17/17 GREEN |
| Discovery contract ciblé | 49/49 GREEN |
| Coverage global | statements 73,97 %; branches 68,47 %; functions 70,16 %; lines 74,74 % |
| Coverage Discovery service | statements 95,83 %; functions 100 %; lines 95,16 % |
| `npm audit --omit=dev` | 0 vulnérabilité |

## 24. Web tests

| Gate | Résultat |
|---|---:|
| Lint | GREEN, 0 erreur/warning |
| Typecheck | GREEN |
| Production build | GREEN Webpack, 57 routes |
| Unit + coverage | 71 fichiers, 431 tests GREEN |
| Coverage global | statements 57,28 %; branches 51,42 %; functions 51,34 %; lines 58,85 % |
| Coverage `discovery-query` | statements 92,39 %; branches 83,65 %; functions 100 %; lines 94,52 % |
| Coverage fetch SSR | statements/lines 92,3 %; branches 75 %; functions 100 % |
| `npm audit --omit=dev` | 0 vulnérabilité |

## 25. Browser E2E

Les 14 scénarios Wave H couvrent : Event/Vendor/Venue, filtres, ouverture des fiches, privacy, empty, URL reload/back, carte sans contour, 7 viewports, Axe et vrai 429. Le scénario dégradé épuise le quota Search réel, vérifie l'erreur réessayable et l'absence de faux vide. Les 401 attendus de restauration de session anonyme sont allow-listés uniquement pour `/auth/me` et `/auth/refresh`; tout autre 401, console error, pageerror ou HTTP ≥500 reste bloquant.

Résultat ciblé final : **17 exécutions GREEN** (2 setup, 1 régression Wave D, 14 Wave H).

## 26. F/G regression

Le smoke post-merge et la suite complète rejouent les notifications Vendor/Venue/invitation, mark-one/mark-all ainsi que profil, mot de passe, vérification, reset, préférences, rôles et achats. Une assertion Wave D disant encore « recherche future » a été remplacée par le contrat réel de Search. Une session propriétaire invalidée volontairement par Wave G ne contamine plus les tests publics Wave H.

## 27. Full regression

API : **1 238 unit + 153 E2E + 17 concurrence**, 0 échec. Web : **431 unit**, 0 échec. Gate Playwright final isolé : **286 passed, 2 historical skips, 0 failed** en 20,8 minutes. Un run antérieur non retenu avait rencontré un sélecteur Wave H ambigu et un `503` Cloudinary intermittent ; le sélecteur a été rendu déterministe, l’upload réel a repassé en ciblé puis dans le run complet, et aucun skip ni relâchement d’assertion n’a été ajouté.

## 28. Independent review

La review a inspecté `git diff` API/Web, DTO, filtres Mongo, projections, SSR/cache, URL state, tests et CSS.

Corrections issues de cette review :

1. borne API `page <= 10 000` et test HTTP rouge/vert ;
2. mapping frontend `category → type` pour Event/Venue ;
3. isolation anonyme du test public après invalidation de session Wave G ;
4. remplacement de l'assertion historique Wave D obsolète ;
5. contraste AA du lien d'effacement ;
6. suppression du lien de navigation créant un overflow tablette ;
7. attente back/forward basée sur l'état et sélecteur de date non ambigu ;
8. parité FR/EN des libellés loading/type ;
9. couverture 429/503/network du fetch SSR et de l'UI dégradée ;
10. remount interne de `SearchBar` pour synchroniser back/forward sans effet React ni état stale ;
11. alignement des champs textuels entre `/search` et les trois catalogues typés ;
12. audit runtime Wave D durci : seuls les 401 de `/auth/me` et `/auth/refresh` sont tolérés, tout autre 401 reste bloquant.

Recherche `test.only`/`describe.only`/nouveaux skips : aucune occurrence dans Wave H. Aucun guard, filtre privacy ou assertion sécurité n'a été désactivé.

## 29. P0/P1/P2/P3

| Sévérité | Trouvés | Ouverts | Résolution |
|---|---:|---:|---|
| P0 | 0 | 0 | — |
| P1 | 0 | 0 | — |
| P2 | 6 | 0 | mapping filtres, overflow tablette, borne page, isolation E2E, état URL SearchBar, sémantique `q` |
| P3 | 4 | 0 | contraste, sélecteurs/attentes, chaînes catalogue, audit 401 historique |

## 30. Deferred items

Hors scope conservé : Reviews, AI/semantic search, embeddings, Elasticsearch, Algolia, pgvector, recommandations, Organizations/Memberships, Payment Readiness, subscriptions, Admin, analytics, mobile natif et refonte i18n globale.

## 31. Preserved F/G backlog

Wave F : rappels programmés ; notification « ticket vendu » organisateur ; notifications/emails d'annulation Vendor/Venue ; realtime/push/WebSocket/SSE ; centre de notifications complet.

Wave G : changement d'email sécurisé ; consommation globale de la préférence langue ; abonnement/facturation/invoices/tax ; suppression de rôle ; gestion multi-device.

## 32. Remaining risks

- Regex Mongo non indexée : acceptable au volume MVP avec input/limit/page/rate bornés, à mesurer avant montée en charge.
- L'agrégation `all` conserve historiquement une pagination par famille (jusqu'à 12 éléments par famille), pas un ranking global cross-entity. C'est documenté et volontaire : aucun score fictif n'a été inventé.
- Le runtime i18n global reste hors scope ; les catalogues sont prêts mais la Search est servie en FR comme le reste des pages publiques actuelles.

## 33. Release scorecard

| Domaine | Statut | Justification |
|---|---|---|
| PUBLIC SEARCH | GREEN | Route SSR réelle et accessible depuis le Hero |
| MULTI-ENTITY DISCOVERY | GREEN | Résultats Event/Vendor/Venue typés |
| EVENT FILTERING | GREEN | q, ville, type, plage UTC |
| VENDOR FILTERING | GREEN | q, catégorie, ville, palier prix |
| VENUE FILTERING | GREEN | q, ville, type, capacité |
| PAGINATION / URL STATE | GREEN | Bornes serveur, reload/back/partage |
| PUBLIC DATA PRIVACY | GREEN | Projections allow-listées, invisibles exclus |
| SEARCH PERFORMANCE | GREEN | 0 N+1, bornes, parallélisme, throttle ; regex MVP documentée |
| RESPONSIVE / A11Y | GREEN | 7 viewports, Axe 0/0, 0 overflow |

## 34. Final verdict

P0 = 0, P1 = 0, P2 bloquant = 0. Aucun changement destructif, aucune migration et aucun secret. Les deux PR Wave H ciblent `dev` et ne doivent pas être fusionnées dans cette mission.

SPRINT 4 / WAVE H — VALIDÉE — DISCOVERY & PUBLIC SEARCH PRODUCT INTEGRATION COMPLETE — PR OUVERTE VERS DEV
