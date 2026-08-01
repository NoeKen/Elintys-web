# Audit du module Création d’événement

**Date de l’audit :** 2026-08-01
**Auditeur :** Codex, audit statique, automatisé et navigateur en lecture seule
**Périmètre Git :** `Elintys-web` branche `dev`, HEAD/origin `6d848c1`, avec 24 fichiers modifiés et 3 fichiers non suivis préexistants; `Elintys-api` branche `dev`, HEAD/origin `1e07a3b`, propre.
**Important :** les commandes frontend ont été exécutées sur le snapshot local, incluant les modifications non commitées de gestion d’erreurs. Le déploiement `https://dev.elintys.com` a été vérifié séparément. Aucun correctif de code ni aucune écriture métier en base n’a été effectué pendant cet audit.

## 1. Résumé exécutif

Le wizard est nettement au-delà d’un prototype : les six étapes existent, un brouillon est créé puis mis à jour, la progression est persistée, la reprise fonctionne au niveau du contrat, les médias disposent d’une vraie chaîne Cloudinary/MongoDB, et le dashboard calcule la progression réelle. Le design reprend correctement la direction « Épure Événementielle ».

Il n’est cependant **pas production-ready**. Deux défauts d’isolation sont bloquants : un événement `published` privé ou sur invitation peut être lu par son slug public, et les endpoints de réservation de salle ne vérifient ni la propriété de l’événement ni l’identité de l’organisateur lors de la création/liste. Les règles d’accès privé sont des indicateurs booléens sans secret, code, lien signé ou enforcement. La publication ne valide aucun prérequis métier. Plusieurs contrôles de recherche de lieu sont purement visuels. Les effets de bord prestataire/invitation précèdent le PATCH d’étape et ne sont pas transactionnels.

Le déploiement dev est joignable : `health`, `events`, `vendors` et `venues` répondent 200; les trois catalogues exposent 10 éléments. Le preflight depuis `https://dev.elintys.com` répond 204 avec origine exacte et credentials. Le seed déployé ne contient toutefois aucune image d’événement, de prestataire ou de lieu, donc le chemin Cloudinary n’a pas pu être confirmé en bout-en-bout sans créer/modifier de donnée.

## 2. Niveau de maturité

**NIVEAU 2 — Fonctionnel partiel.**

Justification : le flux principal et sa persistance existent, mais des fonctions présentées comme disponibles ne le sont pas réellement (filtres de lieux, lien/code privé), deux contrôles d’ownership/confidentialité sont absents, la publication n’a pas de garde métier et le parcours navigateur authentifié complet n’est couvert par aucun E2E. Un NIVEAU 3 exigerait au minimum l’isolation multi-tenant, l’enforcement des règles d’accès et un parcours principal vérifié en environnement contrôlé.

## 3. Note globale

| Dimension | Note /10 | Motif synthétique |
|---|---:|---|
| Fonctionnel | 6 | Flux principal présent, branches et accès incomplets |
| Frontend | 7 | Architecture moderne, composants trop volumineux et état éphémère |
| Backend | 6 | Contrats réels, guards globaux, failles métier sur slug/réservations |
| Base de données | 6 | Schémas et index cohérents, isolation d’environnements non prouvée localement |
| Persistance | 6 | Progression réelle, effets de bord non atomiques |
| Médias | 7 | Chaîne robuste en code/tests, preuve live complète absente |
| Sécurité | 4 | Bon socle HTTP/CSRF, deux défauts d’autorisation majeurs |
| Accessibilité | 5 | Sémantique correcte par endroits, aucune validation automatisée actuelle du wizard |
| Responsive | 5 | Breakpoints présents, validation live du wizard non réalisable sans session |
| Design Elintys | 7 | Direction visuelle cohérente |
| Fidélité Stitch | 6 | Bonne structure, différences fonctionnelles et contextuelles |
| Maintenabilité | 5 | `EventCreationSteps.tsx` atteint 1 441 lignes |
| Tests | 6 | Beaucoup d’unitaires; presque aucun E2E métier |
| Production readiness | 3 | P0 sécurité et scénarios E2E manquants |

**Note globale : 56/100** (79/140 normalisé).

## 4. Architecture observée

- **Frontend :** Next.js 16 App Router, React 19, TypeScript 5.9, TanStack Query 5, React Hook Form 7, Zod 4.
- **Routes :** création via `/evenements/creer`; reprise via `/tableau-de-bord/evenements/[id]/configuration?etape=n`; arrivée via `/tableau-de-bord/evenements/[id]`.
- **État :** formulaire RHF + états React pour événement, progression, besoins prestataires, sélections et médias (`EventCreationWizard.tsx:80-103`).
- **Services :** `events.service.ts`, `event-media.service.ts`, `vendor-requests.service.ts`, `invitations.service.ts`, `venue-profile.service.ts`.
- **Backend :** NestJS 11, guards JWT/rôles globaux, Mongoose 8, endpoints REST, Cloudinary 2, validation `sharp`.
- **Persistance :** `Event.creationProgress`, `coverImage`, `gallery`, `providerNeeds`, `accessRules`; collections séparées pour demandes prestataires, invitations et réservations.
- **Médias :** abstraction `MediaStorage`, implémentation Cloudinary, métadonnées en MongoDB, tâches de nettoyage différé.
- **Observabilité :** `x-request-id`, logs structurés des erreurs 5xx sans cookies/en-têtes; la vérification live a observé les IDs de requête.

Points de couplage : `EventCreationSteps.tsx` (1 441 lignes), `EventMediaManager.tsx` (604), `EventCreationChrome.tsx` (404) et `EventCreationWizard.tsx` (362). La logique de connexion aux prestataires réside dans le composant orchestral plutôt que dans une mutation transactionnelle dédiée.

## 5. Matrice de conformité

Statuts utilisés exactement selon la nomenclature demandée. « Risque » dans la colonne sévérité indique la priorité de correction, pas le statut d’implémentation.

| ID | Exigence | Statut | Frontend | Backend | DB | Tests | Preuve | Sévérité |
|---|---|---|---|---|---|---|---|---|
| F01 | Wizard six étapes | IMPLEMENTED | Oui | N/A | N/A | Partiel | `event-creation.ts`, `EventCreationWizard.tsx` | P3 |
| F02 | Création du draft étape 1 | IMPLEMENTED_WITH_RISK | Oui | Oui | Oui | Oui | `EventCreationWizard.tsx:199-207`; absence de verrou avant `setSaveStatus` | P2 |
| F03 | PATCH progressif | IMPLEMENTED | Oui | Oui | Oui | Oui | `buildStepPayload`, `EventsService.update` | P3 |
| F04 | Reprise par URL/progression | IMPLEMENTED | Oui | Oui | Oui | Oui | `EventCreationLoader.tsx`; `getNextStep` | P3 |
| F05 | Retour avec sauvegarde | IMPLEMENTED | Oui | Oui | Oui | Partiel | `EventCreationWizard.tsx:245-249` | P3 |
| F06 | Skip prestataires | IMPLEMENTED | Oui | Oui | Oui | Partiel | `onSkip`; `skippedSteps` | P3 |
| F07 | Dates, tentative, fuseau | IMPLEMENTED | Oui | Oui | Oui | Oui | Zod + `America/Toronto` | P3 |
| F08 | « J’ai déjà mon lieu » | PARTIALLY_IMPLEMENTED | Oui | Oui | Oui | Partiel | Le « catalogue » liste toutes les salles actives, pas les lieux enregistrés de l’organisateur | P2 |
| F09 | Recherche lieu et filtres | FRONTEND_ONLY | Oui | Partiel | Non | Non | `EventCreationSteps.tsx:562-584,682-728` | P1 |
| F10 | Lieu « plus tard » | IMPLEMENTED | Oui | Oui | Oui | Oui | `buildStepPayload:283-290` | P3 |
| F11 | Besoins prestataires | IMPLEMENTED | Oui | Oui | Oui | Partiel | `providerNeeds` dans Event | P3 |
| F12 | Demande prestataire catalogue | IMPLEMENTED_WITH_RISK | Oui | Oui | Oui | Partiel | création avant PATCH d’étape | P1 |
| F13 | Prestataire manuel + invitation | IMPLEMENTED_WITH_RISK | Oui | Oui | Oui | Partiel | état local non réhydraté; validation API tardive | P1 |
| F14 | Upload/remplacement cover | IMPLEMENTED_WITH_RISK | Oui | Oui | Oui | Oui | service média + tests; pas de test Cloudinary live durant l’audit | P2 |
| F15 | Galerie max 10 | IMPLEMENTED_WITH_RISK | Oui | Oui | Oui | Oui | limite atomique et rollback; pas de test live | P2 |
| F16 | Description complète | IMPLEMENTED | Oui | Oui | Oui | Partiel | payload étape 5 | P3 |
| F17 | Visibilité publique | IMPLEMENTED | Oui | Oui | Oui | Oui | filtre catalogue public | P3 |
| F18 | Lien/code/domaine privé | FRONTEND_ONLY | Oui | Non | Booléens seulement | Validation domaine | aucune génération/enforcement | P0 |
| F19 | Accès sur invitation | FRONTEND_ONLY | Oui | Non | Valeur stockée | Non | visibilité sans contrôle d’accès | P0 |
| F20 | Récapitulatif fidèle | PARTIALLY_IMPLEMENTED | Oui | N/A | N/A | Non | cartes sommaires; checklist statique | P2 |
| F21 | Modifier depuis récapitulatif | IMPLEMENTED | Oui | Oui | Oui | Partiel | `onEdit={goToStep}` | P3 |
| F22 | Publication séparée | IMPLEMENTED_WITH_RISK | Oui | Oui | Oui | Oui | endpoint séparé, mais sans préconditions | P1 |
| F23 | Arrivée espace de gestion | IMPLEMENTED | Oui | N/A | N/A | Partiel | route après étape 6 | P3 |
| F24 | Dashboard brouillons/progression | IMPLEMENTED | Oui | Oui | Oui | Partiel | `DashboardEventCard`, calcul réel | P3 |
| S01 | Ownership CRUD événement | IMPLEMENTED | N/A | Oui | Oui | Oui | `events.service.ts:111-154` | P3 |
| S02 | Ownership médias | IMPLEMENTED | N/A | Oui | Oui | Oui | `event-media.service.ts:261-276` | P3 |
| S03 | Ownership réservations | NOT_IMPLEMENTED | N/A | Non | Oui | Tests insuffisants | `venues.service.ts:92-115` | P0 |
| S04 | Ownership invitation liée à event | NOT_IMPLEMENTED | N/A | Non | Oui | Non | `invitations.service.ts:22-35` | P1 |
| S05 | Confidentialité slug public | NOT_IMPLEMENTED | N/A | Non | Oui | Test erroné | `events.service.ts:165-171` | P0 |
| Q01 | i18n FR/EN runtime | PARTIALLY_IMPLEMENTED | FR forcé | N/A | N/A | Structure vérifiée | 262 clés de chaque côté, import FR direct | P2 |
| Q02 | Panneau contextuel par étape | PARTIALLY_IMPLEMENTED | Générique | N/A | N/A | Non | aucun prop `step` dans `EventCreationAside` | P2 |
| Q03 | Responsive wizard | PARTIALLY_IMPLEMENTED | Breakpoints présents | N/A | N/A | Non | anciennes captures QA seulement | P2 |
| Q04 | Accessibilité wizard | PARTIALLY_IMPLEMENTED | Sémantique partielle | N/A | N/A | Non | labels/fieldsets présents, axe absent | P2 |
| Q05 | Messages d’erreur directs | PARTIALLY_IMPLEMENTED | Amélioration locale | Oui | N/A | Oui localement | fichiers non committés; déploiement distinct | P2 |
| Q06 | Tests pertinents | IMPLEMENTED_WITH_RISK | Unitaires | Unitaires | Mocks | Lacunes E2E | 451 tests passent, API E2E absent | P2 |
| D01 | Seed dev cohérent | IMPLEMENTED | API publique | Oui | Oui | Oui | live : 10/10/10 | P3 |
| M01 | Nettoyage médias différé | IMPLEMENTED | N/A | Oui | Oui | Partiel | `media-cleanup.service.ts` | P3 |
| C01 | Protection double soumission | NOT_IMPLEMENTED | Non | Pas d’idempotency key | N/A | Non | garde uniquement `mediaUploading` | P2 |
| C02 | Atomicité étape 4 | NOT_IMPLEMENTED | Non | Non transactionnel | Plusieurs collections | Non | side-effects avant PATCH | P1 |
| P01 | Budget/performance du wizard | PARTIALLY_IMPLEMENTED | Build optimisé | N/A | N/A | Non | aucun budget CI/Lighthouse | P3 |

**Comptage de la matrice (40 exigences) :** 17 `IMPLEMENTED`, 8 `PARTIALLY_IMPLEMENTED`, 3 `FRONTEND_ONLY`, 0 `BACKEND_ONLY`, 0 `MOCKED`, 5 `NOT_IMPLEMENTED`, 7 `IMPLEMENTED_WITH_RISK`.

## 6. Audit frontend

### Points solides

- Les six étapes sont centralisées et typées; les payloads sont limités à l’étape courante (`event-creation.ts:243-345`).
- RHF + Zod empêchent la transition si les champs de l’étape sont invalides (`EventCreationWizard.tsx:175-180`).
- La navigation URL facilite la reprise et le deep-link (`EventCreationWizard.tsx:106-117`).
- TanStack Query invalide `my-events` après sauvegarde.
- L’upload média expose preview, retry, suppression et état de chargement; les object URLs sont libérées.
- La progression du dashboard est calculée depuis les étapes réelles, non hardcodée.

### Écarts

1. **Recherche de lieu trompeuse.** La requête charge toujours `list(1, 24)`. Le filtrage ne tient compte que du nom/ville; rayon, capacité, budget, types et équipements ne sont utilisés ni par le mémo ni par l’API. Les critères ne sont pas persistés.
2. **« Mes lieux enregistrés » incorrect.** La même liste publique de salles est utilisée; aucun endpoint de lieux sauvegardés/possédés par l’organisateur n’est appelé.
3. **État prestataire fragile.** `manualProviders`, `selectedVendors` et `persistedConnections` sont locaux et réinitialisés au refresh. Seuls `providerNeeds` sont réhydratés.
4. **Atomicité.** Les demandes/invitations sont créées avant le PATCH de l’événement. Si le PATCH échoue, l’interface signale l’échec alors que les side-effects existent déjà.
5. **Concurrence.** `saveCurrentStep` ne bloque pas un second appel pendant `saveStatus === "saving"`; une double activation avant le rerender peut créer deux drafts.
6. **Récapitulatif.** La checklist « Informations/Date/Visibilité » affiche toujours des coches (`EventCreationSteps.tsx:1378-1403`) et les détails médias/règles sont incomplets.
7. **Composants trop volumineux.** Le fichier des étapes mélange rendu, chargement catalogue, filtrage, sélection et review.
8. **Erreurs.** Le snapshot local contient une nouvelle abstraction d’erreur utilisateur, mais elle n’est ni committée ni prouvée sur le déploiement audité.

## 7. Audit backend

### Points solides

- Validation DTO globale avec whitelist et rejet des champs inconnus.
- Guards JWT et rôles globaux; endpoints publics explicitement décorés.
- Ownership correct sur lecture/mise à jour/suppression d’événement et médias.
- Catalogues publics limités à `published + public` pour la liste (`events.service.ts:60-81`).
- Slug unique, pagination, index Mongoose et séparation brouillon/publication.
- Vendor requests vérifient l’ownership de l’événement et dédupliquent les demandes `pending`.

### Défauts majeurs

- `findBySlug` ne filtre que `slug + published`, contrairement à `findAll`; une ressource privée publiée devient publiquement lisible.
- `publish` est un simple changement de statut. Aucun contrôle titre/date/lieu/visibilité/règles/média n’est fait.
- `requestBooking` accepte tout `eventId`, `venueId` et `organizerId` du token sans vérifier l’existence ni la propriété de l’événement; `listBookingsByEvent` ne reçoit même pas l’utilisateur.
- `sendInvitation` stocke un `eventId` sans vérifier que l’invitant possède cet événement.
- Les règles privées sont stockées comme booléens; aucun code hashé, token aléatoire, expiration, liste d’invités ou guard d’accès n’existe.
- Le backend accepte la `creationProgress` calculée par le client sans vérifier la cohérence des étapes.

## 8. Audit base de données

Le schéma Event contient les données attendues : statut, visibilité, dates, lieu embedded ou référence `venueProfile`, besoins prestataires, règles d’accès, progression, cover et galerie. Les demandes/invitations/réservations sont des collections séparées. Les index de catalogue et de rattachement existent.

La base locale `.env` est nommée simplement `elintys`, avec `ELINTYS_ENV` absent. Une lecture prudente a observé 8 événements, 5 prestataires, 3 lieux, 8 demandes prestataires, 4 réservations, 0 invitation et 13 utilisateurs. Cette base **ne correspond pas** à la base du déploiement dev, car l’API dev expose 10/10/10. Cela prouve une séparation effective de ces deux sources, mais pas une stratégie dev/prod complète ni la synchronisation de schéma.

Risques PostgreSQL futurs : structures embedded `location`, `accessRules`, `providerNeeds`, `coverImage/gallery` à normaliser ou conserver en JSONB; enums partagés à versionner; ObjectId à migrer; index et transactions multi-collections à redéfinir. Les migrations de schéma MongoDB ne sont pas formalisées dans un framework versionné.

## 9. Audit médias Cloudinary

### Implémenté

- Endpoints multipart cover/galerie/suppression.
- Secrets uniquement backend (`configuration.ts`), pas de secret Cloudinary dans le frontend.
- Validation serveur : taille, MIME allowlist, signature binaire, décodage `sharp`, limite pixels, refus multi-page/corrompu (`image-file-validation.service.ts:25-80`).
- Préfixes isolés : `Elintys/dev/...` et `Elintys/prod/...`; test explicite sensible à la casse.
- Public IDs : `Elintys/{env}/events/{eventId}/{cover|gallery}/{uuid}`.
- `overwrite: false`; URL sécurisée; transformations de delivery.
- Ownership avant upload/suppression; limite galerie de 10 atomique; upload concurrent limité à 3.
- Rollback Cloudinary si MongoDB échoue; nettoyage différé persistant toutes les cinq minutes.

### Risques/limites

- Le seed dev déployé a `gallery: []` et aucun `coverImage`; les catalogues prestataires/lieux ont `photos: []`. La page publique montre donc un placeholder.
- Aucun upload/suppression réel n’a été effectué durant cet audit pour respecter l’interdiction de modifier les données. Les tests utilisent des doubles; ils ne prouvent pas les credentials/quota/preset Cloudinary du service Render actuel.
- Les suppressions ne portent pas le même throttling explicite que les uploads.
- Le préfixe est `Elintys` avec majuscule, différent de certaines formulations documentaires `elintys/...`; le code et les tests sont cohérents entre eux.

## 10. Audit sécurité

### Contrôles présents

- Cookies `httpOnly`, `secure` en production, `sameSite=lax`, host-only.
- CORS exact avec credentials; preflight live 204 depuis `https://dev.elintys.com`.
- Middleware anti-CSRF par `Origin` sur les écritures cookie-authentifiées.
- Helmet : CSP, HSTS, `nosniff`, `SAMEORIGIN`, CORP observés live.
- Validation DTO whitelist et validation approfondie des images.
- `x-request-id` exposé sans journaliser headers/cookies/query.

### Vulnérabilités

1. **P0 — divulgation d’événements privés/invite-only** via route publique slug (`events.service.ts:165-171`).
2. **P0 — IDOR réservation de salle** : création pour un événement tiers et liste de réservations d’un event arbitraire (`venues.service.ts:92-115`).
3. **P1 — rattachement d’invitation non autorisé** à un event tiers.
4. **P1 — publication de brouillon incomplet** et règles privées non matérialisées.
5. **P2 — double soumission** sans clé d’idempotence.

Scénarios d’abus non exécutés sur les données live : requête publique sur slug privé; POST booking avec event tiers; GET bookings d’un event tiers; invitation avec event tiers; double POST création. La preuve de code est suffisante pour confirmer l’absence de garde, sans risquer de modifier/exposer les données.

## 11. Audit UX/UI Elintys

La direction visuelle est cohérente avec `DESIGN-2.md` : sérif éditoriale, pétrole/teal/or, surfaces minérales, grands rayons, densité maîtrisée, header de progression et navigation fixe. Les captures historiques montrent une amélioration nette par rapport aux Stitch sources.

Écarts :

- La copie Stitch mentionne parfois Paris/euros et des numéros d’étape incohérents; l’implémentation a correctement localisé Montréal/Québec/CAD.
- Le wizard actuel est plus dense en options que les maquettes, ce qui est acceptable, mais certains contrôles ont l’apparence de fonctionnalités complètes sans effet réel.
- Le récapitulatif est visuellement propre mais ne représente pas assez précisément la galerie, la description, les règles privées, les contacts manuels et les erreurs de complétude.
- Le panneau droit reprend le même conseil à chaque étape, alors que Stitch attend un accompagnement contextuel.
- La capture QA historique de l’identité affiche encore « persistance activée dès que le stockage média sera connecté »; ce message n’est plus conforme à l’architecture actuelle et ne doit pas servir de preuve opérationnelle.

Référence de comparaison inspectée : `docs/design-qa/comparison-information-pass2.png` (Stitch à gauche, implémentation à droite), ainsi que les captures identity, review, schedule, dashboard et mobile.

## 12. Audit responsive

Le code masque le panneau droit avant `xl`, transforme les grilles à `sm/lg`, utilise des tailles fluides et une navigation fixe. Les anciennes captures QA montrent l’étape 5 en mobile.

Vérification live de la page publique dev aux largeurs 320, 375, 390, 768, 1024, 1440 et 1538 : aucun overflow horizontal mesuré (`scrollWidth === innerWidth` à chaque largeur). Les captures sont dans `docs/audits/event-creation-evidence/`. À 768, le moteur de capture du navigateur intégré a produit une image dupliquée alors que les mesures DOM restaient à 768 sans overflow; cette capture n’est pas considérée comme défaut produit.

Limite : sans session d’audit authentifiée et sans droit de modifier des données, les six étapes du wizard n’ont pas pu être rejouées live aux sept largeurs. Le responsive du wizard reste donc `PARTIALLY_IMPLEMENTED`, pas « validé ».

## 13. Audit accessibilité

Points positifs : labels associés, fieldsets/radios, erreurs de champ, `aria-hidden` sur les icônes, statut d’upload annoncé, boutons média nommés, focus styling et respect de `prefers-reduced-motion`.

Lacunes :

- aucune dépendance axe ni test WCAG automatisé actuel;
- aucun E2E clavier des six étapes;
- champs de prestataire manuel hors RHF sans erreurs inline robustes;
- checklist de review sémantiquement affirmative même lorsque la complétude réelle n’est pas calculée;
- la qualité des zones fixes et de l’ordre de focus mobile n’a pas été revalidée live.

Les affirmations « 0 violation axe » de l’ancien `design-qa.md` sont historiques et ne sont pas reconduites comme résultat courant.

## 14. Audit performance

- Build de production réussi en 40,55 s, 65 pages générées.
- Page publique dev mesurée à 156 éléments DOM, 30 scripts, 2 styles, environ 19,4 Mo de heap JS utilisé au moment de la mesure; aucun élément `<img>` car le seed n’a pas de cover.
- Les catalogues répondent en 111–124 ms depuis l’environnement d’audit; health en 215 ms.
- TanStack Query utilise `staleTime: 60_000` pour le catalogue des lieux.
- Les uploads galerie sont limités à trois en parallèle et les images sont normalisées côté serveur.

Risques : la page charge de nombreux chunks/scripts, aucun budget de bundle/Lighthouse n’est imposé en CI, la liste de lieux est limitée au premier lot de 24 sans pagination UI, et le composant monolithique des étapes augmente le coût de maintenance/rendu. Les métriques navigateur sont indicatives, pas un profil Lighthouse complet.

## 15. Audit i18n

- `messages/fr.json` et `messages/en.json` possèdent chacun 262 clés `eventCreation`, avec parité structurelle complète.
- Le runtime du wizard importe cependant directement `fr.json` (`event-creation.copy.ts:1-3`); l’anglais n’est jamais sélectionné. Statut : `PARTIALLY_IMPLEMENTED`.
- Plusieurs valeurs sont hardcodées : `America/Toronto`, `Québec` et la chaîne de review du fuseau. Elles sont conformes au marché actuel mais non internationalisables.
- Aucun reliquat Paris/euro n’a été trouvé dans le code du wizard; ils existent uniquement dans les maquettes Stitch sources.
- La qualité rédactionnelle française est globalement bonne; « Mes lieux enregistrés » est fonctionnellement trompeur.

## 16. Audit tests

### Existant

- Frontend : 20 fichiers, 139 tests; wizard draft/retry/reprise, Zod/payloads/progression, média preview/retry/suppression/galerie/reload/limite.
- Backend : 37 suites, 312 tests; événements, ownership CRUD, médias, validation d’image, guards, CSRF, observabilité, seed, vendeurs, lieux, etc.
- E2E frontend : un seul test de landing page sans erreur console.

### Couverture des exigences

| Besoin | État |
|---|---|
| Création draft | Couvert unitairement |
| Mise à jour progressive | Partiel |
| Trois branches lieu | Payload manuel/later couverts; UI/recherche réelle non couverte |
| Skip prestataires | Non couvert bout-en-bout |
| Private access | Validation domaine seulement; enforcement absent |
| Cover/galerie/erreur média | Bon niveau unitaire, pas Cloudinary live |
| Reprise | Couvert au niveau composant/calcul, pas navigateur réel |
| Dashboard | Pas d’E2E |
| Ownership Event/Media | Couvert |
| Ownership booking/invitation | Cas critiques manquants |
| Publication séparée | Test confirme uniquement le changement de statut, donc faux sentiment de sécurité |
| Responsive/accessibilité | Non couvert automatiquement |

La couverture frontend est faible (34,81 % statements, 29,89 % branches, 25,07 % fonctions, 34,87 % lignes) et le provider a échoué à parser `src/server/catalog/catalog-api.ts`, tout en retournant exit 0. La couverture backend obtient 70,32 % statements, 60,27 % branches, 56,34 % fonctions, 71,34 % lignes et échoue correctement les seuils globaux.

## 17. Résultats des commandes

| Projet | Commande | Durée | Résultat |
|---|---|---:|---|
| Web | `npm run lint` | 23,45 s | PASS, 0 erreur, 11 warnings |
| Web | `npm run typecheck` | 13,28 s | PASS |
| Web | `npm test -- --reporter=dot` | 14,03 s | PASS, 20 fichiers, 139 tests |
| Web | `npm run build` | 40,55 s | PASS, 65 pages |
| Web | `npm run test:e2e -- --reporter=line` | 31,97 s | PASS, 1/1 test landing |
| Web | `npm run test:coverage -- --reporter=dot` | 22,08 s | EXIT 0 avec erreur de parsing; 34,81 % statements |
| API | `npm run lint` | 12,67 s | PASS, 0 erreur, 2 warnings |
| API | `npx tsc --noEmit` | 8,19 s | PASS |
| API | `npm run build` | 20,38 s | PASS |
| API | `npm test -- --runInBand` | 33,17 s | PASS, 37 suites, 312 tests |
| API | `npm run test:e2e -- --runInBand` | 2,68 s | FAIL : `test/jest-e2e.json` absent |
| API | `npm run test:cov -- --runInBand` | 45,98 s | FAIL seuils; tests 312/312 passent |

Warnings notables : React Compiler ignore certains usages RHF `watch`; mises à jour synchrones d’état dans des effects; ref lue au render dans `lenis.tsx`; deux warnings API de variables inutilisées.

## 18. Résultats des scénarios manuels

Contrainte : tous les scénarios A–G créent ou modifient des données. Le mandat interdit explicitement la modification des données pendant l’audit initial. Le navigateur dev n’avait pas de session; `/evenements/creer` a effectué un preflight 204, un refresh 401 normal sans cookie, puis une redirection vers `/connexion`. Aucune donnée personnelle ni aucun credential n’a été transmis.

| Scénario | Attendu | Obtenu | Statut | Preuve/problème |
|---|---|---|---|---|
| A — lieu existant | Draft complet | Non exécuté live | BLOQUÉ PAR CONTRAINTE | Contrat/code partiels; « saved venues » non réel |
| B — recherche lieu | Filtres et sélection persistés | Audit statique | ÉCHEC FONCTIONNEL | seuls nom/ville filtrent; autres contrôles sans effet |
| C — lieu plus tard + skip | Reprise étape suivante | Tests payload/code | PARTIEL | payload et skippedSteps présents, pas E2E |
| D — quitter/reprendre | Même données/étape après refresh | Test composant | PARTIEL | Event/step repris; sélections prestataires locales perdues |
| E — privé + domaine | Accès réellement restreint | Audit backend | ÉCHEC SÉCURITÉ | booléens stockés, slug public possible |
| F — cover/galerie | Upload Cloudinary, refresh, replace/delete | Unitaires + DB locale | PARTIEL | code robuste, pas de mutation live; seed déployé sans média |
| G — erreur API | Rester sur étape, message précis, retry | Test création + code local | PARTIEL | retry testé; abstraction d’erreur non déployée prouvée |
| H — event tiers | 403 sans fuite/écriture | Audit statique/tests | MIXTE | Event/Media 403; bookings/invitations vulnérables |

Captures : `deployed-wizard-login-redirect-1538.png`, `deployed-public-event-{320,375,390,768,1024,1440,1538}.png` dans le dossier d’évidence.

## 19. Écarts P0/P1/P2/P3

### P0 — 2

1. **Confidentialité événement privé/invitation non appliquée.** Impact : divulgation publique. Reproduction : publier un événement privé puis appeler le slug public. Cause : filtre `visibility` absent et règles non matérialisées. Fichiers : `events.service.ts`, schéma/DTO access rules. Effort : M (2–4 j) + migration/tests. Dépendance : modèle d’accès produit.
2. **IDOR réservations de salle.** Impact : création/liste cross-tenant. Reproduction : utiliser un `eventId` tiers avec POST/GET bookings. Cause : ownership absent. Fichiers : `venues.service.ts`, controller, tests. Effort : S (0,5–1 j). Dépendance : rôles admin explicites.

### P1 — 5

1. Publication sans validation de readiness — S/M.
2. Invitation rattachable à un event tiers — S.
3. Side-effects prestataires/invitations non atomiques avec le PATCH — M.
4. Filtres de recherche de lieu affichés mais non exécutés/persistés — M.
5. Sélections et brouillons prestataires non réhydratés à la reprise — M.

### P2 — 8

1. Double soumission sans garde/idempotency.
2. Checklist de récapitulatif statique/trompeuse.
3. Panneau expert non contextuel.
4. i18n anglais non activable malgré les traductions.
5. Messages d’erreur améliorés uniquement dans le snapshot local non committé.
6. Aucun E2E wizard, responsive ou accessibilité.
7. Validation opérationnelle Cloudinary dev manquante et seed sans média.
8. « Mes lieux enregistrés » utilise le catalogue public.

### P3 — 4

1. Décomposer les composants de 1 441/604/404 lignes.
2. Ajouter un budget performance/Lighthouse CI.
3. Enrichir le seed dev avec médias de test gérés et nettoyables.
4. Harmoniser les documents Stitch historiques (Paris/euros/numéros d’étape) avec la direction Québec.

## 20. Dette technique

- Orchestrateur frontend responsable de plusieurs écritures métier.
- Absence d’unité transactionnelle/idempotente « save step 4 ».
- Progression client-trusted.
- Access rules modélisées comme préférences UI, pas comme mécanisme de sécurité.
- Composants de présentation trop volumineux.
- Configuration E2E API cassée mais script exposé.
- Couverture frontend peu fiable à cause de l’erreur de parsing ignorée.
- Documentation Design QA historique mélange preuves anciennes et état actuel.
- Pas de migrations de schéma versionnées vers le futur modèle PostgreSQL.

## 21. Recommandations

1. Fermer les P0 avec tests d’intégration adversariaux avant toute bêta.
2. Définir le modèle d’accès : slug non devinable ou token signé, code hashé, liste d’invités, domaine, approbation et guard unique.
3. Introduire une commande backend idempotente par étape ou une orchestration transactionnelle/outbox pour demandes/invitations.
4. Déplacer les filtres lieu dans le contrat API; persister les critères nécessaires ou retirer les contrôles tant qu’ils sont sans effet.
5. Ajouter un E2E contrôlé avec comptes/DB/Cloudinary dédiés et teardown, couvrant A–H aux breakpoints requis.
6. Activer l’i18n via le provider de locale plutôt que l’import statique FR.
7. Transformer le récapitulatif en vue calculée des données réellement persistées.
8. Versionner les migrations et définir dès maintenant les identifiants/relations compatibles avec PostgreSQL.

## 22. Plan de correction proposé

- **Lot 1 — P0 sécurité et perte de données :** slug/visibilité/access enforcement; ownership bookings; tests adversariaux.
- **Lot 2 — P1 backend/persistance :** publish validator; invitation ownership; transaction/idempotence étape 4; reprise des sélections.
- **Lot 3 — P1 médias :** environnement E2E Cloudinary isolé, seed média, delete/throttle, test de reprise réelle.
- **Lot 4 — P2 UX/accessibilité :** erreurs inline, review calculée, clavier/focus/axe, responsive 7 largeurs.
- **Lot 5 — P2 design/performance :** panneau contextuel, recherche lieu réelle, budget bundle/Lighthouse, découpage composants.
- **Lot 6 — P3 polish :** docs/design QA, seed visuel, internationalisation complète et nettoyage de warnings.

Chaque lot doit avoir sa PR séparée, ses migrations/rollback, ses tests, et une preuve navigateur. Aucun lot ne doit être appliqué avant validation explicite de ce rapport.

## 23. Verdict production readiness

**NON VALIDÉ.**

Le module est convaincant pour une démonstration contrôlée et une partie du flux MVP, mais il ne peut pas être ouvert en production avec les contrôles d’accès actuels. Les deux P0, l’absence de publication validée, les filtres simulés et le manque de parcours E2E authentifié empêchent le statut « production candidate ».

La prochaine décision utile est de valider le **Lot 1 — P0 sécurité et perte de données** avant toute modification de code.
