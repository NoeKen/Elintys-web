# Sprint 4 / Wave F — Notifications & Communications

Date de validation : 2026-09-09  
Nature : product completion backend + frontend + intégration + E2E  
Branche API/Web : `feat/s4-wave-f-notifications-communications`

## 1. Executive summary

La capacité Notifications existante a été complétée sans créer de seconde architecture. La cloche du shell authentifié est désormais l'unique surface de consultation : elle distingue les états de chargement, vide, erreur et retry, synchronise le compteur après lecture individuelle ou globale, et navigue vers des routes métier canoniques dérivées exclusivement du type serveur et d'identifiants Mongo valides.

Les parcours MVP prestataire, lieu et invitation produisent maintenant les notifications manquantes. Les réponses prestataire et lieu transportent le contexte `eventId`; la demande de lieu informe le gestionnaire; l'acceptation atomique d'une invitation informe l'organisateur une seule fois. Les emails transactionnels correspondants réutilisent Resend, échappent les valeurs métier injectées et ne journalisent ni destinataire, ni sujet, ni message fournisseur.

Les gates API et Web sont verts. La suite navigateur complète termine à **259 passed / 261**, avec uniquement les **2 skips historiques** déjà présents. Les 7 viewports et les contrôles Axe de la surface Notifications sont verts. P0/P1/P2 bloquants ouverts : **0/0/0**.

## 2. Git baseline

| Repository | Baseline `origin/dev` | Preuve |
|---|---:|---|
| API | `5c6206e` | merge PR #57 Wave E |
| Web | `e05f2db` | merge PR #106 Wave E |

Les deux branches ont été créées depuis ces baselines propres et synchronisées. Aucune migration, suppression de données, modification production ou force-push n'a été effectué.

## 3. Scope

Implémenté : producteurs MVP retenus, lectures individuelle/globale, deep links sûrs, états dégradés, emails transactionnels associés, responsive, accessibilité, tests de contrats et parcours système.

Non construit : centre de notifications séparé, WebSocket/SSE, queue, moteur de préférences, Search, Reviews, nouveau checkout, Payment Readiness, Organizations/Memberships et analytics.

## 4. Pre-implementation inventory

- API : modèle, liste paginée, compteur non-lu, `markRead`, `markAllRead` et producteurs Vendor partiels déjà présents.
- Web : client TanStack Query et cloche existants; `markRead` n'était pas branché; libellés codés dans le composant; aucun deep link; cloche montée dans Topbar et Sidebar; erreur de compteur indistinguable d'un zéro.
- Email : Resend et plusieurs templates existaient, mais certains flux n'étaient pas appelés, le refus prestataire n'envoyait rien et les logs exposaient destinataire/sujet/message provider.
- Tests : contrats unitaires/API partiels; aucun parcours navigateur traversant les rôles Vendor/Venue puis la cloche et le contexte métier.

## 5. Notification trigger matrix — BEFORE

| Trigger métier | In-app | Email | Contexte exploitable par le Web | Test transversal |
|---|---|---|---|---|
| Demande prestataire | Oui, vendeur | Oui | Route générique seulement | Non |
| Réponse prestataire | Oui, organisateur | Acceptation seulement | `eventId` absent | Non |
| Demande de lieu | Non | Non | Non | Non |
| Réponse lieu | Oui, organisateur | Oui | `eventId` absent | Non |
| Invitation acceptée | Non | N/A | Non | Non |
| Ticket vendu / rappel | Enum ou template isolé | Partiel | Producteur non prouvé | Non |
| Annulations | Non | Non | Non | Non |

## 6. Backend changes

- Ajout du type stable `VENUE_BOOKING_RECEIVED`.
- Demande de lieu : notification au gestionnaire et email transactionnel best-effort.
- Réponse Vendor : payload enrichi de `eventId`; email accepté/refusé; deep link workspace canonique.
- Réponse Venue : payload enrichi de `eventId`.
- Invitation : notification `INVITATION_ACCEPTED` émise uniquement après la transition atomique réussie.
- `markRead` retourne un `404 NOTIFICATION_NOT_FOUND` identique pour absence et cross-user.
- `EMAIL_DELIVERY_ENABLED=false` permet d'isoler les E2E des envois externes; le transport demeure actif par défaut.
- Échappement HTML/attribut des valeurs métier injectées dans les templates actifs.
- Logs Resend réduits à des métadonnées non personnelles.

## 7. Frontend changes

- Une seule `NotificationBell`, dans la Topbar authentifiée.
- États loading, empty, error/retry, mark-one error, mark-all pending/error.
- Cache liste + compteur synchronisé sans refetch concurrent après mutation réussie.
- Lecture individuelle réellement branchée; un échec conserve l'état non lu sans bloquer la navigation.
- Destinations déterministes par type; aucune URL arbitraire du payload n'est suivie.
- Panne compteur exposée par un nom accessible « indisponible », sans faux zéro.
- Panneau responsive centré sur mobile, scroll interne, fermeture extérieure/Escape et restauration du focus.
- Cibles principales de 44 px minimum; correction `shrink-0` du bouton menu à 320 px.

## 8. Integration changes

Les chaînes suivantes traversent désormais le domaine, la persistance Notification, l'API authentifiée, TanStack Query et le routing existant :

1. Organizer → demande Vendor → Vendor reçoit/lit → `/tableau-de-bord/prestataire/demandes`.
2. Vendor → réponse → Organizer reçoit/lit → workspace `/prestataires`.
3. Organizer → demande Venue → manager reçoit/lit → `/gestionnaire/reservations`.
4. Venue manager → réponse → Organizer reçoit/lit → workspace `/lieux`.
5. Invitation acceptée → Organizer reçoit → workspace `/invites`.

## 9. Notification trigger matrix — AFTER

| Trigger métier retenu | Destinataire | In-app | Email | Destination sûre | Résultat |
|---|---|---|---|---|---|
| Demande prestataire | Vendor | Oui | Oui | Demandes Vendor | GREEN |
| Réponse prestataire acceptée/refusée | Organizer | Oui | Oui | Workspace prestataires | GREEN |
| Demande de lieu | Venue manager | Oui | Oui | Réservations manager | GREEN |
| Réponse lieu | Organizer | Oui | Oui | Workspace lieux | GREEN |
| Invitation acceptée | Organizer | Oui, après transition atomique | Non requis | Workspace invités | GREEN |
| Ticket vendu | Organizer | Producteur non ajouté | Confirmation achat existante | Route prévue si payload futur valide | DEFERRED |
| Rappels événement | Participant | Producteur/scheduler non ajouté | Template existant | Aucune navigation inventée | DEFERRED |
| Annulations Vendor/Venue | Selon métier futur | Non | Non | Aucune | DEFERRED |

Les lignes différées n'ont pas été simulées : elles exigent un trigger/scheduler ou une décision de bruit produit absent du contrat actuel.

## 10. Email status

Provider conservé : **Resend**. Le service est actif par défaut et désactivable explicitement dans les E2E. Les appels producteurs sont best-effort et ne changent jamais l'autorité métier : une panne email ne transforme pas une réponse Vendor/Venue réussie en échec de domaine.

Les templates nouvellement raccordés couvrent la demande de lieu et les réponses prestataire acceptée/refusée. Les entrées utilisateur sont échappées; les CTA utilisent une URL serveur/config contrôlée; les secrets ne sont ni sérialisés ni journalisés.

## 11. External delivery status

**EXTERNAL EMAIL DELIVERY: GREEN — provider acceptance and simulated delivery proven.**

Un envoi non-production a été effectué avec les credentials dev autorisés vers l'adresse officielle Resend `delivered+wave-f@resend.dev`. Le provider a accepté l'envoi et le dernier événement observé était `delivered`. Cette preuve valide la configuration et la boucle provider simulée; elle ne prétend pas prouver la réception dans une boîte humaine ni la réputation du domaine en production.

Référence provider : https://resend.com/docs/dashboard/emails/send-test-emails

## 12. Security and privacy

- Liste, compteur, mark-one et mark-all restent filtrés par `user.sub` côté serveur.
- Une tentative cross-user sur un ObjectId connu retourne 404 et ne modifie pas la notification cible.
- ObjectId invalide : 400 avant service.
- Deep links : allow-list par type + validation ObjectId; `href`, `javascript:` ou URL externe du payload sont ignorés.
- Une ressource supprimée conduit à l'état 404 du workspace sans réafficher son titre ni enrichir la notification de données privées.
- Aucun token invitation, secret Resend ou credential QA dans les diffs/tests/rapports.
- `npm audit`: 0 vulnérabilité API et Web après mises à jour ciblées de `sharp`, `multer`, Next et Vitest.

## 13. Concurrency and idempotence

La notification d'acceptation d'invitation est placée après le `findOneAndUpdate` atomique : un retry après consommation ne repasse pas la transition et ne recrée pas la notification. Vendor/Venue notifient uniquement après leur transition métier déjà protégée; Notifications ne devient pas une seconde autorité.

Les suites historiques de concurrence ont été rejouées : Wave A **7/7**, Ticketing Wave 5 **10/10**. Aucun index/mécanisme événementiel général n'a été ajouté.

## 14. Responsive

Validé par interactions réelles aux viewports : **320×720, 375×812, 390×844, 768×1024, 1024×768, 1440×900, 1538×1100**.

Pour chacun : cloche et panneau visibles, cible ≥44 px, panneau intégralement dans le viewport, overflow horizontal ≤1 px, fermeture Escape et retour du focus. Le scroller interne du panneau n'altère pas le scroll natif du shell.

## 15. Accessibility

- Nom accessible, `aria-expanded`, `aria-controls`, `role=dialog`, focus initial et restauration.
- Erreurs de liste et mutations avec `role=alert`; liste avec `aria-live`/`aria-busy`.
- Navigation clavier et Escape testées.
- **Axe critical: 0; serious: 0** sur chacun des 7 viewports Notifications.

## 16. i18n

Toutes les nouvelles chaînes sont présentes avec parité structurelle dans `messages/fr.json` et `messages/en.json`, selon le mécanisme statique déjà utilisé par les surfaces Event/Invitation. La locale active de cette surface reste le français, comme le shell actuel; aucun second moteur i18n n'a été introduit.

## 17. Design and card-border audit

La surface réutilise les tokens existants, `shadow-event-panel`, surfaces chaudes, rayons et séparateurs structurels atténués. Aucun contour décoratif de card n'a été ajouté. Les bordures présentes sont des séparateurs de liste fonctionnels et les focus rings accessibles.

**VISIBLE DECORATIVE CARD BORDERLINES: 0.**

## 18. API test results

| Gate | Résultat |
|---|---:|
| Lint | GREEN, 0 erreur/warning |
| Typecheck | GREEN |
| Build | GREEN |
| Unit + coverage | **77 suites, 1213 tests passed** |
| API E2E | **9 suites, 124 tests passed** |
| Concurrency Wave A | **7/7** |
| Concurrency Wave 5 | **10/10** |
| Coverage statements | **73.52% (4853/6601)** |
| Coverage branches | **68.59% (1450/2114)** |
| Coverage functions | **69.83% (692/991)** |
| Coverage lines | **74.31% (4445/5982)** |
| npm audit | **0 vulnerability** |
| git diff --check | GREEN |

## 19. Web test results

| Gate | Résultat |
|---|---:|
| Lint | GREEN, 0 erreur/warning |
| Typecheck | GREEN |
| Production build | GREEN, Next 16.3.4, **57 pages** |
| Unit + coverage | **65 files, 404 tests passed** |
| Coverage statements | **53.64% (1524/2841)** |
| Coverage branches | **48.23% (1425/2954)** |
| Coverage functions | **48.61% (439/903)** |
| Coverage lines | **55.16% (1421/2576)** |
| Full functional E2E | **259 passed, 2 historical skipped, 0 failed / 261** |
| New browser executions vs Wave E | **+11** |
| New skips | **0** |
| npm audit | **0 vulnerability** |
| git diff --check | GREEN |

Le dernier build de production a été confirmé avec Webpack après l'alignement `eslint-config-next`; le build Turbopack complet avait déjà passé sur Next 16.3.4 avant ce seul alignement de linter. Une tentative de revalidation Turbopack a été bloquée par le sandbox local (`binding to a port: Operation not permitted`), pas par le code.

## 20. E2E business journeys

| Flow | Preuve | Résultat |
|---|---|---|
| A — Organizer demande Vendor → Vendor lit/navigue | Domaine + API + UI + markRead | GREEN |
| B — Vendor répond → Organizer lit/navigue | Payload `eventId` + workspace | GREEN |
| C — Organizer demande Venue → manager lit/navigue | Nouveau producteur + UI | GREEN |
| D — Manager répond → Organizer lit/navigue | Payload `eventId` + workspace | GREEN |
| E — markAll → zéro → reload | API persistence + UI cache | GREEN |
| F — cross-user markRead | 404 + notification toujours non lue | GREEN |
| G — cible supprimée | workspace 404, titre absent | GREEN |
| Degraded | 503 intercepté, retry réel, aucun faux vide/logout | GREEN |
| Responsive/Axe | 7 viewports interactifs | GREEN |

## 21. Regression results

Les suites complètes Auth, Events, wizard, Workspace, Vendor, Venue, Participants, Guests, Invitations, Favorites, Ticketing, QR, Admission et PayPal adapter ont été traversées par les **261 exécutions navigateur** sans nouvel échec. Les deux skips sont historiques dans `wizard-capture.spec.ts`; aucun `only` ou nouveau `skip` n'a été introduit.

## 22. Independent review findings

`IMPLEMENTATION COMPLETE — BEGIN INDEPENDENT REVIEW`

| Finding | Sévérité | Correction | Statut |
|---|---|---|---|
| Logs provider contenaient destinataire/sujet/message d'erreur | P2 | Logs minimisés, test de non-fuite | FIXED |
| Route invitation initialement non canonique | P2 | Deep link vers `/invites`, test | FIXED |
| Bouton mobile comprimé sous 44 px à 320 px | P2 | `shrink-0`, preuve 7 viewports | FIXED |
| Session QA expirait durant la suite complète | P2 test infra | JWT E2E 60 min + refresh explicite | FIXED |
| E2E déclenchait des emails externes vers des fixtures | P2 test infra | Transport explicitement désactivé en E2E | FIXED |
| Next et eslint-config-next désalignés après hardening | P3 | Versions 16.3.4 alignées | FIXED |

La seconde lecture n'a trouvé ni URL contrôlée par payload, ni fuite cross-user, ni duplication de cloche, ni mutation optimiste mensongère, ni scope creep temps réel.

## 23. Findings P0/P1/P2/P3

- P0 découverts / ouverts : **0 / 0**
- P1 découverts / ouverts : **0 / 0**
- P2 découverts / ouverts : **5 / 0**
- P3 découverts / ouverts : **1 / 0**
- Blocking in-scope P2 : **0**

## 24. Deferred items

| Élément | Vague candidate | Motif |
|---|---|---|
| Préférences email/in-app | Wave G — Account Settings | Aucune infrastructure de préférences; aucun faux toggle |
| Rappels programmés | Future Communications | Scheduler/consentement non présents |
| Producteur ticket vendu organisateur | Future Ticketing Communications | Définition de bruit/destinataire à arrêter |
| Annulations Vendor/Venue | Future Communications | Sémantique métier et destinataires à confirmer |
| Temps réel push | Dedicated Architecture | Non requis; polling existant conservé |
| Centre de notifications complet | Future Product | La cloche satisfait le MVP actuel |

## 25. Remaining risks

- La preuve externe Resend utilise une adresse de test avec événement simulé, pas une boîte humaine.
- Les envois métier restent best-effort sans queue durable; c'est cohérent avec l'architecture actuelle mais ne garantit pas de retry différé en cas de panne provider.
- La localisation anglaise est prête dans le catalogue, mais le shell Notifications suit encore le mécanisme français statique existant.
- Une notification vers une ressource supprimée reste visible; son contexte se dégrade proprement en 404 sans fuite, conformément au mandat.

## 26. Release scorecard and final verdict

| Gate | Statut | Justification |
|---|---|---|
| IN-APP NOTIFICATIONS | GREEN | Liste, compteur, mark-one/all, persistance, erreurs |
| NOTIFICATION PRODUCERS | GREEN | Tous les triggers MVP retenus sont raccordés |
| FRONTEND INTEGRATION | GREEN | Shell unique, routes canoniques, cache cohérent |
| TRANSACTIONAL EMAIL LOGIC | GREEN | Producteurs actifs, templates sûrs, isolation E2E |
| EXTERNAL EMAIL DELIVERY | GREEN | Acceptation + événement simulé `delivered` Resend dev |
| NOTIFICATION SECURITY | GREEN | Ownership, 400/404, allow-list, aucun secret |
| RESPONSIVE/A11Y | GREEN | 7 viewports, Axe 0/0, clavier/focus |

Commits API : `de1a177`, `133cb9d`, `3d06156`.  
Commits Web produit/tests/sécurité : `31d1231`, `62a5961`, `1e086fa`.

Verdict technique : **VALIDÉE**. Les deux branches satisfont le PR gate; aucune fusion n'est autorisée dans cette Wave.

SPRINT 4 / WAVE F — VALIDÉE — NOTIFICATIONS & COMMUNICATIONS PRODUCT INTEGRATION COMPLETE — PR OUVERTE VERS DEV
