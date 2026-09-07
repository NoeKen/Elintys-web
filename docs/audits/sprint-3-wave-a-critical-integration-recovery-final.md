# Sprint 3 — Vague corrective A — Revue indépendante finale

Date de clôture : 7 septembre 2026  
Reviewer final : Codex  
API : `fix/s3-wave-a-critical-integration-recovery` → `dev`  
Web : `fix/s3-wave-a-critical-integration-recovery` → `dev`  
Verdict : **VALIDÉE — PR ouvertes, non fusionnées**

## 1. Branch state

Les deux dépôts ont été inspectés, synchronisés par `git fetch origin`, et sont restés sur la branche imposée. Aucun reset, rebase, force-push, stash, secret, environnement de production ou donnée de production n'a été touché.

| Dépôt | Base `origin/dev` auditée | Tête de code revue | PR |
|---|---|---|---|
| API | `7950c96` | `d89bfeb` | [NoeKen/Elintys-api#55](https://github.com/NoeKen/Elintys-api/pull/55) |
| Web | `860d8d5` | `68e0707` | [NoeKen/Elintys-web#102](https://github.com/NoeKen/Elintys-web/pull/102) |

Les feature branches ont été poussées. `dev` n'a pas été poussée ni fusionnée.

## 2. Implementation state recovery

Claude ayant épuisé ses tokens avant le nouveau handoff, Git a été traité comme seule source de vérité. Les baselines documentées étaient `26a98bf` pour l'API et `40c8eb1` pour le Web. Six commits supplémentaires Claude ont été retrouvés dans chaque dépôt, plus des changements Web non commités concernant la garde d'URL PayPal. Les 60 captures et rapports Axe historiques régénérés par Playwright ont été exclus de la PR après sauvegarde sous `/private/tmp/elintys-wave-a-generated-qa-backup-20260907`.

### Reconstruction des directives Pre-Codex

| Directive | État vérifié | Preuve principale |
|---|---|---|
| Configuration PayPal sandbox/live | IMPLEMENTED_AND_TESTED | configuration typée API, tests sandbox/live et URLs hostiles |
| `PAYPAL_ENV` | IMPLEMENTED_AND_TESTED | validation explicite, indépendante de `NODE_ENV` |
| `PAYPAL_PROVIDER_ENABLED` | IMPLEMENTED_AND_TESTED | fournisseur désactivé ou configuration complète obligatoire |
| `PAID_CHECKOUT_ENABLED` | IMPLEMENTED_AND_TESTED | gate distinct du fournisseur |
| Hôtes d'approbation | IMPLEMENTED_AND_TESTED | listes exactes par environnement, API et Web |
| Base URL PayPal | IMPLEMENTED_AND_TESTED | dérivée uniquement de `PAYPAL_ENV` |
| Webhook ID | IMPLEMENTED_AND_TESTED | requis quand le fournisseur est actif, jamais exposé |
| Navigation mobile par rôle | IMPLEMENTED_AND_TESTED | source canonique partagée + E2E multi-rôles |
| Routage racine dashboard | IMPLEMENTED_AND_TESTED | destination déterministe selon rôles |
| `getPostAuthPath` | IMPLEMENTED_AND_TESTED | tests login et retour sûr |
| `/auth/me` dégradé | IMPLEMENTED_AND_TESTED | 401 déconnecte ; 429/500/réseau restent des erreurs transitoires |
| ObjectId restants | IMPLEMENTED_AND_TESTED | pipes/DTO + 70 E2E API dont matrice dédiée |
| Validation reviews | IMPLEMENTED_AND_TESTED | `@IsMongoId` et `ParseObjectIdPipe` |
| Validation notifications | IMPLEMENTED_AND_TESTED | `ParseObjectIdPipe` |
| `unreadOnly` | IMPLEMENTED_AND_TESTED | contrat frontend/API aligné |
| Playwright auth setup | IMPLEMENTED_AND_TESTED | login UI propriétaire + session API tiers |
| `storageState` | IMPLEMENTED_AND_TESTED | projets dépendants du setup |
| `auth.setup.ts` | IMPLEMENTED_AND_TESTED | refresh du cookie comme le client réel |
| Régression Wave 2 | IMPLEMENTED_AND_TESTED | suite fonctionnelle complète verte |
| Nettoyage `authFetch` touché | IMPLEMENTED_AND_TESTED | services de profils migrés vers le client partagé |
| Responsive | IMPLEMENTED_AND_TESTED | sept viewports dans la suite complète |
| E2E rôles mobiles | IMPLEMENTED_AND_TESTED | prestataire, gestionnaire et multi-rôle |
| Tests configuration PayPal | IMPLEMENTED_AND_TESTED | API + Web, sandbox/live et fail-closed |
| Documentation | IMPLEMENTED_AND_TESTED | rapport d'implémentation relu puis présent rapport |

Aucun `test.only`, `describe.only`, `it.only`, TODO ou FIXME de transition n'a été trouvé dans le périmètre. Le seul `test.skip` est le harness de capture du wizard, conditionnel à `WIZARD_QA_CAPTURE`; il ne masque aucune assertion fonctionnelle.

## 3. Diff reviewed

Le diff complet `origin/dev...HEAD`, les commits post-baseline, les changements non commités et les fichiers effectivement exécutés ont été inspectés.

Avant les corrections Codex, le diff consolidé représentait :

- API : 42 fichiers, environ 2 897 ajouts et 474 suppressions ;
- Web : 65 fichiers, environ 6 415 ajouts et 967 suppressions.

La revue a couvert les contrôleurs, DTO, services, schémas/index, transitions MongoDB, clients HTTP, cache favoris, auth, routage par rôle, composants mobiles, configuration PayPal et harness Playwright.

## 4. Claude claims revalidated

Les affirmations du rapport d'implémentation ont été vérifiées contre le code, les appels réseau et les tests. Les corrections historiques F-01, F-02, F-03, F-04, F-05, F-12, F-15 et F-16 sont confirmées. Les changements postérieurs concernant F-06, F-14, le post-login, `/auth/me`, les ObjectId et Playwright sont également confirmés.

La seule partie inachevée laissée par Claude était l'extraction Web de la validation d'URL PayPal : le fichier de test importait une abstraction non encore créée et `PurchaseModal` conservait la garde sandbox-only. Codex l'a terminée et durcie avant validation.

## 5. Codex findings and corrections

| Finding Codex | Niveau | Correction | Preuve |
|---|---|---|---|
| Un favori permettait encore d'enrichir un brouillon/événement privé à partir d'un ObjectId connu | P1 | filtre publié, non archivé, public/unlisted ; cibles vendor/venue actives | unitaires + E2E confidentialité |
| `respondToBooking` et `cancelBooking` pouvaient réussir toutes deux dans une course pending → confirmed → cancelled | P1 | garde sur l'état observé et `respondedAt` antérieur au début logique de l'annulation | unitaire + sonde Mongo réelle F |
| Validation d'approbation Web toujours sandbox-only et extraction incomplète | P2 | abstraction typée `sandbox/live`, allowlists exactes, défaut sandbox et valeur invalide fail-closed | tests URL hostile et build |
| Panneau « Plus » mobile artisanal sans focus trap/restauration robuste | P2 | Radix Dialog, Escape, focus restoration, titre accessible, reduced motion | E2E mobile/Axe |
| Agenda public utilisait l'ObjectId sur une route `[slug]` | P2 | type `slug` obligatoire et lien canonique | unitaire + E2E navigation |
| Fallback `/placeholder-event.jpg` inexistant | P2 | fallback visuel local sans requête réseau | E2E final 16/16 sans erreur image |
| Dépendances transitives signalées par `npm audit` | P2 | mises à jour lockfile non cassantes | `found 0 vulnerabilities` dans les deux dépôts |

Tous les P1 et P2 ci-dessus ont été corrigés directement. Aucun finding bloquant n'est ouvert.

## 6. Architecture

L'architecture reste API-first : les cookies de session HTTP-only et l'autorité métier restent côté NestJS. Aucun BFF n'a été ajouté. Le Web consomme les contrats canoniques au moyen du client partagé. Les responsabilités `User`, onboarding, `VendorProfile` et `VenueProfile` restent distinctes.

Les transitions critiques utilisent des opérations MongoDB conditionnelles portant l'identité, l'ownership et l'état source. Les notifications et courriels sont produits seulement après la mutation gagnante. L'index unique demeure l'autorité pour les favoris concurrents.

## 7. PayPal configuration architecture

Réponses explicites à la reconstruction :

1. sélection d'environnement : **pilotée par configuration** ;
2. `PAYPAL_ENV` : **implémenté** ;
3. sandbox → live sans changement de code : **oui** ;
4. live → sandbox sans changement de code : **oui** ;
5. hôtes d'approbation : **dérivés de l'environnement** ;
6. base API : **dérivée de l'environnement** ;
7. webhook ID : **variable d'environnement requise si actif** ;
8. garde live : **fail-closed** ;
9. sandbox codé en dur dans le frontend : **non** ;
10. live dans l'environnement local audité : **désactivé** (`PAYPAL_PROVIDER_ENABLED=false`, `PAYPAL_ENV=sandbox`).

Le domaine Ticketing ne connaît ni hôte PayPal, ni credential, ni webhook ID. Le provider reçoit une configuration typée. Les deux environnements utilisent le même code. Une valeur d'environnement invalide ou une activation sans credentials complètes empêche le démarrage. Les URL `http`, `javascript:`, `data:`, relatives, sosies, sous-domaines non listés et celles de l'autre environnement sont refusées.

Aucune credential n'a été imprimée, aucun checkout PayPal externe, aucune transaction live et aucune opération de production n'ont été exécutés. Cette vague valide l'architecture et les contrats simulés ; elle ne prétend pas constituer une preuve de paiement acheteur sandbox signé de bout en bout.

## 8. Favorites

Un seul client et une seule query `GET /favorites` servent le catalogue. L'état des cœurs est dérivé du cache, sans requête `check` par carte. POST/DELETE, rollback visible, redirection anonyme sûre et liens par slug sont couverts.

L'API valide l'ObjectId, l'existence et désormais la visibilité réelle de la cible. Une cible supprimée, désactivée ou devenue confidentielle est rendue `target: null`; son titre et son slug ne sont pas divulgués. L'enrichissement est groupé par type, donc sans N+1.

## 9. Vendor, venue, requests and bookings

`GET /me`, `POST` et `PUT /me` utilisent `user.sub` comme autorité. Une absence de profil produit un parcours de création, pas un faux état réseau. Les DTO imposent les enums `VendorCategory`, `VenueType` et l'adresse structurée.

Les actions destinataires utilisent le contrat réel `PATCH` + `responseMessage`. Les anciens services divergents ne sont plus branchés. Les transitions accept/refuse/cancel sont conditionnelles et les effets secondaires suivent uniquement la transition gagnante.

La sonde réelle couvre accept/reject, respond/cancel et notification unique. Le défaut de course propre aux réservations de lieu découvert en revue a été corrigé.

## 10. Scan and concurrency

Le scan accepte `eventId`, vérifie l'ownership avant la lecture du billet, refuse un billet d'un autre événement sans divulgation et effectue l'admission avec une mutation atomique.

Résultat du harness contre MongoDB `elintys-dev` : **7/7 scénarios réussis**.

- 10 scans simultanés : 1 `admitted`, 9 `already_used` ;
- mauvais événement : refusé, billet intact ;
- accept/refuse prestataire : 1 gagnant, 1 notification ;
- respond/cancel prestataire : 1 gagnant ;
- confirm/refuse lieu : 1 gagnant, 1 notification ;
- respond/cancel lieu : 1 gagnant ;
- double favori : 1 écriture stockée.

## 11. Auth, post-login and mobile navigation

`/auth/me` distingue désormais l'absence de session des pannes : 401 devient anonyme ; 429, 500 et erreur réseau ne provoquent pas de faux logout. Le garde affiche une erreur réessayable au lieu de rediriger à tort.

La destination post-login et le dashboard racine utilisent une fonction déterministe par rôle et conservent uniquement un retour interne sûr. Les rôles multiples suivent une priorité stable. La navigation mobile réutilise la même source canonique que la sidebar. Prestataire et gestionnaire accèdent à leurs surfaces sous 768 px.

Codex a remplacé le panneau mobile artisanal par Radix Dialog : focus piégé, Escape, restauration du focus, titre annoncé et animations réduites sont pris en charge.

## 12. ObjectId and API contracts

Les routes exposées touchées dans events, vendors, venues, favorites, reviews, notifications, guests, requests, bookings, tickets et ticket-orders utilisent `ParseObjectIdPipe` ou `@IsMongoId`. La matrice E2E confirme des 400 structurés au lieu de CastError/500.

Le filtre notifications est maintenant `unreadOnly` des deux côtés. Le scanner envoie et consomme l'issue serveur. Les services prestataire/lieu utilisent les verbes et payloads NestJS réels.

## 13. Security review

- ownership A→A autorisé et B→A refusé ;
- identité issue de `user.sub`, pas d'un identifiant fourni comme autorité par le client ;
- DTO `forbidNonWhitelisted` contre le mass assignment ;
- favoris privés non exploitables comme canal auxiliaire ;
- QR d'un autre événement non divulgué ;
- return URL limité aux chemins internes ;
- PayPal strictement HTTPS et hôtes exacts ;
- credentials/webhook non retournés ni journalisés ;
- scan de secrets du diff : PASS ;
- `npm audit`: 0 vulnérabilité API, 0 vulnérabilité Web.

P0 sécurité : 0. P1 sécurité ouvert : 0.

## 14. Frontend architecture and Playwright harness

Les frontières client/serveur restent cohérentes avec Next App Router. Le catalogue ne charge pas un appel favoris par carte. Les mutations invalident la clé partagée. Les erreurs ne sont plus converties en états vides plausibles.

Le setup Playwright se connecte réellement par l'UI pour le propriétaire, crée une session API distincte pour les scénarios cross-user puis rafraîchit l'état comme le client runtime. Les storage states sont des artefacts locaux ignorés, pas des fixtures versionnées avec secrets.

Une première commande ciblée lancée par erreur avec `playwright.config.ts` a échoué avant scénario, car cette configuration ne charge pas les credentials QA. Elle a été immédiatement remplacée par `playwright.functional.config.ts`; les 22 scénarios ciblés ont alors passé. Ce faux départ n'est pas compté comme une régression produit.

## 15. Design-system and UI consistency

La revue s'est appuyée sur `design-principles.md`, les tokens existants et le système visuel Elintys : DM Serif Display pour l'éditorial, Inter pour l'interface, pétrole/teal/terracotta, surfaces chaudes, grands rayons et ombres diffuses. Aucun mini design system n'a été ajouté.

Les catalogues, événement public, connexion, favoris, dashboard, espaces prestataire/gestionnaire, scan et workspace conservent une hiérarchie cohérente. Les états loading/empty/error/retry utilisent les primitives partagées. Le fallback agenda sans couverture est maintenant une surface décorative locale cohérente, sans image brisée.

## 16. Responsive and desktop/mobile parity

Viewports automatisés obligatoires : `320×720`, `375×812`, `390×844`, `768×1024`, `1024×768`, `1440×900`, `1538×1100`.

Les catalogues, événement public, dashboard, favoris, rôles, workspace et parcours participant/billetterie ont été rejoués sans overflow horizontal critique. Les cibles principales restent d'au moins 44 px. Le scroll public demeure natif et le dashboard conserve son scroller interne unique.

La parité mobile a été vérifiée pour organisateur, prestataire, gestionnaire et multi-rôle. Un défaut de navigation secondaire accessible a été trouvé et corrigé via Dialog. Aucun parcours desktop essentiel ne reste inaccessible sur mobile.

## 17. Accessibility

La suite Axe couvrant Wave A et les régressions Wave 1–4 retourne :

- violations critical : **0** ;
- violations serious : **0**.

Navigation clavier, focus visible, fermeture Escape, focus restoration, titres/landmarks, alertes, labels, reduced motion et cibles tactiles ont été contrôlés par tests et inspection réelle. Aucun défaut bloquant n'est ouvert.

## 18. i18n and content

Les nouveaux libellés visibles sont en français cohérent avec le produit. Aucun jargon `accessPolicy`, `admissionModes` ou état technique n'est exposé. Les erreurs restent actionnables et ne dévoilent ni secret ni détail interne. La vague n'a pas créé une nouvelle dette structurante de chaînes dupliquées.

## 19. Performance

- favoris : une liste partagée, pas de N appels pour N cartes ;
- enrichissement : au plus trois requêtes backend groupées ;
- pas de polling ajouté ;
- pas de waterfall participant/workspace ajoutée ;
- build Next production : 69 pages générées, succès ;
- avertissement LCP de développement observé sur une image Cloudinary d'une carte, sans régression fonctionnelle ; optimisation `loading=eager` à évaluer seulement si cette image est confirmée above-the-fold dans une mesure production dédiée.

Couverture mesurée :

| Dépôt | Lignes | Fonctions | Branches |
|---|---:|---:|---:|
| API | 73,93 % | 70,56 % | 67,73 % |
| Web | 51,60 % | 43,63 % | 46,03 % |

Les seuils configurés passent ; aucun seuil n'a été abaissé.

## 20. Regression and gates

### API

| Gate | Résultat |
|---|---|
| Typecheck | PASS |
| ESLint | PASS |
| Unitaires | **1 179/1 179**, 76 suites |
| Build NestJS | PASS |
| E2E | **70/70**, 5 suites |
| Concurrence Mongo réelle | **7/7** scénarios |
| Coverage | PASS, chiffres ci-dessus |
| npm audit | **0 vulnérabilité** |
| `git diff --check` | PASS |

### Web

| Gate | Résultat |
|---|---|
| Typecheck | PASS |
| ESLint | PASS avec 9 warnings historiques, 0 erreur |
| Unitaires | **380/380**, 57 fichiers |
| Build Next production | PASS, 69 pages |
| E2E fonctionnels complets | **223 passés, 2 skips conditionnels**, 225 cas |
| E2E finaux ciblés | **22/22**, puis **16/16** après correction fallback |
| Axe | 0 critical, 0 serious |
| Coverage | PASS, chiffres ci-dessus |
| npm audit | **0 vulnérabilité** |
| `git diff --check` | PASS |

Les deux skips appartiennent uniquement à `wizard-capture.spec.ts` et exigent `WIZARD_QA_CAPTURE`; ils produisent des captures, pas une validation fonctionnelle. Wave 2, Wave 4, Wave 5 et Wave 6 ont été incluses dans la régression complète, notamment page publique, participant, paiement fail-closed, PayPal, workspace, responsive, scroll, sécurité et accessibilité.

## 21. Design audit summary

| Mesure | Résultat |
|---|---:|
| Familles de pages majeures inspectées | 18 |
| Familles de pages responsive testées | 11 |
| Viewports distincts | 7 |
| Incohérences design/interaction trouvées | 2 |
| Incohérences design/interaction corrigées | 2 |
| Défauts de parité mobile trouvés | 1 |
| Défauts de parité mobile corrigés | 1 |
| Axe critical | 0 |
| Axe serious | 0 |
| Erreurs console produit finales | 0 |
| Erreurs réseau inattendues finales | 0 |

Les 18 familles incluent accueil/catalogues, détail événement, connexion, dashboard racine, événements organisateur, workspace, favoris, invitations, participation, billetterie, profil/demandes prestataire, fiche/réservations gestionnaire, lieux, prestataires et scan.

## 22. Findings final

| Niveau | Trouvés pendant la revue Codex | Ouverts |
|---|---:|---:|
| P0 | 0 | 0 |
| P1 | 2 | 0 |
| P2 | 5 | 0 |
| P3 | 2 | 2 non bloquants |

## 23. Remaining risks

| Sévérité | Périmètre et impact | Pourquoi non corrigé | Bloquant | Action future |
|---|---|---|---|---|
| P3 | 9 warnings ESLint React Compiler/effects historiques ; certaines optimisations automatiques sont ignorées, sans comportement incorrect observé | fichiers hors périmètre et correction non mécanique | Non | traiter par lot avec tests des flux auth/theme/wizard |
| P3 | avertissement LCP Next en développement sur une image Cloudinary de catalogue | pas une mesure production stable et aucun impact fonctionnel établi | Non | profiler la page déployée puis marquer eager uniquement l'image réellement above-the-fold |
| Limite externe | preuve PayPal acheteur sandbox complète non rejouée dans cette revue | fournisseur local désactivé et mandat interdisant toute opération réelle/live ; les contrats/provider/webhook restent couverts par tests | Non pour Wave A | exécuter séparément create → approve sandbox → capture → webhook signé → ticket avec compte sandbox dédié |
| Dette architecture P2 antérieure | double arborescence top-level/dashboard documentée F-003 | suppression/migration élargirait le scope et pourrait casser des liens historiques ; les parcours actifs sont routés et testés | Non pour Wave A | vague dédiée de canonicalisation avec redirects et télémétrie |

## 24. Commits Codex

### API

- `c9f082f` — `fix(review): close favorite visibility and booking races`
- `d89bfeb` — `chore(deps): remediate audited transitive vulnerabilities`

### Web

- `0601d5c` — `fix(review): harden payment navigation and public journeys`
- `68e0707` — `chore(deps): remediate audited transitive vulnerabilities`

Les commits Claude retrouvés post-baseline ont également été inspectés individuellement. Le présent rapport est livré par un commit documentaire supplémentaire sur la PR Web.

## 25. PR readiness

Les gates de PR sont satisfaits : P0 = 0, P1 = 0, P2 bloquant = 0, régressions Wave A vertes, parité mobile critique = 0, Axe critical/serious = 0, PayPal configuration-driven, aucun secret et aucune opération production/live.

PR API : [#55](https://github.com/NoeKen/Elintys-api/pull/55)  
PR Web : [#102](https://github.com/NoeKen/Elintys-web/pull/102)

Les PR sont ouvertes vers `dev` et volontairement **non fusionnées**.

## Verdict

**SPRINT 3 / VAGUE CORRECTIVE A — VALIDÉE — SYSTEMIC UI/UX & RESPONSIVE REVIEW PASSED — PR OUVERTE VERS DEV**
