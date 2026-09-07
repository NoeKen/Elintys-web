# Sprint 3 — Vague corrective B : rapport final Codex

**Date :** 7 septembre 2026  
**Périmètre :** B-01 à B-08 et régression burger mobile Wave A uniquement  
**Branches API/Web :** `fix/s3-wave-b-contract-security-hardening`  
**Bases vérifiées :** API `e03df89`, Web `31a97be` (`origin/dev`, Wave A fusionnée)

## 1. Git recovery

Le travail interrompu de Claude a été retrouvé dans les deux dépôts sous forme de six commits, complété par un rapport non suivi, puis revu sans reset, rebase ni suppression de travail utilisateur. Aucun stash inattendu n'était présent. Les modifications générées par les anciennes campagnes de captures Wave 1 à 4 ont été sauvegardées dans `/private/tmp/elintys-wave-b-historical-qa-backup-20260907.tar.gz`, puis retirées du diff B afin de ne pas polluer la livraison.

## 2. Branches et bases

Les deux branches partent du dernier `origin/dev` contenant la Vague A. Avant les commits Codex, l'API était à quatre commits de sa base et le Web à deux commits. Aucun changement de production, de secret, de schéma, d'index ou de données n'a été effectué.

## 3. Commits Claude récupérés

API :

- `47e5aab` — `fix(api): align admin authorization contracts`
- `b9373e6` — `fix(discovery): harden search query validation`
- `0e91723` — `fix(api): scope public catalog projections`
- `c479f29` — `fix(api): harden polymorphic references and error semantics on reviews`

Web :

- `14eb46b` — `fix(navigation): make the mobile menu button actually open the menu`
- `0f8ff82` — `fix(web): align hardened API contracts`

## 4. Travail non committé récupéré

Le rapport d'implémentation Claude a été conservé dans `docs/audits/sprint-3-wave-b-contract-security-hardening-implementation.md`. Il décrit utilement l'intention initiale, mais ses chiffres de tests et sa conclusion ont été remplacés par les preuves fraîches de ce rapport final.

## 5. Matrice de recovery B-01 à B-08

| Domaine | État récupéré | Revue Codex | État final |
|---|---|---|---|
| B-01 ADMIN | implémenté | politique anonyme et deux métadonnées de routes corrigées | complet |
| B-02 Discovery | implémenté | exclusion des événements archivés et `q` homogène à 2 caractères | complet |
| B-03 Références polymorphes | implémenté sur les avis | existence remplacée par visibilité publique de la cible | complet |
| B-04 Erreurs | partiel | code métier préservé, payload sûr, query string non réfléchie | complet |
| B-05 Projections | implémenté | téléphone et `_id` auteur retirés, profils inactifs masqués, événements projetés | complet |
| B-06 DTO/query | implémenté | commentaire vide après trim refusé et recherche homogénéisée | complet |
| B-07 Contrats Web/API | partiel | modèle de pagination Discovery et types réels alignés | complet |
| B-08 Codes métier | implémenté | `GUEST_NOT_FOUND` ajouté et testé | complet |

## 6. Régression burger mobile

La cause réelle était un `Topbar` rendu sans callback d'ouverture. La correction réutilise la navigation existante et conserve le shell dashboard. Codex a ensuite ajouté `aria-expanded`, `aria-controls`, un état contrôlé cohérent, un focus visible et une cible de 44 px. Le test Wave B couvre l'ouverture, Escape, restitution du focus, clavier, navigation, overflow et Axe aux largeurs 320, 375, 390 et 768 px ; le burger est masqué à 1024 px.

## 7. Matrice ADMIN

Les opérations de gestion événement utilisent la politique propriétaire ou `ADMIN`; les opérations strictement personnelles restent liées à `user.sub`. Codex a corrigé deux routes dont les décorateurs n'étaient pas alignés (`ticket-types/.../manage` et réservations de lieu par événement). `canManageEvent` refuse maintenant tout acteur sans `userId`, y compris si un rôle admin est injecté isolément. Un organisateur tiers reste refusé et aucun identifiant organisateur fourni par le client ne devient une autorité.

Limite : aucun compte ADMIN réel n'est provisionné dans l'environnement QA. La politique et les métadonnées de garde sont couvertes automatiquement, mais le parcours HTTP avec un vrai JWT admin reste à rejouer lorsqu'un compte dédié sera disponible.

## 8. Discovery hardening

Les regex sont échappées, la pagination est bornée, les paramètres inconnus sont rejetés, les catégories sont validées et les recherches exigent deux caractères. Codex a ajouté `archivedAt: null` au filtre public et étendu la règle de longueur aux catalogues événements, prestataires et lieux. Les tests adversariaux couvrent regex, opérateur Mongo injecté, page négative, limite excessive, catégorie inconnue et terme trop court.

## 9. Références polymorphes

Une cible d'avis doit correspondre au type déclaré et être publiquement visible : événement publié, non archivé et public/unlisted, ou profil prestataire/lieu actif. Une cible absente et une cible cachée renvoient le même `REVIEW_TARGET_NOT_FOUND`, évitant d'utiliser la lecture publique comme oracle. L'index unique reste l'autorité contre les doublons concurrents.

## 10. Erreurs HTTP et métier

Les erreurs B distinguent validation 400, accès 403, absence 404 et conflit 409. Le filtre global conserve un `code` métier explicite, accepte les réponses chaîne ou objet, masque les détails internes et renvoie uniquement `request.path` : un token ou secret placé dans la query string n'est plus réfléchi dans le payload d'erreur. Les mutations d'invités utilisent désormais `GUEST_NOT_FOUND`.

## 11. Projections publiques

Les catalogues publics n'exposent plus les propriétaires internes, timestamps techniques ni numéros de téléphone. Les profils inactifs retournent 404. Les avis ne peuplent que `fullName`, sans `_id` auteur. La liste publique d'événements utilise une projection explicite des champs nécessaires aux cartes. `contactEmail` reste exposé intentionnellement parce que la fiche publique l'utilise ; cette décision produit demeure inscrite au registre hors périmètre.

## 12. DTO, params et query

Les DTO Discovery et Reviews sont soumis à la whitelist globale et aux bornes documentées. `CreateReviewDto.comment` refuse désormais une chaîne vide après trim. Les paramètres polymorphes incluent type et identifiant afin de rester compatibles avec `forbidNonWhitelisted`. Aucun mass assignment n'a été ajouté.

## 13. Contrats frontend/API

Le client Discovery n'envoie plus de filtres inexistants. Codex a remplacé l'ancien type paginé à `meta` par le contrat réel `{ data, total }` et a aligné `PublicEvent` sur `_id`, `slug`, dates, lieu et couverture réellement retournés. Aucun nouveau client HTTP ou BFF n'a été créé.

## 14. Sécurité

La revue indépendante a vérifié IDOR, ownership, rôles, ObjectId, injection Mongo, regex, mass assignment, profils cachés, champs sensibles, messages d'erreur et secrets. Un IDOR confirmé permettait auparavant au propriétaire de l'événement A de modifier ou supprimer un invité de B en combinant `eventId=A` et le `guestId` de B. Les écritures utilisent maintenant un filtre atomique `{ _id, event }`, avec validation Mongoose sur update. Aucun P0/P1/P2 Wave B ne reste ouvert.

## 15. Performance

Les limites serveur réduisent le coût des routes anonymes, les regex littérales éliminent le backtracking piloté par l'utilisateur et les projections réduisent les payloads. La vérification d'une cible d'avis ajoute un seul `exists()` indexé par `_id`, sans N+1. Le menu mobile ne déclenche aucun appel réseau ni chargement de module supplémentaire.

## 16. Responsive limité

La QA Wave B porte sur 320×720, 375×812, 390×844, 768×1024 et 1024 px pour le basculement desktop. Les contrôles automatisés vérifient absence d'overflow horizontal, ouverture du tiroir, fermeture, navigation et cibles tactiles. Aucun redesign des écrans ni travail Wave D n'a été entrepris.

## 17. Accessibilité limitée

Le menu dispose d'un nom accessible, d'un état exposé, d'une relation vers le panneau, d'une navigation clavier, d'un focus visible et d'une restitution du focus après Escape. Le scénario Axe Wave B est vert avec zéro violation critical/serious. La revue UI/UX a suivi le design system Elintys et a renforcé les cibles à 44 px sans introduire de nouveau mini design system.

## 18. Tests et gates

| Gate | Résultat |
|---|---|
| API lint / typecheck / build | vert |
| API unitaires + coverage | 77 suites, 1 198 tests ; 73,37 % statements, 68,37 % branches, 69,89 % functions, 74,07 % lines |
| API E2E complet | 7 suites, 110 tests verts |
| API concurrence Wave A | 7/7 scénarios verts |
| Web lint | vert, 0 erreur ; 9 warnings historiques hors diff |
| Web typecheck / build production | vert ; build rejoué avec réseau pour les polices Google |
| Web unitaires + coverage | 58 fichiers, 385 tests ; 50,06 % statements, 46,11 % branches, 43,51 % functions, 51,47 % lines |
| Web E2E menu Wave B | 11/11 tests verts, Axe inclus |
| Web E2E rôles Wave A | 2 tests de setup verts, puis bloqué par l'absence de `E2E_TEST_EMAIL` / `E2E_TEST_PASSWORD` ; 16 cas non exécutés |
| npm audit API/Web | 0 vulnérabilité |
| `git diff --check` / scan secrets | propre / aucun secret détecté |
| Services locaux | ports 3000 et 3001 libérés |

Le blocage du smoke rôles ne masque pas une régression B : le test autonome Wave B exerce le composant réel à tous les viewports requis. Il reste néanmoins une preuve QA à compléter dès que les comptes multi-rôles sont reprovisionnés.

## 19. Régressions

Les suites complètes unitaires, E2E API, build production Web, E2E Wave B et concurrence Wave A sont vertes. Aucun seuil n'a été abaissé et aucun test n'a été marqué `skip`. Les anciennes captures Wave 1 à 4 régénérées par les tests ne font pas partie du diff livré.

## 20. Findings Codex

- **P1 corrigé :** IDOR inter-événements sur update/delete d'invité.
- **P1 corrigé :** avis accessibles/créables sur cible privée, archivée ou inactive.
- **P2 corrigé :** acteur admin sans identité accepté par la politique pure.
- **P2 corrigé :** deux routes de gestion incohérentes avec la politique admin.
- **P2 corrigé :** profils inactifs et données publiques excessives.
- **P2 corrigé :** query string potentiellement sensible réfléchie dans les erreurs.
- **P2 corrigé :** commentaire d'avis vide après trim et recherche courte incohérente.
- **P2 corrigé :** contrat de pagination Discovery incorrect côté Web.
- **P3 corrigé :** ARIA, focus et taille tactile du burger.

## 21. Corrections Codex

Les corrections sont réparties dans quatre commits atomiques : logique/sécurité API, tests API, contrat/navigation Web et QA mobile. Elles complètent les six commits Claude sans les réécrire. Tous les défauts confirmés dans le périmètre ont été corrigés directement.

## 22. État P0/P1/P2/P3

| Sévérité | Trouvés pendant la revue | Ouverts dans Wave B |
|---|---:|---:|
| P0 | 0 | 0 |
| P1 | 2 | 0 |
| P2 | 6 | 0 |
| P3 | 1 | 0 |

## 23. Registre hors périmètre

- Vague C : clients `authFetch` dupliqués, routes dashboard legacy, hook Discovery sans consommateur, UI Reviews absente, recherche publique encore placeholder.
- Vague D : écrans placeholders atteignables directement et décision produit sur l'exposition de `contactEmail`.
- Vague E : optimisation de la durée E2E et extension de la couverture globale.
- Produit/ops : compte QA ADMIN et comptes QA prestataire/gestionnaire multi-rôles à provisionner ; prérequis PayPal Live inchangés.

## 24. Risques restants

Le risque principal est une lacune de preuve, pas un défaut confirmé : le parcours HTTP ADMIN et le smoke mobile multi-rôles ne peuvent pas être rejoués sans comptes QA correspondants. Les protections fail-closed, métadonnées, tests unitaires et E2E Wave B sont vertes. `contactEmail` public reste une décision produit explicitement assumée à réévaluer.

## 25. Commits

Commits Codex API :

- `d8c4f09` — `fix(security): complete Wave B contract hardening`
- `6336dbf` — `test(security): cover Wave B review findings`

Commits Codex Web :

- `ee8c525` — `fix(web): complete Wave B navigation and discovery review`
- `b55b7c7` — `test(navigation): extend Wave B mobile QA`
- `docs(audit): finalize Sprint 3 Wave B` — commit contenant ce rapport

## 26. PR readiness

Les deux branches sont prêtes à être poussées sans force push, puis proposées vers `dev`. Les PR seront renseignées ici après leur création. Aucune fusion n'est autorisée dans cette vague.

- API : **à ouvrir**
- Web : **à ouvrir**

## Verdict

**VALIDÉE avec une réserve de preuve non bloquante :** B-01 à B-08 et le burger mobile sont implémentés, revus et couverts ; P0/P1/P2 ouverts = 0. Le smoke mobile multi-rôles devra être rejoué dès que les identifiants QA absents seront fournis.
