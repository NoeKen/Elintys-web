# Sprint 3 — Vague corrective A : Critical Integration Recovery

**Branches** : `fix/s3-wave-a-critical-integration-recovery` (Elintys-api et Elintys-web, depuis `origin/dev`)
**Date** : 2026-09-07
**Entrée** : `docs/audits/system-wide-integration-contract-audit.md`
**État** : implémentation terminée, non mergée, aucune PR ouverte.

---

## 1. Baseline

Avant toute modification, le spec de diagnostic `e2e/functional/system-wide-integration-audit.spec.ts` a été exécuté sur `origin/dev` :

```
8 failed | 4 passed (12 tests)
```

Échecs de départ :
- contrat Favoris de la carte événement (404)
- contrat de la page Mes favoris (404)
- payload du scanner rejeté (`property eventId should not exist`)
- verbes de réponse prestataire et lieu (404)
- cœur favori anonyme muet (événements, prestataires, lieux)
- route scanner accessible sans session

Sondes HTTP live confirmant l'état initial (API locale, `/api/v1`) :

```
GET    /favorites/check/<id>?type=event        → 404
GET    /favorites/me                            → 404
DELETE /favorites/<id>?type=event               → 404
PUT    /vendors/requests/<id>/respond           → 404
PUT    /venues/bookings/<id>/respond            → 404
POST   /tickets/scan {eventId,qrCode}           → 400 property eventId should not exist
GET    /vendors/not-an-objectid                 → 500
```

---

## 2. Branches et commits

### Elintys-api — 5 commits

| SHA | Objet |
|---|---|
| `35b2cda` | `fix(favorites)` — validation des cibles, contrat de liste enrichi |
| `bb52c3f` | `fix(profiles)` — `PUT /vendors/me` et `/venues/me`, transitions atomiques |
| `b407113` | `fix(tickets)` — scan lié à l'événement et atomique |
| `54b1789` | `test(qa)` — comptes QA prestataire et gestionnaire |
| `26a98bf` | `test(concurrency)` — preuve sur MongoDB réel |

`23 fichiers, +1915 / −238`

### Elintys-web — 7 commits

| SHA | Objet |
|---|---|
| `c4d0113` | `docs(audit)` — rapport d'audit et spec de diagnostic |
| `6c11880` | `fix(favorites)` — client unique, état dérivé d'une seule liste |
| `d83a9b3` | `fix(profiles)` — parcours prestataire et gestionnaire opérationnels |
| `7fd5556` | `fix(tickets)` — issue du scan lue depuis le serveur |
| `0966cf0` | `fix(scan)` — garde de route, diagnostic au vert |
| `bf52ffa` | `test(e2e)` — quatre parcours complets |
| `40c8eb1` | `test(coverage)` — verrouillage des modules réécrits à 100% |

`41 fichiers, +4115 / −808`

---

## 3. Findings traités

| ID | Sévérité | Statut | Preuve |
|---|---|---|---|
| F-01 Favoris | P1 | **Corrigé** | E2E UI complet + 13 tests unitaires + diagnostic |
| F-02 Réponses prestataire / lieu | P1 | **Corrigé** | E2E boucle complète + concurrence réelle |
| F-03 Scanner QR — contrat | P1 | **Corrigé** | E2E scan + sonde live |
| F-04 `PUT /*/me` | P1 | **Corrigé** | E2E rôles + diagnostic |
| F-05 Création des profils | P1 | **Corrigé** | E2E création depuis compte sans fiche |
| F-15 Scan non atomique | P1 | **Corrigé** | Concurrence MongoDB réel, scénario A |
| F-16 Transitions non atomiques | P1 | **Corrigé** | Concurrence MongoDB réel, scénarios C–F |
| F-12 Catégorie prestataire | P2 (inclus) | **Corrigé** | E2E + test unitaire sur l'énumération |

**Corrigés en dépendance stricte** (nécessaires pour que les parcours ci-dessus soient réellement opérationnels et honnêtes) :

| ID | Raison de l'inclusion |
|---|---|
| F-11 `CastError → 500` | Les routes `/me` ne peuvent être résolues correctement que si `:id` valide son paramètre ; sans quoi `PUT /vendors/xyz` reste une 500. Limité aux contrôleurs touchés. |
| F-13 `organizer` non peuplé + `fullName` | Les écrans destinataires réécrits affichaient un nom vide : un parcours corrigé qui affiche une donnée fausse n'est pas corrigé. |
| Route `/scan/[eventId]` sans garde | Découvert par le diagnostic : la caméra s'ouvrait pour un anonyme et chaque scan repartait en 401. |

---

## 4. Architecture retenue

### Contrat canonique

Conformément au §4-A du mandat, **le backend existant fait référence**. Les routes fantômes (`/favorites/check/:id`, `/favorites/me`, `DELETE /favorites/:id`, `PUT .../respond`) n'ont pas été créées : le client web a été réaligné. Deux exceptions justifiées, où l'API a évolué :

1. **`PUT /vendors/me` et `PUT /venues/me` ont été ajoutés.** L'alternative — faire pointer le client sur `PUT /vendors/:id` — obligerait le client à connaître l'identifiant de son propre profil et à le transmettre comme autorité. Les routes `/me` tirent l'identité de `user.sub`, ce qui supprime la surface d'IDOR au lieu de la déplacer.
2. **`eventId` a été ajouté au contrat de scan.** Le mandat (§11) demandait explicitement de ne pas le supprimer sans réfléchir. Il est désormais utilisé pour deux choses réelles — autoriser le scanneur sur cet événement, et refuser un billet appartenant à un autre — plutôt qu'accepté puis ignoré.

### Transitions d'état

Toutes les transitions de rôle passent d'une séquence `lecture → vérification → écriture` à une **mise à jour conditionnelle atomique** dont le filtre porte l'identité, la propriété et l'état attendu :

```
findOneAndUpdate(
  { _id, vendor: <profil du demandeur>, status: PENDING },
  { status, responseMessage, respondedAt },
  { new: true },
)
```

Quand le filtre ne matche pas, une relecture ciblée distingue *introuvable*, *non propriétaire* et *déjà tranché*. Le helper **renvoie** l'exception au lieu de la lever (`throw await …`), ce qui permet à TypeScript de restreindre le type sans assertion `!` — CLAUDE.md interdit la non-null assertion sur des données utilisateur.

### Effets de bord

Notifications et courriels ne sont émis **que pour la transition gagnante**. Avant la vague, deux réponses concurrentes pouvaient envoyer à l'organisateur une notification « accepté » **et** une notification « refusé » pour la même demande. Aucune infrastructure distribuée n'a été introduite : le point de déclenchement a simplement été déplacé après la transition conditionnelle, comme le demandait le §17.

---

## 5. Favoris

**Un seul client** : `src/features/favorites/favorites.service.ts`, sur le client HTTP partagé. `src/features/favorites/services/favorites.service.ts` et `src/shared/hooks/useFavorite.ts` sont supprimés.

**État dérivé, pas interrogé.** `useFavorites()` charge `GET /favorites` sous la clé unique `['favorites']` ; `useFavorite(id, type)` dérive `isFavorite` de ce cache. L'ancienne implémentation émettait un `GET /favorites/check/:id` **par carte**, chacun rejoué trois fois par le retry par défaut — soit ~80 requêtes 404 pour un catalogue de 20 cartes. Un test E2E garde cette propriété : au plus 2 appels `/favorites` pour un catalogue entier.

**Enrichissement serveur.** `GET /favorites` retourne désormais un objet `target` par entrée : libellé métier, lien public canonique (calculé avec le **slug** pour un événement, que le client ne peut pas deviner), image, sous-titre. `target: null` signale une cible supprimée. L'enrichissement est groupé par type — au plus trois requêtes quel que soit le nombre de favoris, aucun N+1 backend.

**Validation serveur** (§5 du mandat) :
- `targetId` en `@IsMongoId` → 400 structuré au lieu d'un `CastError` en 500 ;
- existence de la cible vérifiée → `404 FAVORITE_TARGET_NOT_FOUND` ;
- l'index unique `{user, targetType, targetId}` devient l'autorité sur les doublons, la violation est traduite en `409 FAVORITE_ALREADY_EXISTS` ;
- suppression inexistante → `404 FAVORITE_NOT_FOUND`.

**Polymorphisme.** Les cœurs de `VendorCard` et `VenueCard` — qui n'appelaient que `preventDefault` — sont branchés. La feature sert enfin les trois types qu'elle annonçait.

**Anonyme.** Redirection vers `/connexion?redirect=<retour sûr>`, l'infobulle « Connectez-vous pour sauvegarder » de CLAUDE.md étant conservée.

**Optimistic update.** Mise à jour de la liste, rollback sur échec, **et erreur rendue visible** (`role="alert"`). Sans la troisième partie, le rollback était silencieux et l'utilisateur ne savait pas que rien n'avait été enregistré.

---

## 6. Profils prestataire

`vendor-profile.service.ts` passe sur le client partagé (le paramètre `token` qu'il transportait était mort depuis la migration cookies) et expose `getMyProfile` / `createProfile` / `updateProfile`. Les méthodes divergentes `getMyRequests` / `respondToRequest` sont **supprimées** au profit de `vendorRequestsService`.

La page `/tableau-de-bord/prestataire/profil` devient un vrai **create-or-edit** :

| Réponse serveur | Écran |
|---|---|
| `200` | Mode édition, formulaire prérempli |
| `404 VENDOR_PROFILE_NOT_FOUND` | Mode création, préremplissage depuis l'onboarding |
| `5xx` / réseau | État d'erreur explicite avec réessai |

Le préremplissage ne reprend que les champs **canoniques** de l'onboarding (`displayName`, `description`, `serviceArea`). La catégorie n'est pas reprise : l'onboarding la stocke en texte libre, ce qui n'est jamais une valeur d'énumération valide.

---

## 7. Profils lieu

Même architecture. Le formulaire construit l'objet `address` attendu par `CreateVenueDto` et gagne un sélecteur `VenueType`. Le préremplissage ne reprend ni l'adresse (l'onboarding la stocke en chaîne unique, pas en rue + ville) ni le type.

### Décision F-05 : pourquoi pas la création automatique à l'onboarding

Le mandat (§8) préférait une création idempotente en fin d'onboarding **si les données y sont canoniques**. Inspection faite, elles ne le sont pas :

| Champ requis | État dans l'onboarding |
|---|---|
| `VendorProfile.category` | texte libre `@MaxLength(80)` ; l'API exige `@IsEnum(VendorCategory)` |
| `VenueProfile.address` | chaîne unique ; l'API exige `{ street, city }` |

Créer le profil automatiquement supposerait d'inventer une catégorie et de découper une adresse par heuristique — c'est-à-dire de fabriquer une donnée métier que l'utilisateur n'a pas fournie. L'option B du mandat a donc été retenue : un parcours de création explicite, préremplie de ce qui est fiable.

Les responsabilités restent séparées comme l'exige le §9 : `User` porte l'identité, `onboardingData` la progression, `VendorProfile`/`VenueProfile` l'état métier durable. Le document `User` n'est jamais devenu la source canonique du profil.

---

## 8. Demandes et réservations

Les deux écrans destinataires passent sur `vendorRequestsService.respond` et `venueBookingsService.respond` — `PATCH` + `responseMessage`. **Aucun troisième client n'a été créé** (§6).

Chaque écran distingue désormais :

| Situation | Rendu |
|---|---|
| Chargement | `role="status"` |
| Liste vide | état vide explicite (`data-testid="empty-state"`) |
| `404` profil absent | orientation vers la création de fiche, pas une erreur |
| Autre erreur | `role="alert"` + bouton Réessayer |
| Échec de réponse (dont `409` concurrent) | `FormErrorAlert` visible |

Les noms d'organisateur lisent `fullName` (F-13) et le serveur peuple enfin `organizer`.

---

## 9. Scan QR

**Contrat** : `ScanTicketDto` accepte `eventId` (`@IsMongoId`) et `qrCode`.

**Ordre des opérations**, délibéré :

1. `canManageEvent` sur l'événement scanné — **avant toute lecture du billet**. Le rôle `ORGANISATEUR` ne suffisait pas : un organisateur pouvait scanner les billets de l'événement d'autrui. Il ne peut désormais pas non plus sonder l'existence d'un code QR qui ne le concerne pas.
2. Transition atomique filtrée sur `{ qrCode, event, status: VALID }`.
3. En cas d'échec, relecture **restreinte à l'événement autorisé** : un billet d'un autre événement est indiscernable d'un code inconnu (`QR_NOT_FOUND`). C'est volontaire — on ne confirme pas à l'organisateur A l'existence d'un billet de l'organisateur B.

**Réponse** : champ `outcome` (`admitted` | `already_used`) décidé par le serveur. Le client ne dérive plus l'état d'un message libre — ce qui aurait affiché « Déjà utilisé » sur un scan réussi, puisqu'un billet admis vaut désormais `used`. `scannedBy` est ajouté au schéma pour la traçabilité.

---

## 10. Atomicité

| Opération | Avant | Après |
|---|---|---|
| `scan` | lecture VALID → vérification → écriture USED | `findOneAndUpdate({qrCode, event, status: VALID})` |
| `respondToRequest` | lecture → vérification → `findByIdAndUpdate` | `findOneAndUpdate({_id, vendor, status: PENDING})` |
| `cancelRequest` | lecture → vérification → `findByIdAndDelete` | `findOneAndDelete({_id, organizer, status: PENDING})` |
| `respondToBooking` | lecture → vérification → `findByIdAndUpdate` | `findOneAndUpdate({_id, venue, status: PENDING})` |
| `cancelBooking` | lecture → vérification → `findByIdAndUpdate` | `findOneAndUpdate({_id, status: {$in: [PENDING, CONFIRMED]}})` |
| `favorites.add` | pré-vérification seule | index unique autoritaire + traduction 409 |
| `vendors/venues.create` | pré-vérification seule | index unique autoritaire + traduction 409 |

---

## 11. Sécurité

Sondes exécutées sur l'API locale contre les surfaces créées ou modifiées :

| Sonde | Résultat |
|---|---|
| `PUT /vendors/me` avec `user`, `isPremium`, `rating` | `400 property user should not exist` — mass assignment bloqué |
| `POST /favorites` avec `user` injecté | `400 property user should not exist` |
| `POST /favorites` cible d'un type incohérent | `404 FAVORITE_TARGET_NOT_FOUND` |
| `GET /vendors/pas-un-id` | `400 INVALID_OBJECT_ID` (était **500**) |
| `PATCH /vendors/requests/pas-un-id/respond` | `400 INVALID_OBJECT_ID` |
| `PUT /venues/me` avec un compte prestataire | `403 Rôle insuffisant` |
| `PUT /vendors/me` anonyme | `401` |
| `GET /favorites` | cloisonné par `user.sub` |
| Scan par un organisateur tiers | `403 EVENT_NOT_OWNER` |
| Billet d'un autre événement | `404 QR_NOT_FOUND` — pas de divulgation |

**Aucune autorité métier n'est acceptée du client** sur les surfaces touchées : toutes les identités viennent de `@CurrentUser()`. Les routes `/me` suppriment la dernière surface où le client transmettait un identifiant de profil.

---

## 12. UI / UX

Les sept écrans réécrits distinguent explicitement `loading`, `empty`, `success`, `error`, `retry`, `unauthorized` et `notfound`. Les quatre interdits du §19 sont levés sur le périmètre :

| Interdit | Où il se produisait | État |
|---|---|---|
| `404 → liste vide` | page Mes favoris, cœur événement | Corrigé, testé |
| `500 → formulaire vide` | profils prestataire et lieu | Corrigé, testé |
| `mutation error → aucune indication` | bascule favori | Corrigé, testé |
| `optimistic failure → état visuel faux` | cœur événement | Rollback + `role="alert"` |

---

## 13. Tests

| Suite | Avant | Après |
|---|---|---|
| API unitaires | 1135 | **1135** (contrats réécrits, pas d'inflation artificielle) |
| API E2E (Jest) | 49 | **49** |
| Web unitaires | 269 | **331** (+62) |
| Web E2E vague A | 0 | **19** |
| Diagnostic transversal | 4/12 | **13/13** |

Modules verrouillés à 100% dans `vitest.config.ts` : `favorites.service.ts`, `vendor-profile.service.ts`, `venue-profile.service.ts`, `catalog-filters.ts`.

---

## 14. Concurrence

`npm run wave-a:concurrency` — MongoDB réel (`elintys-dev`), mêmes gardes que `verify-wave5-concurrency` : `ELINTYS_ENV=dev`, base nommément vérifiée, suppression limitée aux `_id` créés par le script.

```
7/7 scénarios réussis
A  Deux scans simultanés du même billet          admitted=1, alreadyUsed=1
B  Billet d'un autre événement                    refusé, statut inchangé « valid »
C  Accepter vs refuser (prestataire)              1 gagnant, 1 notification
D  Répondre vs annuler (prestataire)              1 gagnant
E  Confirmer vs refuser (lieu)                    1 gagnant, 1 notification
F  Répondre vs annuler (lieu)                     état final cohérent
G  Double ajout du même favori                    1 créé, index unique tranche
```

**Note sur le scénario F** : les deux opérations réussissent (`fulfilled: 2`) et c'est correct — annuler reste permis sur une réservation confirmée. Ce qui est vérifié est l'absence d'état final indéterminé, pas l'exclusion mutuelle.

Le double scan concurrent est également vérifié en E2E via `Promise.all` sur deux requêtes HTTP réelles.

---

## 15. Spec de diagnostic — avant / après

```
AVANT :  8 failed |  4 passed
APRÈS :  0 failed | 13 passed
```

**Trois assertions ont été retournées, aucune supprimée.** Rédigées pendant l'audit, elles supposaient que la correction consisterait à *ajouter* les routes fantômes côté API. La résolution retenue par ce mandat (§4-A : le backend fait référence) est l'inverse. Elles vérifient donc maintenant que ces routes **n'existent pas** et que les routes canoniques répondent `401` plutôt que `404` — ce qui protège contre une réintroduction du contrat fantôme. Deux assertions ont été ajoutées (routes `/me`, verbe `PATCH`).

Ce retournement est signalé en commentaire dans le fichier et dans le message de commit `0966cf0`.

---

## 16. Responsive

`wave-a-a11y-responsive.spec.ts` — aucun débordement horizontal (`scrollWidth − innerWidth ≤ 1`) sur `/prestataires`, `/lieux`, profil et demandes prestataire, aux quatre points demandés : **320×720, 390×844, 768×1024, 1440×900**.

Cibles tactiles vérifiées : bouton favori **44×44** (l'ancien mesurait 32px), bouton de soumission du profil ≥ 44px.

---

## 17. Accessibilité

Axe (`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`) sur les écrans réécrits : **0 critical, 0 serious**.

Corrections apportées :
- le bouton favori sort du `<Link>` — un `<button>` imbriqué dans un `<a>` est invalide et piégeait la navigation clavier ;
- `aria-pressed` uniquement pour un utilisateur connecté (un anonyme n'a pas d'état favori) ;
- libellés propres au type de cible (`Ajouter cet événement / ce prestataire / ce lieu aux favoris`) ;
- échec de bascule en `role="alert"`, succès d'enregistrement en `role="status" aria-live="polite"` ;
- icône en `pointer-events-none` : elle interceptait le clic ;
- focus visible sur le bouton favori.

---

## 18. Performance

| Mesure | Avant | Après |
|---|---|---|
| Requêtes favoris pour un catalogue de 20 cartes | ~20 (×3 avec retry) | **1** |
| Requêtes d'enrichissement de `GET /favorites` | — | ≤ 3, quel que soit le nombre |
| Réessais sur un 404 métier | 3 | **0** (`retryOnTransientError`) |

L'anti-N+1 est verrouillé par un test E2E qui compte les requêtes réseau réelles.

---

## 19. Migrations

**Aucune migration n'a été nécessaire.**

`TicketPurchase.scannedBy` est un ajout **additif** avec `default: null` : Mongoose n'exige aucune réécriture des documents existants, et aucun index n'a été créé, modifié ni supprimé. Aucune donnée n'a été supprimée. La production n'a pas été touchée.

Le script de provisioning QA a été étendu (deux comptes supplémentaires) en conservant intactes ses gardes anti-production.

---

## 20. Limitations

1. **Le harnais E2E web ne s'auto-amorce pas.** `playwright.config.ts` ne déclare ni `storageState` global ni projet `setup` avec dépendance, et le `testMatch` par défaut n'inclut pas `*.setup.ts` : `e2e/functional/auth.setup.ts` **ne s'exécute jamais**. Les specs authentifiées de vagues antérieures dépendent donc de fichiers `.e2e/*.json` laissés sur disque, dont l'access token expire en 15 minutes. Les specs de la vague A ont été écrits pour être autonomes (connexion propre à chaque exécution), mais **le défaut du harnais n'a pas été corrigé** : il dépasse le périmètre de cette vague corrective.

2. **Le tier `AUTH_STRICT` plafonne à 5 connexions par minute et par IP.** Exécuter l'ensemble de la suite fonctionnelle en parallèle sature ce quota. Les specs de la vague A s'exécutent en mode `serial` ; une suite complète nécessite `--workers=1` ou un relèvement du quota en environnement de test.

3. **Environnement de développement déployé non sondé.** Comme lors de l'audit, aucune autorisation explicite n'a été donnée. Le drift déploiement/code reste non vérifié.

4. **Le fournisseur PayPal n'a pas été exercé.** La vague ne touche pas la billetterie payante ; F-06 (allow-list restreinte au sandbox) reste ouvert.

---

## 21. Risques résiduels

| Risque | Portée | Atténuation |
|---|---|---|
| **F-06 PayPal production** | P1 conditionnel, hors périmètre | `isTrustedApprovalUrl` n'accepte que `sandbox.paypal.com` : en production la commande sera créée et le stock réservé, puis la redirection rejetée. **À traiter avant toute activation live.** |
| Échec E2E préexistant | `sprint3-wave2-public-event.spec.ts:187` | Bouton « S'inscrire » introuvable. Tous les fichiers exercés par ce spec (`src/features/events/**`, page publique) sont **intacts** dans le diff de la vague — vérifié. Cause probable : dérive de fixture ou de libellé antérieure. |
| `CastError → 500` restant | `reviews`, `notifications` | `ParseObjectIdPipe` n'a été appliqué qu'aux contrôleurs touchés. `GET /reviews/:type/:id` répond toujours 500 sur un identifiant malformé, sur une route **publique**. |
| Navigation mobile sans rôles | F-14, P2 | Sous 768 px, prestataires et gestionnaires n'ont toujours aucun chemin vers leurs écrans — désormais fonctionnels mais inatteignables au doigt. **Le gain de cette vague est partiellement invisible sur mobile.** |
| Dashboard racine par rôle | P2 | `/tableau-de-bord` rend l'expérience organisateur ; un prestataire connecté y reçoit toujours un 403. |
| Cinq copies d'`authFetch` | P3 | Deux supprimées (prestataire, lieu). Trois subsistent (favoris supprimée, restent notifications, invités, et deux internes). Aucun nouveau client parallèle n'a été introduit. |

---

## 22. Portes de validation

### API

| Porte | Résultat |
|---|---|
| `npm run lint` | ✅ |
| `npm run typecheck` | ✅ |
| `npm run build` | ✅ |
| `npx jest` | ✅ 75 suites, **1135 tests** |
| Couverture globale | 73,24 % — `favorites` 89,38 %, `favorites.service.ts` 98,59 % |
| `npm run test:e2e` | ✅ 4 suites, **49 tests** |
| `npm run wave-a:concurrency` | ✅ **7/7** |
| Migration dry-run | Sans objet — aucune migration |
| Secret scan du diff | ✅ aucun littéral |
| `git diff --check` | ✅ |

### Web

| Porte | Résultat |
|---|---|
| `npm run lint` | ✅ |
| `tsc --noEmit` | ✅ |
| `npm run build` | ✅ compilé |
| `npx vitest run` | ✅ 56 fichiers, **331 tests** |
| Seuils de couverture | ✅ 4 modules verrouillés à 100% |
| E2E vague A | ✅ **19/19** |
| Diagnostic transversal | ✅ **13/13** |
| Axe | ✅ 0 critical / 0 serious |
| Responsive 320 / 390 / 768 / 1440 | ✅ |
| Cibles tactiles ≥ 44px | ✅ |
| Secret scan du diff | ✅ aucun littéral |
| `git diff --check` | ✅ |

---

## 23. Porte de sévérité

| Niveau | Ouverts dans le périmètre |
|---|---|
| P0 | **0** |
| P1 | **0** — les sept P1 du périmètre sont corrigés, chacun avec un test de non-régression |
| P2 bloquants introduits | **0** |

Aucun finding n'est marqué corrigé sans test de régression associé.

---

## 24. État Git

```
Elintys-api : fix/s3-wave-a-critical-integration-recovery   5 commits, worktree propre
Elintys-web : fix/s3-wave-a-critical-integration-recovery   7 commits, worktree propre
```

Aucun merge, aucune PR, aucun push sur `dev`, aucun force push, aucun reset destructif.
