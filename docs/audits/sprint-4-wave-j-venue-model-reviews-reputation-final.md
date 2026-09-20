# Sprint 4 / Wave J — Venue Model + Verified Reviews & Reputation

Date de validation : 20 septembre 2026

Date de livraison en revue : 20 septembre 2026

Branche API/Web : `feat/s4-wave-j-venue-model-reviews-reputation`

Verdict technique : **CANDIDATE VALIDÉE ET LIVRÉE EN REVUE**. Commits, push et deux PR ouvertes vers `dev` ; merge non effectué. Détail en §49 ; historique de reprise dans `sprint-4-wave-j-implementation-state.md`.

## 1. Executive summary

Wave J sépare désormais le compte gestionnaire, son profil professionnel et ses lieux. Un même gestionnaire peut administrer plusieurs lieux sans ambiguïté d’ownership. Les avis publics sont exclusivement issus d’interactions serveur vérifiées : participation à un événement terminé, collaboration prestataire acceptée et exécutée, ou réservation de lieu confirmée et terminée. Les relations Organisateur↔Prestataire et Organisateur↔Lieu sont bilatérales ; la réputation Participant reste non publique.

Les revues indépendantes ont trouvé et corrigé quatre défauts avant livraison : absence des surfaces d’avis inverses, détail public des événements terminés inaccessible, appel privé d’éligibilité pour les anonymes et parcours d’éligibilité N+1. Les anciens compteurs de réputation ont aussi été retirés des cartes de catalogue en attendant les futurs badges Search vérifiés.

La Wave est livrée en revue : les deux branches sont poussées et les PR API #62 et Web #111 ciblent `dev`, toutes deux mergeables sans conflit. Elles ne doivent pas être mergées dans le cadre de Wave J.

## 2. Wave I merge evidence

- API `dev` de départ : `542c95b`, contenant la PR Wave I #61 et les commits attendus `c1e3fd5`, `850a388`.
- Web `dev` de départ : `101709a`, contenant la PR Wave I #110 et les commits attendus `70891fb`, `0dcfae9`, `f765c3f`.
- Les deux arbres étaient propres avant la création des branches Wave J.
- Aucune écriture directe sur `dev`, aucun force push, aucun reset destructif.

## 3. Post-merge smoke et 4. Git baseline

Les smokes post-Wave-I ont validé lint, typecheck, build, tests ciblés API/Web et le parcours navigateur Wave I avant modification. La source de vérité de Wave J est le code des branches issues de ces deux HEAD, et non les anciens rapports.

## 5. Scope

Implémenté : profil gestionnaire distinct, multi-lieux, ownership exact, migration additive, reviews V2 vérifiées et contextualisées, agrégats publics, avis privés reçus par organisateur, UI publique et dashboard, responsive/Axe/E2E.  
Différé : location directe Participant→Venue, modération/signalement, notifications d’avis, profil public Organizer, badges de réputation Search/catalogues et structured data `AggregateRating`.

## 6. Venue audit, 7. ancien modèle et 8. modèle corrigé

L’ancien modèle imposait `VenueProfile.user` unique : le compte, le gestionnaire et le lieu étaient confondus. Le modèle corrigé est :

`User → VenueManagerProfile → VenueProfile[]`

- `VenueManagerProfile.user` est unique, immutable et dérivé du JWT.
- `VenueProfile.managerProfile` est requis et immutable.
- Le champ legacy `VenueProfile.user` est conservé pour compatibilité, mais n’est plus unique ni utilisé comme autorité.
- Les routes publiques ne projettent ni `user`, ni `managerProfile`.
- Les réservations résolvent le propriétaire du lieu exact via le profil gestionnaire.

## 9. Migration/backfill

Une sauvegarde globale préalable a été créée dans `/private/tmp/elintys-wave-j-backup.tmz9kH/elintys-dev-2026-09-20T02-49-18-548Z` : 22 collections, 2 872 documents, empreinte vérifiée. Elle reste locale et n’est pas commitée.

Migration lieux : dry-run, backup BSON/indexes, création idempotente des profils, lien des 11 lieux existants, création du nouvel index, contrôle des champs et du nombre de documents, puis suppression en dernier de l’unicité legacy `user_1`. Résultat : 11/11 lieux préservés, zéro lien orphelin. Backup dédié : `/private/tmp/elintys-wave-j-backup.tmz9kH/wave-j-1789891346496`.

Migration avis : aucun historique n’a été requalifié artificiellement. L’index legacy a été remplacé par l’unicité partielle V2. Backup dédié : `/private/tmp/elintys-wave-j-backup.tmz9kH/wave-j-reviews-1789899861851`. Résultat post-migration : 0 avis historique, 0 perte, index V2 présent.

## 10. Onboarding et 11. dashboard gestionnaire

L’onboarding configure le profil professionnel du gestionnaire et ne crée plus implicitement de lieu. Le dashboard expose `Mon profil`, `Mes lieux`, `Ajouter un lieu` et les réservations, avec redirection de l’ancienne route `/gestionnaire/fiche` vers le parcours canonique.

## 12. Multi-venue, 13. ownership et 14. profils publics

- `GET /venues/mine` est paginé et retourne tous les lieux du profil connecté.
- `GET /venues/mine/:id` et `PUT /venues/:id` contrôlent le `managerProfile` exact.
- `/venues/me` reste compatible pour un seul lieu et répond `409 VENUE_SELECTION_REQUIRED` lorsque le choix serait ambigu.
- Manager A ne peut ni lire les données privées, ni modifier, ni répondre pour un lieu de Manager B.
- Les pages publiques restent centrées sur le lieu, jamais sur le compte propriétaire.

## 15. Reviews matrix

| Direction | Preuve serveur | Réputation |
|---|---|---|
| Participant → Event | inscription active ou billet valid/used + Event completed | Event publique |
| Organizer → Vendor | VendorRequest accepted + Event completed | Vendor publique |
| Vendor → Organizer | même interaction, acteur Vendor exact | Organizer privée |
| Organizer → Venue | Booking confirmed + période terminée + Event completed | Venue publique |
| Venue Manager → Organizer | même Booking, manager exact | Organizer privée |
| Participant locataire → Venue | capacité de réservation directe absente | différé |

## 16. Participant/Event

Un événement `completed`, public ou unlisted, reste accessible par son URL historique sans réapparaître dans le catalogue actif. L’admission y est fermée et le formulaire d’avis n’apparaît qu’après validation serveur de la participation.

## 17. Organizer/Vendor et 18. Organizer/Venue

Les deux relations sont bilatérales. L’organisateur dépose son avis sur les pages publiques Vendor/Venue. Le prestataire et le gestionnaire évaluent leur collaboration depuis leurs demandes/réservations réelles. Le serveur dérive toujours la cible et la direction à partir du contexte ; le frontend ne transmet aucune identité faisant autorité.

## 19. Participant renter/Venue

**DEFERRED — BLOCKED BY PRODUCT CAPABILITY.** Le produit actuel ne permet pas une réservation directe de lieu par un Participant. Aucun flux parallèle n’a été inventé et aucune réputation publique Participant n’existe.

## 20. Schema, 21. eligibility et 22. duplicate/concurrency

Reviews V2 ajoute `schemaVersion`, `contextType`, `contextId`, `direction` et `verifiedAt`. La clé unique partielle est `(author, contextType, contextId, direction)` pour `schemaVersion=2`, ce qui permet de nouvelles collaborations futures mais empêche le doublon d’une même interaction.

L’éligibilité par cible publique utilise des agrégations Mongo bornées, sans boucle N+1. L’éligibilité inverse par contexte est disponible uniquement authentifiée. Une sonde Mongo réelle a lancé deux insertions simultanées : exactement une acceptée et une rejetée `E11000`, puis les données de sonde ont été supprimées.

## 23. Edit/delete

Seul l’auteur peut modifier note/commentaire ou supprimer son avis. Cible, contexte, direction, auteur et date de vérification ne sont jamais mutables par DTO. Les tentatives mass assignment, ObjectId invalides, faux contexte, tiers et self-review sont rejetées.

## 24. Event reputation, 25. Vendor reputation et 26. Venue reputation

Les fiches détaillées affichent uniquement les agrégats V2 vérifiés et paginés. Les compteurs legacy ne sont plus présentés comme avis vérifiés. Chaque Venue conserve sa propre réputation : aucune moyenne n’est fusionnée au niveau du gestionnaire.

## 27. Organizer reputation privée et 28. Participant non public

Les avis reçus par l’organisateur sont persistés et visibles sur `/tableau-de-bord/avis`. Aucune marketplace Organizer n’a été créée. Aucun score, classement ou profil de réputation public Participant n’existe.

## 29. Public UI et 30. Dashboard UI

Les surfaces gèrent loading, empty, error/retry, inéligible, formulaire, pending et succès. Les formulaires radio 1–5 sont nommés, les commentaires sont bornés à 2 000 caractères et le double submit est bloqué. Un visiteur anonyme voit le CTA de connexion sans déclencher de 401 privé. Les avis inverses sont chargés à la demande pour éviter une requête par carte au premier rendu.

## 31. Search/catalog badges

**DEFERRED — FUTURE SEARCH AMENDMENT.** Les cartes Vendor/Venue n’affichent plus les anciens `rating/reviewCount`. Le futur badge de réputation devra consommer un agrégat V2 explicite, dans la séparation marketplace prévue en Wave H. Le tri legacy backend reste une dette de ranking sans affichage de réputation.

## 32. Security/privacy

- Identité depuis JWT uniquement ; DTO allow-listés et `forbidNonWhitelisted` conservé.
- Aucune création d’avis sur simple visite, favori, demande refusée ou interaction non terminée.
- Aucun `managerProfile`, user owner, contexte interne ou secret dans les projections publiques.
- Organizer reviews accessibles seulement au compte cible via `/reviews/me/received`.
- Invalid ObjectId = 400 structuré ; cible publique cachée/inactive = 404 ; tiers = 403 ; doublon = 409.

## 33. API changes

Nouveau module `venue-managers`, ownership multi-lieux, migrations contrôlées, Reviews V2, endpoints d’éligibilité par cible/contexte, feed public paginé, feed Organizer privé, CRUD auteur, agrégats vérifiés et accès direct aux événements terminés.

## 34. Web changes

Nouveau workspace profil/lieux, formulaires création/édition ciblés, navigation multi-lieux, pages publiques enrichies par les avis vérifiés, composant d’avis public, action d’avis interactionnelle lazy et dashboard des avis reçus.

## 35. i18n

Les copies Reviews FR/EN sont définies pour le composant public. Les surfaces dashboard historiques restant principalement francophones n’ont pas déclenché une refonte i18n globale hors scope.

## 36. Responsive, 37. accessibility

Viewports validés : 320×720, 375×812, 390×844, 768×1024, 1024×768, 1440×900, 1538×1100. Aucun overflow horizontal critique. Les CTA principaux respectent 44 px. Axe WCAG A/AA sur profil gestionnaire, fiche publique et formulaires réels : **critical 0, serious 0**. Clavier, labels, fieldsets, radio names, focus visible, pending et annonces ont été vérifiés.

## 38. E2E et 39. unit tests

- API unit/coverage : **82 suites, 1 332 tests, 0 échec**.
- API E2E : **10 suites, 153 tests, 0 échec**.
- Concurrence : Wave A **7/7**, Wave 5 **10/10**, Reviews V2 **1/1**.
- Web unit/coverage : **76 fichiers, 458 tests, 0 échec**.
- Wave J navigateur ciblée : **9/9**, incluant 2 setups et 7 parcours Wave J.
- Suite fonctionnelle Web complète : voir résultat final au §49.

## 40. Migrations

Les migrations sont dev-only, gardées par nom d’environnement/base, dry-run par défaut, backup obligatoire en mode apply et sans rollback automatique destructif. Les runbooks décrivent dry-run, apply et récupération.

## 41. Performance

- Feed paginé, limite maximale 50, tri stable.
- Trois lectures parallèles pour feed/count/aggregate.
- Éligibilité Vendor/Venue réduite à une recherche de cible et une agrégation `$lookup` bornée.
- Les avis inverses ne chargent l’éligibilité qu’après action utilisateur.
- Aucun chargement de tous les avis ou de tous les lieux au premier rendu.

## 42. Card borders et 43. native scroll

Les surfaces Wave J suivent l’invariant **0 contour décoratif visible sur les cards** : contraste de surface, espaces, radius et ombres diffuses. Les bordures restent réservées aux champs, focus, séparateurs et validations. Aucun Lenis, `preventDefault` global, `touch-action:none` global ou masquage global de scrollbar n’a été introduit.

## 44. Independent review

La review a relu le diff complet comme un changement tiers. Elle a vérifié mass assignment, IDOR, target/context forgés, indexes, migrations, projections, N+1, cache/invalidation, états frontend, formulaires, mobile, Axe et preuves visuelles. Les correctifs ont été rejoués en tests ciblés avant les suites complètes.

Deux scans Codex Security scellés ont ensuite couvert l'intégralité des changements : API `4866ee2b-4f03-4b20-a815-e264cf97454e` (36 fichiers) et Web `680e59f1-3112-4f0e-9045-4dcc998b862d` (42 fichiers). Résultat : **0 finding reportable**, couverture complète. Le scan de secrets limité aux fichiers modifiés et nouveaux n'a détecté aucune clé, URI avec credentials, secret PayPal/JWT, clé privée ou fichier `.env` ajouté.

## 45. Findings

| ID | Sévérité | Défaut | État |
|---|---|---|---|
| J-F01 | P1 | Event completed inaccessible, bloquant Participant→Event review | CORRIGÉ |
| J-F02 | P1 | Avis inverses Vendor/Manager persistables mais sans surface frontend | CORRIGÉ |
| J-F03 | P2 | Visiteur anonyme déclenchait un 401 d’éligibilité privé | CORRIGÉ |
| J-F04 | P2 | Éligibilité Vendor/Venue avec boucle N+1 jusqu’à 50 relations | CORRIGÉ |
| J-F05 | P2 | Cartes catalogue affichaient des compteurs legacy non vérifiés | CORRIGÉ |
| J-F07 | P2 | Total catégorie incluait à tort les événements terminés | CORRIGÉ |
| J-F06 | P3 | Pas de suppression/disable Venue : les lieux QA de parcours multi-run restent en dev | OUVERT, backlog data hygiene |

État final : **P0 0, P1 0, P2 bloquant 0, P3 ouvert 1**.

## 46. Deferred et 47. backlog Search amendment

- Participant direct Venue rental/review : capacité produit absente.
- Modération/reporting et notifications d’avis.
- Profil/réputation Organizer publique.
- Badges Search/catalogues, ranking V2 et `AggregateRating` structuré.
- Backlogs F/I préservés : temps réel/rappels/annulations, remboursements/void, outbox et scheduler observability.

## 48. Remaining risks

Le tri backend de certains catalogues repose encore sur les anciens champs dénormalisés, désormais non affichés comme réputation. Les fixtures E2E créent des lieux uniques sur la base dev faute de contrat de désactivation ; elles ne touchent pas la production. La livraison externe de paiement et les fonctionnalités de modération ne font pas partie de Wave J.

## 49. Commits et PRs

Gate navigateur complet final : **307 passed, 2 skips historiques, 0 failed** en 24,6 min. Un premier run avait rencontré un flaky historique du scroll clavier `/`; le test a ensuite réussi quatre fois isolément puis dans la suite complète verte, sans modification ni augmentation de timeout.

Commits API :

- `fe7a71c` — `feat(reputation): enforce verified reviews and multi-venue ownership`
- `0be5963` — `test(reputation): cover migrations ownership and concurrency`

Commits Web :

- `3f7545a` — `feat(reputation): integrate multi-venue management and verified reviews`
- `0904e6f` — `test(reputation): cover venue ownership and bilateral reviews`

Commits documentaires Web supplémentaires :

- `15566ac` — `docs(audit): document sprint 4 wave J validation`
- `020be1c` — `docs(audit): record Wave J pull requests`

Avance sur `origin/dev` au moment de l'ouverture des PR : API 2 commits (38 fichiers, +1291/-384), Web 3 commits (47 fichiers, +1348/-484), aucun retard dans les deux cas.

PRs ouvertes le 20 septembre 2026, ciblant `dev`, **non mergées** :

| Dépôt | PR | Base | Mergeable | Checks |
|---|---|---|---|---|
| Elintys-api | https://github.com/NoeKen/Elintys-api/pull/62 | `dev` | MERGEABLE / CLEAN | aucun workflow CI configuré dans le dépôt |
| Elintys-web | https://github.com/NoeKen/Elintys-web/pull/111 | `dev` | MERGEABLE / CLEAN | Vercel SUCCESS, Vercel Preview Comments SUCCESS |

Preview Web : https://elintys-web-git-feat-s4-wave-j-ven-d5411c-noe-kenfacks-projects.vercel.app

Ni `Elintys-api/.github/workflows` ni `Elintys-web/.github/workflows` n'existent : il n'y a pas de CI GitHub Actions à attendre sur ces PR. La seule vérification automatisée disponible est la preview Vercel côté Web, verte.

Réserve de traçabilité : les statuts de checks du tableau ci-dessus ont été relevés sur le Web à `15566ac`. Les commits documentaires postérieurs (`020be1c` et suivants) déclenchent un nouveau build de preview dont le statut n'est pas relevé ici ; ils ne touchent que des fichiers Markdown sous `docs/audits/` et ne modifient aucun code applicatif.

État des dépôts après livraison : worktrees propres, branches locales alignées avec `origin` dans les deux dépôts, aucun merge, aucun force push, aucune écriture directe sur `dev`.

## 50. Final verdict

Release scorecard : Venue ownership **GREEN** ; Multi-venue **GREEN** ; Reviews eligibility **GREEN** ; Event reputation **GREEN** ; Vendor reputation **GREEN** ; Venue reputation **GREEN** ; Organizer private feedback **GREEN** ; Participant public reputation **N/A/INTERDIT** ; Responsive/A11y **GREEN** ; Security/privacy **GREEN** ; migrations **GREEN**.

**SPRINT 4 / WAVE J — LIVRÉE EN REVUE — implémentation et gates locaux verts ; commits, push et deux PR ouvertes vers `dev`, mergeables et checks verts ; merge non effectué, en attente de revue**
