# ELINTYS — Sprint 3 / Vague corrective E

## System-wide E2E & Release Hardening — rapport final

Date d'exécution : 8 septembre 2026

Branche Web : `test/s3-wave-e-system-wide-e2e-release-hardening`

Branche API : `test/s3-wave-e-system-wide-e2e-release-hardening`

## 1. Git baseline

- Web `origin/dev` : `9f77e255e2e76d6e973674a0d539db793e241d98`, merge de la PR Wave D #105.
- API `origin/dev` : `453bd1f1433abc7fde833c2fe8bdc9e33709eb10`.
- Les deux branches Wave E ont été créées depuis leurs `origin/dev` respectifs.
- Les arbres et listes de stash étaient propres avant modification.
- Aucun reset, force-push, rebase destructif, secret production ou environnement production n'a été utilisé.

## 2. Scope

Wave E a audité et rejoué les chaînes MVP existantes : auth/session, création et publication Event, Workspace, surfaces publiques et Access V2, participants/invitations, billetterie/QR, prestataires, lieux, favoris, notifications, navigation multi-rôle, autorisations, responsive, accessibilité, scroll et états dégradés. Les ajouts fonctionnels se limitent à des corrections de défauts d'intégration découverts par les tests.

Les fonctionnalités Search, Reviews UI, Organizations, nouveau checkout et Payment Readiness externe restent hors périmètre.

## 3. Existing E2E inventory

L'inventaire initial comptait 28 fichiers Playwright fonctionnels/setup et 7 specs API E2E. La couverture existante était déjà forte sur auth, wizard, lifecycle Event, Workspace, public Event, Access V2, participant, ticketing/scan, prestataire, lieu, favoris, multi-rôle, IDOR, responsive, Axe et scroll.

Wave E ajoute :

- API : `notifications.e2e-spec.ts` et `guests-pagination.e2e-spec.ts` ;
- Web : `system/notifications-guests.spec.ts`, soit trois scénarios navigateur réels ;
- régressions dans le spec Workspace et le test unitaire du wizard prestataires.

## 4. Gap matrix

| Journey | Existing coverage | Missing boundary | Risk | New test | Layer / rôle |
|---|---|---|---|---|---|
| Auth/session | login, refresh, logout, guards, dégradation | jeton QA proche expiration sur suite longue | faux signal 401 | setup durci | Web / tous |
| Organizer lifecycle | wizard, draft, reprise, readiness, publish | aucune lacune bloquante | faible | non, replay | Web / organizer |
| Workspace | neuf sous-modules, ownership, mobile | diagnostics Radix du dialogue destructif | accessibilité | oui, assertion console | Web / organizer |
| Access V2/public | combinaisons supportées, private/unlisted/draft | aucune lacune bloquante | faible | non, replay | API+Web / public+participant |
| Guests | services et écrans | CRUD transversal, cross-event et pagination bornée | IDOR/charge | oui | API+Web / organizer |
| Notifications | unités et composant | création métier, lecture, read-all, reload, 503/retry | faux empty | oui | API+Web / vendor |
| Ticketing/QR | state machine, scan, concurrence | aucune lacune bloquante | élevée | non, replay adversarial | API+Web / participant+scanner |
| Vendor | profil, demandes, réponses, mobile | aucune lacune bloquante | élevée | non, replay | API+Web / vendor+organizer |
| Venue | profil, réservations, réponses | aucune lacune bloquante | élevée | non, replay | API+Web / venue+organizer |
| Favorites | add/remove/reload/privacy/race | aucune lacune bloquante | moyenne | non, replay | API+Web / authentifié |
| Multi-role | routage desktop/mobile | aucune lacune bloquante | moyenne | non, replay | Web / multi-role |

## 5. Test data and provisioning

Le provisionneur QA idempotent existant a recréé/vérifié les comptes organizer, secondary user, vendor, venue manager et multi-role sur `elintys-dev`. Les mots de passe sont restés dans les variables locales non suivies et ne figurent ni dans le diff, ni dans ce rapport, ni dans les fixtures commitées.

Les nouveaux scénarios utilisent des titres et courriels uniques, créent leurs propres événements et nettoient ces événements en fin de fichier. La review finale a supprimé une dépendance entre les deux tests Notifications : chaque scénario crée désormais sa propre notification métier, sans `serial` ni skip en cascade.

## 6. Auth

Les parcours anonymous, login valide/invalide, route protégée, retour interne sûr, refresh, logout, rôles et états 401/429/5xx/réseau ont été rejoués. Le setup rafraîchit désormais systématiquement une session QA avant une suite longue : un access token encore valide mais proche de l'expiration ne peut plus produire un 401 transitoire au milieu du gate console.

Invariant confirmé : 401 rend la session anonyme ; 429/5xx/réseau restent des états dégradés récupérables et ne provoquent pas de faux logout.

## 7. Organizer lifecycle

Le parcours dashboard → création → six étapes → sauvegarde → reprise → informations/date/lieu/prestataires/médias/Access V2 → readiness → publication → exposition publique est vert. Le wizard reste à six étapes et aucune logique métier parallèle n'a été ajoutée.

## 8. Event Workspace

Overview, informations, lieu, prestataires, accès/inscriptions, billetterie, invitations, médias et paramètres sont couverts selon les contrats existants. Les états loading, 403, 404, erreur/retry, invalidation après mutation, navigation interne, mobile et scroll ont été rejoués.

Le dialogue d'archive/restauration/suppression délègue maintenant à Radix la génération cohérente de `aria-labelledby` et `aria-describedby`. Une assertion E2E échoue si les diagnostics `DialogContent` réapparaissent.

## 9. Public events

Les événements public, unlisted par URL directe, private, draft, archived, slug invalide et not found sont couverts. Les projections publiques et CTA reflètent l'état serveur sans révéler les champs internes testés par les suites sécurité.

## 10. Event Access V2

Les tests conservent l'indépendance entre `discoverability`, `accessPolicy`, `admissionModes` et `status`. Les politiques réellement supportées — open, registration_required, access_code, email_domain, manual_approval, guest_list et invitation_token — restent couvertes avec leurs admissions compatibles. Aucune combinaison non supportée n'a été transformée en exigence artificielle.

## 11. Participants and guests

Le nouveau parcours crée deux événements et deux invités, refuse la modification cross-event, persiste une mise à jour légitime, vérifie la liste paginée puis supprime l'invité. L'API refuse désormais `page < 1`, les valeurs non entières et `limit` hors `1..100` avant d'appeler le service.

## 12. Invitations

Les contrats existants couvrent listing organizer, isolation Event, token invalide, absence de fuite de token/hash et parcours participant supporté. Aucun token brut n'est ajouté aux fixtures ou rapports. L'envoi réel d'un courriel externe n'est pas requis pour le release gate système local.

## 13. Ticketing

Les TicketType, TicketOrder, TicketHold, TicketPurchase, capacité, `reserved`, `sold`, billets gratuits et transitions internes payantes ont été rejoués via unités, E2E et suites de concurrence existantes. Aucun nouveau moteur de billetterie ou checkout n'a été construit.

## 14. QR and admission

Les scénarios ticket valide → scan → admission, second scan, mauvais événement, QR invalide et scanner non autorisé restent couverts. La concurrence de dix scans produit exactement une admission et neuf réponses already-used.

## 15. Vendor

Profil absent/existant, création via le flux réel, visibilité publique, demande organizer, notification reçue et réponse restent intégrés. La suite de concurrence confirme qu'accepter/refuser simultanément produit un seul verdict et une seule notification.

## 16. Venue manager

Profil/lieu, création ou édition supportée, visibilité publique, booking request, réponse et reflet organizer sont couverts. Les races réponse/annulation et confirmation/refus n'ont qu'une opération gagnante.

## 17. Favorites

Ajout authentifié, doublon, suppression, reload, liste et cible cachée/inactive sont couverts. La régression de confidentialité Wave A reste verte : connaître l'ObjectId d'une ressource cachée ne permet pas d'enrichir le favori. Le test concurrent confirme une seule ligne persistée.

## 18. Notifications

Le nouveau scénario part d'une vraie demande organizer→vendor, attend la notification, liste les non-lues, marque une notification, utilise « Tout marquer lu », vérifie le compteur serveur à zéro puis la persistance après reload. Un 503 injecté affiche un état réessayable, jamais « Aucune notification », et le retry manuel récupère les données.

`unreadOnly` est désormais un booléen strict et `page` un entier positif validé par DTO. La route statique `/notifications/read-all` est verrouillée par un test de résolution avant `/:id/read`.

## 19. Multi-role

Le compte multi-role conserve la priorité existante, les routes permises et la navigation stable sur desktop/mobile. Aucun redesign ou changement de politique de rôle n'a été introduit.

## 20. Authorization and IDOR

La matrice existante owner / other user / anonymous, complétée par le nouveau test Guests cross-event, reste verte pour Events, Guests, Invitations, profils/demandes Vendor, Venues/Bookings, Tickets/Orders, Media et Favorites. Aucun guard n'a été désactivé et aucune autorité métier fournie par le client n'a été acceptée.

Le vrai compte QA ADMIN n'est toujours pas disponible. Les 20 scénarios HTTP de `admin-authorization.e2e-spec.ts` et les tests de guards/policies restent verts ; l'absence de parcours navigateur Admin est classée N/A, non masquée par un faux credential.

## 21. Invalid inputs

ObjectId invalides, champs inconnus, enums erronés, transitions invalides et pagination malformée sont couverts. Wave E ajoute onze cas négatifs (`notifications` : quatre pages et deux booléens ambigus ; `guests` : cinq paginations). Les contrôleurs ne transmettent plus `NaN`, zéro, décimales, booléens ambigus ou une limite non bornée aux services.

## 22. Public projections

Les projections Event, Vendor, Venue et Favorite enrichi ont été rejouées. Les ressources privées/inactives ne sont pas enrichies et les identifiants/propriétés internes non nécessaires restent absents des payloads publics couverts.

## 23. Responsive and mobile

Viewports exercés : `320×720`, `375×812`, `390×844`, `768×1024`, `1024×768`, `1440×900`, `1538×1100`. Les tests interagissent avec navigation, formulaires, cards, CTA, wizard, Workspace, ticketing, dialogues et mobile nav ; ils ne se limitent pas à charger les pages.

Les images du sélecteur de prestataires portent désormais un attribut `sizes` correspondant à la grille, éliminant le chargement systématique en `100vw` sur desktop.

## 24. Accessibility

- Axe critical : **0**.
- Axe serious : **0**.
- Dialogues : nom, description, Escape, focus initial et restauration testés.
- Navigation clavier, focus visible, aria-live, erreurs de formulaire et reduced motion sont couverts sur les parcours principaux.

## 25. Native scroll

Le scroll natif document des zones public/auth et le scroller interne unique du dashboard/workspace sont préservés. Les tests wheel, clavier, touch et cycle body-lock des overlays sont verts. Aucun Lenis, `preventDefault` global, `touch-action:none` global ou scrollbar globalement masquée n'a été ajouté.

## 26. Card design invariant

Les assertions héritées de Wave D restent vertes sur les familles canoniques et surfaces représentatives.

**VISIBLE DECORATIVE CARD BORDERLINES = 0.**

Les bordures fonctionnelles des inputs, focus, séparateurs, validation et badges restent autorisées.

## 27. Degraded and network states

Les scénarios 401, 429, 500/503, panne réseau et retry sont couverts sur auth et surfaces critiques. Le nouveau scénario Notifications confirme qu'une erreur ne devient ni faux empty ni mutation réussie localement. Les erreurs volontairement injectées sont locales et explicitement attendues.

## 28. Races and concurrency

Deux suites dédiées ont produit **17/17** scénarios verts :

- Wave A : **7/7** — QR atomique, mauvais Event, Vendor response, Venue response/cancel, Favorites duplicate ;
- Wave 5 : **10/10** — capacité, réservations concurrentes, idempotency keys, expiration, callbacks répétés/concurrents, rollback et finalisation croisée.

Aucune politique commerciale de late settlement n'a été modifiée.

## 29. Discovered defects

| ID | Severity | Défaut | Preuve initiale |
|---|---|---|---|
| E-F01 | P2 | pagination Notifications acceptait zéro, décimales et texte | 4 cas rouges à 200 |
| E-F02 | P2 | pagination Guests acceptait valeurs invalides et limite non bornée | 5 cas rouges à 200 |
| E-F03 | P2 | token QA proche expiration produisait un 401 console intermittent sur suite longue | premier full run : 1 échec sur `/auth/me` |
| E-F04 | P2 | override manuel des IDs Radix produisait quatre diagnostics d'accessibilité | capture console rouge ciblée |
| E-F05 | P3 | images wizard prestataires chargées comme `100vw` | warning Next et test unitaire rouge |
| E-F06 | P3 | test de région live paiement se terminait avant deux mises à jour React | deux diagnostics `act(...)` au gate coverage |

P0 découvert : 0. P1 découvert : 0.

## 30. Fixes

- DTO stricts pour pagination Guests et Notifications ; limite Guests `1..100`.
- E2E HTTP négatifs avant service et route statique Notifications verrouillée.
- refresh QA proactif avant le full run, sans retry global ni allongement arbitraire de timeout.
- sémantique Dialog Radix restaurée et diagnostic console transformé en régression.
- `sizes` responsive sur les images du wizard prestataires.
- attente asynchrone du composant de statut paiement enfermée dans `act`, sans toucher au flux externe.
- nouveaux E2E Guests/Notifications rendus indépendants après seconde review.

## 31. Independent review

**IMPLEMENTATION COMPLETE — BEGIN INDEPENDENT REVIEW**

Le diff complet a été relu comme un apport externe. Les contrôleurs, transformations DTO, bornes, appels de service, tests négatifs, isolation cross-event, sessions QA, écoute console, dialogue Radix et sélecteurs Playwright ont été examinés. Aucun mock ne remplace la frontière métier des nouveaux parcours navigateur.

La review a trouvé puis corrigé la dépendance inter-test Notifications et supprimé le mode `serial`. Elle n'a trouvé aucun secret, contournement de validation/guard, élargissement d'autorité, scope creep produit ou finding sécurité reportable. Les DTO rejettent fail-closed les booléens et nombres ambigus.

## 32. Full test results

| Gate | Résultat final |
|---|---|
| API lint | 0 erreur, 0 warning |
| API typecheck | vert |
| API build | vert |
| API unit + coverage | 77 suites, 1 198 tests passés |
| API E2E full | 9 suites, 122 tests passés |
| API concurrence | 17/17 |
| Web lint | 0 erreur, 0 warning |
| Web typecheck | vert |
| Web production build | vert, 57 pages générées |
| Web unit + coverage | 65 fichiers, 396 tests passés |
| Web functional E2E full | 250 exécutions, 248 passées, 2 skips historiques, 0 échec |
| Nouveaux E2E Wave E | 3/3 ; run ciblé avec setup 5/5 |
| npm audit API/Web | 0 vulnérabilité / 0 vulnérabilité |
| secret scan | aucun secret détecté dans le diff |
| git diff --check | vert dans les deux dépôts |

## 33. Coverage

| Dépôt | Baseline documentée | Wave E | Écart |
|---|---|---|---|
| API statements | 73,37 % (Wave B) | 73,19 % — 4 795/6 551 | -0,18 pt |
| API branches | 68,37 % | 68,24 % — 1 431/2 097 | -0,13 pt |
| API functions | 69,89 % | 69,47 % — 685/986 | -0,42 pt |
| API lines | 74,07 % | 73,94 % — 4 388/5 934 | -0,13 pt |
| Web statements | 53,07 % (Wave D) | 52,99 % — 1 485/2 802 | -0,08 pt |
| Web branches | 47,74 % | 47,71 % — 1 386/2 905 | -0,03 pt |
| Web functions | 47,24 % | 47,24 % — 420/889 | stable |
| Web lines | 54,57 % | 54,48 % — 1 384/2 540 | -0,09 pt |

Les variations sont dues aux dénominateurs et au fait que les nouvelles frontières HTTP/navigateur sont mesurées dans les suites E2E séparées. Aucun test n'a été supprimé pour améliorer le pourcentage. La couverture système critique augmente de deux specs API et trois parcours navigateur.

## 34. Console and network

Le gate représentatif final collecte `console.error`, `pageerror`, requêtes échouées et HTTP >=500 inattendus.

- console errors inattendues : **0** ;
- page errors : **0** ;
- HTTP >=500 inattendus : **0** ;
- failed network inattendues : **0**.

Les 500/503 injectés par les tests négatifs sont whitelistés localement. Les warnings de processus `NO_COLOR/FORCE_COLOR` ne proviennent pas du navigateur. Deux warnings React `act(...)` du test unitaire des routes de retour paiement ont été reproduits puis supprimés en attendant la stabilisation asynchrone dans `act` ; le test ciblé repasse 12/12 sans diagnostic.

## 35. Findings P0/P1/P2/P3

| Niveau | Ouverts bloquants | Corrigés Wave E | Résiduels non bloquants |
|---|---:|---:|---:|
| P0 | 0 | 0 | 0 |
| P1 | 0 | 0 | 0 |
| P2 | 0 | 4 | 0 |
| P3 | 0 | 2 | 2 groupes |

Résiduels P3 : warnings LCP de développement sur quelques images de galerie/card ; une réponse ObjectId 404 isolée lors d'un rerun API complet, non reproduite par le spec ciblé 21/21 puis par deux suites complètes vertes, dont la finale à 122/122. Aucun retry global n'a été ajouté pour masquer cette intermittence.

## 36. Release readiness scorecard

| Domaine | État | Justification |
|---|---|---|
| AUTH | GREEN | session, refresh, logout, retour sûr et dégradation couverts |
| ORGANIZER | GREEN | lifecycle six étapes et publication verts |
| EVENT WORKSPACE | GREEN | modules existants, ownership, erreurs et mutations couverts |
| PUBLIC EVENT | GREEN | public/unlisted/private/draft/archived couverts |
| ACCESS V2 | GREEN | dimensions indépendantes et politiques supportées couvertes |
| PARTICIPANTS | GREEN | admission existante et Guests CRUD/isolation couverts |
| INVITATIONS | GREEN | contrats et sécurité token couverts |
| TICKETING | GREEN | core interne, stock et idempotence verts |
| QR/ADMISSION | GREEN | atomique, doublon, mauvais Event et auth verts |
| VENDOR | GREEN | profil, request/response et race verts |
| VENUE | GREEN | profil, booking/response et race verts |
| FAVORITES | GREEN | cycle, privacy et doublon verts |
| NOTIFICATIONS | GREEN | cycle réel, reload, pagination et 503/retry verts |
| MULTI-ROLE | GREEN | routage desktop/mobile stable |
| MOBILE | GREEN | parcours critiques exercés |
| SECURITY | GREEN | P0/P1/P2 bloquant = 0, IDOR et inputs verts |
| RESPONSIVE | GREEN | sept viewports |
| A11Y | GREEN | Axe critical/serious = 0 |
| PERFORMANCE/BUILD | GREEN | builds production verts ; `sizes` corrigé |
| PAYMENT EXTERNAL READINESS | YELLOW | gate externe séparé, non exécuté ici |

### Release matrix

| Journey | Desktop | Mobile | Auth | Authorization | Error path | Result |
|---|---|---|---|---|---|---|
| Organizer | oui | oui | session réelle | owner/other/anonymous | 400/403/404/5xx | GREEN |
| Participant | oui | oui | anonymous + connecté | Event/admission isolés | accès refusé, stock, réseau | GREEN |
| Vendor | oui | oui | session réelle | profil/request cross-user | empty/error/retry | GREEN |
| Venue Manager | oui | oui | session réelle | lieu/booking cross-user | empty/error/race | GREEN |
| Multi-role | oui | oui | session réelle | rôles permis uniquement | return path/dégradation | GREEN |
| Public anonymous | oui | oui | N/A | projections public/unlisted/private | 404/500/réseau | GREEN |

### Exact release metrics

| Mesure | Valeur |
|---|---:|
| API unit tests | 1 198 |
| API E2E | 122 |
| API concurrency tests | 17 |
| Web unit tests | 396 |
| Existing Web E2E collected | 247 |
| New Wave E Web E2E | 3 |
| Total final browser executions | 250 |
| Historical skips | 2 |
| New skips | 0 |
| Viewports | 7 |
| Axe critical / serious | 0 / 0 |
| Console errors / page errors | 0 / 0 |
| Unexpected HTTP >=500 | 0 |
| npm vulnerabilities API / Web | 0 / 0 |
| Lint warnings / errors API / Web | 0 / 0 |
| P0 / P1 / blocking P2 open | 0 / 0 / 0 |

La recherche statique ne trouve aucun `test.only`, `describe.only` ou `it.only`. Le seul `test.skip` source est le fichier historique de génération de captures wizard, activable explicitement par `WIZARD_QA_CAPTURE=1` ; il représente les deux skips collectés selon ses viewports.

## 37. Out-of-scope register

| Finding | Severity | Location | Candidate wave | Reason deferred |
|---|---:|---|---|---|
| Recherche publique réelle absente | P3 | `/evenements/recherche` | Future Product — Search | Wave E teste l'honnêteté, pas une nouvelle feature |
| UI Reviews complète absente | P3 | surfaces prestataire/public | Future Product — Reviews | contrat produit hors scope |
| Vraie transaction PayPal et preuve buyer→ticket | P2 hors E | checkout/payments | Payment Readiness | gate externe explicitement séparé |
| Parcours navigateur Admin | N/A | dashboard Admin | Dedicated Architecture | aucun credential QA Admin réel disponible |
| Contenu juridique définitif | P2 hors E | pages légales | Legal | validation juridique externe requise |

## 38. Remaining risks

Les deux groupes P3 de performance/intermittence doivent rester observés en CI/preview. Les emails externes, PayPal Sandbox réel et compte Admin navigateur n'ont pas été simulés. Search et Reviews restent volontairement absents mais sont présentés honnêtement. Ces limites ne cassent aucun parcours MVP couvert par le release gate.

**PAYMENT READINESS REAL EXTERNAL FLOW: NOT EXECUTED IN WAVE E**

## 39. Commits

Les commits atomiques et leurs SHA sont ajoutés après le dernier rerun complet sur l'arbre final :

- API `5091c05` — `fix(api): validate guest and notification pagination` ;
- Web `8427ff9` — `test(e2e): cover guest and notification system journeys` ;
- Web `3ea555a` — `test(e2e): stabilize long-running QA sessions` ;
- Web `8b33cf6` — `fix(a11y): restore workspace dialog semantics` ;
- Web `33626c6` — `fix(perf): size wizard provider images` ;
- Web `888f415` — `test(payments): await live status synchronization` ;
- documentation — `docs(audit): document Sprint 3 Wave E release gate`, portant le présent rapport.

## 40. PR readiness

Le dernier rerun Playwright sur l'arbre final est vert : 248 passés, 2 skips historiques, 0 échec. Deux PR sont autorisées vers `dev` ; aucune ne sera fusionnée automatiquement. La mergeabilité, les checks CI et la preview Vercel sont vérifiés après ouverture.

## Final baseline decision

**BASELINE READY FOR NEW PRODUCT WAVES: YES.** Les vagues produit peuvent ensuite reprendre Search et Reviews ; le Payment Readiness externe conserve son gate dédié.
